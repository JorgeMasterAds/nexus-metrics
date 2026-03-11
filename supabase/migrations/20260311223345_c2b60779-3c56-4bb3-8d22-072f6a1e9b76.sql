
-- Fix: make api_keys_safe use invoker security instead of definer
DROP VIEW IF EXISTS public.api_keys_safe;
CREATE VIEW public.api_keys_safe WITH (security_invoker = on) AS
  SELECT id, account_id, name, key_prefix, permissions, is_active, last_used_at, expires_at, created_at, updated_at
  FROM public.api_keys;
