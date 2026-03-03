-- 1. Remove the overly permissive profiles_select policy (allows unauthenticated reads)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

-- 2. Drop the overly broad members_view_accounts_basic policy
-- Members should use accounts_safe view instead (exposes only safe fields)
DROP POLICY IF EXISTS "members_view_accounts_basic" ON public.accounts;