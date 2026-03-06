import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X, Users, AlertTriangle, AlertCircle, TrendingUp, CreditCard, Shield, Gauge } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAccount } from "@/hooks/useAccount";
import { useUsageLimits } from "@/hooks/useSubscription";

interface PendingInvite {
  id: string;
  project_id: string;
  role: string;
  invited_at: string;
  project_name: string;
}

interface WebhookAlert {
  id: string;
  status: string;
  event_type: string | null;
  transaction_id: string | null;
  ignore_reason: string | null;
  created_at: string;
  platform: string | null;
}

interface SystemNotification {
  id: string;
  type: "limit-warning" | "limit-critical" | "subscription-expired" | "subscription-warning" | "error";
  title: string;
  description: string;
  icon: "gauge" | "alert" | "credit-card" | "shield";
  severity: "warning" | "error" | "info";
  link?: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("nexus_dismissed_alerts_v2");
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [seenAlerts, setSeenAlerts] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("nexus_seen_alerts_v2");
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const qc = useQueryClient();
  const { activeAccountId } = useAccount();
  const { maxProjects, maxSmartlinks, maxWebhooks, maxAgents, maxLeads, maxSurveys } = useUsageLimits();

  // Invites
  const { data: invites = [] } = useQuery({
    queryKey: ["pending-invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("project_users")
        .select("id, project_id, role, invited_at")
        .eq("user_id", user.id)
        .is("accepted_at", null)
        .not("invited_at", "is", null);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const projectIds = data.map((d: any) => d.project_id);
      const { data: projects } = await (supabase as any).from("projects").select("id, name").in("id", projectIds);
      const projectMap = new Map((projects || []).map((p: any) => [p.id, p.name]));
      return data.map((inv: any) => ({ ...inv, project_name: projectMap.get(inv.project_id) || "Projeto" })) as PendingInvite[];
    },
    refetchInterval: 120_000,
  });

