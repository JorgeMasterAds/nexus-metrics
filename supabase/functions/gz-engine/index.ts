import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, ...params } = await req.json();

    // Verify user account
    const { data: accountIds } = await supabase.rpc("get_user_account_ids", { _user_id: userData.user.id });
    if (!accountIds || accountIds.length === 0) throw new Error("No account found");

    const accountId = params.account_id || accountIds[0];
    if (!accountIds.includes(accountId)) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: send_campaign ── Execute a campaign
    if (action === "send_campaign") {
      const { campaign_id } = params;
      if (!campaign_id) throw new Error("campaign_id required");

      const { data: campaign, error: campErr } = await supabase
        .from("gz_campaigns")
        .select("*")
        .eq("id", campaign_id)
        .eq("account_id", accountId)
        .single();

      if (campErr || !campaign) throw new Error("Campaign not found");
      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        throw new Error(`Campaign cannot be started (status: ${campaign.status})`);
      }

      // Get the WhatsApp account
      const { data: gzAccount } = await supabase
        .from("gz_accounts")
        .select("*")
        .eq("account_id", accountId)
        .eq("status", "connected")
        .limit(1)
        .maybeSingle();

      if (!gzAccount) throw new Error("No WhatsApp account connected");

      // Check anti-spam rules
      const { data: spamRules } = await supabase
        .from("gz_anti_spam_rules")
        .select("*")
        .eq("account_id", accountId)
        .eq("is_active", true);

      const maxPerHour = spamRules?.find((r: any) => r.rule_type === "max_per_hour")?.config?.limit || 100;
      const intervalMs = campaign.send_interval_ms || 3000;

      // Mark campaign as running
      await supabase.from("gz_campaigns").update({
        status: "running",
        started_at: new Date().toISOString(),
      }).eq("id", campaign_id);

      // Get target groups
      const targetGroupIds = campaign.target_groups || [];
      const { data: groups } = await supabase
        .from("gz_groups")
        .select("*")
        .in("id", targetGroupIds);

      let totalSent = 0;
      let totalFailed = 0;

      for (const group of groups || []) {
        try {
          // Send message to group
          const resp = await fetch(`${gzAccount.api_url}/message/sendText/${gzAccount.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: gzAccount.api_key_encrypted },
            body: JSON.stringify({
              number: group.group_jid,
              text: campaign.message_template,
            }),
          });

          const msgStatus = resp.ok ? "sent" : "failed";

          await supabase.from("gz_messages").insert({
            account_id: accountId,
            gz_account_id: gzAccount.id,
            campaign_id,
            group_jid: group.group_jid,
            direction: "outgoing",
            content: campaign.message_template,
            status: msgStatus,
            error_message: resp.ok ? null : await resp.text(),
          });

          if (resp.ok) totalSent++;
          else totalFailed++;

          // Rate limiting
          if (intervalMs > 0) {
            await new Promise(r => setTimeout(r, intervalMs));
          }

          // Check hourly limit
          if (totalSent >= maxPerHour) {
            await supabase.from("gz_campaigns").update({
              status: "paused",
              total_sent: totalSent,
              total_failed: totalFailed,
            }).eq("id", campaign_id);

            return new Response(JSON.stringify({
              status: "paused",
              reason: "hourly_limit_reached",
              total_sent: totalSent,
              total_failed: totalFailed,
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } catch (e: any) {
          totalFailed++;
          await supabase.from("gz_messages").insert({
            account_id: accountId,
            gz_account_id: gzAccount.id,
            campaign_id,
            group_jid: group.group_jid,
            direction: "outgoing",
            content: campaign.message_template,
            status: "failed",
            error_message: e.message,
          });
        }
      }

      // Mark campaign as completed
      await supabase.from("gz_campaigns").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_sent: totalSent,
        total_failed: totalFailed,
      }).eq("id", campaign_id);

      return new Response(JSON.stringify({
        status: "completed",
        total_sent: totalSent,
        total_failed: totalFailed,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: sync_groups ── Sync groups from WhatsApp
    if (action === "sync_groups") {
      const { gz_account_id } = params;

      const { data: gzAccount } = await supabase
        .from("gz_accounts")
        .select("*")
        .eq("id", gz_account_id)
        .eq("account_id", accountId)
        .single();

      if (!gzAccount) throw new Error("WhatsApp account not found");

      // Fetch groups from Evolution API
      const resp = await fetch(`${gzAccount.api_url}/group/fetchAllGroups/${gzAccount.instance_name}`, {
        headers: { apikey: gzAccount.api_key_encrypted },
      });

      if (!resp.ok) throw new Error("Failed to fetch groups");

      const groupsData = await resp.json();
      let synced = 0;

      for (const g of groupsData || []) {
        await supabase.from("gz_groups").upsert({
          account_id: accountId,
          gz_account_id,
          group_jid: g.id || g.jid,
          name: g.subject || g.name || "Grupo",
          description: g.desc || g.description || "",
          member_count: g.size || g.participants?.length || 0,
          is_admin: g.isAdmin || false,
        }, { onConflict: "account_id,group_jid", ignoreDuplicates: false });
        synced++;
      }

      return new Response(JSON.stringify({ synced }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: update_lead_score ── Update lead scoring
    if (action === "update_lead_score") {
      const { contact_jid, interaction_type, points } = params;
      if (!contact_jid) throw new Error("contact_jid required");

      const { data: existing } = await supabase
        .from("gz_lead_scores")
        .select("*")
        .eq("account_id", accountId)
        .eq("contact_jid", contact_jid)
        .maybeSingle();

      const interaction = {
        type: interaction_type || "message",
        points: points || 1,
        at: new Date().toISOString(),
      };

      if (existing) {
        const interactions = [...(existing.interactions || []), interaction].slice(-100);
        await supabase.from("gz_lead_scores").update({
          score: existing.score + (points || 1),
          interactions,
          last_interaction_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("gz_lead_scores").insert({
          account_id: accountId,
          contact_jid,
          score: points || 1,
          interactions: [interaction],
          last_interaction_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e: any) {
    console.error("gz-engine error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
