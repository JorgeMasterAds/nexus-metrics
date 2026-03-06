import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupportTickets, useTicketMessages, type SupportTicket } from "@/hooks/useSupportTickets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  aguardando_cliente: "Aguardando",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "new" | "chat">("list");
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { tickets, createTicket } = useSupportTickets();
  const { messages, sendMessage } = useTicketMessages(activeTicket?.id || null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreate = async () => {
    if (!subject.trim()) return;
    const ticket = await createTicket.mutateAsync({ subject, body: body || subject, category: "geral" });
    setSubject("");
    setBody("");
    setActiveTicket(ticket);
    setView("chat");
  };

  const handleSend = () => {
    if (!msg.trim() || !activeTicket) return;
    sendMessage.mutate({ content: msg, senderType: "user" });
    setMsg("");
  };

  const openTickets = tickets.filter(t => t.status !== "fechado");

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95",
          open && "rotate-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3">
            {view !== "list" && (
              <button onClick={() => { setView("list"); setActiveTicket(null); }} className="text-primary-foreground/80 hover:text-primary-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-primary-foreground">
                {view === "list" ? "Suporte Nexus" : view === "new" ? "Novo Ticket" : `#${activeTicket?.id.slice(0, 6)}`}
              </h3>
              {view === "list" && <p className="text-[10px] text-primary-foreground/70">Como podemos ajudar?</p>}
            </div>
            {view === "list" && (
              <button onClick={() => setView("new")} className="bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-lg p-1.5 text-primary-foreground transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* List View */}
          {view === "list" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {openTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhum ticket aberto</p>
                  <button onClick={() => setView("new")} className="mt-2 text-primary text-xs font-medium">Criar novo ticket</button>
                </div>
              ) : (
                openTickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTicket(t); setView("chat"); }}
                    className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate flex-1">{t.subject}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                        t.status === "novo" && "bg-info/20 text-info",
                        t.status === "em_atendimento" && "bg-warning/20 text-warning",
                        t.status === "resolvido" && "bg-success/20 text-success",
                        t.status === "aguardando_cliente" && "bg-muted text-muted-foreground",
                      )}>{statusLabels[t.status]}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(t.created_at), "dd MMM, HH:mm", { locale: ptBR })}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* New Ticket */}
          {view === "new" && (
            <div className="flex-1 p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Assunto</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Descreva brevemente..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Mensagem</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Detalhe sua dúvida ou problema..."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!subject.trim() || createTicket.isPending}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {createTicket.isPending ? "Enviando..." : "Enviar Ticket"}
              </button>
            </div>
          )}

          {/* Chat View */}
          {view === "chat" && activeTicket && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: 340 }}>
                {/* Initial message */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-secondary px-3 py-2 text-xs">
                    <p className="font-medium mb-1">{activeTicket.subject}</p>
                    <p className="text-muted-foreground">{activeTicket.body}</p>
                    <span className="text-[9px] text-muted-foreground/60 mt-1 block">{format(new Date(activeTicket.created_at), "HH:mm")}</span>
                  </div>
                </div>
                {messages.map(m => (
                  <div key={m.id} className={cn("flex", m.sender_type === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-xl px-3 py-2 text-xs",
                      m.sender_type === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-secondary text-foreground"
                    )}>
                      <p>{m.content}</p>
                      <span className={cn("text-[9px] mt-1 block", m.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                        {format(new Date(m.created_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {activeTicket.status !== "fechado" && activeTicket.status !== "resolvido" && (
                <div className="p-3 border-t border-border flex gap-2">
                  <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!msg.trim() || sendMessage.isPending}
                    className="bg-primary text-primary-foreground rounded-lg p-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
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
