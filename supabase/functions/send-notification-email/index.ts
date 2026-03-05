import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Branded email wrapper ──
function emailTemplate({ title, preheader, body, ctaText, ctaUrl, footer }: {
  title: string; preheader: string; body: string; ctaText?: string; ctaUrl?: string; footer: string;
}) {
  const ctaBlock = ctaText && ctaUrl ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:4px;">
      <tr><td align="center">
        <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#FF2924,#FF2967);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:0.2px;">
          ${ctaText}
        </a>
      </td></tr>
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<style>body{margin:0;padding:0;-webkit-font-smoothing:antialiased;}</style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Inter',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;">
    <tr><td align="center" style="padding-bottom:32px;">
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:36px;height:36px;background:linear-gradient(135deg,#FF2924,#FF2967);border-radius:10px;" align="center" valign="middle">
            <span style="font-size:18px;color:#fff;font-weight:800;line-height:36px;">N</span>
          </td>
          <td style="padding-left:10px;">
            <span style="font-size:18px;font-weight:700;color:#f4f4f5;letter-spacing:-0.3px;">Nexus Metrics</span>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="background:#0f0f11;border:1px solid #1e1e22;border-radius:16px;padding:36px 32px;">
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f4f4f5;line-height:1.3;">${title}</h1>
      ${body}
      ${ctaBlock}
    </td></tr>
    <tr><td style="padding:28px 20px 0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">${footer}</p>
      <p style="margin:8px 0 0;font-size:11px;color:#3f3f46;">© ${new Date().getFullYear()} Nexus Metrics. Todos os direitos reservados.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

// ── SMTP sender ──
async function sendEmail(to: string, subject: string, html: string) {
  const smtpHost = Deno.env.get('SMTP_HOST');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPass = Deno.env.get('SMTP_PASS');
  if (!smtpHost || !smtpUser || !smtpPass) throw new Error('SMTP not configured');

  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
      tls: true,
      auth: { username: smtpUser, password: smtpPass },
    },
  });
  await client.send({ from: smtpUser, to, subject, html });
  await client.close();
}

// ── Email builders ──

function buildLimitAlertEmail(resourceName: string, current: number, max: number, appUrl: string) {
  const pct = Math.round((current / max) * 100);
  const isCritical = current >= max;
  const statusColor = isCritical ? '#ef4444' : '#f59e0b';
  const statusLabel = isCritical ? 'LIMITE ATINGIDO' : 'QUASE NO LIMITE';

  return {
    subject: isCritical
      ? `🚨 Limite atingido: ${resourceName}`
      : `⚠️ Alerta de uso: ${resourceName} em ${pct}%`,
    html: emailTemplate({
      title: `Alerta de uso: ${resourceName}`,
      preheader: `${statusLabel} — ${current}/${max} (${pct}%)`,
      body: `
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin:0 0 24px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${statusColor};"></span>
            <span style="color:${statusColor};font-weight:700;font-size:13px;letter-spacing:0.5px;">${statusLabel}</span>
          </div>
          <p style="margin:0 0 8px;color:#f4f4f5;font-size:28px;font-weight:800;">${current}<span style="color:#71717a;font-weight:400;font-size:16px;"> / ${max}</span></p>
          <p style="margin:0;color:#a1a1aa;font-size:14px;">${resourceName} utilizados</p>
          <!-- Progress bar -->
          <div style="margin-top:16px;background:#27272a;border-radius:6px;height:8px;overflow:hidden;">
            <div style="width:${Math.min(pct, 100)}%;height:100%;background:linear-gradient(90deg,${statusColor},${isCritical ? '#dc2626' : '#eab308'});border-radius:6px;"></div>
          </div>
        </div>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 28px;">
          ${isCritical
            ? 'Você atingiu o limite do seu plano atual. Para continuar criando novos recursos, considere fazer um upgrade.'
            : `Você está usando ${pct}% do seu limite. Considere fazer um upgrade antes de atingir o limite.`}
        </p>
      `,
      ctaText: 'Gerenciar meu plano',
      ctaUrl: `${appUrl}/settings`,
      footer: 'Este alerta é enviado automaticamente quando o uso dos recursos se aproxima do limite do plano.',
    }),
  };
}

