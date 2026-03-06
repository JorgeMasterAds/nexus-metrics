import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.error) return null;
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try to get project_id from body
    let projectId: string | null = null;
    try {
      const body = await req.json();
      projectId = body?.project_id || null;
    } catch { /* no body */ }

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

    let integrationQuery = adminClient
      .from("integrations")
      .select("*")
      .eq("account_id", accountUser.account_id)
      .eq("provider", "google");

    if (projectId) {
      integrationQuery = integrationQuery.eq("project_id", projectId);
    } else {
      integrationQuery = integrationQuery.is("project_id", null);
    }

    const { data: integration } = await integrationQuery.maybeSingle();

    if (!integration) {
      return new Response(JSON.stringify({ error: "Google not connected" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let accessToken = integration.access_token_encrypted;

    // Check if token expired, refresh if needed
    if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
      if (!integration.refresh_token_encrypted) {
        return new Response(JSON.stringify({ error: "Token expired and no refresh token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const refreshed = await refreshAccessToken(integration.refresh_token_encrypted);
      if (!refreshed) {
        return new Response(JSON.stringify({ error: "Failed to refresh token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await adminClient.from("integrations").update({
        access_token_encrypted: accessToken,
        expires_at: newExpiry,
        updated_at: new Date().toISOString(),
      }).eq("id", integration.id);
    }

    // Fetch GA4 properties
    let ga4Properties: any[] = [];
    try {
      const ga4Res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (ga4Res.ok) {
        const ga4Data = await ga4Res.json();
        for (const summary of ga4Data.accountSummaries || []) {
          for (const prop of summary.propertySummaries || []) {
            ga4Properties.push({
              account_name: summary.displayName,
              property_id: prop.property,
              property_name: prop.displayName,
            });
          }
        }
      }
    } catch (e) {
      console.error("GA4 fetch error:", e);
    }

    // Fetch Google Ads accounts (accessible customers)
    let adsAccounts: any[] = [];
    try {
      const adsRes = await fetch("https://googleads.googleapis.com/v17/customers:listAccessibleCustomers", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "",
        },
      });
      if (adsRes.ok) {
        const adsData = await adsRes.json();
        adsAccounts = (adsData.resourceNames || []).map((rn: string) => ({
          customer_id: rn.replace("customers/", ""),
          resource_name: rn,
        }));
      }
    } catch (e) {
      console.error("Google Ads fetch error:", e);
    }

    return new Response(JSON.stringify({ ga4_properties: ga4Properties, ads_accounts: adsAccounts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Google list accounts error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
