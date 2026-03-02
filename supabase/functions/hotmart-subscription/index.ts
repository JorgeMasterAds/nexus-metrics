import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Validate Hotmart token via header (official v2 flow) ──
  const HOTMART_HOTTOK = Deno.env.get('HOTMART_HOTTOK');
  if (!HOTMART_HOTTOK) {
    console.error('[HOTMART-SUB] HOTMART_HOTTOK não configurado');
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const receivedToken = req.headers.get('x-hotmart-hottok');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (!receivedToken || receivedToken !== HOTMART_HOTTOK) {
    console.warn('[HOTMART-SUB] Unauthorized: X-HOTMART-HOTTOK inválido');
    await logEvent(supabase, {
      event_id: `rejected_${Date.now()}`,
      event_type: 'UNAUTHORIZED',
      raw_payload: null,
      status: 'rejected',
      error_message: 'Invalid X-HOTMART-HOTTOK header',
    });
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Extract event data ──
  const data = (rawPayload as any).data || rawPayload;
  const event = (rawPayload as any).event || '';
  const purchase = data.purchase || {};
  const product = data.product || {};
  const buyer = data.buyer || {};
  const subscription = data.subscription || {};

  const eventId = purchase.transaction || subscription.subscriber?.code || `${event}_${Date.now()}`;
  const transactionId = purchase.transaction || null;
  const hotmartProductId = product.id ? String(product.id) : null;
  const hotmartSubId = subscription.subscriber?.code || subscription.plan?.id || null;
  const customerEmail = buyer.email || null;
  const customerName = buyer.name || null;

  console.log(`[HOTMART-SUB] Evento: ${event}, Transaction: ${transactionId}, Product: ${hotmartProductId}, Email: ${customerEmail}`);

  // ── Idempotency check ──
  const { data: existingEvent } = await supabase
    .from('hotmart_webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existingEvent) {
    console.log(`[HOTMART-SUB] Evento ${eventId} já processado, ignorando`);
    return new Response(JSON.stringify({ ok: true, message: 'Already processed' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    switch (event) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE': {
        if (!customerEmail) {
          await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'error', error_message: 'Missing customer email' });
          return respond(200, { ok: true, error: 'Missing email' });
        }

        // Find plan mapping
        let planId: string | null = null;
        let planType = 'free';
        if (hotmartProductId) {
          const { data: mapping } = await supabase
            .from('hotmart_product_plan_mapping')
            .select('plan_id')
            .eq('hotmart_product_id', hotmartProductId)
            .maybeSingle();
          if (mapping) {
            planId = mapping.plan_id;
            const { data: plan } = await supabase.from('plans').select('name').eq('id', planId).maybeSingle();
            planType = plan?.name || 'free';
          }
        }

        if (!planId) {
          await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'error', error_message: `No plan mapping for product ${hotmartProductId}` });
          return respond(200, { ok: true, error: 'No plan mapping' });
        }

        // Find or create user
        let userId: string | null = null;
        const { data: existingUserId } = await supabase.rpc('find_user_id_by_email', { _email: customerEmail });
        
        if (existingUserId) {
          userId = existingUserId;
        } else {
          // Auto-create user via Supabase Auth Admin API
          const tempPassword = crypto.randomUUID().slice(0, 16) + 'Aa1!';
          const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
            email: customerEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: customerName || customerEmail.split('@')[0] },
          });
          if (createErr || !newUser?.user) {
            console.error('[HOTMART-SUB] Erro ao criar usuário:', createErr);
            await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'error', error_message: `User creation failed: ${createErr?.message}` });
            return respond(200, { ok: true, error: 'User creation failed' });
          }
          userId = newUser.user.id;
          console.log(`[HOTMART-SUB] Novo usuário criado: ${userId} (${customerEmail})`);

          // Send password reset email so user can set their own password
          await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: customerEmail,
          });
        }

        // Get user's account
        const { data: accountIds } = await supabase.rpc('get_user_account_ids', { _user_id: userId });
        if (!accountIds || accountIds.length === 0) {
          await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'error', error_message: `No account for user ${userId}` });
          return respond(200, { ok: true, error: 'No account' });
        }

        const accountId = accountIds[0];

        // Calculate billing period
        const nextBillingDate = subscription.plan?.next_charge_date
          ? new Date(subscription.plan.next_charge_date).toISOString()
          : null;
        const periodStart = purchase.approved_date
          ? new Date(purchase.approved_date).toISOString()
          : new Date().toISOString();

        // Upsert subscription
        await supabase.from('subscriptions').upsert({
          account_id: accountId,
          plan_type: planType,
          plan_id: planId,
          status: 'active',
          provider: 'hotmart',
          hotmart_subscription_id: hotmartSubId,
          hotmart_transaction_id: transactionId,
          current_period_start: periodStart,
          current_period_end: nextBillingDate,
        }, { onConflict: 'account_id' });

        // Update usage_limits based on plan
        const { data: planLimits } = await supabase
          .from('plans')
          .select('max_projects, max_smartlinks, max_webhooks, max_users')
          .eq('id', planId)
          .maybeSingle();

        if (planLimits) {
          await supabase.from('usage_limits').update({
            max_projects: planLimits.max_projects,
            max_smartlinks: planLimits.max_smartlinks,
            max_webhooks: planLimits.max_webhooks,
            max_users: planLimits.max_users,
          }).eq('account_id', accountId);
        }

        console.log(`[HOTMART-SUB] ✅ Assinatura ativada: account=${accountId}, plan=${planType}, hotmart_sub=${hotmartSubId}`);
        await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, hotmart_subscription_id: hotmartSubId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'processed' });
        break;
      }

      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
      case 'PURCHASE_CANCELED': {
        // Find subscription by hotmart_subscription_id or transaction
        let sub: any = null;
        if (hotmartSubId) {
          const { data } = await supabase.from('subscriptions').select('account_id').eq('hotmart_subscription_id', hotmartSubId).maybeSingle();
          sub = data;
        }
        if (!sub && transactionId) {
          const { data } = await supabase.from('subscriptions').select('account_id').eq('hotmart_transaction_id', transactionId).maybeSingle();
          sub = data;
        }
        if (!sub && customerEmail) {
          const { data: uid } = await supabase.rpc('find_user_id_by_email', { _email: customerEmail });
          if (uid) {
            const { data: aids } = await supabase.rpc('get_user_account_ids', { _user_id: uid });
            if (aids?.[0]) {
              const { data } = await supabase.from('subscriptions').select('account_id').eq('account_id', aids[0]).maybeSingle();
              sub = data;
            }
          }
        }

        if (sub) {
          await supabase.from('subscriptions').update({
            status: 'canceled',
            plan_type: 'free',
          }).eq('account_id', sub.account_id);

          // Reset to free plan limits
          const { data: freePlan } = await supabase.from('plans')
            .select('max_projects, max_smartlinks, max_webhooks, max_users')
            .eq('name', 'free').maybeSingle();
          if (freePlan) {
            await supabase.from('usage_limits').update({
              max_projects: freePlan.max_projects,
              max_smartlinks: freePlan.max_smartlinks,
              max_webhooks: freePlan.max_webhooks,
              max_users: freePlan.max_users,
            }).eq('account_id', sub.account_id);
          }
          console.log(`[HOTMART-SUB] ❌ Assinatura cancelada: account=${sub.account_id}`);
        } else {
          console.warn(`[HOTMART-SUB] Assinatura não encontrada para cancelamento: ${hotmartSubId || transactionId}`);
        }

        await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, hotmart_subscription_id: hotmartSubId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'processed' });
        break;
      }

      case 'SUBSCRIPTION_CANCELLATION': {
        // Same as cancellation above
        let sub: any = null;
        if (hotmartSubId) {
          const { data } = await supabase.from('subscriptions').select('account_id').eq('hotmart_subscription_id', hotmartSubId).maybeSingle();
          sub = data;
        }
        if (!sub && customerEmail) {
          const { data: uid } = await supabase.rpc('find_user_id_by_email', { _email: customerEmail });
          if (uid) {
            const { data: aids } = await supabase.rpc('get_user_account_ids', { _user_id: uid });
            if (aids?.[0]) {
              const { data } = await supabase.from('subscriptions').select('account_id').eq('account_id', aids[0]).maybeSingle();
              sub = data;
            }
          }
        }

        if (sub) {
          await supabase.from('subscriptions').update({
            status: 'canceled',
            plan_type: 'free',
          }).eq('account_id', sub.account_id);

          const { data: freePlan } = await supabase.from('plans')
            .select('max_projects, max_smartlinks, max_webhooks, max_users')
            .eq('name', 'free').maybeSingle();
          if (freePlan) {
            await supabase.from('usage_limits').update({
              max_projects: freePlan.max_projects,
              max_smartlinks: freePlan.max_smartlinks,
              max_webhooks: freePlan.max_webhooks,
              max_users: freePlan.max_users,
            }).eq('account_id', sub.account_id);
          }
          console.log(`[HOTMART-SUB] ❌ Assinatura cancelada via SUBSCRIPTION_CANCELLATION: account=${sub.account_id}`);
        }

        await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, hotmart_subscription_id: hotmartSubId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'processed' });
        break;
      }

      case 'PURCHASE_DELAYED':
      case 'PURCHASE_OVERDUE': {
        // Mark as past_due (inadimplente) but don't delete data
        let sub: any = null;
        if (hotmartSubId) {
          const { data } = await supabase.from('subscriptions').select('account_id').eq('hotmart_subscription_id', hotmartSubId).maybeSingle();
          sub = data;
        }
        if (!sub && customerEmail) {
          const { data: uid } = await supabase.rpc('find_user_id_by_email', { _email: customerEmail });
          if (uid) {
            const { data: aids } = await supabase.rpc('get_user_account_ids', { _user_id: uid });
            if (aids?.[0]) {
              const { data } = await supabase.from('subscriptions').select('account_id').eq('account_id', aids[0]).maybeSingle();
              sub = data;
            }
          }
        }

        if (sub) {
          await supabase.from('subscriptions').update({ status: 'past_due' }).eq('account_id', sub.account_id);
          console.log(`[HOTMART-SUB] ⚠️ Assinatura inadimplente: account=${sub.account_id}`);
        }

        await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, hotmart_subscription_id: hotmartSubId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'processed' });
        break;
      }

      case 'PURCHASE_PROTEST':
      case 'PURCHASE_EXPIRED': {
        // Treat same as cancellation
        let sub: any = null;
        if (hotmartSubId) {
          const { data } = await supabase.from('subscriptions').select('account_id').eq('hotmart_subscription_id', hotmartSubId).maybeSingle();
          sub = data;
        }
        if (!sub && customerEmail) {
          const { data: uid } = await supabase.rpc('find_user_id_by_email', { _email: customerEmail });
          if (uid) {
            const { data: aids } = await supabase.rpc('get_user_account_ids', { _user_id: uid });
            if (aids?.[0]) {
              const { data } = await supabase.from('subscriptions').select('account_id').eq('account_id', aids[0]).maybeSingle();
              sub = data;
            }
          }
        }

        if (sub) {
          await supabase.from('subscriptions').update({ status: 'canceled', plan_type: 'free' }).eq('account_id', sub.account_id);
          const { data: freePlan } = await supabase.from('plans')
            .select('max_projects, max_smartlinks, max_webhooks, max_users')
            .eq('name', 'free').maybeSingle();
          if (freePlan) {
            await supabase.from('usage_limits').update(freePlan).eq('account_id', sub.account_id);
          }
        }

        await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, hotmart_subscription_id: hotmartSubId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'processed' });
        break;
      }

      default: {
        console.log(`[HOTMART-SUB] Evento não tratado: ${event}`);
        await logEvent(supabase, { event_id: eventId, event_type: event || 'UNKNOWN', hotmart_product_id: hotmartProductId, hotmart_subscription_id: hotmartSubId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'ignored', error_message: `Unhandled event: ${event}` });
      }
    }
  } catch (err) {
    console.error(`[HOTMART-SUB] Erro ao processar ${event}:`, err);
    await logEvent(supabase, { event_id: eventId, event_type: event, hotmart_product_id: hotmartProductId, hotmart_subscription_id: hotmartSubId, transaction_id: transactionId, customer_email: customerEmail, raw_payload: rawPayload, status: 'error', error_message: String(err) });
    return respond(500, { error: 'Processing failed' });
  }

  return respond(200, { ok: true });
});

// ── Helpers ──

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function logEvent(supabase: any, data: Record<string, unknown>) {
  try {
    await supabase.from('hotmart_webhook_events').insert(data);
  } catch (err) {
    console.error('[HOTMART-SUB] Erro ao salvar log:', err);
  }
}
