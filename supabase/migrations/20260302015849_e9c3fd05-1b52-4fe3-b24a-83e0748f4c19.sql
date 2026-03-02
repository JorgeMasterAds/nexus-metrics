
-- Fix: Restrict profiles SELECT to same-account members only (instead of all authenticated users)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create a new policy that allows viewing profiles of users in the same account
CREATE POLICY "Users can view profiles in same account" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT au2.user_id FROM public.account_users au2
      WHERE au2.account_id = ANY(get_user_account_ids(auth.uid()))
    )
    OR is_super_admin(auth.uid())
  );
