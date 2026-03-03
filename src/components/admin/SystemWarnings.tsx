import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, CheckCircle2, RefreshCw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  critical: { icon: ShieldAlert, color: "text-red-500", label: "Crítico" },
  error: { icon: AlertCircle, color: "text-red-400", label: "Erro" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", label: "Aviso" },
  info: { icon: Info, color: "text-blue-400", label: "Info" },
};

export default function SystemWarnings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<any>(null);

  const { data: warnings = [], isLoading, refetch } = useQuery({
    queryKey: ["system-warnings", showResolved],
    queryFn: async () => {
      let query = (supabase as any)
        .from("system_warnings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!showResolved) {
        query = query.eq("is_resolved", false);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const resolveWarning = async (id: string) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("system_warnings")
      .update({ is_resolved: true, resolved_by: user.user?.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aviso resolvido" });
    qc.invalidateQueries({ queryKey: ["system-warnings"] });
  };

  const unresolvedCount = warnings.filter((w: any) => !w.is_resolved).length;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Alertas do Sistema
          </h2>
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {unresolvedCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? "Ocultar resolvidos" : "Mostrar resolvidos"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : warnings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500/60" />
          Nenhum alerta pendente. Tudo funcionando normalmente!
        </div>
      ) : (
        <div className="space-y-2">
          {warnings.map((w: any) => {
            const config = SEVERITY_CONFIG[w.severity] || SEVERITY_CONFIG.warning;
            const Icon = config.icon;
            return (
              <div
                key={w.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  w.is_resolved
                    ? "bg-muted/30 border-border/30 opacity-60"
                    : "bg-card border-border/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{w.title}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{config.label}</Badge>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">{w.source}</Badge>
                    </div>
                    {w.message && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{w.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(w.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Ver detalhes"
                      onClick={() => setSelectedWarning(w)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {!w.is_resolved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-green-500 hover:text-green-600"
                        title="Marcar como resolvido"
                        onClick={() => resolveWarning(w.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedWarning} onOpenChange={() => setSelectedWarning(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              {selectedWarning && (() => {
                const config = SEVERITY_CONFIG[selectedWarning.severity] || SEVERITY_CONFIG.warning;
                const Icon = config.icon;
                return <Icon className={cn("h-4 w-4", config.color)} />;
              })()}
              {selectedWarning?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedWarning?.created_at && new Date(selectedWarning.created_at).toLocaleString("pt-BR")}
              {" · "}Fonte: {selectedWarning?.source}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            {selectedWarning?.message && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">Mensagem</p>
                <p className="text-foreground">{selectedWarning.message}</p>
              </div>
            )}
            {selectedWarning?.metadata && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">Metadados</p>
                <pre className="bg-secondary/50 rounded-lg p-3 overflow-auto max-h-60 text-[11px]">
                  {JSON.stringify(selectedWarning.metadata, null, 2)}
                </pre>
              </div>
            )}
            {selectedWarning?.is_resolved && (
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Resolvido em {new Date(selectedWarning.resolved_at).toLocaleString("pt-BR")}
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
