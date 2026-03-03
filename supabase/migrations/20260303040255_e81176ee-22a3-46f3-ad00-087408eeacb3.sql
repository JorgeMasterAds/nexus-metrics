
-- Add views_adjustment column to smartlink_variants for manual view count corrections
ALTER TABLE public.smartlink_variants
ADD COLUMN IF NOT EXISTS views_adjustment integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.smartlink_variants.views_adjustment IS 'Manual adjustment to views count. Displayed views = real_views + views_adjustment';
