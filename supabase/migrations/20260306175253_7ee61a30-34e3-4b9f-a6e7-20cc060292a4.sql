
ALTER TABLE public.integrations ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX idx_integrations_project_id ON public.integrations(project_id);
