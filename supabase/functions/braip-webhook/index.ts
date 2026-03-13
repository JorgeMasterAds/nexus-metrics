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
  approved: 'approved',
  refused: 'cancelled',
  refunded: 'refunded',
  chargeback: 'chargeback',
  cancelled: 'cancelled',
  waiting: 'pending',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const payload = await req.json()

    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    let accountId: string | null = null

    if (!secret) {
      console.warn('[braip-webhook] No secret query param')
      return new Response('Missing secret', { status: 401, headers: corsHeaders })
    }

    const { data: integration } = await supabase
      .from('platform_integrations')
      .select('account_id')
      .eq('platform', 'braip')
      .eq('webhook_secret', secret)
      .eq('is_active', true)
      .maybeSingle()
    
    if (!integration) {
      console.warn('[braip-webhook] No matching integration for secret')
      return new Response('Invalid secret', { status: 401, headers: corsHeaders })
    }
    accountId = integration.account_id

    const normalized = {
      account_id: accountId,
      platform: 'braip',
      external_id: String(payload?.sale_id ?? payload?.id ?? ''),
      status: STATUS_MAP[payload?.status] ?? 'pending',
      amount: parseFloat(payload?.value ?? payload?.amount ?? 0),
      currency: 'BRL',
      buyer_email: payload?.buyer?.email ?? payload?.email ?? null,
      buyer_name: payload?.buyer?.name ?? payload?.name ?? null,
      product_id: String(payload?.product?.id ?? ''),
      product_name: payload?.product?.name ?? null,
      payment_method: payload?.payment_method ?? null,
      metadata: payload,
    }

    const { error } = await supabase
      .from('sales')
      .upsert(normalized, { onConflict: 'platform,external_id' })

    if (error) throw error

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[braip-webhook]', err)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
})
