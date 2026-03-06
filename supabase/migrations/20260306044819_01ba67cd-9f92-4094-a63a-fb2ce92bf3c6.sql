
-- CRM2 Module: Completely isolated from CRM1
-- All tables prefixed with crm2_ to avoid conflicts

-- Lead Statuses (configurable pipeline stages for leads)
CREATE TABLE public.crm2_lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Open' CHECK (type IN ('Open','Junk','Converted','Lost')),
  color TEXT DEFAULT '#6b7280',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, name)
);

-- Deal Statuses (configurable pipeline stages for deals)
CREATE TABLE public.crm2_deal_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Open' CHECK (type IN ('Open','Won','Lost')),
  probability INT DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  color TEXT DEFAULT '#6b7280',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, name)
);

-- Organizations (Companies)
CREATE TABLE public.crm2_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  territory TEXT,
  no_of_employees TEXT,
  annual_revenue NUMERIC(15,2),
  currency TEXT DEFAULT 'BRL',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts
CREATE TABLE public.crm2_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  organization_id UUID REFERENCES public.crm2_organizations(id) ON DELETE SET NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE public.crm2_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  organization TEXT,
  website TEXT,
  job_title TEXT,
  source TEXT,
  industry TEXT,
  territory TEXT,
  annual_revenue NUMERIC(15,2),
  status_id UUID REFERENCES public.crm2_lead_statuses(id) ON DELETE SET NULL,
  lead_owner UUID REFERENCES auth.users(id),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  lost_reason TEXT,
  lost_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deals
CREATE TABLE public.crm2_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT,
  organization_id UUID REFERENCES public.crm2_organizations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.crm2_leads(id) ON DELETE SET NULL,
  deal_owner UUID REFERENCES auth.users(id),
  status_id UUID REFERENCES public.crm2_deal_statuses(id) ON DELETE SET NULL,
  probability INT DEFAULT 0,
  deal_value NUMERIC(15,2),
  currency TEXT DEFAULT 'BRL',
  expected_closure_date DATE,
  closed_date DATE,
  next_step TEXT,
  source TEXT,
  lost_reason TEXT,
  lost_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deal <-> Contact M:M
CREATE TABLE public.crm2_deal_contacts (
  deal_id UUID NOT NULL REFERENCES public.crm2_deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm2_contacts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (deal_id, contact_id)
);

-- Tasks (linked to lead or deal)
CREATE TABLE public.crm2_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  status TEXT DEFAULT 'Todo' CHECK (status IN ('Backlog','Todo','In Progress','Done','Canceled')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  reference_type TEXT CHECK (reference_type IN ('lead','deal')),
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notes
CREATE TABLE public.crm2_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  reference_type TEXT CHECK (reference_type IN ('lead','deal')),
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activities (immutable audit log)
CREATE TABLE public.crm2_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('lead','deal')),
  reference_id UUID,
  actor UUID REFERENCES auth.users(id),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.crm2_lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_deal_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_deal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm2_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: account-based access using get_user_account_ids
CREATE POLICY "crm2_lead_statuses_access" ON public.crm2_lead_statuses FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_deal_statuses_access" ON public.crm2_deal_statuses FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_organizations_access" ON public.crm2_organizations FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_contacts_access" ON public.crm2_contacts FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_leads_access" ON public.crm2_leads FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_deals_access" ON public.crm2_deals FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_deal_contacts_access" ON public.crm2_deal_contacts FOR ALL TO authenticated
  USING (deal_id IN (SELECT id FROM public.crm2_deals WHERE account_id = ANY(public.get_user_account_ids(auth.uid()))))
  WITH CHECK (deal_id IN (SELECT id FROM public.crm2_deals WHERE account_id = ANY(public.get_user_account_ids(auth.uid()))));

CREATE POLICY "crm2_tasks_access" ON public.crm2_tasks FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_notes_access" ON public.crm2_notes FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

CREATE POLICY "crm2_activities_access" ON public.crm2_activities FOR ALL TO authenticated
  USING (account_id = ANY(public.get_user_account_ids(auth.uid())))
  WITH CHECK (account_id = ANY(public.get_user_account_ids(auth.uid())));

