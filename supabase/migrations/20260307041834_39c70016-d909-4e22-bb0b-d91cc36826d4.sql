
-- Deep Links table: simple single-URL links with click tracking
CREATE TABLE public.deeplinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, slug)
);

ALTER TABLE public.deeplinks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view deeplinks for their accounts"
  ON public.deeplinks FOR SELECT TO authenticated
  USING (account_id IN (SELECT unnest(get_user_account_ids(auth.uid()))));

CREATE POLICY "Users can insert deeplinks for their accounts"
  ON public.deeplinks FOR INSERT TO authenticated
  WITH CHECK (account_id IN (SELECT unnest(get_user_account_ids(auth.uid()))));

CREATE POLICY "Users can update deeplinks for their accounts"
  ON public.deeplinks FOR UPDATE TO authenticated
  USING (account_id IN (SELECT unnest(get_user_account_ids(auth.uid()))));

CREATE POLICY "Users can delete deeplinks for their accounts"
  ON public.deeplinks FOR DELETE TO authenticated
  USING (account_id IN (SELECT unnest(get_user_account_ids(auth.uid()))));

-- Trigger for updated_at
CREATE TRIGGER update_deeplinks_updated_at
  BEFORE UPDATE ON public.deeplinks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
