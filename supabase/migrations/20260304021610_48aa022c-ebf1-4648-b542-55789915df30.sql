ALTER TYPE public.conversion_status ADD VALUE IF NOT EXISTS 'waiting_payment';
ALTER TYPE public.conversion_status ADD VALUE IF NOT EXISTS 'abandoned_cart';