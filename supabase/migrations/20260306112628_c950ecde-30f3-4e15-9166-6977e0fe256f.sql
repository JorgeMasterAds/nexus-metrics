CREATE OR REPLACE FUNCTION public.get_usage_counts(p_account_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'projects',   (SELECT COUNT(*) FROM projects WHERE account_id = p_account_id AND is_active = true),
    'smartlinks',  (SELECT COUNT(*) FROM smartlinks WHERE account_id = p_account_id),
    'webhooks',    (SELECT COUNT(*) FROM webhooks WHERE account_id = p_account_id AND platform != 'form'),
    'agents',      (SELECT COUNT(*) FROM ai_agents WHERE account_id = p_account_id),
    'leads',       (SELECT COUNT(*) FROM leads WHERE account_id = p_account_id),
    'surveys',     (SELECT COUNT(*) FROM surveys WHERE account_id = p_account_id)
  ) INTO result;
  RETURN result;
END;
$$;