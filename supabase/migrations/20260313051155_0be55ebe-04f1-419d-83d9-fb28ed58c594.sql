-- Fix variant limits propagation across plans/subscriptions

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
    max_surveys = NEW.max_surveys,
    max_variants = NEW.max_variants
  FROM public.subscriptions s
  WHERE s.account_id = ul.account_id
    AND (s.plan_id = NEW.id OR (s.plan_type = NEW.name AND s.status = 'active'));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_user_plan(_user_id uuid, _plan_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan RECORD;
  v_account_id UUID;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT id, name, max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys, max_variants
  INTO v_plan FROM public.plans WHERE lower(name) = lower(_plan_name) LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plano não encontrado: %', _plan_name;
  END IF;

  SELECT account_id INTO v_account_id FROM public.account_users WHERE user_id = _user_id LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Conta não encontrada para este usuário';
  END IF;

  UPDATE public.subscriptions SET
    plan_id = v_plan.id,
    plan_type = v_plan.name,
    status = 'active',
    updated_at = now()
  WHERE account_id = v_account_id;

  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (account_id, plan_id, plan_type, status)
    VALUES (v_account_id, v_plan.id, v_plan.name, 'active');
  END IF;

  UPDATE public.usage_limits SET
    max_projects = v_plan.max_projects,
    max_smartlinks = v_plan.max_smartlinks,
    max_webhooks = v_plan.max_webhooks,
    max_users = v_plan.max_users,
    max_agents = v_plan.max_agents,
    max_leads = v_plan.max_leads,
    max_devices = v_plan.max_devices,
    max_surveys = v_plan.max_surveys,
    max_variants = v_plan.max_variants
  WHERE account_id = v_account_id;

  IF NOT FOUND THEN
    INSERT INTO public.usage_limits (
      account_id,
      max_projects,
      max_smartlinks,
      max_webhooks,
      max_users,
      max_agents,
      max_leads,
      max_devices,
      max_surveys,
      max_variants
    )
    VALUES (
      v_account_id,
      v_plan.max_projects,
      v_plan.max_smartlinks,
      v_plan.max_webhooks,
      v_plan.max_users,
      v_plan.max_agents,
      v_plan.max_leads,
      v_plan.max_devices,
      v_plan.max_surveys,
      v_plan.max_variants
    );
  END IF;
END;
$function$;

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
  SELECT max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys, max_variants
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
      max_surveys = ouro_plan.max_surveys,
      max_variants = ouro_plan.max_variants
    WHERE account_id = acct_id;
  END LOOP;

  RETURN NEW;
END;
$function$;

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
    SELECT p.max_projects, p.max_smartlinks, p.max_webhooks, p.max_users, p.max_agents, p.max_leads, p.max_devices, p.max_surveys, p.max_variants
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
        max_surveys = plan_row.max_surveys,
        max_variants = plan_row.max_variants
      WHERE account_id = acct_id;
    END IF;
  END LOOP;

  RETURN OLD;
END;
$function$;

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

  SELECT id, max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys, max_variants
  INTO free_plan
  FROM public.plans WHERE name = 'free' LIMIT 1;

  free_plan_id := free_plan.id;

  INSERT INTO public.usage_limits (
    account_id,
    max_projects,
    max_smartlinks,
    max_webhooks,
    max_users,
    max_agents,
    max_leads,
    max_devices,
    max_surveys,
    max_variants
  )
  VALUES (
    new_account_id,
    COALESCE(free_plan.max_projects, 1),
    COALESCE(free_plan.max_smartlinks, 1),
    COALESCE(free_plan.max_webhooks, 1),
    COALESCE(free_plan.max_users, 1),
    COALESCE(free_plan.max_agents, 0),
    COALESCE(free_plan.max_leads, 100),
    COALESCE(free_plan.max_devices, 0),
    COALESCE(free_plan.max_surveys, 1),
    COALESCE(free_plan.max_variants, 2)
  );

  INSERT INTO public.subscriptions (account_id, plan_type, plan_id, status)
  VALUES (new_account_id, 'free', free_plan_id, 'active');

  INSERT INTO public.referral_codes (account_id, code)
  VALUES (new_account_id, encode(extensions.gen_random_bytes(6), 'hex'));

  RETURN NEW;
END;
$function$;

-- Backfill existing accounts so usage_limits.max_variants matches active plan
UPDATE public.usage_limits ul
SET max_variants = plan_source.max_variants
FROM (
  SELECT
    s.account_id,
    COALESCE(p_by_id.max_variants, p_by_name.max_variants) AS max_variants
  FROM public.subscriptions s
  LEFT JOIN public.plans p_by_id ON p_by_id.id = s.plan_id
  LEFT JOIN public.plans p_by_name ON lower(p_by_name.name) = lower(s.plan_type)
  WHERE s.status = 'active'
) plan_source
WHERE ul.account_id = plan_source.account_id
  AND plan_source.max_variants IS NOT NULL
  AND ul.max_variants IS DISTINCT FROM plan_source.max_variants;