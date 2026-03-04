import { useState } from "react";
import { Bell, Check, X, Users, AlertTriangle, AlertCircle } from "lucide-react";
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("nexus_dismissed_wh_alerts");
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const qc = useQueryClient();
  const { activeAccountId } = useAccount();

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
      const { data: projects } = await (supabase as any)
        .from("projects")
        .select("id, name")
        .in("id", projectIds);

      const projectMap = new Map((projects || []).map((p: any) => [p.id, p.name]));

      return data.map((inv: any) => ({
        ...inv,
        project_name: projectMap.get(inv.project_id) || "Projeto",
      })) as PendingInvite[];
    },
    refetchInterval: 30000,
  });

  // Fetch recent webhook errors/problems (last 24h)
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
    refetchInterval: 60000,
  });

  const visibleAlerts = webhookAlerts.filter((a) => !dismissedAlerts.has(a.id));

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("nexus_dismissed_wh_alerts", JSON.stringify([...next]));
      return next;
    });
  };

  const dismissAllAlerts = () => {
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      visibleAlerts.forEach((a) => next.add(a.id));
      localStorage.setItem("nexus_dismissed_wh_alerts", JSON.stringify([...next]));
      return next;
    });
  };

  const acceptInvite = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    try {
      const { error } = await (supabase as any)
        .from("project_users")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);
      if (error) throw error;
      toast({ title: "Convite aceito!", description: `Você agora faz parte de "${invite.project_name}"` });
      qc.invalidateQueries({ queryKey: ["pending-invites"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project-members"] });
    } catch (err: any) {
      toast({ title: "Erro ao aceitar convite", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const rejectInvite = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    try {
      const { error } = await (supabase as any)
        .from("project_users")
        .delete()
        .eq("id", invite.id);
      if (error) throw error;
      toast({ title: "Convite recusado" });
      qc.invalidateQueries({ queryKey: ["pending-invites"] });
    } catch (err: any) {
      toast({ title: "Erro ao recusar convite", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const count = invites.length + visibleAlerts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] gradient-bg border-0 text-primary-foreground">
              {count}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {visibleAlerts.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={dismissAllAlerts}>
              Limpar alertas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <>
              {/* Webhook alerts */}
              {visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="px-4 py-3 border-b border-border last:border-0 space-y-1"
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
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Invites */}
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="px-4 py-3 border-b border-border last:border-0 space-y-2"
                >
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
                        {invite.invited_at && (
                          <> · {new Date(invite.invited_at).toLocaleDateString("pt-BR")}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-11">
                    <Button
                      size="sm"
                      className="h-7 text-xs gradient-bg border-0 text-primary-foreground hover:opacity-90 flex-1"
                      disabled={processingId === invite.id}
                      onClick={() => acceptInvite(invite)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      disabled={processingId === invite.id}
                      onClick={() => rejectInvite(invite)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Recusar
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
