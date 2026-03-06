
-- Table to store which Google Ads accounts and GA4 properties the user selected
CREATE TABLE IF NOT EXISTS public.google_selected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('google_ads', 'ga4')),
  external_id TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, type, external_id)
);

ALTER TABLE public.google_selected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own google_selected_accounts"
ON public.google_selected_accounts
FOR ALL
TO authenticated
USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))
WITH CHECK (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

-- GA4 metrics table
CREATE TABLE IF NOT EXISTS public.ga4_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  avg_session_duration NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  device_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, property_id, date, source, medium, campaign, device_category)
);

ALTER TABLE public.ga4_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own ga4_metrics"
ON public.ga4_metrics
FOR SELECT
TO authenticated
USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

CREATE POLICY "Service can insert ga4_metrics"
ON public.ga4_metrics
FOR INSERT
TO authenticated
WITH CHECK (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));