  // Webhook alerts
  const { data: webhookAlerts = [] } = useQuery({
    queryKey: ["webhook-alerts", activeAccountId],
    queryFn: async () => {
      if (!activeAccountId) return [];
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from("webhook_logs")
        .select("id, status, event_type, transaction_id, ignore_reason, created_at, platform")
        .eq("account_id", activeAccountId)
        .in("status", ["error", "duplicate"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as WebhookAlert[];
    },
    enabled: !!activeAccountId,
    refetchInterval: 300_000,
  });

  // Usage counts for limit warnings
  const { data: usageCounts } = useQuery({
    queryKey: ["notification-usage-counts", activeAccountId],
    queryFn: async () => {
      const [projects, smartlinks, webhooks, agents, leads, surveys] = await Promise.all([
        (supabase as any).from("projects").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId).eq("is_active", true),
        (supabase as any).from("smartlinks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
        (supabase as any).from("webhooks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId).neq("platform", "form"),
        (supabase as any).from("ai_agents").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
        (supabase as any).from("leads").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
        (supabase as any).from("surveys").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
      ]);
      return {
        projects: projects.count ?? 0,
        smartlinks: smartlinks.count ?? 0,
        webhooks: webhooks.count ?? 0,
        agents: agents.count ?? 0,
        leads: leads.count ?? 0,
        surveys: surveys.count ?? 0,
      };
    },
    enabled: !!activeAccountId,
    refetchInterval: 120_000,
  });

  // Subscription status
  const { data: subscription } = useQuery({
    queryKey: ["notification-subscription", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("subscriptions")
        .select("plan_type, status, current_period_end")
        .eq("account_id", activeAccountId)
        .maybeSingle();
      return data;
    },
    enabled: !!activeAccountId,
    refetchInterval: 300_000,
  });

  // Build system notifications
  const systemNotifications = useMemo(() => {
    const notifications: SystemNotification[] = [];

    // Limit warnings (>80% and 100%)
    if (usageCounts) {
      const resources = [
        { label: "Projetos", current: usageCounts.projects, max: maxProjects },
        { label: "Smart Links", current: usageCounts.smartlinks, max: maxSmartlinks },
        { label: "Webhooks", current: usageCounts.webhooks, max: maxWebhooks },
        { label: "Leads", current: usageCounts.leads, max: maxLeads },
        { label: "Pesquisas", current: usageCounts.surveys, max: maxSurveys },
      ];
      if (maxAgents > 0) resources.push({ label: "Agentes IA", current: usageCounts.agents, max: maxAgents });

      resources.forEach((r) => {
        if (r.max <= 0) return;
        const pct = r.current / r.max;
        if (pct >= 1) {
          notifications.push({
            id: `limit-critical-${r.label}`,
            type: "limit-critical",
            title: `${r.label}: limite atingido`,
            description: `Você está usando ${r.current.toLocaleString("pt-BR")}/${r.max.toLocaleString("pt-BR")}. Faça upgrade para continuar.`,
            icon: "gauge",
            severity: "error",
            link: "/settings",
          });
        } else if (pct >= 0.8) {
          notifications.push({
            id: `limit-warning-${r.label}`,
            type: "limit-warning",
            title: `${r.label}: quase no limite`,
            description: `Você está usando ${r.current.toLocaleString("pt-BR")}/${r.max.toLocaleString("pt-BR")} (${Math.round(pct * 100)}%).`,
            icon: "gauge",
            severity: "warning",
            link: "/settings",
          });
        }
      });
    }

    // Subscription alerts
    if (subscription) {
      if (subscription.status === "cancelled" || subscription.status === "canceled") {
        notifications.push({
          id: "sub-cancelled",
          type: "subscription-expired",
          title: "Plano cancelado",
          description: "Seu plano foi cancelado. Renove para manter o acesso completo.",
          icon: "credit-card",
          severity: "error",
          link: "/settings",
        });
      } else if (subscription.status === "past_due" || subscription.status === "overdue") {
        notifications.push({
          id: "sub-overdue",
          type: "subscription-warning",
          title: "Pagamento pendente",
          description: "Seu plano está com pagamento atrasado. Regularize para evitar suspensão.",
          icon: "credit-card",
          severity: "error",
          link: "/settings",
        });
      } else if (subscription.current_period_end) {
        const daysUntilExpiry = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 3 && daysUntilExpiry > 0 && subscription.plan_type !== "free") {
          notifications.push({
            id: "sub-expiring",
            type: "subscription-warning",
            title: "Plano expira em breve",
            description: `Seu plano expira em ${daysUntilExpiry} dia${daysUntilExpiry > 1 ? "s" : ""}. Renove para não perder acesso.`,
            icon: "credit-card",
            severity: "warning",
            link: "/settings",
          });
        } else if (daysUntilExpiry <= 0 && subscription.plan_type !== "free") {
          notifications.push({
            id: "sub-expired",
            type: "subscription-expired",
            title: "Plano expirado",
            description: "Seu plano expirou. Renove agora para recuperar o acesso completo.",
            icon: "credit-card",
            severity: "error",
            link: "/settings",
          });
        }
      }
    }

    return notifications;
  }, [usageCounts, subscription, maxProjects, maxSmartlinks, maxWebhooks, maxAgents, maxLeads, maxSurveys]);

  const visibleWebhookAlerts = webhookAlerts.filter((a) => !dismissedAlerts.has(a.id));
  const visibleSystemNotifs = systemNotifications.filter((n) => !dismissedAlerts.has(n.id));

  const allNotifIds = [
    ...visibleWebhookAlerts.map((a) => a.id),
    ...visibleSystemNotifs.map((n) => n.id),
  ];
  const unseenCount = invites.length +
    allNotifIds.filter((id) => !seenAlerts.has(id)).length;

  const totalCount = invites.length + visibleWebhookAlerts.length + visibleSystemNotifs.length;

  const markAllSeen = () => {
    setSeenAlerts((prev) => {
      const next = new Set(prev);
      allNotifIds.forEach((id) => next.add(id));
      localStorage.setItem("nexus_seen_alerts_v2", JSON.stringify([...next]));
      return next;
    });
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("nexus_dismissed_alerts_v2", JSON.stringify([...next]));
      return next;
    });
  };

