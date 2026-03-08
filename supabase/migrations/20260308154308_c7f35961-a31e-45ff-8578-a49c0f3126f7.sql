DO $$
DECLARE
  r RECORD;
  v_recovered_variant_id UUID;
BEGIN
  FOR r IN
    SELECT s.id AS smartlink_id, s.account_id
    FROM public.smartlinks s
    WHERE EXISTS (
      SELECT 1 FROM public.clicks c
      WHERE c.smartlink_id = s.id AND c.variant_id IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.conversions cv
      WHERE cv.smartlink_id = s.id AND cv.variant_id IS NULL
    )
  LOOP
    SELECT sv.id
      INTO v_recovered_variant_id
    FROM public.smartlink_variants sv
    WHERE sv.smartlink_id = r.smartlink_id
      AND lower(sv.name) = 'histórico recuperado'
    LIMIT 1;

    IF v_recovered_variant_id IS NULL THEN
      INSERT INTO public.smartlink_variants (
        smartlink_id,
        account_id,
        name,
        url,
        weight,
        is_active
      )
      VALUES (
        r.smartlink_id,
        r.account_id,
        'Histórico recuperado',
        'historico-recuperado://auto',
        0,
        false
      )
      RETURNING id INTO v_recovered_variant_id;
    END IF;

    UPDATE public.clicks
    SET variant_id = v_recovered_variant_id
    WHERE smartlink_id = r.smartlink_id
      AND variant_id IS NULL;

    UPDATE public.conversions
    SET variant_id = v_recovered_variant_id
    WHERE smartlink_id = r.smartlink_id
      AND variant_id IS NULL;

    UPDATE public.daily_metrics
    SET variant_id = v_recovered_variant_id
    WHERE smartlink_id = r.smartlink_id
      AND variant_id IS NULL;
  END LOOP;
END
$$;