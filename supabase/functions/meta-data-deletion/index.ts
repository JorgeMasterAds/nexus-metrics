import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function base64UrlDecode(input: string): Uint8Array {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  const bytes = new Uint8Array(signature);
  // Convert to base64url
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!META_APP_SECRET) {
    console.error("META_APP_SECRET not configured");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse the signed_request from form data or JSON
    let signedRequest: string | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      signedRequest = formData.get("signed_request") as string;
    } else {
      const body = await req.json();
      signedRequest = body.signed_request;
    }

    if (!signedRequest) {
      return new Response(JSON.stringify({ error: "Missing signed_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse signed_request: <encoded_sig>.<payload>
    const parts = signedRequest.split(".");
    if (parts.length !== 2) {
      return new Response(JSON.stringify({ error: "Invalid signed_request format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [encodedSig, encodedPayload] = parts;

    // Verify signature
    const expectedSig = await hmacSha256(META_APP_SECRET, encodedPayload);
    if (encodedSig !== expectedSig) {
      console.error("Invalid signed_request signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode payload
    const payloadBytes = base64UrlDecode(encodedPayload);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadStr);

    const metaUserId = payload.user_id;
    if (!metaUserId) {
      return new Response(JSON.stringify({ error: "Missing user_id in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Meta data deletion request for user_id: ${metaUserId}`);

    // Delete data from database
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find integrations with this meta user ID
    const { data: integrations } = await supabaseAdmin
      .from("integrations")
      .select("id, account_id")
      .eq("provider", "meta_ads")
      .eq("external_account_id", metaUserId);

    if (integrations && integrations.length > 0) {
      for (const integration of integrations) {
        // Delete ad_accounts linked to this integration
        await supabaseAdmin
          .from("ad_accounts")
          .delete()
          .eq("integration_id", integration.id);

        // Delete the integration record
        await supabaseAdmin
          .from("integrations")
          .delete()
          .eq("id", integration.id);
      }
      console.log(`Deleted ${integrations.length} integration(s) for meta user ${metaUserId}`);
    } else {
      console.log(`No integrations found for meta user ${metaUserId}`);
    }

    // Generate confirmation code
    const confirmationCode = crypto.randomUUID();

    // Return response per Meta's specification
    return new Response(
      JSON.stringify({
        url: `https://nexusmetrics.jmads.com.br/data-deletion-status?id=${confirmationCode}`,
        confirmation_code: confirmationCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error processing data deletion request:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
