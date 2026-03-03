
-- Table to store tags configured for each webhook
CREATE TABLE public.webhook_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(webhook_id, tag_id)
);

ALTER TABLE public.webhook_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook tags for their accounts"
ON public.webhook_tags FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.webhooks w
    JOIN public.account_users au ON au.account_id = w.account_id
    WHERE w.id = webhook_tags.webhook_id AND au.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage webhook tags for their accounts"
ON public.webhook_tags FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.webhooks w
    JOIN public.account_users au ON au.account_id = w.account_id
    WHERE w.id = webhook_tags.webhook_id AND au.user_id = auth.uid()
  )
);

-- Table to store tags configured for each webhook form
CREATE TABLE public.webhook_form_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.webhook_forms(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(form_id, tag_id)
);

ALTER TABLE public.webhook_form_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view form tags for their accounts"
ON public.webhook_form_tags FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.webhook_forms wf
    JOIN public.webhooks w ON w.id = wf.webhook_id
    JOIN public.account_users au ON au.account_id = w.account_id
    WHERE wf.id = webhook_form_tags.form_id AND au.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage form tags for their accounts"
ON public.webhook_form_tags FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.webhook_forms wf
    JOIN public.webhooks w ON w.id = wf.webhook_id
    JOIN public.account_users au ON au.account_id = w.account_id
    WHERE wf.id = webhook_form_tags.form_id AND au.user_id = auth.uid()
  )
);
