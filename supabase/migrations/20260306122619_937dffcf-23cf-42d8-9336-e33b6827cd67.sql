
-- Add currency and locale preferences to accounts
ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'pt-BR';
