CREATE OR REPLACE VIEW public.integrations_safe AS
SELECT
  id,
  account_id,
  provider,
  expires_at,
  external_account_id,
  config,
  created_at,
  updated_at,
  (refresh_token_encrypted IS NOT NULL AND refresh_token_encrypted != '') AS has_refresh_token
FROM integrations;