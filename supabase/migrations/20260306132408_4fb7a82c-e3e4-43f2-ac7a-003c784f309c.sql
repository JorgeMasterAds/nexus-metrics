
-- Add missing columns to support_tickets
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Make account_id NOT NULL (set default for existing rows first)
-- ALTER TABLE public.support_tickets ALTER COLUMN account_id SET NOT NULL;

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);

-- Super admins can see all tickets
CREATE POLICY "Super admins can view all tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Super admins can update any ticket
CREATE POLICY "Super admins can update tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Users can update own tickets
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Messages RLS
CREATE POLICY "Users can view messages of own tickets"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Super admins can view all messages"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can send messages on own tickets"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Super admins can send messages"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND public.is_super_admin(auth.uid())
  );

-- Update trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
