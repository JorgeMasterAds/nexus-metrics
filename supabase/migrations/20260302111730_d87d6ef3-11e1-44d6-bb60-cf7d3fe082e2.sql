
-- Add checkout_url column to plans for Hotmart redirect
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS checkout_url text;

-- Update plan prices to match Hotmart
UPDATE public.plans SET price = 57, checkout_url = '' WHERE name = 'bronze';
UPDATE public.plans SET price = 97, checkout_url = '' WHERE name = 'prata';
UPDATE public.plans SET price = 147, checkout_url = '' WHERE name = 'ouro';
