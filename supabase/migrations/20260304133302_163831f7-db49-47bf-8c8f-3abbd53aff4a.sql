
-- Add unique constraint on click_id to prevent duplicate clicks at DB level
CREATE UNIQUE INDEX IF NOT EXISTS clicks_click_id_unique ON public.clicks (click_id);
