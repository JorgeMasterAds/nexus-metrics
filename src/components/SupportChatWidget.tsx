import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, ArrowLeft, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "user" | "admin" | "bot";
  content: string;
  created_at: string;
}

interface ChatTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [botTyping, setBotTyping] = useState(false);
  const [botStreamContent, setBotStreamContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { activeAccountId } = useAccount();

  // Check if chatbot is enabled (global platform config)
  const { data: chatbotConfig } = useQuery({
    queryKey: ["chatbot-config-global"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("support_chatbot_config")
        .select("is_enabled, greeting_message")
        .eq("is_enabled", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const chatbotEnabled = chatbotConfig?.is_enabled ?? false;

  // Fetch user's open ticket (most recent non-closed)
  const { data: openTicket, isLoading: loadingTicket } = useQuery({
    queryKey: ["support-open-ticket"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("support_tickets")
        .select("id, subject, status, created_at, updated_at")
        .eq("user_id", user.id)
        .not("status", "in", '("fechado","resolvido")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as ChatTicket | null;
    },
    enabled: open,
  });

  // Fetch past conversations
  const { data: pastTickets = [] } = useQuery({
    queryKey: ["support-past-tickets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await (supabase as any)
        .from("support_tickets")
        .select("id, subject, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as ChatTicket[];
    },
    enabled: open && view === "history",
  });

  const currentTicketId = activeTicketId || openTicket?.id || null;

  // Fetch messages for current ticket
  const { data: messages = [] } = useQuery({
    queryKey: ["support-chat-messages", currentTicketId],
    enabled: !!currentTicketId,
    refetchInterval: 4000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("support_messages")
        .select("*")
        .eq("ticket_id", currentTicketId)
        .order("created_at", { ascending: true });
      return (data || []) as ChatMessage[];
    },
  });

  // Real-time subscription for messages
  useEffect(() => {
    if (!currentTicketId) return;
    const channel = supabase
      .channel(`support-chat-${currentTicketId}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${currentTicketId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["support-chat-messages", currentTicketId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentTicketId, qc]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botStreamContent]);

  // Stream AI response
  const streamBotResponse = async (userMessage: string, ticketId: string, allMessages: ChatMessage[]) => {
    if (!chatbotEnabled || !activeAccountId) return;
    setBotTyping(true);
    setBotStreamContent("");

    try {
      const chatHistory = allMessages.map(m => ({
        role: m.sender_type === "user" ? "user" : "assistant",
        content: m.content,
      }));
      chatHistory.push({ role: "user", content: userMessage });

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chatbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ messages: chatHistory }),
        }
      );

      if (!resp.ok || !resp.body) {
        setBotTyping(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setBotStreamContent(fullContent);
            }
          } catch { /* ignore partial */ }
        }
      }

      // Save bot message to DB
      if (fullContent) {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from("support_messages").insert({
          ticket_id: ticketId,
          sender_id: user?.id || "bot",
          sender_type: "admin",
          content: fullContent,
        });
        qc.invalidateQueries({ queryKey: ["support-chat-messages", ticketId] });
      }
    } catch (e) {
      console.error("Bot stream error:", e);
    } finally {
      setBotTyping(false);
      setBotStreamContent("");
    }
  };

  // Send message (auto-creates ticket if none exists)
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      let ticketId = currentTicketId;

      // Auto-create ticket if no active one
      if (!ticketId) {
        const preview = content.length > 60 ? content.slice(0, 60) + "…" : content;
        const { data: newTicket, error: ticketErr } = await (supabase as any)
          .from("support_tickets")
          .insert({
            user_id: user.id,
            account_id: activeAccountId,
            subject: preview,
            body: content,
            category: "chat",
            status: "novo",
            priority: "normal",
          })
          .select("id")
          .single();
        if (ticketErr) throw ticketErr;
        ticketId = newTicket.id;
        setActiveTicketId(ticketId);
      }

      // Insert message
      const { error } = await (supabase as any)
        .from("support_messages")
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: "user",
          content,
        });
      if (error) throw error;
      return { ticketId: ticketId!, content };
    },
    onSuccess: ({ ticketId, content }) => {
      qc.invalidateQueries({ queryKey: ["support-chat-messages", ticketId] });
      qc.invalidateQueries({ queryKey: ["support-open-ticket"] });
      // Trigger bot response
      if (chatbotEnabled) {
        streamBotResponse(content, ticketId, messages);
      }
    },
  });

  const handleSend = () => {
    if (!msg.trim() || sendMutation.isPending || botTyping) return;
    sendMutation.mutate(msg.trim());
    setMsg("");
  };

  const openHistoryTicket = (ticket: ChatTicket) => {
    setActiveTicketId(ticket.id);
    setView("chat");
  };

  const goBack = () => {
    setActiveTicketId(null);
    setView("chat");
  };

  const hasActiveChat = !!currentTicketId;
  const currentStatus = activeTicketId
    ? pastTickets.find(t => t.id === activeTicketId)?.status
    : openTicket?.status;
  const isClosed = currentStatus === "fechado" || currentStatus === "resolvido";

  // Unread indicator: check if last message is from admin
  const hasUnread = messages.length > 0 && messages[messages.length - 1].sender_type === "admin";

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
        )}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {hasUnread && !open && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-primary animate-pulse" />
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3">
            {view === "history" && (
              <button onClick={goBack} className="text-primary-foreground/80 hover:text-primary-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-primary-foreground flex items-center gap-1.5">
                {chatbotEnabled && <Bot className="h-3.5 w-3.5" />}
                Suporte Nexus
              </h3>
              <p className="text-[10px] text-primary-foreground/70">
                {botTyping
                  ? "🤖 Digitando..."
                  : hasActiveChat && !isClosed
                    ? chatbotEnabled
                      ? "🤖 Assistente IA ativo"
                      : currentStatus === "em_atendimento"
                        ? "🟢 Atendente conectado"
                        : "⏳ Aguardando atendimento..."
                    : chatbotEnabled
                      ? "🤖 Assistente virtual disponível"
                      : "Como podemos ajudar?"}
              </p>
            </div>
            <button
              onClick={() => setView(view === "history" ? "chat" : "history")}
              className="text-[10px] text-primary-foreground/70 hover:text-primary-foreground underline"
            >
              {view === "history" ? "Chat atual" : "Histórico"}
            </button>
          </div>

          {/* History View */}
          {view === "history" ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pastTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma conversa anterior.</p>
                </div>
              ) : (
                pastTickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => openHistoryTicket(ticket)}
                    className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate flex-1">{ticket.subject}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-medium ml-2",
                        ticket.status === "novo" && "bg-info/20 text-info",
                        ticket.status === "em_atendimento" && "bg-warning/20 text-warning",
                        ticket.status === "resolvido" && "bg-success/20 text-success",
                        ticket.status === "fechado" && "bg-muted text-muted-foreground",
                        ticket.status === "aguardando_cliente" && "bg-accent text-accent-foreground",
                      )}>
                        {ticket.status === "novo" ? "Novo" :
                         ticket.status === "em_atendimento" ? "Em atendimento" :
                         ticket.status === "resolvido" ? "Resolvido" :
                         ticket.status === "fechado" ? "Fechado" :
                         "Aguardando"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: 360 }}>
                {/* Greeting message for chatbot */}
                {!hasActiveChat && messages.length === 0 && chatbotEnabled && chatbotConfig?.greeting_message && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                      <div className="max-w-[75%] rounded-xl rounded-tl-sm bg-secondary text-foreground px-3 py-2 text-xs">
                        <p>{chatbotConfig.greeting_message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!hasActiveChat && messages.length === 0 && !chatbotEnabled && (
                  <div className="text-center py-8">
                    <span className="text-3xl">💬</span>
                    <p className="text-xs text-muted-foreground mt-2">
                      Envie uma mensagem para iniciar o atendimento.
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Nossa equipe responderá o mais breve possível.
                    </p>
                  </div>
                )}

                {hasActiveChat && currentStatus === "novo" && messages.length > 0 && !chatbotEnabled && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-info/10 text-info text-[10px] font-medium">
                      <span className="h-2 w-2 rounded-full bg-info animate-pulse" />
                      Aguardando atendente...
                    </div>
                  </div>
                )}

                {messages.map(m => (
                  <div key={m.id} className={cn("flex", m.sender_type === "user" ? "justify-end" : "justify-start")}>
                    {m.sender_type !== "user" && (
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 shrink-0 self-end">
                        {chatbotEnabled ? <Bot className="h-3 w-3 text-primary" /> : <span className="text-[10px]">🎧</span>}
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[75%] rounded-xl px-3 py-2 text-xs",
                      m.sender_type === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-secondary text-foreground"
                    )}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <span className={cn(
                        "text-[9px] mt-1 block",
                        m.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"
                      )}>
                        {format(new Date(m.created_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Bot streaming response */}
                {botTyping && botStreamContent && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 shrink-0 self-end">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="max-w-[75%] rounded-xl rounded-tl-sm bg-secondary text-foreground px-3 py-2 text-xs">
                      <p className="whitespace-pre-wrap">{botStreamContent}</p>
                    </div>
                  </div>
                )}

                {/* Bot typing indicator */}
                {botTyping && !botStreamContent && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 shrink-0 self-end">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-secondary px-3 py-2 text-xs">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {!isClosed ? (
                <div className="p-3 border-t border-border flex gap-2">
                  <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={chatbotEnabled ? "Pergunte ao assistente..." : "Digite sua mensagem..."}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    disabled={botTyping}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!msg.trim() || sendMutation.isPending || botTyping}
                    className="bg-primary text-primary-foreground rounded-lg p-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-3 border-t border-border text-center">
                  <p className="text-[10px] text-muted-foreground mb-2">Esta conversa foi encerrada.</p>
                  <button
                    onClick={() => { setActiveTicketId(null); qc.invalidateQueries({ queryKey: ["support-open-ticket"] }); }}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Iniciar nova conversa
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
