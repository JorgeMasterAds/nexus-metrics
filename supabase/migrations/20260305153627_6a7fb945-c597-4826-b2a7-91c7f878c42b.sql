
-- Create trigger to sync limits when super_admin is added
CREATE TRIGGER on_super_admin_insert
  AFTER INSERT ON public.super_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_super_admin_limits();

-- Create trigger to revert limits when super_admin is removed
CREATE TRIGGER on_super_admin_delete
  AFTER DELETE ON public.super_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.revert_super_admin_limits();

-- Also fix existing super admins NOW: sync their limits to Ouro
DO $$
DECLARE
  sa RECORD;
  ouro_plan RECORD;
  acct_id UUID;
BEGIN
  SELECT max_projects, max_smartlinks, max_webhooks, max_users, max_agents, max_leads, max_devices, max_surveys
  INTO ouro_plan
  FROM public.plans WHERE lower(name) = 'ouro' LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE 'Plano Ouro não encontrado';
    RETURN;
  END IF;

  FOR sa IN SELECT user_id FROM public.super_admins LOOP
    FOR acct_id IN SELECT account_id FROM public.account_users WHERE user_id = sa.user_id LOOP
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
  END LOOP;
END;
$$;
