-- Re-add a SELECT policy for account members on accounts table
-- This allows the accounts_safe view to work for all members
CREATE POLICY "members_select_own_accounts" ON public.accounts
  FOR SELECT TO authenticated
  USING (id = ANY (get_user_account_ids(auth.uid())));