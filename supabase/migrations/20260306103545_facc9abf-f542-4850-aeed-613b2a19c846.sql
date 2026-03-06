
-- Fix search_path for crm2_auto_lead_name
CREATE OR REPLACE FUNCTION crm2_auto_lead_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_name IS NULL OR NEW.lead_name = '' THEN
    NEW.lead_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  END IF;
  RETURN NEW;
END;
$$;
