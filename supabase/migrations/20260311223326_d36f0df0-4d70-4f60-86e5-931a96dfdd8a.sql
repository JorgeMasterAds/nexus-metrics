
-- Tabela para API Keys dos usuários
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT ARRAY['read'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para configurações de API de plataformas externas
CREATE TABLE public.platform_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, project_id, platform)
);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_api_configs ENABLE ROW LEVEL SECURITY;

-- Policies api_keys
CREATE POLICY "Users can manage own account api keys"
  ON public.api_keys FOR ALL TO authenticated
  USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

-- Policies platform_api_configs
CREATE POLICY "Users can manage own platform configs"
  ON public.platform_api_configs FOR ALL TO authenticated
  USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

-- View segura para api_keys (oculta hash)
CREATE VIEW public.api_keys_safe AS
  SELECT id, account_id, name, key_prefix, permissions, is_active, last_used_at, expires_at, created_at, updated_at
  FROM public.api_keys;

-- Triggers updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_platform_api_configs_updated_at BEFORE UPDATE ON public.platform_api_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
