ALTER TYPE public.conversion_status ADD VALUE IF NOT EXISTS 'boleto_generated';
ALTER TYPE public.conversion_status ADD VALUE IF NOT EXISTS 'pix_generated';
ALTER TYPE public.conversion_status ADD VALUE IF NOT EXISTS 'declined';