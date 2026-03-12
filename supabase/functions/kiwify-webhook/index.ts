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
  compra_aprovada: 'approved',
  compra_recusada: 'cancelled',
  compra_reembolsada: 'refunded',
  chargeback: 'chargeback',
  subscription_canceled: 'cancelled',
  subscription_renewed: 'approved',
  subscription_late: 'overdue',
  boleto_gerado: 'pending',
  pix_gerado: 'pending',
  carrinho_abandonado: 'pending',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const payload = await req.json()

    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    let accountId: string | null = null

    if (secret) {
      const { data: integration } = await supabase
        .from('platform_integrations')
        .select('account_id')
        .eq('platform', 'kiwify')
        .eq('webhook_secret', secret)
        .eq('is_active', true)
        .maybeSingle()
      accountId = integration?.account_id ?? null
    }

    const event = payload?.event ?? payload?.type
    const data = payload?.data ?? payload

    const normalized = {
      account_id: accountId,
      platform: 'kiwify',
      external_id: String(data?.order_id ?? data?.id ?? ''),
      status: STATUS_MAP[event] ?? 'pending',
      amount: parseFloat(data?.order_value ?? data?.amount ?? 0),
      currency: 'BRL',
      buyer_email: data?.Customer?.email ?? data?.customer?.email ?? null,
      buyer_name: data?.Customer?.full_name ?? data?.customer?.name ?? null,
      product_id: String(data?.Product?.id ?? data?.product?.id ?? ''),
      product_name: data?.Product?.name ?? data?.product?.name ?? null,
      payment_method: data?.payment_method ?? null,
      metadata: payload,
    }

    const { error } = await supabase
      .from('sales')
      .upsert(normalized, { onConflict: 'platform,external_id' })

    if (error) throw error

    return new Response('OK', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[kiwify-webhook]', err)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
})
