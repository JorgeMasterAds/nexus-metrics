import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { toast } from "sonner";

export type TicketStatus = "novo" | "em_atendimento" | "aguardando_cliente" | "resolvido" | "fechado";
export type TicketPriority = "baixa" | "normal" | "alta" | "urgente";

export interface SupportTicket {
  id: string;
  user_id: string;
  account_id: string | null;
  subject: string;
  body: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  content: string;
  created_at: string;
}

export function useSupportTickets(isAdmin = false) {
  const qc = useQueryClient();
  const { activeAccountId } = useAccount();

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", isAdmin ? "all" : "mine"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SupportTicket[];
    },
  });

  const createTicket = useMutation({
    mutationFn: async ({ subject, body, category }: { subject: string; body: string; category?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("support_tickets")
        .insert({ user_id: user.id, account_id: activeAccountId, subject, body, category: category || "geral" })
        .select()
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupportTicket> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("support_tickets")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket atualizado");
    },
  });

  return { tickets: ticketsQuery.data || [], isLoading: ticketsQuery.isLoading, createTicket, updateTicket, refetch: ticketsQuery.refetch };
}

export function useTicketMessages(ticketId: string | null) {
  const qc = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["support-messages", ticketId],
    enabled: !!ticketId,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as SupportMessage[];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, senderType }: { content: string; senderType: "user" | "admin" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any)
        .from("support_messages")
        .insert({ ticket_id: ticketId, sender_id: user.id, sender_type: senderType, content });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-messages", ticketId] });
    },
  });

  return { messages: messagesQuery.data || [], isLoading: messagesQuery.isLoading, sendMessage };
}
