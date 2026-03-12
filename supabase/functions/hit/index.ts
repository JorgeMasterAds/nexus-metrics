import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple in-memory rate limiting (per isolate)
const ipCounts = new Map<string, { count: number; resetAt: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limiting: 100 req/min per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";
    const now = Date.now();
    const entry = ipCounts.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 100) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      entry.count++;
    } else {
      ipCounts.set(ip, { count: 1, resetAt: now + 60000 });
    }

    const body = await req.json();
    const { token, click_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      utm_conjunto, fbclid, gclid, ttclid, page_url, referrer } = body;

    if (!token || !click_id) {
      return new Response(JSON.stringify({ error: "Missing token or click_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token — token is the account_id or a webhook token
    let accountId = token;

    // Check if it's a valid account
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", token)
      .maybeSingle();

    if (!account) {
      // Try looking up by webhook token
      const { data: webhook } = await supabase
        .from("webhooks")
        .select("account_id")
        .eq("token", token)
        .maybeSingle();

      if (!webhook) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      accountId = webhook.account_id;
    }

    // Get user agent
    const userAgent = req.headers.get("user-agent") || "";

    // Insert click
    const { error: insertError } = await supabase.from("clicks").insert({
      account_id: accountId,
      click_id,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      utm_conjunto: utm_conjunto || null,
      fbclid: fbclid || null,
      gclid: gclid || null,
      ttclid: ttclid || null,
      page_url: page_url || null,
      referrer: referrer || null,
      ip: ip,
      user_agent: userAgent,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save click" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Hit error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
