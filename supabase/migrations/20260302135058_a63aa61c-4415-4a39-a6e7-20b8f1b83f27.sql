
-- Tabela de automações
CREATE TABLE public.automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  project_id uuid REFERENCES public.projects(id),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  flow_nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  flow_connections jsonb NOT NULL DEFAULT '[]'::jsonb,
  trigger_type text NOT NULL DEFAULT 'manual',
  trigger_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auto_select" ON public.automations FOR SELECT
  USING (account_id = ANY (get_user_account_ids(auth.uid())));

CREATE POLICY "auto_insert" ON public.automations FOR INSERT
  WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));

CREATE POLICY "auto_update" ON public.automations FOR UPDATE
  USING (account_id = ANY (get_user_account_ids(auth.uid())));

CREATE POLICY "auto_delete" ON public.automations FOR DELETE
  USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- Trigger para updated_at
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Campo auto_tags nos smartlinks
ALTER TABLE public.smartlinks ADD COLUMN IF NOT EXISTS auto_tags text[] DEFAULT '{}';
