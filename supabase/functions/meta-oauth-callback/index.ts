import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const REDIRECT_URI = "https://dev.nexusmetrics.jmads.com.br/auth/meta/callback";
const GRAPH_API_VERSION = "v19.0";
const SUCCESS_REDIRECT = "https://dev.nexusmetrics.jmads.com.br/integrations?meta=success";
const ERROR_REDIRECT = "https://dev.nexusmetrics.jmads.com.br/integrations?meta=error";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept GET (browser redirect from Meta)
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // JWT or user identifier
  const errorParam = url.searchParams.get("error");

  // --- Error from Meta ---
  if (errorParam) {
    console.error("Meta OAuth error:", errorParam, url.searchParams.get("error_description"));
    return Response.redirect(`${ERROR_REDIRECT}&reason=denied`, 302);
  }

  // --- Missing code ---
  if (!code) {
    console.error("Missing code parameter");
    return Response.redirect(`${ERROR_REDIRECT}&reason=missing_code`, 302);
  }

  // --- Missing state (user auth token) ---
  if (!state) {
    console.error("Missing state parameter (user token)");
    return Response.redirect(`${ERROR_REDIRECT}&reason=missing_state`, 302);
  }

  const META_APP_ID = Deno.env.get("META_APP_ID");
  const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!META_APP_ID || !META_APP_SECRET) {
    console.error("META_APP_ID or META_APP_SECRET not configured");
    return Response.redirect(`${ERROR_REDIRECT}&reason=server_config`, 302);
  }

  try {
    // 1. Exchange code for short-lived access token
    const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", META_APP_ID);
    tokenUrl.searchParams.set("client_secret", META_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Token exchange error:", JSON.stringify(tokenData.error));
      return Response.redirect(`${ERROR_REDIRECT}&reason=invalid_code`, 302);
    }

    const shortLivedToken = tokenData.access_token;
    if (!shortLivedToken) {
      console.error("No access_token in response:", JSON.stringify(tokenData));
      return Response.redirect(`${ERROR_REDIRECT}&reason=no_token`, 302);
    }

    // 2. Exchange for long-lived token
    const longLivedUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", META_APP_ID);
    longLivedUrl.searchParams.set("client_secret", META_APP_SECRET);
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString(), { method: "GET" });
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error("Long-lived token error:", JSON.stringify(longLivedData.error));
      return Response.redirect(`${ERROR_REDIRECT}&reason=long_lived_failed`, 302);
    }

    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // seconds

    // 3. Get Meta user info
    const meRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me?fields=id,name&access_token=${longLivedToken}`
    );
    const meData = await meRes.json();

    if (meData.error) {
      console.error("Me endpoint error:", JSON.stringify(meData.error));
      return Response.redirect(`${ERROR_REDIRECT}&reason=me_failed`, 302);
    }

    const metaUserId = meData.id;

    // 4. Get ad accounts
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/adaccounts?fields=id,name,account_id&access_token=${longLivedToken}`
    );
    const adAccountsData = await adAccountsRes.json();

    if (adAccountsData.error) {
      console.error("Ad accounts error:", JSON.stringify(adAccountsData.error));
      // Non-fatal: continue without ad accounts
    }

    const adAccounts = adAccountsData.data || [];

    // 5. Authenticate user via state (JWT token)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(state);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return Response.redirect(`${ERROR_REDIRECT}&reason=auth_failed`, 302);
    }

    // 6. Get user's account_id
    const { data: accountUser, error: accountError } = await supabaseAdmin
      .from("account_users")
      .select("account_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (accountError || !accountUser) {
      console.error("Account lookup error:", accountError?.message);
      return Response.redirect(`${ERROR_REDIRECT}&reason=no_account`, 302);
    }

    const accountId = accountUser.account_id;
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // 7. Upsert integration record
    const { data: existingIntegration } = await supabaseAdmin
      .from("integrations")
      .select("id")
      .eq("account_id", accountId)
      .eq("provider", "meta_ads")
      .limit(1)
      .maybeSingle();

    let integrationId: string;

    if (existingIntegration) {
      integrationId = existingIntegration.id;
      const { error: updateError } = await supabaseAdmin
        .from("integrations")
        .update({
          access_token_encrypted: longLivedToken,
          external_account_id: metaUserId,
          expires_at: expiresAt,
          config: { meta_user_name: meData.name },
          updated_at: new Date().toISOString(),
        })
        .eq("id", integrationId);

      if (updateError) {
        console.error("Integration update error:", updateError.message);
        return Response.redirect(`${ERROR_REDIRECT}&reason=db_error`, 302);
      }
    } else {
      const { data: newIntegration, error: insertError } = await supabaseAdmin
        .from("integrations")
        .insert({
          account_id: accountId,
          provider: "meta_ads",
          access_token_encrypted: longLivedToken,
          external_account_id: metaUserId,
          expires_at: expiresAt,
          config: { meta_user_name: meData.name },
        })
        .select("id")
        .single();

      if (insertError || !newIntegration) {
        console.error("Integration insert error:", insertError?.message);
        return Response.redirect(`${ERROR_REDIRECT}&reason=db_error`, 302);
      }
      integrationId = newIntegration.id;
    }

    // 8. Sync ad accounts
    if (adAccounts.length > 0) {
      // Remove old ad accounts for this integration
      await supabaseAdmin
        .from("ad_accounts")
        .delete()
        .eq("integration_id", integrationId)
        .eq("account_id", accountId);

      const adAccountRows = adAccounts.map((acc: any) => ({
        account_id: accountId,
        integration_id: integrationId,
        platform: "meta_ads" as const,
        external_account_id: acc.account_id || acc.id,
        name: acc.name || `Ad Account ${acc.account_id || acc.id}`,
      }));

      const { error: adError } = await supabaseAdmin
        .from("ad_accounts")
        .insert(adAccountRows);

      if (adError) {
        console.error("Ad accounts insert error:", adError.message);
        // Non-fatal
      }
    }

    console.log(`Meta OAuth success for user ${user.id}, account ${accountId}, ${adAccounts.length} ad accounts synced`);

    // 9. Redirect to success page
    return Response.redirect(SUCCESS_REDIRECT, 302);
  } catch (err) {
    console.error("Unexpected error in meta-oauth-callback:", err);
    return Response.redirect(`${ERROR_REDIRECT}&reason=unexpected`, 302);
  }
});
