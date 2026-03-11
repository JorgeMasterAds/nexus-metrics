
CREATE TABLE public.daily_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  insight_date date NOT NULL DEFAULT CURRENT_DATE,
  message text NOT NULL,
  trend text CHECK (trend IN ('up', 'down', 'stable')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, project_id, insight_date)
);

CREATE UNIQUE INDEX daily_insights_account_null_project_date 
  ON public.daily_insights (account_id, insight_date) 
  WHERE project_id IS NULL;

ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own account insights"
  ON public.daily_insights FOR SELECT TO authenticated
  USING (account_id IN (SELECT unnest(public.get_user_account_ids(auth.uid()))));
