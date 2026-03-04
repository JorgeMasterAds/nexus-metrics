import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple in-memory rate limiter (per isolate)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
function isRateLimited(ip: string, maxReqs = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > maxReqs;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Rate limit by IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Extract token from URL
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const token = pathParts[pathParts.length - 1];

  if (!token || token === 'form-submit') {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate webhook token
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('id, account_id, project_id, is_active')
    .eq('token', token)
    .maybeSingle();

  if (!webhook || !webhook.is_active) {
    return new Response(JSON.stringify({ error: 'Invalid or inactive form' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const name = (body.name || '').slice(0, 200).trim();
  const email = (body.email || '').slice(0, 200).trim().toLowerCase();
  const phone = (body.phone || '').slice(0, 50).trim();
  const formId = body.form_id || null;

  if (!name && !email) {
    return new Response(JSON.stringify({ error: 'Name or email required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const accountId = webhook.account_id;
  const projectId = webhook.project_id;

  // Find existing lead by email or phone
  let leadId: string | null = null;

  if (email) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('account_id', accountId)
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    if (existing) leadId = existing.id;
  }

  if (!leadId && phone) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('account_id', accountId)
      .eq('phone', phone)
      .limit(1)
      .maybeSingle();
    if (existing) leadId = existing.id;
  }

  if (leadId) {
    // Update existing lead
    await supabase.from('leads').update({
      name: name || undefined,
      phone: phone || undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', leadId);

    await supabase.from('lead_history').insert({
      lead_id: leadId,
      account_id: accountId,
      action: 'form_update',
      details: 'Lead atualizado via formulário',
    });
  } else {
    // Get first pipeline stage
    const { data: firstStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('account_id', accountId)
      .order('position')
      .limit(1)
      .maybeSingle();

    const { data: newLead } = await supabase.from('leads').insert({
      account_id: accountId,
      project_id: projectId,
      name: name || email || 'Lead',
      email: email || null,
      phone: phone || null,
      source: 'formulario',
      stage_id: firstStage?.id || null,
    }).select('id').single();

    if (newLead) {
      leadId = newLead.id;
      await supabase.from('lead_history').insert({
        lead_id: newLead.id,
        account_id: accountId,
        action: 'created',
        details: 'Lead criado via formulário externo',
      });
    }
  }

  // Auto-tag: apply form-configured tags
  if (leadId && formId) {
    try {
      const { data: formTags } = await supabase
        .from('webhook_form_tags')
        .select('tag_id')
        .eq('form_id', formId);

      if (formTags && formTags.length > 0) {
        for (const ft of formTags) {
          await supabase
            .from('lead_tag_assignments')
            .insert({ lead_id: leadId, tag_id: ft.tag_id })
            .then(() => {});
        }
      }
    } catch (err) {
      console.error('Auto-tag form error:', err);
    }
  }

  // Auto-tag: apply webhook-configured tags
  if (leadId && webhook.id) {
    try {
      const { data: whTags } = await supabase
        .from('webhook_tags')
        .select('tag_id')
        .eq('webhook_id', webhook.id);

      if (whTags && whTags.length > 0) {
        for (const wt of whTags) {
          await supabase
            .from('lead_tag_assignments')
            .insert({ lead_id: leadId, tag_id: wt.tag_id })
            .then(() => {});
        }
      }
    } catch (err) {
      console.error('Auto-tag webhook error:', err);
    }
  }

  return new Response(JSON.stringify({ ok: true, lead_id: leadId }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
