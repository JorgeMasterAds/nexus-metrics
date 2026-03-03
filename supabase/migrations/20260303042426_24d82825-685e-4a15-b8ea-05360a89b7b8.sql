
-- 1. Add project_id to lead_tags for project isolation
ALTER TABLE public.lead_tags ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- 2. Sync existing super admin limits to Ouro plan
DO $$
DECLARE
  ouro RECORD;
  sa RECORD;
  acct_id UUID;
BEGIN
  SELECT max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys
  INTO ouro FROM public.plans WHERE lower(name) = 'ouro' LIMIT 1;
  
  IF FOUND THEN
    FOR sa IN SELECT user_id FROM public.super_admins LOOP
      FOR acct_id IN SELECT account_id FROM public.account_users WHERE user_id = sa.user_id LOOP
        UPDATE public.usage_limits SET
          max_projects = ouro.max_projects,
          max_smartlinks = ouro.max_smartlinks,
          max_webhooks = ouro.max_webhooks,
          max_users = ouro.max_users,
          max_agents = ouro.max_agents,
          max_leads = ouro.max_leads,
          max_devices = ouro.max_devices,
          max_surveys = ouro.max_surveys
        WHERE account_id = acct_id;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- 3. Create RPC for admin to update user plan
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(_user_id uuid, _plan_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan RECORD;
  v_account_id UUID;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT id, name, max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys
  INTO v_plan FROM public.plans WHERE lower(name) = lower(_plan_name) LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plano não encontrado: %', _plan_name;
  END IF;

  SELECT account_id INTO v_account_id FROM public.account_users WHERE user_id = _user_id LIMIT 1;
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Conta não encontrada para este usuário';
  END IF;

  -- Update subscription
  UPDATE public.subscriptions SET
    plan_id = v_plan.id,
    plan_type = v_plan.name,
    status = 'active',
    updated_at = now()
  WHERE account_id = v_account_id;

  -- If no subscription exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (account_id, plan_id, plan_type, status)
    VALUES (v_account_id, v_plan.id, v_plan.name, 'active');
  END IF;

  -- Update usage limits
  UPDATE public.usage_limits SET
    max_projects = v_plan.max_projects,
    max_smartlinks = v_plan.max_smartlinks,
    max_webhooks = v_plan.max_webhooks,
    max_users = v_plan.max_users,
    max_agents = v_plan.max_agents,
    max_leads = v_plan.max_leads,
    max_devices = v_plan.max_devices,
    max_surveys = v_plan.max_surveys
  WHERE account_id = v_account_id;

  -- If no usage_limits exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.usage_limits (account_id, max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys)
    VALUES (v_account_id, v_plan.max_projects, v_plan.max_smartlinks, v_plan.max_webhooks, v_plan.max_users, v_plan.max_agents, v_plan.max_leads, v_plan.max_devices, v_plan.max_surveys);
  END IF;
END;
$$;
