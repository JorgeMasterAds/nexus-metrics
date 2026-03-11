
-- ================================================================
-- NEXUSAUTO: Tabelas de execução de automações
-- ================================================================

CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed','paused')),
  current_node_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.automation_node_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','success','failed','skipped')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  resume_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','processing','done','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_exec_automation ON public.automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_auto_exec_account ON public.automation_executions(account_id);
CREATE INDEX IF NOT EXISTS idx_auto_exec_status ON public.automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_auto_node_exec ON public.automation_node_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_auto_queue_resume ON public.automation_queue(resume_at) WHERE status = 'waiting';

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account automation executions"
  ON public.automation_executions FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own account automation executions"
  ON public.automation_executions FOR INSERT
  TO authenticated
  WITH CHECK (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own account node executions"
  ON public.automation_node_executions FOR SELECT
  TO authenticated
  USING (execution_id IN (SELECT id FROM public.automation_executions WHERE account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid())));

CREATE POLICY "Users can view own account queue"
  ON public.automation_queue FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

-- ================================================================
-- GRUPOZAP: Tabelas do módulo GrupoZap
-- ================================================================

CREATE TABLE IF NOT EXISTS public.gz_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  instance_name TEXT,
  api_url TEXT,
  api_key_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','banned')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gz_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  gz_account_id UUID REFERENCES public.gz_accounts(id) ON DELETE SET NULL,
  group_jid TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  member_count INT DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gz_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  target_groups UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','completed','paused','failed')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  total_read INT DEFAULT 0,
  send_interval_ms INT DEFAULT 3000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gz_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  gz_account_id UUID REFERENCES public.gz_accounts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.gz_campaigns(id) ON DELETE SET NULL,
  group_jid TEXT,
  recipient_jid TEXT,
  direction TEXT NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('incoming','outgoing')),
  content TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','read','failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gz_anti_spam_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gz_lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_jid TEXT NOT NULL,
  contact_name TEXT,
  score INT DEFAULT 0,
  interactions JSONB DEFAULT '[]',
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, contact_jid)
);

CREATE INDEX IF NOT EXISTS idx_gz_groups_account ON public.gz_groups(account_id);
CREATE INDEX IF NOT EXISTS idx_gz_campaigns_account ON public.gz_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_gz_messages_account ON public.gz_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_gz_messages_campaign ON public.gz_messages(campaign_id);

ALTER TABLE public.gz_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gz_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gz_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gz_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gz_anti_spam_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gz_lead_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for all gz_ tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['gz_accounts','gz_groups','gz_campaigns','gz_messages','gz_anti_spam_rules','gz_lead_scores'])
  LOOP
    EXECUTE format('CREATE POLICY "account_select_%s" ON public.%I FOR SELECT TO authenticated USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "account_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "account_update_%s" ON public.%I FOR UPDATE TO authenticated USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "account_delete_%s" ON public.%I FOR DELETE TO authenticated USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))', tbl, tbl);
  END LOOP;
END $$;
