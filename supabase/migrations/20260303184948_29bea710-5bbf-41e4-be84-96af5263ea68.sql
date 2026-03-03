
CREATE TABLE public.planning_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Novo Planejamento',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own planning tabs"
  ON public.planning_tabs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_planning_tabs_user ON public.planning_tabs(user_id, project_id);
