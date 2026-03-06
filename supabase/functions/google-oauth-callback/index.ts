import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Google OAuth not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirect_uri || "https://dev.nexusmetrics.jmads.com.br/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("Google token error:", tokenData);
      return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    // Get Google user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const googleUser = await userInfoRes.json();

    // Get account_id for user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: accountUser } = await adminClient
      .from("account_users")
      .select("account_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!accountUser) {
      return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Upsert integration
    const { data: existing } = await adminClient
      .from("integrations")
      .select("id")
      .eq("account_id", accountUser.account_id)
      .eq("provider", "google")
      .maybeSingle();

    if (existing) {
      await adminClient.from("integrations").update({
        access_token_encrypted: access_token,
        refresh_token_encrypted: refresh_token || null,
        external_account_id: googleUser.id || null,
        expires_at: expiresAt,
        config: { google_email: googleUser.email, google_name: googleUser.name },
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await adminClient.from("integrations").insert({
        account_id: accountUser.account_id,
        provider: "google",
        access_token_encrypted: access_token,
        refresh_token_encrypted: refresh_token || null,
        external_account_id: googleUser.id || null,
        expires_at: expiresAt,
        config: { google_email: googleUser.email, google_name: googleUser.name },
      });
    }

    return new Response(JSON.stringify({ success: true, google_email: googleUser.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
