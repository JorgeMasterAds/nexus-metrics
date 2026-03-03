-- Add max_surveys column to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_surveys integer NOT NULL DEFAULT 0;

-- Add motivational_message column to platform_settings for custom revenue goal messages
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS motivational_message text DEFAULT '💪 "O sucesso é a soma de pequenos esforços repetidos dia após dia."';