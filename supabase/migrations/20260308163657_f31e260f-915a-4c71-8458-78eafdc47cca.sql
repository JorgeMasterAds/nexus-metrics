-- 1. Prevent clearing variant_id on clicks once set
CREATE OR REPLACE FUNCTION public.protect_click_variant_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent clearing variant_id once it has been set
  IF OLD.variant_id IS NOT NULL AND NEW.variant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot clear variant_id on click "%" — variant linkage is permanent. Old variant: %', OLD.click_id, OLD.variant_id;
  END IF;
  -- Prevent clearing smartlink_id once set
  IF OLD.smartlink_id IS NOT NULL AND NEW.smartlink_id IS NULL THEN
    RAISE EXCEPTION 'Cannot clear smartlink_id on click "%" — smartlink linkage is permanent.', OLD.click_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_click_variant ON public.clicks;
CREATE TRIGGER trg_protect_click_variant
  BEFORE UPDATE ON public.clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_click_variant_link();

-- 2. Prevent clearing variant_id on conversions once set
CREATE OR REPLACE FUNCTION public.protect_conversion_variant_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent clearing variant_id once it has been set
  IF OLD.variant_id IS NOT NULL AND NEW.variant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot clear variant_id on conversion "%" — variant linkage is permanent. Old variant: %', OLD.transaction_id, OLD.variant_id;
  END IF;
  -- Prevent clearing smartlink_id once set
  IF OLD.smartlink_id IS NOT NULL AND NEW.smartlink_id IS NULL THEN
    RAISE EXCEPTION 'Cannot clear smartlink_id on conversion "%" — smartlink linkage is permanent.', OLD.transaction_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_conversion_variant ON public.conversions;
CREATE TRIGGER trg_protect_conversion_variant
  BEFORE UPDATE ON public.conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_conversion_variant_link();

-- 3. Prevent UPDATE on smartlink_variants that would change the ID
CREATE OR REPLACE FUNCTION public.protect_variant_id_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot change variant UUID — it is permanently linked to clicks/conversions. Old: %, New: %', OLD.id, NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_variant_id ON public.smartlink_variants;
CREATE TRIGGER trg_protect_variant_id
  BEFORE UPDATE ON public.smartlink_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_variant_id_immutable();