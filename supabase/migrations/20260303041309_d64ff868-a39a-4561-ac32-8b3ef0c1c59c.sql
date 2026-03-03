
-- Fix: recreate view with security_invoker = true so it respects caller's RLS
DROP VIEW IF EXISTS public.accounts_safe;

CREATE VIEW public.accounts_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  slug,
  timezone,
  company_name,
  created_at,
  updated_at
FROM public.accounts;
