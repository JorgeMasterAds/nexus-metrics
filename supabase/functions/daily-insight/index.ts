import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

    const { account_id, project_id } = await req.json();
    if (!account_id) {
      return new Response(JSON.stringify({ error: "account_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Check if insight already exists for today
    let existingQ = supabase
      .from("daily_insights")
      .select("*")
      .eq("account_id", account_id)
      .eq("insight_date", today);
    
    if (project_id) {
      existingQ = existingQ.eq("project_id", project_id);
    } else {
      existingQ = existingQ.is("project_id", null);
    }

    const { data: existing } = await existingQ.maybeSingle();
    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather metrics: today vs yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

    // Today's conversions
    let qToday = supabase
      .from("conversions")
      .select("amount", { count: "exact" })
      .eq("account_id", account_id)
      .eq("status", "approved")
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);
    if (project_id) qToday = qToday.eq("project_id", project_id);
    const { data: todayConv, count: todayCount } = await qToday;

    // Yesterday's conversions
    let qYesterday = supabase
      .from("conversions")
      .select("amount", { count: "exact" })
      .eq("account_id", account_id)
      .eq("status", "approved")
      .gte("created_at", `${yesterday}T00:00:00`)
      .lt("created_at", `${yesterday}T23:59:59`);
    if (project_id) qYesterday = qYesterday.eq("project_id", project_id);
    const { data: yesterdayConv, count: yesterdayCount } = await qYesterday;

    // Today's clicks
    let qClicksToday = supabase
      .from("clicks")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account_id)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);
    if (project_id) qClicksToday = qClicksToday.eq("project_id", project_id);
    const { count: clicksToday } = await qClicksToday;

    // Yesterday's clicks
    let qClicksYesterday = supabase
      .from("clicks")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account_id)
      .gte("created_at", `${yesterday}T00:00:00`)
      .lt("created_at", `${yesterday}T23:59:59`);
    if (project_id) qClicksYesterday = qClicksYesterday.eq("project_id", project_id);
    const { count: clicksYesterday } = await qClicksYesterday;

    const todayRevenue = (todayConv || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const yesterdayRevenue = (yesterdayConv || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

    const metricsContext = `
Dados de hoje (${today}):
- Vendas: ${todayCount || 0}
- Faturamento: R$ ${todayRevenue.toFixed(2)}
- Cliques: ${clicksToday || 0}
- Taxa conversão: ${(clicksToday || 0) > 0 ? (((todayCount || 0) / (clicksToday || 1)) * 100).toFixed(1) : 0}%

Dados de ontem (${yesterday}):
- Vendas: ${yesterdayCount || 0}
- Faturamento: R$ ${yesterdayRevenue.toFixed(2)}
- Cliques: ${clicksYesterday || 0}
- Taxa conversão: ${(clicksYesterday || 0) > 0 ? (((yesterdayCount || 0) / (clicksYesterday || 1)) * 100).toFixed(1) : 0}%
`.trim();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      // Fallback without AI
      const trend = todayRevenue > yesterdayRevenue ? "up" : todayRevenue < yesterdayRevenue ? "down" : "stable";
      const fallback = trend === "up"
        ? `📈 Faturamento em alta! Hoje já são R$ ${todayRevenue.toFixed(2)} vs R$ ${yesterdayRevenue.toFixed(2)} ontem. Continue assim!`
        : trend === "down"
        ? `📉 Faturamento em queda comparado a ontem (R$ ${yesterdayRevenue.toFixed(2)} → R$ ${todayRevenue.toFixed(2)}). Considere revisar suas campanhas.`
        : `➡️ Faturamento estável em R$ ${todayRevenue.toFixed(2)}. Analise novas estratégias para acelerar.`;

      const { data: inserted } = await supabase
        .from("daily_insights")
        .upsert({
          account_id, project_id: project_id || null, insight_date: today, message: fallback, trend,
        }, { onConflict: "account_id,project_id,insight_date" })
        .select()
        .single();

      return new Response(JSON.stringify(inserted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch chatbot config to get model preference
    const { data: chatbotConfig } = await supabase
      .from("support_chatbot_config")
      .select("model")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const aiModel = chatbotConfig?.model || "gpt-5-mini";

    // Call OpenAI API
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `Você é um analista de marketing digital. Com base nos dados fornecidos, gere UMA frase curta (máximo 2 linhas) com um insight prático sobre a performance do negócio. Use emoji no início. Seja direto e acionável. Responda APENAS a frase, sem formatação markdown. Exemplos:
📈 Vendas subiram 30% hoje! Aproveite o momento para aumentar o investimento em anúncios.
📉 Queda de 15% no faturamento. Verifique se há problemas na página de checkout ou reduza o preço temporariamente.
🔄 Performance estável. Teste novos criativos ou públicos diferentes para impulsionar crescimento.`,
          },
          { role: "user", content: metricsContext },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
      // Fallback
      const trend = todayRevenue >= yesterdayRevenue ? "up" : "down";
      const fallback = `📊 Faturamento hoje: R$ ${todayRevenue.toFixed(2)} | Ontem: R$ ${yesterdayRevenue.toFixed(2)}`;
      const { data: inserted } = await supabase
        .from("daily_insights")
        .upsert({ account_id, project_id: project_id || null, insight_date: today, message: fallback, trend }, { onConflict: "account_id,project_id,insight_date" })
        .select().single();
      return new Response(JSON.stringify(inserted), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices?.[0]?.message?.content?.trim() || "📊 Analise seus dados para identificar oportunidades.";

    const trend = todayRevenue > yesterdayRevenue ? "up" : todayRevenue < yesterdayRevenue ? "down" : "stable";

    const { data: inserted } = await supabase
      .from("daily_insights")
      .upsert({
        account_id,
        project_id: project_id || null,
        insight_date: today,
        message: aiMessage,
        trend,
      }, { onConflict: "account_id,project_id,insight_date" })
      .select()
      .single();

    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("daily-insight error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
