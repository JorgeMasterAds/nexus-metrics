
CREATE TABLE public.system_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  source TEXT NOT NULL DEFAULT 'webhook',
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read all warnings"
  ON public.system_warnings FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update warnings"
  ON public.system_warnings FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Service role can insert warnings"
  ON public.system_warnings FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_system_warnings_created ON public.system_warnings(created_at DESC);
CREATE INDEX idx_system_warnings_severity ON public.system_warnings(severity);
CREATE INDEX idx_system_warnings_resolved ON public.system_warnings(is_resolved);
