import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle, X, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const severityLabels: Record<string, string> = {
  info: "Informação",
  warning: "Aviso",
  error: "Erro",
  critical: "Crítico",
};

const severityColors: Record<string, string> = {
  info: "bg-info/20 text-info",
  warning: "bg-warning/20 text-warning",
  error: "bg-destructive/20 text-destructive",
  critical: "bg-destructive/30 text-destructive",
};

export default function GlobalAlertsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("warning");
  const [durationHours, setDurationHours] = useState<string>("24");
  const [publishing, setPublishing] = useState(false);

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ["admin-global-alerts"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("global_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const publish = async () => {
    if (!title.trim() || !message.trim()) return;
    setPublishing(true);
    try {
      const hours = parseInt(durationHours) || 0;
      const expires_at = hours > 0 ? new Date(Date.now() + hours * 3600000).toISOString() : null;
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("global_alerts").insert({
        title: title.trim(),
        message: message.trim(),
        severity,
        expires_at,
        created_by: user.user?.id,
      });
      if (error) throw error;
      toast({ title: "Alerta publicado!" });
      setTitle("");
      setMessage("");
      setSeverity("warning");
      setDurationHours("24");
      refetch();
      qc.invalidateQueries({ queryKey: ["global-alerts-active"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await (supabase as any).from("global_alerts").update({ is_active: !current }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: current ? "Alerta desativado" : "Alerta reativado" });
    refetch();
    qc.invalidateQueries({ queryKey: ["global-alerts-active"] });
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Excluir este alerta?")) return;
    const { error } = await (supabase as any).from("global_alerts").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Alerta excluído" });
    refetch();
    qc.invalidateQueries({ queryKey: ["global-alerts-active"] });
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 space-y-5">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        Alertas Globais
      </h2>
      <p className="text-xs text-muted-foreground -mt-3">
        Crie alertas visíveis no topo da página para todos os usuários.
      </p>

      {/* Form */}
      <div className="space-y-3 border border-border/30 rounded-lg p-4 bg-secondary/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Manutenção programada" className="text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Severidade</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Informação</SelectItem>
                  <SelectItem value="warning">⚠️ Aviso</SelectItem>
                  <SelectItem value="error">❌ Erro</SelectItem>
                  <SelectItem value="critical">🚨 Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duração (horas)</Label>
              <Input type="number" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} placeholder="0 = sem expiração" className="text-xs" min={0} />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mensagem</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva o alerta para os usuários..." className="text-xs min-h-[60px]" />
        </div>
        <Button size="sm" className="gradient-bg border-0 text-primary-foreground text-xs" onClick={publish} disabled={publishing || !title.trim() || !message.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {publishing ? "Publicando..." : "Publicar alerta"}
        </Button>
      </div>

      {/* List */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Alertas recentes</h3>
          {alerts.map((a: any) => {
            const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{a.title}</span>
                    <Badge className={`text-[10px] ${severityColors[a.severity] || ""}`}>{severityLabels[a.severity]}</Badge>
                    {!a.is_active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                    {isExpired && <Badge variant="outline" className="text-[10px] text-muted-foreground">Expirado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{a.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                    {a.expires_at && ` · Expira: ${new Date(a.expires_at).toLocaleString("pt-BR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleActive(a.id, a.is_active)} title={a.is_active ? "Desativar" : "Ativar"}>
                    <Power className={`h-3.5 w-3.5 ${a.is_active ? "text-success" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAlert(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
