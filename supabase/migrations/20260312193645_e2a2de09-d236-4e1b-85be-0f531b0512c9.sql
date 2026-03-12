
-- Add missing tracking columns to clicks table
ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS utm_conjunto text;
ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS fbclid text;
ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS gclid text;
ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS ttclid text;
ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS page_url text;

-- Add onboarding tracking to accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create index on new columns
CREATE INDEX IF NOT EXISTS idx_clicks_fbclid ON public.clicks (fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clicks_gclid ON public.clicks (gclid) WHERE gclid IS NOT NULL;
