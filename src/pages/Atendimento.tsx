import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupportTickets, useTicketMessages, type SupportTicket, type TicketStatus } from "@/hooks/useSupportTickets";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Headset, LayoutGrid, List, BarChart3, Send, Search, ChevronDown, User, Clock, Tag, AlertTriangle, CheckCircle2, MessageCircle, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/MetricCard";
import { useI18n } from "@/lib/i18n";

const kanbanColumns: TicketStatus[] = ["novo", "em_atendimento", "aguardando_cliente", "resolvido", "fechado"];

const priorityKeys: Record<string, string> = {
  baixa: "support_priority_low",
  normal: "support_priority_normal",
  alta: "support_priority_high",
  urgente: "support_priority_urgent",
};

const priorityColors: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  normal: "bg-info/20 text-info",
  alta: "bg-warning/20 text-warning",
  urgente: "bg-destructive/20 text-destructive",
};

function useStatusConfig() {
  const { t } = useI18n();
  return {
    novo: { label: t("support_status_new"), color: "text-info", bgClass: "bg-info/15 border-info/30" },
    em_atendimento: { label: t("support_status_in_progress"), color: "text-warning", bgClass: "bg-warning/15 border-warning/30" },
    aguardando_cliente: { label: t("support_status_waiting"), color: "text-muted-foreground", bgClass: "bg-muted/30 border-border" },
    resolvido: { label: t("support_status_resolved"), color: "text-success", bgClass: "bg-success/15 border-success/30" },
    fechado: { label: t("support_status_closed"), color: "text-muted-foreground", bgClass: "bg-muted/20 border-border/50" },
  } as Record<TicketStatus, { label: string; color: string; bgClass: string }>;
}

