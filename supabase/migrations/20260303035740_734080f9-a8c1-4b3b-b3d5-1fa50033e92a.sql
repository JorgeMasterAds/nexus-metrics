
-- Fix RLS policies: change 'public' role to 'authenticated' on sensitive tables
-- This prevents anonymous (unauthenticated) access to all business data

-- ai_agents
DROP POLICY IF EXISTS "aia_select" ON public.ai_agents;
DROP POLICY IF EXISTS "aia_insert" ON public.ai_agents;
DROP POLICY IF EXISTS "aia_update" ON public.ai_agents;
DROP POLICY IF EXISTS "aia_delete" ON public.ai_agents;
CREATE POLICY "aia_select" ON public.ai_agents FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "aia_insert" ON public.ai_agents FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "aia_update" ON public.ai_agents FOR UPDATE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "aia_delete" ON public.ai_agents FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- ai_api_keys
DROP POLICY IF EXISTS "aiak_select" ON public.ai_api_keys;
DROP POLICY IF EXISTS "aiak_insert" ON public.ai_api_keys;
DROP POLICY IF EXISTS "aiak_update" ON public.ai_api_keys;
DROP POLICY IF EXISTS "aiak_delete" ON public.ai_api_keys;
CREATE POLICY "aiak_select" ON public.ai_api_keys FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "aiak_insert" ON public.ai_api_keys FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "aiak_update" ON public.ai_api_keys FOR UPDATE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "aiak_delete" ON public.ai_api_keys FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- automations
DROP POLICY IF EXISTS "auto_select" ON public.automations;
DROP POLICY IF EXISTS "auto_insert" ON public.automations;
DROP POLICY IF EXISTS "auto_update" ON public.automations;
DROP POLICY IF EXISTS "auto_delete" ON public.automations;
CREATE POLICY "auto_select" ON public.automations FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "auto_insert" ON public.automations FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "auto_update" ON public.automations FOR UPDATE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "auto_delete" ON public.automations FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- clicks (delete was public)
DROP POLICY IF EXISTS "click_delete" ON public.clicks;
CREATE POLICY "click_delete" ON public.clicks FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- investments
DROP POLICY IF EXISTS "inv_select" ON public.investments;
DROP POLICY IF EXISTS "inv_insert" ON public.investments;
DROP POLICY IF EXISTS "inv_update" ON public.investments;
DROP POLICY IF EXISTS "inv_delete" ON public.investments;
CREATE POLICY "inv_select" ON public.investments FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "inv_insert" ON public.investments FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "inv_update" ON public.investments FOR UPDATE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "inv_delete" ON public.investments FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- leads
DROP POLICY IF EXISTS "lead_select" ON public.leads;
DROP POLICY IF EXISTS "lead_insert" ON public.leads;
DROP POLICY IF EXISTS "lead_update" ON public.leads;
DROP POLICY IF EXISTS "lead_delete" ON public.leads;
CREATE POLICY "lead_select" ON public.leads FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "lead_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "lead_update" ON public.leads FOR UPDATE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "lead_delete" ON public.leads FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- Check remaining tables with public role policies and fix them
-- lead_tags
DROP POLICY IF EXISTS "lt_select" ON public.lead_tags;
DROP POLICY IF EXISTS "lt_insert" ON public.lead_tags;
DROP POLICY IF EXISTS "lt_update" ON public.lead_tags;
DROP POLICY IF EXISTS "lt_delete" ON public.lead_tags;
CREATE POLICY "lt_select" ON public.lead_tags FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "lt_insert" ON public.lead_tags FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "lt_update" ON public.lead_tags FOR UPDATE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "lt_delete" ON public.lead_tags FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- lead_notes
DROP POLICY IF EXISTS "ln_select" ON public.lead_notes;
DROP POLICY IF EXISTS "ln_insert" ON public.lead_notes;
DROP POLICY IF EXISTS "ln_delete" ON public.lead_notes;
CREATE POLICY "ln_select" ON public.lead_notes FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "ln_insert" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "ln_delete" ON public.lead_notes FOR DELETE TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));

-- lead_history
DROP POLICY IF EXISTS "lh_select" ON public.lead_history;
DROP POLICY IF EXISTS "lh_insert" ON public.lead_history;
CREATE POLICY "lh_select" ON public.lead_history FOR SELECT TO authenticated USING (account_id = ANY (get_user_account_ids(auth.uid())));
CREATE POLICY "lh_insert" ON public.lead_history FOR INSERT TO authenticated WITH CHECK (account_id = ANY (get_user_account_ids(auth.uid())));

-- profiles: add policy to deny anonymous access
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
