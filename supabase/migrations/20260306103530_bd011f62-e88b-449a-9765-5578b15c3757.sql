
-- Add missing columns to crm2 tables for Nexus CRM
ALTER TABLE crm2_leads ADD COLUMN IF NOT EXISTS lead_name TEXT;
ALTER TABLE crm2_leads ADD COLUMN IF NOT EXISTS mobile_no TEXT;
ALTER TABLE crm2_leads ADD COLUMN IF NOT EXISTS no_of_employees TEXT;
ALTER TABLE crm2_leads ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE crm2_leads ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}';

ALTER TABLE crm2_deals ADD COLUMN IF NOT EXISTS deal_number TEXT;

ALTER TABLE crm2_contacts ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE crm2_contacts ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE crm2_contacts ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE crm2_organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE crm2_organizations ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE crm2_tasks ADD COLUMN IF NOT EXISTS start_date DATE;

-- Auto-generate lead_name from first_name + last_name
CREATE OR REPLACE FUNCTION crm2_auto_lead_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_name IS NULL OR NEW.lead_name = '' THEN
    NEW.lead_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crm2_leads_auto_name ON crm2_leads;
CREATE TRIGGER crm2_leads_auto_name
  BEFORE INSERT OR UPDATE ON crm2_leads
  FOR EACH ROW EXECUTE FUNCTION crm2_auto_lead_name();