export default function Atendimento() {
  const { tickets, isLoading, updateTicket } = useSupportTickets(true);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("kanban");
  const { t } = useI18n();
  const statusConfig = useStatusConfig();

  // User emails + names lookup
  const userIds = [...new Set(tickets.map(t => t.user_id))];
  const { data: userEmails } = useQuery({
    queryKey: ["support-user-emails", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("get_user_emails_by_ids", { _user_ids: userIds });
      return (data || []) as { user_id: string; email: string }[];
    },
  });
  const { data: userProfiles } = useQuery({
    queryKey: ["support-user-profiles", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      return (data || []) as { id: string; full_name: string | null }[];
    },
  });
  const emailMap = Object.fromEntries((userEmails || []).map(u => [u.user_id, u.email]));
  const nameMap = Object.fromEntries((userProfiles || []).filter(p => p.full_name).map(p => [p.id, p.full_name!]));

  const filtered = tickets.filter(tk =>
    !search || tk.subject.toLowerCase().includes(search.toLowerCase()) || emailMap[tk.user_id]?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalOpen = tickets.filter(tk => !["resolvido", "fechado"].includes(tk.status)).length;
  const totalNew = tickets.filter(tk => tk.status === "novo").length;
  const totalResolved = tickets.filter(tk => tk.status === "resolvido").length;
  const avgResponseHours = tickets.length > 0 ? "~2h" : "—";

  const handleDrop = (ticketId: string, newStatus: TicketStatus) => {
    updateTicket.mutate({ id: ticketId, status: newStatus, ...(newStatus === "fechado" ? { closed_at: new Date().toISOString() } : {}) });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Headset className="h-5 w-5 text-primary" /> {t("support_title")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("support_subtitle")}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t("support_open")} value={String(totalOpen)} icon={AlertTriangle} change={t("support_active_tickets")} changeType="neutral" />
        <MetricCard label={t("support_new")} value={String(totalNew)} icon={MessageCircle} change={t("support_awaiting")} changeType="negative" />
        <MetricCard label={t("support_resolved")} value={String(totalResolved)} icon={CheckCircle2} change={t("support_total_history")} changeType="positive" />
        <MetricCard label={t("support_avg_time")} value={avgResponseHours} icon={Clock} change={t("support_first_response")} changeType="neutral" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("support_search")}
          className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="kanban" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> {t("support_kanban")}</TabsTrigger>
          <TabsTrigger value="lista" className="gap-1.5"><List className="h-3.5 w-3.5" /> {t("support_list")}</TabsTrigger>
          <TabsTrigger value="relatorio" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> {t("support_report")}</TabsTrigger>
        </TabsList>

        {/* KANBAN */}
        <TabsContent value="kanban" className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {kanbanColumns.map(status => {
              const col = statusConfig[status];
              const colTickets = filtered.filter(tk => tk.status === status);
              return (
                <div
                  key={status}
                  className="min-w-[260px] flex-shrink-0 rounded-xl border border-border/50 bg-card/50 flex flex-col"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const id = e.dataTransfer.getData("ticketId");
                    if (id) handleDrop(id, status);
                  }}
                >
                  <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between">
                    <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{colTickets.length}</Badge>
                  </div>
                  <div className="p-2 space-y-2 flex-1 min-h-[120px]">
                    {colTickets.map(tk => (
                      <div
                        key={tk.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData("ticketId", tk.id)}
                        onClick={() => setActiveTicket(tk)}
                        className={cn(
                          "rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all",
                          col.bgClass
                        )}
                      >
                        <p className="text-xs font-medium truncate">{tk.subject}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{nameMap[tk.user_id] || emailMap[tk.user_id] || "..."}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", priorityColors[tk.priority])}>{t(priorityKeys[tk.priority] || tk.priority)}</span>
                          <span className="text-[9px] text-muted-foreground">{format(new Date(tk.created_at), "dd/MM HH:mm")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* LISTA */}
        <TabsContent value="lista" className="mt-4">
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">{t("support_ticket")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("support_user")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("status")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("support_priority")}</th>
                  <th className="text-left px-4 py-2.5 font-medium">{t("support_date")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tk => (
                  <tr
                    key={tk.id}
                    onClick={() => setActiveTicket(tk)}
                    className="border-b border-border/10 hover:bg-accent/20 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{tk.subject}</p>
                      <p className="text-muted-foreground mt-0.5 truncate max-w-[200px]">{tk.body}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{nameMap[tk.user_id] || emailMap[tk.user_id] || tk.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3"><span className={cn("text-[10px] font-medium", statusConfig[tk.status]?.color)}>{statusConfig[tk.status]?.label}</span></td>
                    <td className="px-4 py-3"><span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", priorityColors[tk.priority])}>{t(priorityKeys[tk.priority] || tk.priority)}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(tk.created_at), "dd/MM/yyyy HH:mm")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("support_no_tickets")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* RELATÓRIO */}
        <TabsContent value="relatorio" className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kanbanColumns.map(status => {
              const count = tickets.filter(tk => tk.status === status).length;
              const pct = tickets.length > 0 ? ((count / tickets.length) * 100).toFixed(0) : "0";
              return (
                <div key={status} className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-sm font-medium", statusConfig[status].color)}>{statusConfig[status].label}</span>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{pct}% {t("support_of_total")}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">{t("support_by_category")}</h3>
            <div className="space-y-2">
              {[...new Set(tickets.map(tk => tk.category))].map(cat => {
                const count = tickets.filter(tk => tk.category === cat).length;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{cat}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Drawer */}
      {activeTicket && (
        <TicketDetailDrawer
          ticket={activeTicket}
          userName={nameMap[activeTicket.user_id] || null}
          email={emailMap[activeTicket.user_id] || activeTicket.user_id.slice(0, 8)}
          onClose={() => setActiveTicket(null)}
          onUpdateStatus={(status) => {
            updateTicket.mutate({ id: activeTicket.id, status, ...(status === "fechado" ? { closed_at: new Date().toISOString() } : {}) });
            setActiveTicket({ ...activeTicket, status });
          }}
        />
      )}
    </div>
  );
}

function TicketDetailDrawer({ ticket, userName, email, onClose, onUpdateStatus }: { ticket: SupportTicket; userName: string | null; email: string; onClose: () => void; onUpdateStatus: (s: TicketStatus) => void }) {
  const { messages, sendMessage } = useTicketMessages(ticket.id);
  const [msg, setMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const statusConfig = useStatusConfig();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!msg.trim()) return;
    sendMessage.mutate({ content: msg, senderType: "admin" });
    setMsg("");
    if (ticket.status === "novo") onUpdateStatus("em_atendimento");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{ticket.subject}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{email} · {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {/* Status controls */}
        <div className="px-5 py-2.5 border-b border-border/50 flex items-center gap-2 flex-wrap">
          {kanbanColumns.map(s => (
            <button
              key={s}
              onClick={() => onUpdateStatus(s)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full border transition-colors font-medium",
                ticket.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-secondary px-3 py-2 text-xs">
              <p className="font-medium text-foreground mb-1">{ticket.subject}</p>
              <p className="text-muted-foreground">{ticket.body}</p>
              <span className="text-[9px] text-muted-foreground/60 mt-1 block">{format(new Date(ticket.created_at), "HH:mm")}</span>
            </div>
          </div>
          {messages.map(m => (
            <div key={m.id} className={cn("flex", m.sender_type === "admin" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                m.sender_type === "admin"
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-secondary text-foreground"
              )}>
                <p>{m.content}</p>
                <span className={cn("text-[9px] mt-1 block", m.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                  {format(new Date(m.created_at), "HH:mm")}
                </span>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        {ticket.status !== "fechado" && (
          <div className="p-4 border-t border-border flex gap-2">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={t("support_reply")}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={handleSend} disabled={!msg.trim()} className="bg-primary text-primary-foreground rounded-lg p-2.5 disabled:opacity-50 hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
