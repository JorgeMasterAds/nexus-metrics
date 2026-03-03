
DROP FUNCTION IF EXISTS public.aggregate_daily_metrics(date);

CREATE FUNCTION public.aggregate_daily_metrics(p_target_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.daily_metrics WHERE daily_metrics.date = p_target_date;

  -- Step 1: Insert click-based metrics (views) grouped by account, smartlink, variant
  INSERT INTO public.daily_metrics (account_id, date, smartlink_id, variant_id, views, conversions, revenue)
  SELECT
    ck.account_id,
    p_target_date,
    ck.smartlink_id,
    ck.variant_id,
    COUNT(*),
    0,
    0
  FROM public.clicks ck
  WHERE ck.created_at::date = p_target_date
  GROUP BY ck.account_id, ck.smartlink_id, ck.variant_id;

  -- Step 2: Update with conversion data (merge into existing click rows)
  UPDATE public.daily_metrics dm
  SET
    conversions = conv.conv_count,
    revenue = conv.conv_revenue
  FROM (
    SELECT
      c.account_id,
      c.smartlink_id,
      c.variant_id,
      COUNT(*) as conv_count,
      COALESCE(SUM(c.amount), 0) as conv_revenue
    FROM public.conversions c
    WHERE c.created_at::date = p_target_date
      AND c.status = 'approved'
    GROUP BY c.account_id, c.smartlink_id, c.variant_id
  ) conv
  WHERE dm.date = p_target_date
    AND dm.account_id = conv.account_id
    AND dm.smartlink_id IS NOT DISTINCT FROM conv.smartlink_id
    AND dm.variant_id IS NOT DISTINCT FROM conv.variant_id;

  -- Step 3: Insert conversion-only rows (no matching clicks)
  INSERT INTO public.daily_metrics (account_id, date, smartlink_id, variant_id, views, conversions, revenue)
  SELECT
    c.account_id,
    p_target_date,
    c.smartlink_id,
    c.variant_id,
    0,
    COUNT(*),
    COALESCE(SUM(c.amount), 0)
  FROM public.conversions c
  WHERE c.created_at::date = p_target_date
    AND c.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_metrics dm
      WHERE dm.account_id = c.account_id
        AND dm.smartlink_id IS NOT DISTINCT FROM c.smartlink_id
        AND dm.variant_id IS NOT DISTINCT FROM c.variant_id
        AND dm.date = p_target_date
    )
  GROUP BY c.account_id, c.smartlink_id, c.variant_id;
END;
$$;
