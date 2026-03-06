import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.220.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Branded email wrapper (short lines to avoid =20 quoted-printable) ──
function emailTemplate(opts: {
  title: string; preheader: string; body: string;
  ctaText?: string; ctaUrl?: string; footer: string;
}) {
  const { title, preheader, body, ctaText, ctaUrl, footer } = opts;
  const cta = ctaText && ctaUrl
    ? `<table width="100%" cellspacing="0" cellpadding="0" role="presentation">
<tr><td align="center" style="padding-top:4px;">
<a href="${ctaUrl}" target="_blank"
style="display:inline-block;padding:14px 36px;
background:linear-gradient(135deg,#FF2924,#FF2967);
color:#ffffff;text-decoration:none;border-radius:10px;
font-weight:600;font-size:15px;">
${ctaText}</a>
</td></tr></table>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;
background-color:#09090b;
font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;
overflow:hidden;">${preheader}</div>
<table width="100%" cellspacing="0"
cellpadding="0" role="presentation"
style="background-color:#09090b;">
<tr><td align="center" style="padding:40px 16px;">
<table width="520" cellspacing="0"
cellpadding="0" role="presentation"
style="max-width:520px;width:100%;">
<tr><td align="center"
style="padding-bottom:32px;">
<table cellspacing="0" cellpadding="0"
role="presentation"><tr>
<td style="width:36px;height:36px;
background:linear-gradient(135deg,#FF2924,#FF2967);
border-radius:10px;"
align="center" valign="middle">
<span style="font-size:18px;color:#fff;
font-weight:800;line-height:36px;">N</span>
</td>
<td style="padding-left:10px;">
<span style="font-size:18px;font-weight:700;
color:#f4f4f5;">Nexus Metrics</span>
</td>
</tr></table>
</td></tr>
<tr><td style="background:#0f0f11;
border:1px solid #1e1e22;
border-radius:16px;padding:36px 32px;">
<h1 style="margin:0 0 20px;font-size:22px;
font-weight:700;color:#f4f4f5;
line-height:1.3;">${title}</h1>
${body}
${cta}
</td></tr>
<tr><td style="padding:28px 20px 0;
text-align:center;">
<p style="margin:0;font-size:12px;
color:#52525b;line-height:1.6;">${footer}</p>
<p style="margin:8px 0 0;font-size:11px;
color:#3f3f46;">&copy; ${new Date().getFullYear()}
Nexus Metrics. Todos os direitos reservados.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── SMTP sender with base64 transfer encoding ──
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
  await client.send({
    from: smtpUser,
    to,
    subject,
    content: "Visualize este e-mail em HTML.",
    html,
    encoding: "base64",
  });
  await client.close();
}

// ── Limit resource item type ──
interface LimitItem {
  label: string;
  current: number;
  max: number;
}

// ── Build consolidated limit alerts email ──
function buildLimitAlertsEmail(items: LimitItem[], appUrl: string) {
  const hasCritical = items.some(i => i.current >= i.max);

  const rows = items.map(item => {
    const pct = Math.round((item.current / item.max) * 100);
    const isCritical = item.current >= item.max;
    const color = isCritical ? '#ef4444' : '#f59e0b';
    const label = isCritical ? 'ATINGIDO' : `${pct}%`;

    return `<tr>
<td style="padding:12px 16px;border-bottom:1px solid #27272a;">
<span style="color:#f4f4f5;font-size:14px;
font-weight:600;">${item.label}</span>
</td>
<td style="padding:12px 16px;border-bottom:1px solid #27272a;
text-align:center;">
<span style="color:#f4f4f5;font-size:20px;
font-weight:800;">${item.current}</span>
<span style="color:#71717a;font-size:13px;">
/ ${item.max}</span>
</td>
<td style="padding:12px 16px;border-bottom:1px solid #27272a;
text-align:right;">
<span style="display:inline-block;padding:4px 10px;
border-radius:6px;font-size:11px;font-weight:700;
color:#fff;background:${color};">${label}</span>
</td>
</tr>`;
  }).join('');

  const subject = hasCritical
    ? `\u{1F6A8} Limites atingidos no seu plano`
    : `\u{26A0}\u{FE0F} Alerta de uso de recursos`;

  return {
    subject,
    html: emailTemplate({
      title: 'Alerta de uso de recursos',
      preheader: `${items.length} recurso(s) pr\u00F3ximo(s) do limite`,
      body: `
<p style="color:#a1a1aa;font-size:14px;
line-height:1.7;margin:0 0 20px;">
Os seguintes recursos est\u00E3o pr\u00F3ximos ou
atingiram o limite do seu plano atual:</p>
<table width="100%" cellspacing="0" cellpadding="0"
role="presentation"
style="background:#18181b;border:1px solid #27272a;
border-radius:12px;overflow:hidden;
margin:0 0 24px;">
<tr style="background:#1a1a1e;">
<td style="padding:10px 16px;font-size:11px;
color:#71717a;font-weight:600;
text-transform:uppercase;
letter-spacing:0.5px;">Recurso</td>
<td style="padding:10px 16px;font-size:11px;
color:#71717a;font-weight:600;
text-transform:uppercase;text-align:center;
letter-spacing:0.5px;">Uso</td>
<td style="padding:10px 16px;font-size:11px;
color:#71717a;font-weight:600;
text-transform:uppercase;text-align:right;
letter-spacing:0.5px;">Status</td>
</tr>
${rows}
</table>
<p style="color:#a1a1aa;font-size:14px;
line-height:1.7;margin:0 0 28px;">
${hasCritical
  ? 'Voc\u00EA atingiu o limite em um ou mais recursos. Para continuar criando, considere fazer um upgrade.'
  : 'Considere fazer um upgrade antes de atingir os limites.'}
</p>`,
      ctaText: 'Gerenciar meu plano',
      ctaUrl: `${appUrl}/settings`,
      footer: 'Este alerta \u00E9 enviado automaticamente quando o uso dos recursos se aproxima do limite do plano.',
    }),
  };
}

function buildSubscriptionFailureEmail(
  eventType: string, planName: string, appUrl: string
) {
  const isOverdue = eventType.includes('DELAYED')
    || eventType.includes('OVERDUE');

  const title = isOverdue
    ? 'Pagamento pendente'
    : 'Assinatura cancelada';
  const description = isOverdue
    ? 'Detectamos que o pagamento da sua assinatura est\u00E1 pendente. Regularize para evitar a suspens\u00E3o.'
    : 'Sua assinatura foi cancelada e seu plano foi revertido para o gratuito. Seus dados continuam salvos.';
  const icon = isOverdue ? '\u26A0\uFE0F' : '\u274C';
  const borderColor = isOverdue ? '#f59e0b33' : '#ef444433';
  const textColor = isOverdue ? '#f59e0b' : '#ef4444';

  return {
    subject: `${icon} ${title} \u2014 Nexus Metrics`,
    html: emailTemplate({
      title,
      preheader: description,
      body: `
<div style="background:#18181b;
border:1px solid ${borderColor};
border-radius:12px;padding:16px 20px;
margin:0 0 24px;">
<p style="margin:0;font-size:14px;
color:${textColor};font-weight:600;">
${isOverdue ? '\u23F3 Pagamento em atraso' : '\uD83D\uDD12 Acesso reduzido'}
</p>
<p style="margin:6px 0 0;font-size:13px;
color:#71717a;">Plano anterior:
<strong style="color:#f4f4f5;">${planName}</strong></p>
</div>
<p style="color:#a1a1aa;font-size:14px;
line-height:1.7;margin:0 0 28px;">
${description}</p>`,
      ctaText: isOverdue ? 'Regularizar pagamento' : 'Reativar meu plano',
      ctaUrl: `${appUrl}/settings`,
      footer: 'E-mail enviado automaticamente pelo sistema de faturamento.',
    }),
  };
}

function buildPlanUpgradeEmail(
  planName: string, features: string[], appUrl: string
) {
  const featureRows = features.map(f =>
    `<tr><td style="padding:8px 16px;
border-bottom:1px solid #27272a;">
<span style="color:#22c55e;font-size:14px;
margin-right:8px;">\u2714</span>
<span style="color:#f4f4f5;font-size:14px;">${f}</span>
</td></tr>`
  ).join('');

  return {
    subject: `\uD83C\uDF89 Parab\u00E9ns! Seu plano agora \u00E9 ${planName}`,
    html: emailTemplate({
      title: `Parab\u00E9ns! Voc\u00EA agora \u00E9 ${planName} \uD83C\uDF89`,
      preheader: `Seu plano foi atualizado para ${planName}. Confira seus novos benef\u00EDcios!`,
      body: `
<p style="color:#a1a1aa;font-size:15px;
line-height:1.7;margin:0 0 8px;">
Seu plano foi atualizado com sucesso para
<strong style="color:#f4f4f5;">${planName}</strong>.
Agora voc\u00EA tem acesso a recursos exclusivos
para turbinar seus resultados!</p>
<div style="background:#18181b;
border:1px solid #27272a;border-radius:12px;
overflow:hidden;margin:20px 0 28px;">
<table width="100%" cellspacing="0" cellpadding="0"
role="presentation">
<tr style="background:#1a1a1e;">
<td style="padding:10px 16px;font-size:11px;
color:#71717a;font-weight:600;
text-transform:uppercase;
letter-spacing:0.5px;">
\uD83C\uDF1F Seus novos benef\u00EDcios</td>
</tr>
${featureRows}
</table>
</div>
<p style="color:#a1a1aa;font-size:14px;
line-height:1.7;margin:0 0 28px;">
Explore agora todas as funcionalidades
dispon\u00EDveis no seu novo plano.</p>`,
      ctaText: 'Explorar meu painel',
      ctaUrl: `${appUrl}/dashboard`,
      footer: 'Obrigado por confiar no Nexus Metrics. Estamos aqui para ajud\u00E1-lo a crescer!',
    }),
  };
}

function buildLeadExportEmail(
  totalLeads: number, downloadUrl: string, projectName: string
) {
  return {
    subject: `\uD83D\uDCCA Exporta\u00E7\u00E3o de leads \u2014 ${projectName}`,
    html: emailTemplate({
      title: 'Exporta\u00E7\u00E3o de leads pronta',
      preheader: `${totalLeads} leads exportados`,
      body: `
<p style="color:#a1a1aa;font-size:15px;
line-height:1.7;margin:0 0 8px;">
A exporta\u00E7\u00E3o do projeto
<strong style="color:#f4f4f5;">
"${projectName}"</strong> foi conclu\u00EDda.</p>
<div style="background:#18181b;
border:1px solid #27272a;border-radius:12px;
padding:16px 20px;margin:16px 0 28px;">
<p style="margin:0;font-size:28px;
font-weight:800;color:#f4f4f5;">
${totalLeads.toLocaleString('pt-BR')}</p>
<p style="margin:4px 0 0;font-size:13px;
color:#71717a;">leads exportados</p>
</div>
<p style="color:#a1a1aa;font-size:13px;
line-height:1.6;margin:0 0 28px;">
O link expira em 24 horas.</p>`,
      ctaText: 'Baixar arquivo CSV',
      ctaUrl: downloadUrl,
      footer: 'Arquivo com dados sens\u00EDveis. N\u00E3o compartilhe o link.',
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

    const internalSecret = req.headers.get('x-internal-secret');
    const isInternal = internalSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!isInternal) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('N\u00E3o autorizado');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) throw new Error('N\u00E3o autorizado');
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://nexusmetrics.jmads.com.br';

    switch (type) {
      case 'limit_alert': {
        // Legacy single-resource alert — redirect to batch
        const { email, resource_name, current, max } = params;
        if (!email || !resource_name) throw new Error('Missing params');
        const { subject, html } = buildLimitAlertsEmail(
          [{ label: resource_name, current, max }], appUrl
        );
        await sendEmail(email, subject, html);
        break;
      }

      case 'limit_alerts_batch': {
        const { email, items } = params as {
          email: string; items: LimitItem[];
        };
        if (!email || !items?.length) throw new Error('Missing params');
        const { subject, html } = buildLimitAlertsEmail(items, appUrl);
        await sendEmail(email, subject, html);
        break;
      }

      case 'subscription_failure': {
        const { email, event_type, plan_name } = params;
        if (!email) throw new Error('Missing email');
        const { subject, html } = buildSubscriptionFailureEmail(
          event_type || 'CANCELED',
          plan_name || 'Desconhecido', appUrl
        );
        await sendEmail(email, subject, html);
        break;
      }

      case 'lead_export': {
        const { email, total_leads, download_url, project_name } = params;
        if (!email || !download_url) throw new Error('Missing params');
        const { subject, html } = buildLeadExportEmail(
          total_leads || 0, download_url,
          project_name || 'Projeto'
        );
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
