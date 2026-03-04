-- 1. Fix RLS Always True: Replace overly permissive INSERT policy on system_warnings
-- The service role bypasses RLS anyway, so this policy is unnecessary
DROP POLICY IF EXISTS "Service role can insert warnings" ON public.system_warnings;

-- 2. Restrict conversions SELECT to owner/admin only (not all account members)
DROP POLICY IF EXISTS "conv_select" ON public.conversions;
CREATE POLICY "conv_select_admin" ON public.conversions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.user_id = auth.uid()
        AND au.account_id = conversions.account_id
        AND au.role IN ('owner', 'admin')
    )
    OR is_super_admin(auth.uid())
  );

-- 3. Tighten profiles: remove the broad "same account" policy and keep own-profile + super admin
DROP POLICY IF EXISTS "Users can view profiles in same account" ON public.profiles;
CREATE POLICY "Users can view profiles in same account" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.user_id = auth.uid()
        AND au.account_id IN (
          SELECT au2.account_id FROM public.account_users au2 WHERE au2.user_id = profiles.id
        )
        AND au.role IN ('owner', 'admin')
    )
    OR is_super_admin(auth.uid())
  );