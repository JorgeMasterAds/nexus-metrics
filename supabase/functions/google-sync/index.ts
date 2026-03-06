import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.error) { console.error("Refresh error:", data); return null; }
  return data;
}

async function getValidToken(adminClient: any, integration: any): Promise<string | null> {
  let accessToken = integration.access_token_encrypted;

  if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
    if (!integration.refresh_token_encrypted) return null;
    const refreshed = await refreshAccessToken(integration.refresh_token_encrypted);
    if (!refreshed) return null;
    accessToken = refreshed.access_token;
    await adminClient.from("integrations").update({
      access_token_encrypted: accessToken,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", integration.id);
  }
  return accessToken;
}

async function syncGoogleAds(adminClient: any, accessToken: string, accountId: string, selectedAccounts: any[]) {
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!developerToken) {
    console.log("No GOOGLE_ADS_DEVELOPER_TOKEN, skipping Google Ads sync");
    return;
  }

  const today = new Date();
  const since = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
  const until = today.toISOString().slice(0, 10).replace(/-/g, "");

  for (const selected of selectedAccounts) {
    const customerId = selected.external_id;
    try {
      const query = `SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, segments.date FROM campaign WHERE segments.date BETWEEN '${since.slice(0,4)}-${since.slice(4,6)}-${since.slice(6,8)}' AND '${until.slice(0,4)}-${until.slice(4,6)}-${until.slice(6,8)}'`;

      const res = await fetch(
        `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "developer-token": developerToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Google Ads API error for ${customerId}:`, errText);
        continue;
      }

      const data = await res.json();
      const rows = data.results || [];

      for (const row of rows) {
        const spend = Number(row.metrics?.costMicros || 0) / 1_000_000;
        const clicks = Number(row.metrics?.clicks || 0);
        const impressions = Number(row.metrics?.impressions || 0);
        const campaignName = row.campaign?.name || "";
        const campaignId = row.campaign?.id || "";
        const date = row.segments?.date || "";

        await adminClient.from("ad_spend").upsert({
          account_id: accountId,
          platform: "google",
          campaign_id: String(campaignId),
          campaign_name: campaignName,
          spend,
          clicks,
          impressions,
          date,
          ad_account_id: null,
        }, { onConflict: "account_id,platform,campaign_id,date", ignoreDuplicates: false });
      }

      console.log(`Synced ${rows.length} Google Ads rows for customer ${customerId}`);
    } catch (err) {
      console.error(`Google Ads sync error for ${customerId}:`, err);
    }
  }
}

async function syncGA4(adminClient: any, accessToken: string, accountId: string, selectedProperties: any[]) {
  const today = new Date();
  const sinceDate = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const untilDate = today.toISOString().slice(0, 10);

  for (const selected of selectedProperties) {
    const propertyId = selected.external_id;
    try {
      const res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: sinceDate, endDate: untilDate }],
            dimensions: [
              { name: "date" },
              { name: "sessionSource" },
              { name: "sessionMedium" },
              { name: "sessionCampaignName" },
              { name: "deviceCategory" },
            ],
            metrics: [
              { name: "sessions" },
              { name: "totalUsers" },
              { name: "newUsers" },
              { name: "screenPageViews" },
              { name: "engagementRate" },
              { name: "averageSessionDuration" },
              { name: "bounceRate" },
              { name: "conversions" },
            ],
            limit: "10000",
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`GA4 API error for ${propertyId}:`, errText);
        continue;
      }

      const data = await res.json();
      const rows = data.rows || [];

      await adminClient.from("ga4_metrics")
        .delete()
        .eq("account_id", accountId)
        .eq("property_id", propertyId)
        .gte("date", sinceDate)
        .lte("date", untilDate);

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((row: any) => {
          const dims = row.dimensionValues || [];
          const mets = row.metricValues || [];
          const rawDate = dims[0]?.value || "";
          const formattedDate = rawDate.length === 8
            ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
            : rawDate;

          return {
            account_id: accountId,
            property_id: propertyId,
            date: formattedDate,
            source: dims[1]?.value || null,
            medium: dims[2]?.value || null,
            campaign: dims[3]?.value || null,
            device_category: dims[4]?.value || null,
            sessions: parseInt(mets[0]?.value || "0"),
            users: parseInt(mets[1]?.value || "0"),
            new_users: parseInt(mets[2]?.value || "0"),
            page_views: parseInt(mets[3]?.value || "0"),
            engagement_rate: parseFloat(mets[4]?.value || "0"),
            avg_session_duration: parseFloat(mets[5]?.value || "0"),
            bounce_rate: parseFloat(mets[6]?.value || "0"),
            conversions: parseInt(mets[7]?.value || "0"),
          };
        });

        const { error } = await adminClient.from("ga4_metrics").insert(batch);
        if (error) console.error("GA4 insert error:", error);
      }

      console.log(`Synced ${rows.length} GA4 rows for ${propertyId}`);
    } catch (err) {
      console.error(`GA4 sync error for ${propertyId}:`, err);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let targetAccountId: string | null = null;
    let targetProjectId: string | null = null;
    try {
      const body = await req.json();
      targetAccountId = body?.account_id || null;
      targetProjectId = body?.project_id || null;
    } catch { /* no body, sync all */ }

    // Get all Google integrations (now per-project)
    let integrationsQuery = adminClient.from("integrations").select("*").eq("provider", "google");
    if (targetAccountId) {
      integrationsQuery = integrationsQuery.eq("account_id", targetAccountId);
    }
    if (targetProjectId) {
      integrationsQuery = integrationsQuery.eq("project_id", targetProjectId);
    }
    const { data: integrations } = await integrationsQuery;

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ message: "No Google integrations found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const integration of integrations) {
      const accessToken = await getValidToken(adminClient, integration);
      if (!accessToken) {
        results.push({ account_id: integration.account_id, project_id: integration.project_id, error: "Failed to get valid token" });
        continue;
      }

      const { data: selectedAccounts } = await adminClient
        .from("google_selected_accounts")
        .select("*")
        .eq("integration_id", integration.id);

      const googleAdsAccounts = (selectedAccounts || []).filter((s: any) => s.type === "google_ads");
      const ga4Properties = (selectedAccounts || []).filter((s: any) => s.type === "ga4");

      if (googleAdsAccounts.length > 0) {
        await syncGoogleAds(adminClient, accessToken, integration.account_id, googleAdsAccounts);
      }
      if (ga4Properties.length > 0) {
        await syncGA4(adminClient, accessToken, integration.account_id, ga4Properties);
      }

      results.push({
        account_id: integration.account_id,
        project_id: integration.project_id,
        google_ads_synced: googleAdsAccounts.length,
        ga4_synced: ga4Properties.length,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Google sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