-- Function to seed default statuses for a new account
CREATE OR REPLACE FUNCTION public.crm2_seed_default_statuses(p_account_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Lead statuses
  INSERT INTO crm2_lead_statuses (account_id, name, type, color, position) VALUES
    (p_account_id, 'Novo', 'Open', '#3b82f6', 0),
    (p_account_id, 'Contatado', 'Open', '#8b5cf6', 1),
    (p_account_id, 'Interessado', 'Open', '#f59e0b', 2),
    (p_account_id, 'Qualificado', 'Converted', '#10b981', 3),
    (p_account_id, 'Perdido', 'Lost', '#ef4444', 4),
    (p_account_id, 'Descartado', 'Junk', '#6b7280', 5)
  ON CONFLICT (account_id, name) DO NOTHING;

  -- Deal statuses
  INSERT INTO crm2_deal_statuses (account_id, name, type, probability, color, position) VALUES
    (p_account_id, 'Lead', 'Open', 10, '#3b82f6', 0),
    (p_account_id, 'Qualificado', 'Open', 30, '#8b5cf6', 1),
    (p_account_id, 'Proposta', 'Open', 50, '#f59e0b', 2),
    (p_account_id, 'Negociação', 'Open', 70, '#f97316', 3),
    (p_account_id, 'Ganho', 'Won', 100, '#10b981', 4),
    (p_account_id, 'Perdido', 'Lost', 0, '#ef4444', 5)
  ON CONFLICT (account_id, name) DO NOTHING;
END;
$$;

-- Convert lead to deal function
CREATE OR REPLACE FUNCTION public.crm2_convert_lead_to_deal(
  p_lead_id UUID,
  p_account_id UUID,
  p_project_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_lead RECORD;
  v_org_id UUID;
  v_contact_id UUID;
  v_deal_id UUID;
  v_deal_status_id UUID;
  v_converted_status_id UUID;
BEGIN
  SELECT * INTO v_lead FROM crm2_leads WHERE id = p_lead_id AND account_id = p_account_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF v_lead.converted THEN RAISE EXCEPTION 'Lead already converted'; END IF;

  -- Create or find organization
  IF v_lead.organization IS NOT NULL AND v_lead.organization != '' THEN
    SELECT id INTO v_org_id FROM crm2_organizations
    WHERE account_id = p_account_id AND name = v_lead.organization LIMIT 1;
    IF v_org_id IS NULL THEN
      INSERT INTO crm2_organizations (account_id, project_id, name, industry, territory, annual_revenue, created_by)
      VALUES (p_account_id, p_project_id, v_lead.organization, v_lead.industry, v_lead.territory, v_lead.annual_revenue, auth.uid())
      RETURNING id INTO v_org_id;
    END IF;
  END IF;

  -- Create contact
  INSERT INTO crm2_contacts (account_id, project_id, first_name, last_name, email, phone, job_title, organization_id, created_by)
  VALUES (p_account_id, p_project_id, COALESCE(v_lead.first_name, 'Lead'), v_lead.last_name, v_lead.email, v_lead.phone, v_lead.job_title, v_org_id, auth.uid())
  RETURNING id INTO v_contact_id;

  -- Get first 'Open' deal status
  SELECT id INTO v_deal_status_id FROM crm2_deal_statuses
  WHERE account_id = p_account_id AND type = 'Open' ORDER BY position LIMIT 1;

  -- Create deal
  INSERT INTO crm2_deals (account_id, project_id, title, organization_id, lead_id, deal_owner, status_id, source, created_by)
  VALUES (p_account_id, p_project_id,
    COALESCE(v_lead.first_name, '') || ' ' || COALESCE(v_lead.last_name, '') || ' - ' || COALESCE(v_lead.organization, 'Deal'),
    v_org_id, p_lead_id, v_lead.lead_owner, v_deal_status_id, v_lead.source, auth.uid())
  RETURNING id INTO v_deal_id;

  -- Link contact to deal
  INSERT INTO crm2_deal_contacts (deal_id, contact_id, is_primary) VALUES (v_deal_id, v_contact_id, TRUE);

  -- Mark lead as converted
  SELECT id INTO v_converted_status_id FROM crm2_lead_statuses
  WHERE account_id = p_account_id AND type = 'Converted' ORDER BY position LIMIT 1;

  UPDATE crm2_leads SET converted = TRUE, converted_at = now(),
    status_id = COALESCE(v_converted_status_id, status_id), updated_at = now()
  WHERE id = p_lead_id;

  -- Log activity
  INSERT INTO crm2_activities (account_id, activity_type, reference_type, reference_id, actor, data)
  VALUES (p_account_id, 'converted', 'lead', p_lead_id, auth.uid(), jsonb_build_object('deal_id', v_deal_id, 'contact_id', v_contact_id, 'organization_id', v_org_id));

  INSERT INTO crm2_activities (account_id, activity_type, reference_type, reference_id, actor, data)
  VALUES (p_account_id, 'created', 'deal', v_deal_id, auth.uid(), jsonb_build_object('from_lead_id', p_lead_id));

  RETURN v_deal_id;
END;
$$;
