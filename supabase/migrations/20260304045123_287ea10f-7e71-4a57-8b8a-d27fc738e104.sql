
-- Add max_variants column to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_variants integer NOT NULL DEFAULT 5;

-- Add max_variants column to usage_limits table
ALTER TABLE public.usage_limits ADD COLUMN IF NOT EXISTS max_variants integer NOT NULL DEFAULT 5;
