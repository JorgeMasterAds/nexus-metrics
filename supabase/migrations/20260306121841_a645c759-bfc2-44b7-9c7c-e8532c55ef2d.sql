
-- Step 1: Add missing columns from crm2_leads to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score_breakdown jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status_id uuid REFERENCES public.crm2_lead_statuses(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS organization text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS territory text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS annual_revenue numeric;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS no_of_employees text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mobile_no text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_owner uuid;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_notes text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Make name nullable (CRM uses first_name/last_name instead)
ALTER TABLE public.leads ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN name SET DEFAULT '';

-- Step 2: Migrate data from crm2_leads into leads
INSERT INTO public.leads (
  id, account_id, project_id, name, first_name, last_name, lead_name,
  email, phone, source, score, score_breakdown, status_id, organization,
  job_title, website, industry, territory, annual_revenue, no_of_employees,
  mobile_no, lead_owner, created_by, converted, converted_at,
  lost_reason, lost_notes, image_url, created_at, updated_at
)
SELECT
  id, account_id, project_id,
  COALESCE(lead_name, TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''),
  first_name, last_name, lead_name,
  email, phone, source, COALESCE(score, 0), score_breakdown, status_id, organization,
  job_title, website, industry, territory, annual_revenue, no_of_employees,
  mobile_no, lead_owner, created_by, COALESCE(converted, false), converted_at,
  lost_reason, lost_notes, image_url, COALESCE(created_at, now()), COALESCE(updated_at, now())
FROM public.crm2_leads
ON CONFLICT (id) DO NOTHING;

-- Step 3: Update crm2_deals FK from crm2_leads to leads
ALTER TABLE public.crm2_deals DROP CONSTRAINT IF EXISTS crm2_deals_lead_id_fkey;
ALTER TABLE public.crm2_deals ADD CONSTRAINT crm2_deals_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- Step 4: Update DB functions to use leads instead of crm2_leads

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
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id AND account_id = p_account_id;
  IF NOT FOUND THEN RETURN 0; END IF;

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

  UPDATE leads SET score = v_score WHERE id = p_lead_id;
  RETURN v_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm2_recalculate_all_scores(p_account_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_lead RECORD;
BEGIN
  FOR v_lead IN SELECT id FROM leads WHERE account_id = p_account_id AND (converted IS NULL OR converted = false)
  LOOP
    PERFORM crm2_calculate_lead_score(v_lead.id, p_account_id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm2_convert_lead_to_deal(p_lead_id uuid, p_account_id uuid, p_project_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_lead RECORD;
  v_org_id UUID;
  v_contact_id UUID;
  v_deal_id UUID;
  v_deal_status_id UUID;
  v_converted_status_id UUID;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id AND account_id = p_account_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF v_lead.converted THEN RAISE EXCEPTION 'Lead already converted'; END IF;

  IF v_lead.organization IS NOT NULL AND v_lead.organization != '' THEN
    SELECT id INTO v_org_id FROM crm2_organizations
    WHERE account_id = p_account_id AND name = v_lead.organization LIMIT 1;
    IF v_org_id IS NULL THEN
      INSERT INTO crm2_organizations (account_id, project_id, name, industry, territory, annual_revenue, created_by)
      VALUES (p_account_id, p_project_id, v_lead.organization, v_lead.industry, v_lead.territory, v_lead.annual_revenue, auth.uid())
      RETURNING id INTO v_org_id;
    END IF;
  END IF;

  INSERT INTO crm2_contacts (account_id, project_id, first_name, last_name, email, phone, job_title, organization_id, created_by)
  VALUES (p_account_id, p_project_id, COALESCE(v_lead.first_name, 'Lead'), v_lead.last_name, v_lead.email, v_lead.phone, v_lead.job_title, v_org_id, auth.uid())
  RETURNING id INTO v_contact_id;

  SELECT id INTO v_deal_status_id FROM crm2_deal_statuses
  WHERE account_id = p_account_id AND type = 'Open' ORDER BY position LIMIT 1;

  INSERT INTO crm2_deals (account_id, project_id, title, organization_id, lead_id, deal_owner, status_id, source, created_by)
  VALUES (p_account_id, p_project_id,
    COALESCE(v_lead.first_name, '') || ' ' || COALESCE(v_lead.last_name, '') || ' - ' || COALESCE(v_lead.organization, 'Deal'),
    v_org_id, p_lead_id, v_lead.lead_owner, v_deal_status_id, v_lead.source, auth.uid())
  RETURNING id INTO v_deal_id;

  INSERT INTO crm2_deal_contacts (deal_id, contact_id, is_primary) VALUES (v_deal_id, v_contact_id, TRUE);

  SELECT id INTO v_converted_status_id FROM crm2_lead_statuses
  WHERE account_id = p_account_id AND type = 'Converted' ORDER BY position LIMIT 1;

  UPDATE leads SET converted = TRUE, converted_at = now(),
    status_id = COALESCE(v_converted_status_id, status_id), updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO crm2_activities (account_id, activity_type, reference_type, reference_id, actor, data)
  VALUES (p_account_id, 'converted', 'lead', p_lead_id, auth.uid(), jsonb_build_object('deal_id', v_deal_id, 'contact_id', v_contact_id, 'organization_id', v_org_id));

  INSERT INTO crm2_activities (account_id, activity_type, reference_type, reference_id, actor, data)
  VALUES (p_account_id, 'created', 'deal', v_deal_id, auth.uid(), jsonb_build_object('from_lead_id', p_lead_id));

  RETURN v_deal_id;
END;
$$;

-- Auto lead_name trigger for leads table
CREATE OR REPLACE FUNCTION public.leads_auto_lead_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.lead_name IS NULL OR NEW.lead_name = '' THEN
    NEW.lead_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  END IF;
  IF (NEW.name IS NULL OR NEW.name = '') AND (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
    NEW.name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_auto_lead_name_trigger ON public.leads;
CREATE TRIGGER leads_auto_lead_name_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_auto_lead_name();

-- Step 5: Drop crm2_leads table (and its trigger)
DROP TRIGGER IF EXISTS crm2_auto_lead_name_trigger ON public.crm2_leads;
DROP TABLE IF EXISTS public.crm2_leads CASCADE;

-- Drop the old trigger function
DROP FUNCTION IF EXISTS public.crm2_auto_lead_name();
