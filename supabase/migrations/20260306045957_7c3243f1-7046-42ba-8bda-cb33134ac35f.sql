
-- Add score column to crm2_leads
ALTER TABLE public.crm2_leads ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;

-- Create scoring rules table
CREATE TABLE IF NOT EXISTS public.crm2_scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  field text NOT NULL, -- 'has_email', 'has_phone', 'has_organization', 'source', 'status_type', 'has_website', 'has_job_title'
  condition text NOT NULL, -- 'exists', 'equals', 'not_empty'
  value text, -- optional value for 'equals' condition
  points integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm2_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage scoring rules for their accounts"
  ON public.crm2_scoring_rules
  FOR ALL
  TO authenticated
  USING (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT account_id FROM public.account_users WHERE user_id = auth.uid()));

-- Function to calculate lead score
CREATE OR REPLACE FUNCTION public.crm2_calculate_lead_score(p_lead_id uuid, p_account_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead RECORD;
  v_score integer := 0;
  v_rule RECORD;
  v_status_type text;
BEGIN
  SELECT * INTO v_lead FROM crm2_leads WHERE id = p_lead_id AND account_id = p_account_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Get status type
  SELECT type INTO v_status_type FROM crm2_lead_statuses WHERE id = v_lead.status_id;

  FOR v_rule IN 
    SELECT * FROM crm2_scoring_rules WHERE account_id = p_account_id AND is_active = true
  LOOP
    CASE v_rule.field
      WHEN 'has_email' THEN
        IF v_lead.email IS NOT NULL AND v_lead.email != '' THEN v_score := v_score + v_rule.points; END IF;
      WHEN 'has_phone' THEN
        IF v_lead.phone IS NOT NULL AND v_lead.phone != '' THEN v_score := v_score + v_rule.points; END IF;
      WHEN 'has_organization' THEN
        IF v_lead.organization IS NOT NULL AND v_lead.organization != '' THEN v_score := v_score + v_rule.points; END IF;
      WHEN 'has_website' THEN
        IF v_lead.website IS NOT NULL AND v_lead.website != '' THEN v_score := v_score + v_rule.points; END IF;
      WHEN 'has_job_title' THEN
        IF v_lead.job_title IS NOT NULL AND v_lead.job_title != '' THEN v_score := v_score + v_rule.points; END IF;
      WHEN 'source' THEN
        IF v_rule.condition = 'equals' AND lower(v_lead.source) = lower(v_rule.value) THEN v_score := v_score + v_rule.points; END IF;
      WHEN 'status_type' THEN
        IF v_rule.condition = 'equals' AND v_status_type = v_rule.value THEN v_score := v_score + v_rule.points; END IF;
      WHEN 'has_annual_revenue' THEN
        IF v_lead.annual_revenue IS NOT NULL AND v_lead.annual_revenue > 0 THEN v_score := v_score + v_rule.points; END IF;
      ELSE NULL;
    END CASE;
  END LOOP;

  -- Update lead score
  UPDATE crm2_leads SET score = v_score WHERE id = p_lead_id;
  
  RETURN v_score;
END;
$$;

-- Function to recalculate all lead scores for an account
CREATE OR REPLACE FUNCTION public.crm2_recalculate_all_scores(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead RECORD;
BEGIN
  FOR v_lead IN SELECT id FROM crm2_leads WHERE account_id = p_account_id AND (converted IS NULL OR converted = false)
  LOOP
    PERFORM crm2_calculate_lead_score(v_lead.id, p_account_id);
  END LOOP;
END;
$$;

-- Seed default scoring rules function
CREATE OR REPLACE FUNCTION public.crm2_seed_default_scoring_rules(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO crm2_scoring_rules (account_id, field, condition, value, points) VALUES
    (p_account_id, 'has_email', 'exists', NULL, 10),
    (p_account_id, 'has_phone', 'exists', NULL, 15),
    (p_account_id, 'has_organization', 'exists', NULL, 10),
    (p_account_id, 'has_website', 'exists', NULL, 5),
    (p_account_id, 'has_job_title', 'exists', NULL, 5),
    (p_account_id, 'has_annual_revenue', 'exists', NULL, 15),
    (p_account_id, 'status_type', 'equals', 'Converted', 20),
    (p_account_id, 'source', 'equals', 'google', 10),
    (p_account_id, 'source', 'equals', 'indicação', 20)
  ON CONFLICT DO NOTHING;
END;
$$;