  const dismissAllAlerts = () => {
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      visibleWebhookAlerts.forEach((a) => next.add(a.id));
      visibleSystemNotifs.forEach((n) => next.add(n.id));
      localStorage.setItem("nexus_dismissed_alerts_v2", JSON.stringify([...next]));
      return next;
    });
  };

  const acceptInvite = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    try {
      const { error } = await (supabase as any).from("project_users").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
      if (error) throw error;
      toast({ title: "Convite aceito!", description: `Você agora faz parte de "${invite.project_name}"` });
      qc.invalidateQueries({ queryKey: ["pending-invites"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project-members"] });
    } catch (err: any) {
      toast({ title: "Erro ao aceitar convite", description: err.message, variant: "destructive" });
    } finally { setProcessingId(null); }
  };

  const rejectInvite = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    try {
      const { error } = await (supabase as any).from("project_users").delete().eq("id", invite.id);
      if (error) throw error;
      toast({ title: "Convite recusado" });
      qc.invalidateQueries({ queryKey: ["pending-invites"] });
    } catch (err: any) {
      toast({ title: "Erro ao recusar convite", description: err.message, variant: "destructive" });
    } finally { setProcessingId(null); }
  };

  const navigate = useNavigate();

  const getNotifIcon = (n: SystemNotification) => {
    switch (n.icon) {
      case "gauge": return <Gauge className="h-4 w-4" />;
      case "credit-card": return <CreditCard className="h-4 w-4" />;
      case "shield": return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "error": return { bg: "bg-destructive/10", text: "text-destructive" };
      case "warning": return { bg: "bg-yellow-500/10", text: "text-yellow-500" };
      default: return { bg: "bg-primary/10", text: "text-primary" };
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) markAllSeen(); }}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)] transition-all border border-transparent hover:border-primary/30">
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] gradient-bg border-0 text-primary-foreground">
              {unseenCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {(visibleWebhookAlerts.length + visibleSystemNotifs.length) > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={dismissAllAlerts}>
              Limpar tudo
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {totalCount === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <>
              {/* System notifications (limits, subscription) */}
              {visibleSystemNotifs.map((notif) => {
                const styles = getSeverityStyles(notif.severity);
                return (
                  <div
                    key={notif.id}
                    className="px-4 py-3 border-b border-border last:border-0 space-y-1 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => { setOpen(false); if (notif.link) navigate(notif.link); }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", styles.bg)}>
                        <span className={styles.text}>{getNotifIcon(notif)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={(e) => { e.stopPropagation(); dismissAlert(notif.id); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Webhook alerts */}
              {visibleWebhookAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="px-4 py-3 border-b border-border last:border-0 space-y-1 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => { setOpen(false); navigate("/webhook-logs"); }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      alert.status === "error" ? "bg-destructive/10" : "bg-yellow-500/10"
                    )}>
                      {alert.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {alert.status === "error" ? "Erro no webhook" : "Webhook duplicado"}
                        {alert.platform && <span className="text-muted-foreground"> · {alert.platform}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {alert.ignore_reason || alert.event_type || "—"}
                        {alert.transaction_id && <> · <span className="font-mono">{alert.transaction_id.slice(0, 12)}…</span></>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Invites */}
              {invites.map((invite) => (
                <div key={invite.id} className="px-4 py-3 border-b border-border last:border-0 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        Você foi convidado para o projeto{" "}
                        <span className="font-semibold">{invite.project_name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Papel: <span className="capitalize">{invite.role}</span>
                        {invite.invited_at && <> · {new Date(invite.invited_at).toLocaleDateString("pt-BR")}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-11">
                    <Button size="sm" className="h-7 text-xs gradient-bg border-0 text-primary-foreground hover:opacity-90 flex-1" disabled={processingId === invite.id} onClick={() => acceptInvite(invite)}>
                      <Check className="h-3 w-3 mr-1" />Aceitar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" disabled={processingId === invite.id} onClick={() => rejectInvite(invite)}>
                      <X className="h-3 w-3 mr-1" />Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
