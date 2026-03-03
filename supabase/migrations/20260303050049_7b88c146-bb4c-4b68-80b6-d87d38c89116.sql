
-- Table for multiple motivational messages
CREATE TABLE public.motivational_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.motivational_messages ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage
CREATE POLICY "Super admins can manage motivational messages"
ON public.motivational_messages
FOR ALL
USING (is_super_admin(auth.uid()));

-- All authenticated users can read active messages
CREATE POLICY "Authenticated users can read active messages"
ON public.motivational_messages
FOR SELECT
TO authenticated
USING (is_active = true);

-- Migrate existing message if exists
INSERT INTO public.motivational_messages (message)
SELECT motivational_message FROM public.platform_settings
WHERE motivational_message IS NOT NULL AND motivational_message != ''
LIMIT 1;
