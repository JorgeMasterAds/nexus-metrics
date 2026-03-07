
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

UPDATE public.projects
SET slug = lower(
  regexp_replace(
    regexp_replace(
      extensions.unaccent(name),
      '[^a-zA-Z0-9 -]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON public.projects (slug) WHERE slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.projects_auto_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          extensions.unaccent(NEW.name),
          '[^a-zA-Z0-9 -]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    IF EXISTS (SELECT 1 FROM projects WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_auto_slug ON public.projects;
CREATE TRIGGER trg_projects_auto_slug
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.projects_auto_slug();
