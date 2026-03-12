import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const STATUS_MAP: Record<string, string> = {
  APPROVED: 'approved',
  COMPLETE: 'approved',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  CHARGEBACK: 'chargeback',
  BILLET_PRINTED: 'pending',
  DELAYED: 'overdue',
  OVERDUE: 'overdue',
  EXPIRED: 'cancelled',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const payload = await req.json()

    const purchase = payload?.data?.purchase
    const buyer = payload?.data?.buyer
    const product = payload?.data?.product

    if (!purchase) return new Response('Invalid payload', { status: 400, headers: corsHeaders })

    // Find account by hottok match
    const hottok = req.headers.get('x-hotmart-hottok')
    let accountId: string | null = null

    if (hottok) {
      const { data: integration } = await supabase
        .from('platform_integrations')
        .select('account_id')
        .eq('platform', 'hotmart')
        .eq('webhook_secret', hottok)
        .eq('is_active', true)
        .maybeSingle()
      accountId = integration?.account_id ?? null
    }

    const normalized = {
      account_id: accountId,
      platform: 'hotmart',
      external_id: purchase.transaction,
      status: STATUS_MAP[purchase.status] ?? 'pending',
      amount: purchase.price?.value ?? 0,
      currency: purchase.price?.currency_value ?? 'BRL',
      buyer_email: buyer?.email ?? null,
      buyer_name: buyer?.name ?? null,
      product_id: String(product?.id ?? ''),
      product_name: product?.name ?? null,
      commission: purchase.commission?.value ?? null,
      payment_method: purchase.payment?.type ?? null,
      metadata: payload,
    }

    const { error } = await supabase
      .from('sales')
      .upsert(normalized, { onConflict: 'platform,external_id' })

    if (error) throw error

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[hotmart-webhook]', err)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
})
