
-- 1. Remove the overly permissive INSERT policy on sales
DROP POLICY IF EXISTS "Service role inserts sales" ON public.sales;

-- 2. Create a restrictive INSERT policy: only allow inserts where account_id matches user's accounts
-- (Edge Functions use service_role key which bypasses RLS, so this only blocks direct client abuse)
CREATE POLICY "Authenticated users insert own sales"
  ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.account_users WHERE user_id = auth.uid()
    )
  );
