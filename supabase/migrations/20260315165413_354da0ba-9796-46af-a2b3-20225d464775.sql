-- Allow owners/admins to delete webhook_logs
CREATE POLICY "wl_delete_admin" ON public.webhook_logs
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM account_users au
    WHERE au.user_id = auth.uid()
      AND au.account_id = webhook_logs.account_id
      AND au.role IN ('owner', 'admin')
  )
  OR is_super_admin(auth.uid())
);

-- Fix existing conversions with null project_id: assign the account's first active project
UPDATE conversions c
SET project_id = p.id
FROM (
  SELECT DISTINCT ON (account_id) account_id, id
  FROM projects
  WHERE is_active = true
  ORDER BY account_id, created_at ASC
) p
WHERE c.account_id = p.account_id
  AND c.project_id IS NULL;