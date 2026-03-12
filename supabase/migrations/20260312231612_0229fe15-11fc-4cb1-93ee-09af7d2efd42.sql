
-- Tabela principal de vendas normalizadas (todas as plataformas)
CREATE TABLE public.sales (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  external_id     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  amount          DECIMAL(10,2),
  currency        TEXT DEFAULT 'BRL',
  buyer_email     TEXT,
  buyer_name      TEXT,
  product_id      TEXT,
  product_name    TEXT,
  commission      DECIMAL(10,2),
  payment_method  TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- Configurações de integração por conta
CREATE TABLE public.platform_integrations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id      UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  platform        TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT false,
  credentials     JSONB DEFAULT '{}',
  webhook_secret  TEXT,
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, platform)
);

-- Índices
CREATE INDEX idx_sales_platform ON public.sales(platform);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX idx_sales_account_platform ON public.sales(account_id, platform, created_at DESC);

-- RLS
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- platform_integrations: account members can manage
CREATE POLICY "Account members manage integrations" ON public.platform_integrations
  FOR ALL USING (
    account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid())
  );

-- sales: account members can read
CREATE POLICY "Account members read sales" ON public.sales
  FOR SELECT USING (
    account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid())
  );

-- sales: service role inserts (edge functions use service role key)
CREATE POLICY "Service role inserts sales" ON public.sales
  FOR INSERT WITH CHECK (true);

-- Enable realtime for sales
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
