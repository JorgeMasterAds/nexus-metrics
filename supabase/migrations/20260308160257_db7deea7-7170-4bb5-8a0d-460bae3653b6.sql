-- 1. Change smartlink_variants FK from CASCADE to RESTRICT
-- This prevents deleting a smartlink from cascading to delete its variants
ALTER TABLE public.smartlink_variants
  DROP CONSTRAINT smartlink_variants_smartlink_id_fkey,
  ADD CONSTRAINT smartlink_variants_smartlink_id_fkey
    FOREIGN KEY (smartlink_id) REFERENCES public.smartlinks(id)
    ON DELETE RESTRICT;

-- 2. Add a trigger to BLOCK deletion of variants that have historical data
CREATE OR REPLACE FUNCTION public.prevent_variant_delete_with_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  click_count integer;
  conv_count integer;
BEGIN
  SELECT count(*) INTO click_count FROM public.clicks WHERE variant_id = OLD.id;
  SELECT count(*) INTO conv_count FROM public.conversions WHERE variant_id = OLD.id;
  
  IF click_count > 0 OR conv_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete variant "%" (ID: %). It has % clicks and % conversions linked. Archive it instead (is_active=false, weight=0).',
      OLD.name, OLD.id, click_count, conv_count;
  END IF;
  
  -- Also clean up daily_metrics for variants with no real data
  DELETE FROM public.daily_metrics WHERE variant_id = OLD.id;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_variant_delete
  BEFORE DELETE ON public.smartlink_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_variant_delete_with_data();

-- 3. Add a trigger to BLOCK deletion of smartlinks that have data
CREATE OR REPLACE FUNCTION public.prevent_smartlink_delete_with_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  click_count integer;
  conv_count integer;
BEGIN
  SELECT count(*) INTO click_count FROM public.clicks WHERE smartlink_id = OLD.id;
  SELECT count(*) INTO conv_count FROM public.conversions WHERE smartlink_id = OLD.id;
  
  IF click_count > 0 OR conv_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete smartlink "%" (ID: %). It has % clicks and % conversions linked. Archive it instead (is_active=false).',
      OLD.name, OLD.id, click_count, conv_count;
  END IF;
  
  -- Allow deletion only if no data exists - clean up childless variants and daily_metrics
  DELETE FROM public.daily_metrics WHERE smartlink_id = OLD.id;
  DELETE FROM public.smartlink_variants WHERE smartlink_id = OLD.id;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_smartlink_delete
  BEFORE DELETE ON public.smartlinks
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_smartlink_delete_with_data();

-- 4. Add is_archived column to smartlinks for soft-delete
ALTER TABLE public.smartlinks ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;