import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, automation_id, lead_id, trigger_data } = await req.json();

    // ── ACTION: execute ── Start a new automation execution for a lead
    if (action === "execute") {
      if (!automation_id) throw new Error("automation_id required");

      const { data: automation, error: autoErr } = await supabase
        .from("automations")
        .select("*")
        .eq("id", automation_id)
        .single();

      if (autoErr || !automation) throw new Error("Automation not found");
      if (!automation.is_active) throw new Error("Automation is not active");

      const nodes = (automation.flow_nodes || []) as any[];
      const edges = (automation.flow_connections || []) as any[];

      if (nodes.length === 0) throw new Error("Automation has no nodes");

      // Create execution record
      const { data: execution, error: execErr } = await supabase
        .from("automation_executions")
        .insert({
          automation_id,
          account_id: automation.account_id,
          lead_id: lead_id || null,
          status: "running",
          current_node_id: nodes[0]?.id,
          metadata: { trigger_data },
        })
        .select()
        .single();

      if (execErr) throw new Error(`Failed to create execution: ${execErr.message}`);

      // Process nodes sequentially
      let currentNodeId = nodes[0]?.id;
      const context: Record<string, any> = { lead_id, trigger_data, ...(trigger_data || {}) };

      while (currentNodeId) {
        const node = nodes.find((n: any) => n.id === currentNodeId);
        if (!node) break;

        // Log node start
        const { data: nodeExec } = await supabase
          .from("automation_node_executions")
          .insert({
            execution_id: execution.id,
            node_id: node.id,
            node_type: node.type || node.data?.type || "unknown",
            status: "running",
            input_data: context,
          })
          .select()
          .single();

        try {
          const result = await executeNode(supabase, node, context, automation.account_id);

          await supabase
            .from("automation_node_executions")
            .update({ status: "success", completed_at: new Date().toISOString(), output_data: result })
            .eq("id", nodeExec!.id);

          // Handle wait nodes - queue for later
          if ((node.type === "wait" || node.data?.type === "wait") && result?.wait_seconds) {
            const resumeAt = new Date(Date.now() + result.wait_seconds * 1000).toISOString();
            const nextEdge = edges.find((e: any) => e.source === currentNodeId);

            await supabase.from("automation_queue").insert({
              execution_id: execution.id,
              automation_id,
              account_id: automation.account_id,
              node_id: nextEdge?.target || "",
              resume_at: resumeAt,
              status: "waiting",
            });

            await supabase
              .from("automation_executions")
              .update({ status: "paused", current_node_id: currentNodeId })
              .eq("id", execution.id);

            return new Response(JSON.stringify({ execution_id: execution.id, status: "paused", resume_at: resumeAt }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Handle if/else branching
          if ((node.type === "if_else" || node.data?.type === "if_else") && result?.branch) {
            const branchEdge = edges.find((e: any) => e.source === currentNodeId && e.sourceHandle === result.branch);
            currentNodeId = branchEdge?.target || null;
          } else {
            // Normal flow: follow first edge from current node
            const nextEdge = edges.find((e: any) => e.source === currentNodeId);
            currentNodeId = nextEdge?.target || null;
          }
        } catch (nodeErr: any) {
          await supabase
            .from("automation_node_executions")
            .update({ status: "failed", completed_at: new Date().toISOString(), error_message: nodeErr.message })
            .eq("id", nodeExec!.id);

          await supabase
            .from("automation_executions")
            .update({ status: "failed", completed_at: new Date().toISOString(), error_message: nodeErr.message, current_node_id: currentNodeId })
            .eq("id", execution.id);

          return new Response(JSON.stringify({ execution_id: execution.id, status: "failed", error: nodeErr.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Completed all nodes
      await supabase
        .from("automation_executions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", execution.id);

      return new Response(JSON.stringify({ execution_id: execution.id, status: "completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: resume ── Process queued items that are ready
    if (action === "resume") {
      const now = new Date().toISOString();
      const { data: items } = await supabase
        .from("automation_queue")
        .select("*")
        .eq("status", "waiting")
        .lte("resume_at", now)
        .limit(50);

      const results: any[] = [];
      for (const item of items || []) {
        await supabase.from("automation_queue").update({ status: "processing" }).eq("id", item.id);

        try {
          // Re-invoke this function to continue the execution
          const { data: execution } = await supabase
            .from("automation_executions")
            .select("*, automations(*)")
            .eq("id", item.execution_id)
            .single();

          if (execution) {
            const automation = execution.automations;
            const nodes = (automation.flow_nodes || []) as any[];
            const edges = (automation.flow_connections || []) as any[];
            let currentNodeId = item.node_id;
            const context: Record<string, any> = execution.metadata || {};

            await supabase
              .from("automation_executions")
              .update({ status: "running", current_node_id: currentNodeId })
              .eq("id", execution.id);

            while (currentNodeId) {
              const node = nodes.find((n: any) => n.id === currentNodeId);
              if (!node) break;

              const { data: nodeExec } = await supabase
                .from("automation_node_executions")
                .insert({
                  execution_id: execution.id,
                  node_id: node.id,
                  node_type: node.type || node.data?.type || "unknown",
                  status: "running",
                  input_data: context,
                })
                .select()
                .single();

              const result = await executeNode(supabase, node, context, automation.account_id);

              await supabase
                .from("automation_node_executions")
                .update({ status: "success", completed_at: new Date().toISOString(), output_data: result })
                .eq("id", nodeExec!.id);

              if ((node.type === "wait" || node.data?.type === "wait") && result?.wait_seconds) {
                const resumeAt = new Date(Date.now() + result.wait_seconds * 1000).toISOString();
                const nextEdge = edges.find((e: any) => e.source === currentNodeId);
                await supabase.from("automation_queue").insert({
                  execution_id: execution.id,
                  automation_id: automation.id,
                  account_id: automation.account_id,
                  node_id: nextEdge?.target || "",
                  resume_at: resumeAt,
                  status: "waiting",
                });
                await supabase.from("automation_executions").update({ status: "paused" }).eq("id", execution.id);
                break;
              }

              if ((node.type === "if_else" || node.data?.type === "if_else") && result?.branch) {
                const branchEdge = edges.find((e: any) => e.source === currentNodeId && e.sourceHandle === result.branch);
                currentNodeId = branchEdge?.target || null;
              } else {
                const nextEdge = edges.find((e: any) => e.source === currentNodeId);
                currentNodeId = nextEdge?.target || null;
              }
            }

            if (!currentNodeId) {
              await supabase.from("automation_executions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", execution.id);
            }
          }

          await supabase.from("automation_queue").update({ status: "done" }).eq("id", item.id);
          results.push({ id: item.id, status: "done" });
        } catch (e: any) {
          await supabase.from("automation_queue").update({ status: "done" }).eq("id", item.id);
          results.push({ id: item.id, status: "error", error: e.message });
        }
      }

      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e: any) {
    console.error("automation-engine error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Node executor ──
async function executeNode(supabase: any, node: any, context: Record<string, any>, accountId: string): Promise<any> {
  const type = node.type || node.data?.type;
  const config = node.data?.config || node.config || {};

  switch (type) {
    // Trigger nodes - just pass through
    case "new_lead":
    case "tag_added":
    case "purchase_completed":
    case "form_submitted":
      return { triggered: true };

    // Wait node
    case "wait": {
      const amount = config.amount || 1;
      const unit = config.unit || "minutos";
      const multipliers: Record<string, number> = { segundos: 1, minutos: 60, horas: 3600, dias: 86400 };
      return { wait_seconds: amount * (multipliers[unit] || 60) };
    }

    // If/Else node
    case "if_else": {
      const field = config.field || "email";
      const operator = config.operator || "exists";
      const value = config.value;
      let result = false;

      if (context.lead_id) {
        const { data: lead } = await supabase.from("leads").select("*").eq("id", context.lead_id).single();
        if (lead) {
          const fieldVal = lead[field];
          switch (operator) {
            case "exists": result = !!fieldVal; break;
            case "equals": result = fieldVal === value; break;
            case "contains": result = String(fieldVal || "").includes(value); break;
            case "greater_than": result = Number(fieldVal) > Number(value); break;
            default: result = !!fieldVal;
          }
        }
      }

      return { branch: result ? "yes" : "no" };
    }

    // Send email
    case "send_email": {
      if (!context.lead_id) return { skipped: true, reason: "no lead_id" };
      const { data: lead } = await supabase.from("leads").select("email, name").eq("id", context.lead_id).single();
      if (!lead?.email) return { skipped: true, reason: "no email" };

      const smtpHost = Deno.env.get("SMTP_HOST");
      if (!smtpHost) return { skipped: true, reason: "SMTP not configured" };

      // Use the existing send-notification-email function pattern
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          to: lead.email,
          subject: config.subject || "Mensagem automática",
          html: (config.body || "Olá {{name}}").replace("{{name}}", lead.name || ""),
        }),
      });

      return { sent: resp.ok, to: lead.email };
    }

    // Send WhatsApp
    case "send_whatsapp": {
      if (!context.lead_id) return { skipped: true, reason: "no lead_id" };
      const { data: lead } = await supabase.from("leads").select("phone, name").eq("id", context.lead_id).single();
      if (!lead?.phone) return { skipped: true, reason: "no phone" };

      const { data: device } = await supabase
        .from("whatsapp_devices")
        .select("*")
        .eq("account_id", accountId)
        .eq("status", "connected")
        .limit(1)
        .maybeSingle();

      if (!device) return { skipped: true, reason: "no WhatsApp device connected" };

      const message = (config.message || "Olá {{name}}").replace("{{name}}", lead.name || "");
      const resp = await fetch(`${device.api_url}/message/sendText/${device.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: device.api_key_encrypted },
        body: JSON.stringify({ number: lead.phone, text: message }),
      });

      return { sent: resp.ok, to: lead.phone };
    }

    // Move pipeline stage
    case "move_stage": {
      if (!context.lead_id) return { skipped: true, reason: "no lead_id" };
      const stageName = config.stage_name;
      if (!stageName) return { skipped: true, reason: "no stage configured" };

      const { data: stage } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("account_id", accountId)
        .ilike("name", stageName)
        .limit(1)
        .maybeSingle();

      if (stage) {
        await supabase.from("leads").update({ stage_id: stage.id }).eq("id", context.lead_id);
        return { moved: true, stage_id: stage.id };
      }
      return { skipped: true, reason: "stage not found" };
    }

    // Add tag
    case "add_tag": {
      if (!context.lead_id) return { skipped: true, reason: "no lead_id" };
      const tagName = config.tag_name;
      if (!tagName) return { skipped: true, reason: "no tag configured" };

      let { data: tag } = await supabase.from("lead_tags").select("id").eq("account_id", accountId).eq("name", tagName).maybeSingle();
      if (!tag) {
        const { data: newTag } = await supabase.from("lead_tags").insert({ account_id: accountId, name: tagName, color: "#8b5cf6" }).select().single();
        tag = newTag;
      }
      if (tag) {
        await supabase.from("lead_tag_assignments").insert({ lead_id: context.lead_id, tag_id: tag.id }).select().maybeSingle();
      }
      return { tagged: true, tag_name: tagName };
    }

    // Run AI agent
    case "run_ai_agent": {
      const agentId = config.agent_id;
      if (!agentId) return { skipped: true, reason: "no agent configured" };

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Use Lovable AI Gateway as fallback
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const { data: agent } = await supabase.from("ai_agents").select("ai_config").eq("id", agentId).single();
        const prompt = agent?.ai_config?.prompt || "You are a helpful assistant.";

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: JSON.stringify(context) },
            ],
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const aiResponse = data.choices?.[0]?.message?.content || "";
          return { ai_response: aiResponse };
        }
      }

      return { skipped: true, reason: "AI not configured" };
    }

    default:
      return { skipped: true, reason: `unknown node type: ${type}` };
  }
}
