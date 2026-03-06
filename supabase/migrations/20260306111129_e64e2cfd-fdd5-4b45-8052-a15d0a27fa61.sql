
CREATE TABLE public.global_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.global_alerts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active alerts
CREATE POLICY "Anyone can read active alerts"
  ON public.global_alerts FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Only super admins can manage alerts (via service role or direct insert)
CREATE POLICY "Super admins can manage alerts"
  ON public.global_alerts FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  );
