
CREATE OR REPLACE FUNCTION public.increment_deeplink_clicks(dl_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.deeplinks SET click_count = click_count + 1 WHERE id = dl_id;
$$;
