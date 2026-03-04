
-- Add period column to revenue_goals
ALTER TABLE public.revenue_goals 
ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'monthly';

-- Drop old unique constraint and create new one with period
ALTER TABLE public.revenue_goals 
DROP CONSTRAINT IF EXISTS revenue_goals_account_id_project_id_key;

ALTER TABLE public.revenue_goals 
ADD CONSTRAINT revenue_goals_account_project_period_key 
UNIQUE (account_id, project_id, period);
