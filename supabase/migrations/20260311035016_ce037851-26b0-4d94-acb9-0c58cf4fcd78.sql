
-- Add unique constraint for gz_groups upsert
ALTER TABLE public.gz_groups ADD CONSTRAINT gz_groups_account_group_jid_unique UNIQUE (account_id, group_jid);