function buildSubscriptionFailureEmail(eventType: string, planName: string, appUrl: string) {
  const isOverdue = eventType.includes('DELAYED') || eventType.includes('OVERDUE');
  const isCanceled = eventType.includes('CANCEL') || eventType.includes('REFUND') || eventType.includes('CHARGEBACK') || eventType.includes('EXPIRED');

  const title = isOverdue ? 'Pagamento pendente' : 'Assinatura cancelada';
  const description = isOverdue
    ? 'Detectamos que o pagamento da sua assinatura está pendente. Regularize para evitar a suspensão do seu acesso.'
    : 'Sua assinatura foi cancelada e seu plano foi revertido para o plano gratuito. Seus dados continuam salvos.';
  const icon = isOverdue ? '⚠️' : '❌';

  return {
    subject: `${icon} ${title} — Nexus Metrics`,
    html: emailTemplate({
      title,
      preheader: description,
      body: `
        <div style="background:#18181b;border:1px solid ${isOverdue ? '#f59e0b33' : '#ef444433'};border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0;font-size:14px;color:${isOverdue ? '#f59e0b' : '#ef4444'};font-weight:600;">
            ${isOverdue ? '⏳ Pagamento em atraso' : '🔒 Acesso reduzido ao plano gratuito'}
          </p>
          <p style="margin:6px 0 0;font-size:13px;color:#71717a;">Plano anterior: <strong style="color:#f4f4f5;">${planName}</strong></p>
        </div>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 28px;">
          ${description}
        </p>
      `,
      ctaText: isOverdue ? 'Regularizar pagamento' : 'Reativar meu plano',
      ctaUrl: `${appUrl}/settings`,
      footer: 'Este e-mail é enviado automaticamente pelo sistema de faturamento.',
    }),
  };
}

function buildLeadExportEmail(totalLeads: number, downloadUrl: string, projectName: string) {
  return {
    subject: `📊 Exportação de leads concluída — ${projectName}`,
    html: emailTemplate({
      title: 'Exportação de leads pronta',
      preheader: `${totalLeads} leads exportados do projeto "${projectName}"`,
      body: `
        <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 8px;">
          A exportação dos leads do projeto <strong style="color:#f4f4f5;">"${projectName}"</strong> foi concluída com sucesso.
        </p>
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px 20px;margin:16px 0 28px;">
          <p style="margin:0;font-size:28px;font-weight:800;color:#f4f4f5;">${totalLeads.toLocaleString('pt-BR')}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#71717a;">leads exportados</p>
        </div>
        <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0 0 28px;">
          O link de download expira em 24 horas. Clique no botão abaixo para baixar o arquivo.
        </p>
      `,
      ctaText: 'Baixar arquivo CSV',
      ctaUrl: downloadUrl,
      footer: 'Este arquivo contém dados sensíveis. Não compartilhe o link de download.',
    }),
  };
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  try {
    const { type, ...params } = await req.json();

    // Internal calls from other edge functions don't need auth
    const internalSecret = req.headers.get('x-internal-secret');
    const isInternal = internalSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!isInternal) {
      // Validate auth for client-side calls
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Não autorizado');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) throw new Error('Não autorizado');
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://nexusmetrics.jmads.com.br';

    switch (type) {
      case 'limit_alert': {
        const { email, resource_name, current, max } = params;
        if (!email || !resource_name) throw new Error('Missing params');
        const { subject, html } = buildLimitAlertEmail(resource_name, current, max, appUrl);
        await sendEmail(email, subject, html);
        break;
      }

      case 'subscription_failure': {
        const { email, event_type, plan_name } = params;
        if (!email) throw new Error('Missing email');
        const { subject, html } = buildSubscriptionFailureEmail(event_type || 'CANCELED', plan_name || 'Desconhecido', appUrl);
        await sendEmail(email, subject, html);
        break;
      }

      case 'lead_export': {
        const { email, total_leads, download_url, project_name } = params;
        if (!email || !download_url) throw new Error('Missing params');
        const { subject, html } = buildLeadExportEmail(total_leads || 0, download_url, project_name || 'Projeto');
        await sendEmail(email, subject, html);
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SEND-EMAIL] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
