-- Restrict deletion_requests: only creators can insert, only admins can update/delete
DROP POLICY IF EXISTS "deletion_requests_insert" ON public.deletion_requests;
DROP POLICY IF EXISTS "deletion_requests_select" ON public.deletion_requests;
DROP POLICY IF EXISTS "deletion_requests_update" ON public.deletion_requests;
DROP POLICY IF EXISTS "deletion_requests_delete" ON public.deletion_requests;

-- Allow account members to view deletion requests for their account
CREATE POLICY "deletion_requests_select" ON public.deletion_requests
  FOR SELECT TO authenticated
  USING (
    account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid())
  );

-- Allow authenticated users to insert their own deletion requests
CREATE POLICY "deletion_requests_insert" ON public.deletion_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid())
  );

-- Only admins/owners can update (approve/reject) deletion requests
CREATE POLICY "deletion_requests_update" ON public.deletion_requests
  FOR UPDATE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

-- Only admins/owners can delete deletion request records
CREATE POLICY "deletion_requests_delete" ON public.deletion_requests
  FOR DELETE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

-- Restrict shared_view_tokens: only admins can create/manage
DROP POLICY IF EXISTS "shared_view_tokens_insert" ON public.shared_view_tokens;
DROP POLICY IF EXISTS "shared_view_tokens_select" ON public.shared_view_tokens;
DROP POLICY IF EXISTS "shared_view_tokens_update" ON public.shared_view_tokens;
DROP POLICY IF EXISTS "shared_view_tokens_delete" ON public.shared_view_tokens;

CREATE POLICY "shared_view_tokens_select" ON public.shared_view_tokens
  FOR SELECT TO authenticated
  USING (
    account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid())
  );

CREATE POLICY "shared_view_tokens_insert" ON public.shared_view_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "shared_view_tokens_update" ON public.shared_view_tokens
  FOR UPDATE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "shared_view_tokens_delete" ON public.shared_view_tokens
  FOR DELETE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

-- Restrict whatsapp_devices: only admins/owners can manage
DROP POLICY IF EXISTS "whatsapp_devices_select" ON public.whatsapp_devices;
DROP POLICY IF EXISTS "whatsapp_devices_insert" ON public.whatsapp_devices;
DROP POLICY IF EXISTS "whatsapp_devices_update" ON public.whatsapp_devices;
DROP POLICY IF EXISTS "whatsapp_devices_delete" ON public.whatsapp_devices;

CREATE POLICY "whatsapp_devices_select" ON public.whatsapp_devices
  FOR SELECT TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "whatsapp_devices_insert" ON public.whatsapp_devices
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "whatsapp_devices_update" ON public.whatsapp_devices
  FOR UPDATE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "whatsapp_devices_delete" ON public.whatsapp_devices
  FOR DELETE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

-- Restrict ai_api_keys: only admins/owners can manage
DROP POLICY IF EXISTS "ai_api_keys_select" ON public.ai_api_keys;
DROP POLICY IF EXISTS "ai_api_keys_insert" ON public.ai_api_keys;
DROP POLICY IF EXISTS "ai_api_keys_update" ON public.ai_api_keys;
DROP POLICY IF EXISTS "ai_api_keys_delete" ON public.ai_api_keys;

CREATE POLICY "ai_api_keys_select" ON public.ai_api_keys
  FOR SELECT TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "ai_api_keys_insert" ON public.ai_api_keys
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "ai_api_keys_update" ON public.ai_api_keys
  FOR UPDATE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );

CREATE POLICY "ai_api_keys_delete" ON public.ai_api_keys
  FOR DELETE TO authenticated
  USING (
    public.user_has_admin_access(auth.uid(), account_id)
  );