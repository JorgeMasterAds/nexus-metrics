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

    const { action, agent_id, conversation_id, message, messages: chatMessages } = await req.json();

    // Verify user belongs to the agent's account
    const { data: accountIds } = await supabase.rpc("get_user_account_ids", { _user_id: userData.user.id });

    // ── ACTION: chat ── Send a message to an agent and get a streamed response
    if (action === "chat") {
      if (!agent_id) throw new Error("agent_id required");

      const { data: agent, error: agentErr } = await supabase
        .from("hub_agents")
        .select("*, hub_agent_settings(*)")
        .eq("id", agent_id)
        .single();

      if (agentErr || !agent) throw new Error("Agent not found");
      if (!accountIds?.includes(agent.account_id)) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const settings = agent.hub_agent_settings?.[0] || agent.hub_agent_settings || {};

      // Get or create conversation
      let convId = conversation_id;
      if (!convId) {
        const { data: conv } = await supabase
          .from("hub_conversations")
          .insert({
            agent_id,
            account_id: agent.account_id,
            channel: "web",
            status: "active",
            metadata: { user_id: userData.user.id },
          })
          .select()
          .single();
        convId = conv!.id;
      }

      // Save user message
      await supabase.from("hub_messages").insert({
        conversation_id: convId,
        agent_id,
        account_id: agent.account_id,
        role: "user",
        content: message,
      });

      // Load conversation history
      const { data: history } = await supabase
        .from("hub_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(50);

      const systemPrompt = settings.system_prompt || agent.system_prompt || "You are a helpful AI assistant.";
      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...(history || []).map((m: any) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
      ];

      // Try user's own API key first, then Lovable AI Gateway
      let apiKey = "";
      let provider = "";

      if (settings.api_key_id) {
        const { data: keyData } = await supabase
          .from("ai_api_keys")
          .select("api_key_encrypted, provider")
          .eq("id", settings.api_key_id)
          .single();
        if (keyData) {
          apiKey = keyData.api_key_encrypted;
          provider = keyData.provider;
        }
      }

      // Use Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey && LOVABLE_API_KEY) {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: settings.model || "google/gemini-3-flash-preview",
            messages: aiMessages,
            stream: true,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw new Error(`AI gateway error: ${response.status}`);
        }

        // Collect full response for saving, while streaming to client
        const [streamForClient, streamForCollect] = response.body!.tee();

        // Save assistant message in background
        const savePromise = (async () => {
          const reader = streamForCollect.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullContent += content;
              } catch { /* ignore */ }
            }
          }

          if (fullContent) {
            await supabase.from("hub_messages").insert({
              conversation_id: convId,
              agent_id,
              account_id: agent.account_id,
              role: "assistant",
              content: fullContent,
            });

            // Log execution
            await supabase.from("hub_agent_logs").insert({
              agent_id,
              account_id: agent.account_id,
              conversation_id: convId,
              action: "chat",
              input: message,
              output: fullContent.slice(0, 1000),
              tokens_in: aiMessages.reduce((a: number, m: any) => a + (m.content?.length || 0), 0),
              tokens_out: fullContent.length,
              duration_ms: 0,
              status: "success",
            });
          }
        })();

        // Don't await savePromise - let it run in background
        savePromise.catch(e => console.error("Save error:", e));

        return new Response(streamForClient, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "X-Conversation-Id": convId,
          },
        });
      }

      // Fallback to user's own API key
      if (apiKey && provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: settings.model || "gpt-4o-mini",
            messages: aiMessages,
            stream: true,
          }),
        });

        // Save and stream same as above
        const [streamForClient, streamForCollect] = response.body!.tee();
        const savePromise = collectAndSave(streamForCollect, supabase, convId, agent_id, agent.account_id, message, aiMessages);
        savePromise.catch(e => console.error("Save error:", e));

        return new Response(streamForClient, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream", "X-Conversation-Id": convId },
        });
      }

      throw new Error("No AI provider configured. Add an API key or enable Lovable AI.");
    }

    // ── ACTION: list_conversations ──
    if (action === "list_conversations") {
      if (!agent_id) throw new Error("agent_id required");
      const { data } = await supabase
        .from("hub_conversations")
        .select("*")
        .eq("agent_id", agent_id)
        .order("updated_at", { ascending: false })
        .limit(50);
      return new Response(JSON.stringify({ conversations: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: get_messages ──
    if (action === "get_messages") {
      if (!conversation_id) throw new Error("conversation_id required");
      const { data } = await supabase
        .from("hub_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true })
        .limit(200);
      return new Response(JSON.stringify({ messages: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e: any) {
    console.error("hub-chat error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function collectAndSave(stream: ReadableStream, supabase: any, convId: string, agentId: string, accountId: string, userMessage: string, aiMessages: any[]) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullContent += content;
      } catch { /* ignore */ }
    }
  }

  if (fullContent) {
    await supabase.from("hub_messages").insert({
      conversation_id: convId,
      agent_id: agentId,
      account_id: accountId,
      role: "assistant",
      content: fullContent,
    });
  }
}
