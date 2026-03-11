CREATE TABLE IF NOT EXISTS public.support_chatbot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  system_prompt text NOT NULL DEFAULT 'Você é um assistente de suporte do Nexus Metrics. Responda de forma clara, educada e objetiva em português. Ajude o usuário com dúvidas sobre a plataforma, funcionalidades, integrações e configurações.',
  greeting_message text DEFAULT 'Olá! 👋 Sou o assistente virtual do Nexus. Como posso ajudar?',
  max_tokens integer NOT NULL DEFAULT 1000,
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id)
);

ALTER TABLE public.support_chatbot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account chatbot config"
  ON public.support_chatbot_config FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage chatbot config"
  ON public.support_chatbot_config FOR ALL TO authenticated
  USING (public.user_has_admin_access(auth.uid(), account_id))
  WITH CHECK (public.user_has_admin_access(auth.uid(), account_id));

CREATE TRIGGER update_support_chatbot_config_updated_at
  BEFORE UPDATE ON public.support_chatbot_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();