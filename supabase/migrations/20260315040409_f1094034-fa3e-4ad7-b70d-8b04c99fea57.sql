-- Allow users to see their own project_users rows (including pending invites)
DROP POLICY IF EXISTS pu_select ON public.project_users;
CREATE POLICY pu_select ON public.project_users FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR project_id IN (
    SELECT id FROM projects WHERE account_id = ANY(get_user_account_ids(auth.uid()))
  )
);

-- Allow invited users to update their own row (accept invite)
DROP POLICY IF EXISTS pu_update_own ON public.project_users;
CREATE POLICY pu_update_own ON public.project_users FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow invited users to delete their own row (reject invite)
DROP POLICY IF EXISTS pu_delete ON public.project_users;
CREATE POLICY pu_delete ON public.project_users FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR project_id IN (
    SELECT id FROM projects WHERE account_id = ANY(get_user_account_ids(auth.uid()))
  )
);