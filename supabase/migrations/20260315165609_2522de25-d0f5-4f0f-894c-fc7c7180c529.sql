-- Drop the restrictive policy and create a broader one for all account members
DROP POLICY IF EXISTS "wl_delete_admin" ON public.webhook_logs;

CREATE POLICY "wl_delete_member" ON public.webhook_logs
FOR DELETE TO authenticated
USING (
  account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())
);