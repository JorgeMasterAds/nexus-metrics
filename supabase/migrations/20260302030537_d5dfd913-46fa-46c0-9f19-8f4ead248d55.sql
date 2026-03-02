
-- Tabela de mapeamento Hotmart Product → Plan interno
CREATE TABLE public.hotmart_product_plan_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotmart_product_id TEXT NOT NULL UNIQUE,
  hotmart_product_name TEXT,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotmart_product_plan_mapping ENABLE ROW LEVEL SECURITY;

-- Somente super_admins podem gerenciar mapeamentos
CREATE POLICY "Super admins can manage hotmart mappings"
  ON public.hotmart_product_plan_mapping
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Tabela de eventos processados (idempotência + auditoria)
CREATE TABLE public.hotmart_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  hotmart_product_id TEXT,
  hotmart_subscription_id TEXT,
  transaction_id TEXT,
  customer_email TEXT,
  raw_payload JSONB,
  status TEXT NOT NULL DEFAULT 'processed',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotmart_webhook_events ENABLE ROW LEVEL SECURITY;

-- Somente super_admins podem ler logs
CREATE POLICY "Super admins can read hotmart events"
  ON public.hotmart_webhook_events
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Índices para performance
CREATE INDEX idx_hotmart_events_event_id ON public.hotmart_webhook_events(event_id);
CREATE INDEX idx_hotmart_events_transaction_id ON public.hotmart_webhook_events(transaction_id);
CREATE INDEX idx_hotmart_events_email ON public.hotmart_webhook_events(customer_email);

-- Adicionar colunas Hotmart na tabela subscriptions existente
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS hotmart_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'stripe';

-- Índice para busca por hotmart_subscription_id
CREATE INDEX idx_subscriptions_hotmart_sub ON public.subscriptions(hotmart_subscription_id) WHERE hotmart_subscription_id IS NOT NULL;

-- Trigger de updated_at para hotmart_product_plan_mapping
CREATE TRIGGER update_hotmart_mapping_updated_at
  BEFORE UPDATE ON public.hotmart_product_plan_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
