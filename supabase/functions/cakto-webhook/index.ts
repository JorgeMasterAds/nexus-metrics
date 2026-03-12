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
  purchase_approved: 'approved',
  purchase_refused: 'cancelled',
  purchase_refunded: 'refunded',
  chargeback: 'chargeback',
  subscription_canceled: 'cancelled',
  subscription_renewed: 'approved',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const payload = await req.json()
    const event = payload?.event
    const data = Array.isArray(payload?.data) ? payload.data[0] : payload?.data

    if (!data) return new Response('Invalid payload', { status: 400, headers: corsHeaders })

    // Try to find account by webhook secret in query param
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    let accountId: string | null = null

    if (secret) {
      const { data: integration } = await supabase
        .from('platform_integrations')
        .select('account_id')
        .eq('platform', 'cakto')
        .eq('webhook_secret', secret)
        .eq('is_active', true)
        .maybeSingle()
      accountId = integration?.account_id ?? null
    }

    const normalized = {
      account_id: accountId,
      platform: 'cakto',
      external_id: String(data.purchase_id ?? data.id ?? ''),
      status: STATUS_MAP[event] ?? 'pending',
      amount: data.value ?? 0,
      currency: 'BRL',
      buyer_email: data.customer?.email ?? null,
      buyer_name: data.customer?.name ?? null,
      product_id: String(data.product?.id ?? ''),
      product_name: data.product?.name ?? null,
      payment_method: data.payment_method ?? null,
      metadata: payload,
    }

    const { error } = await supabase
      .from('sales')
      .upsert(normalized, { onConflict: 'platform,external_id' })

    if (error) throw error

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[cakto-webhook]', err)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
})
