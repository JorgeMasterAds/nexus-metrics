import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
  viewer: 'Visualizador',
};

function emailTemplate({ title, preheader, body, ctaText, ctaUrl, footer }: {
  title: string; preheader: string; body: string; ctaText: string; ctaUrl: string; footer: string;
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<style>body{margin:0;padding:0;-webkit-font-smoothing:antialiased;}</style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Inter',Helvetica,Arial,sans-serif;">
<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;">
    <!-- Logo -->
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
    <!-- Card -->
    <tr><td style="background:#0f0f11;border:1px solid #1e1e22;border-radius:16px;padding:36px 32px;">
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f4f4f5;line-height:1.3;">${title}</h1>
      ${body}
      <!-- CTA -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr><td align="center">
          <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#FF2924,#FF2967);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:0.2px;">
            ${ctaText}
          </a>
        </td></tr>
      </table>
    </td></tr>
    <!-- Footer -->
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Não autorizado');

    const { email, project_id, role = 'member' } = await req.json();

    if (!email || !project_id) {
      return new Response(JSON.stringify({ error: 'Email e projeto são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Papel inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the project belongs to the caller's account
    const { data: accountIds } = await supabase.rpc('get_user_account_ids', { _user_id: userData.user.id });
    if (!accountIds || accountIds.length === 0) throw new Error('Conta não encontrada');

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, account_id')
      .eq('id', project_id)
      .in('account_id', accountIds)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Projeto não encontrado ou sem permissão' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check caller is owner/admin of the account
    const isAdmin = await supabase.rpc('user_has_admin_access', {
      _user_id: userData.user.id,
      _account_id: project.account_id,
    });
    if (!isAdmin.data) {
      return new Response(JSON.stringify({ error: 'Apenas admins podem convidar membros' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check team member limit (1000 per project)
    const { count: memberCount } = await supabase
      .from('project_users')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project_id);

    if ((memberCount || 0) >= 1000) {
      return new Response(JSON.stringify({ error: 'Limite de 1000 membros por projeto atingido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find user by email using secure RPC (avoids loading all users)
    const { data: targetUserId } = await supabase.rpc('find_user_id_by_email', { _email: email });

    // Generic response to prevent email enumeration
    const genericSuccess = { success: true, message: 'Convite enviado se o usuário existir.' };

    if (!targetUserId) {
      // Return same response whether user exists or not
      return new Response(JSON.stringify(genericSuccess), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already a member (silent - same generic response)
    const { data: existing } = await supabase
      .from('project_users')
      .select('id')
      .eq('project_id', project_id)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify(genericSuccess), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add member (accepted_at = null so it shows as pending invite)
    const { error: insertError } = await supabase
      .from('project_users')
      .insert({
        project_id,
        user_id: targetUserId,
        role,
        invited_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Get project name for notification email
    const { data: projDetail } = await supabase
      .from('projects')
      .select('name')
      .eq('id', project_id)
      .maybeSingle();

    // Get inviter name
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userData.user.id)
      .maybeSingle();

    // Get target user email
    const { data: targetEmails } = await supabase.rpc('get_user_emails_by_ids', {
      _user_ids: [targetUserId],
    });
    const targetEmail = targetEmails?.[0]?.email;

    // Send invite email via SMTP if configured
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass && targetEmail) {
      try {
        const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
        const client = new SMTPClient({
          connection: {
            hostname: smtpHost,
            port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
            tls: true,
            auth: { username: smtpUser, password: smtpPass },
          },
        });

        const projectName = projDetail?.name || 'um projeto';
        const inviterName = inviterProfile?.full_name || userData.user.email || 'Alguém';
        const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://nexusmetrics.jmads.com.br';

        await client.send({
          from: smtpUser,
          to: targetEmail,
          subject: `🚀 Você foi convidado para "${projectName}" no Nexus Metrics`,
          html: emailTemplate({
            title: 'Novo convite de projeto',
            preheader: `${inviterName} convidou você para "${projectName}"`,
            body: `
              <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 8px;">
                <strong style="color:#f4f4f5;">${inviterName}</strong> convidou você para participar do projeto
              </p>
              <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px 20px;margin:16px 0 24px;">
                <p style="margin:0;font-size:18px;font-weight:700;color:#f4f4f5;">${projectName}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#71717a;">Papel: <span style="color:#FF2924;font-weight:600;">${roleLabels[role] || role}</span></p>
              </div>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 28px;">
                Acesse sua conta para aceitar ou recusar o convite nas notificações.
              </p>
            `,
            ctaText: 'Acessar Nexus Metrics',
            ctaUrl: appUrl,
            footer: 'Você recebeu este e-mail porque alguém convidou você para um projeto no Nexus Metrics.',
          }),
        });
        await client.close();
      } catch (emailErr) {
        console.error('Failed to send invite email:', emailErr);
        // Don't fail the invite if email fails
      }
    }

    return new Response(JSON.stringify(genericSuccess), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
