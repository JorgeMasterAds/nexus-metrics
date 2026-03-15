import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const STATUS_MAP: Record<string, string> = {
  '1': 'pending',
  '3': 'approved',
  '4': 'cancelled',
  '6': 'refunded',
  '7': 'cancelled',
  '13': 'chargeback',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const payload = await req.json()

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const urlToken = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null
    const querySecret = url.searchParams.get('secret')
    const secret = urlToken || querySecret

    if (!secret) {
      console.warn('[eduzz-webhook] No token/secret found')
      return new Response('Missing secret', { status: 401, headers: corsHeaders })
    }

    const { data: integration } = await supabase
      .from('platform_integrations')
      .select('account_id')
      .eq('platform', 'eduzz')
      .eq('webhook_secret', secret)
      .eq('is_active', true)
      .maybeSingle()
    
    if (!integration) {
      console.warn('[eduzz-webhook] No matching integration for secret')
      return new Response('Invalid secret', { status: 401, headers: corsHeaders })
    }
    const accountId = integration.account_id

    const normalized = {
      account_id: accountId,
      platform: 'eduzz',
      external_id: String(payload?.trans_cod ?? payload?.sale_id ?? ''),
      status: STATUS_MAP[String(payload?.sale_status)] ?? 'pending',
      amount: parseFloat(payload?.sale_total ?? 0),
      currency: 'BRL',
      buyer_email: payload?.cli_email ?? null,
      buyer_name: payload?.cli_name ?? null,
      product_id: String(payload?.content_id ?? ''),
      product_name: payload?.content_title ?? null,
      payment_method: payload?.pay_type ?? null,
      metadata: payload,
    }

    const { error } = await supabase
      .from('sales')
      .upsert(normalized, { onConflict: 'platform,external_id' })

    if (error) throw error

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[eduzz-webhook]', err)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
})
