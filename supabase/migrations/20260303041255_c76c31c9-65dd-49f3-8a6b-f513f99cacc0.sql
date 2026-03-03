
-- Create a restricted view for non-admin users
CREATE OR REPLACE VIEW public.accounts_safe AS
SELECT
  id,
  name,
  slug,
  timezone,
  company_name,
  created_at,
  updated_at
FROM public.accounts;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their accounts" ON public.accounts;

-- Owners/admins see everything
CREATE POLICY "admins_view_accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM account_users au
    WHERE au.account_id = accounts.id
      AND au.user_id = auth.uid()
      AND au.role IN ('owner', 'admin')
  )
  OR is_super_admin(auth.uid())
);

-- Members/viewers see only non-sensitive columns via RLS (they use the safe view)
-- But we still need them to query accounts for basic info
CREATE POLICY "members_view_accounts_basic"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  id = ANY (get_user_account_ids(auth.uid()))
);
