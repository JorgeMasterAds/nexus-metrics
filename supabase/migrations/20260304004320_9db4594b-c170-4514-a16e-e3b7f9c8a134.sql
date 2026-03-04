CREATE INDEX IF NOT EXISTS idx_clicks_account_project_created ON public.clicks (account_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_account_project_created ON public.conversions (account_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_account_status_created ON public.conversions (account_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_account_project ON public.leads (account_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_account_date ON public.daily_metrics (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON public.webhook_logs (created_at DESC);