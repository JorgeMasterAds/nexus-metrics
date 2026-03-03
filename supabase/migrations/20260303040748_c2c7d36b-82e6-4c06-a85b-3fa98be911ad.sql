
-- Add missing limit columns to usage_limits
ALTER TABLE public.usage_limits
  ADD COLUMN IF NOT EXISTS max_agents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_leads integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_devices integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_surveys integer NOT NULL DEFAULT 1;

-- Update existing usage_limits rows based on current subscription plan
UPDATE public.usage_limits ul
SET
  max_agents = COALESCE(p.max_agents, 0),
  max_leads = COALESCE(p.max_leads, 100),
  max_devices = COALESCE(p.max_devices, 0),
  max_surveys = COALESCE(p.max_surveys, 1)
FROM public.subscriptions s
JOIN public.plans p ON p.id = s.plan_id
WHERE s.account_id = ul.account_id AND s.status = 'active';

-- Update sync_plan_limits_to_accounts trigger function to include new columns
CREATE OR REPLACE FUNCTION public.sync_plan_limits_to_accounts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.usage_limits ul
  SET
    max_projects = NEW.max_projects,
    max_smartlinks = NEW.max_smartlinks,
    max_webhooks = NEW.max_webhooks,
    max_users = NEW.max_users,
    max_agents = NEW.max_agents,
    max_leads = NEW.max_leads,
    max_devices = NEW.max_devices,
    max_surveys = NEW.max_surveys
  FROM public.subscriptions s
  WHERE s.account_id = ul.account_id
    AND (s.plan_id = NEW.id OR (s.plan_type = NEW.name AND s.status = 'active'));
  RETURN NEW;
END;
$function$;

-- Update sync_super_admin_limits to include new columns
CREATE OR REPLACE FUNCTION public.sync_super_admin_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ouro_plan RECORD;
  acct_id UUID;
BEGIN
  SELECT max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys
  INTO ouro_plan
  FROM public.plans WHERE lower(name) = 'ouro' LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  FOR acct_id IN
    SELECT account_id FROM public.account_users WHERE user_id = NEW.user_id
  LOOP
    UPDATE public.usage_limits
    SET
      max_projects = ouro_plan.max_projects,
      max_smartlinks = ouro_plan.max_smartlinks,
      max_webhooks = ouro_plan.max_webhooks,
      max_users = ouro_plan.max_users,
      max_agents = ouro_plan.max_agents,
      max_leads = ouro_plan.max_leads,
      max_devices = ouro_plan.max_devices,
      max_surveys = ouro_plan.max_surveys
    WHERE account_id = acct_id;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Update revert_super_admin_limits
CREATE OR REPLACE FUNCTION public.revert_super_admin_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  acct_id UUID;
  plan_row RECORD;
BEGIN
  FOR acct_id IN
    SELECT account_id FROM public.account_users WHERE user_id = OLD.user_id
  LOOP
    SELECT p.max_projects, p.max_smartlinks, p.max_webhooks, p.max_users, p.max_agents, p.max_leads, p.max_devices, p.max_surveys
    INTO plan_row
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.account_id = acct_id AND s.status = 'active'
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.usage_limits
      SET
        max_projects = plan_row.max_projects,
        max_smartlinks = plan_row.max_smartlinks,
        max_webhooks = plan_row.max_webhooks,
        max_users = plan_row.max_users,
        max_agents = plan_row.max_agents,
        max_leads = plan_row.max_leads,
        max_devices = plan_row.max_devices,
        max_surveys = plan_row.max_surveys
      WHERE account_id = acct_id;
    END IF;
  END LOOP;

  RETURN OLD;
END;
$function$;

-- Update handle_new_user to include new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_account_id UUID;
  free_plan_id UUID;
  free_plan RECORD;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.accounts (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'Minha Conta'))
  RETURNING id INTO new_account_id;

  INSERT INTO public.account_users (account_id, user_id, role, accepted_at)
  VALUES (new_account_id, NEW.id, 'owner', now());

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');

  SELECT id, max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys
  INTO free_plan
  FROM public.plans WHERE name = 'free' LIMIT 1;

  free_plan_id := free_plan.id;

  INSERT INTO public.usage_limits (account_id, max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys)
  VALUES (
    new_account_id,
    COALESCE(free_plan.max_projects, 1),
    COALESCE(free_plan.max_smartlinks, 1),
    COALESCE(free_plan.max_webhooks, 1),
    COALESCE(free_plan.max_users, 1),
    COALESCE(free_plan.max_agents, 0),
    COALESCE(free_plan.max_leads, 100),
    COALESCE(free_plan.max_devices, 0),
    COALESCE(free_plan.max_surveys, 1)
  );

  INSERT INTO public.subscriptions (account_id, plan_type, plan_id, status)
  VALUES (new_account_id, 'free', free_plan_id, 'active');

  INSERT INTO public.referral_codes (account_id, code)
  VALUES (new_account_id, encode(extensions.gen_random_bytes(6), 'hex'));

  RETURN NEW;
END;
$function$;
