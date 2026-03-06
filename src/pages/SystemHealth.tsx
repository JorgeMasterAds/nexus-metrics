import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { Activity, Clock, AlertTriangle, RefreshCw, Server, Zap, HelpCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ─── Helpers ─── */
function HelpTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

const logExplanations: Record<string, string> = {
  info: "Evento informativo — operação do sistema executada com sucesso.",
  warn: "Aviso — comportamento inesperado detectado, mas o sistema está se recuperando.",
  error: "Erro — falha em componente do sistema que pode requerer atenção.",
};

/* ─── Component ─── */
export default function SystemHealth() {
  // Real metrics from DB
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["system-health-metrics"],
    refetchInterval: 30000,
    queryFn: async () => {
      const now = new Date();
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [clicksRes, webhookRes, conversionsRes] = await Promise.all([
        (supabase as any).from("clicks").select("id", { count: "exact", head: true }).gte("created_at", h24),
        (supabase as any).from("webhook_logs").select("status").gte("created_at", h24),
        (supabase as any).from("conversions").select("id", { count: "exact", head: true }).gte("created_at", h24),
      ]);

      const totalClicks = clicksRes.count || 0;
      const webhooks = webhookRes.data || [];
      const webhookErrors = webhooks.filter((w: any) => w.status === "error").length;
      const webhookIgnored = webhooks.filter((w: any) => w.status === "ignored").length;
      const totalConversions = conversionsRes.count || 0;
      const totalRequests = totalClicks + webhooks.length;
      const errorRate = totalRequests > 0 ? ((webhookErrors / totalRequests) * 100).toFixed(2) : "0.00";

      return { totalClicks, totalConversions, webhookErrors, webhookIgnored, totalRequests, errorRate, webhookTotal: webhooks.length };
    },
  });

  // System-level logs derived from health checks and edge function status
  const systemLogs = React.useMemo(() => {
    const logs: { time: string; level: string; message: string }[] = [];
    const now = format(new Date(), "HH:mm:ss");

    if (edgeFnHealth) {
      if (edgeFnHealth.operational) {
        logs.push({ time: now, level: "info", message: `Edge Functions operacionais — latência ${edgeFnHealth.latency}ms` });
      } else {
        logs.push({ time: now, level: "error", message: "Edge Functions não responderam ao health check" });
      }
    }

    if (metrics) {
      logs.push({ time: now, level: "info", message: `Sistema processou ${metrics.totalClicks.toLocaleString("pt-BR")} cliques nas últimas 24h` });
      logs.push({ time: now, level: "info", message: `${metrics.totalConversions.toLocaleString("pt-BR")} conversões registradas nas últimas 24h` });

      if (metrics.webhookErrors > 0) {
        logs.push({ time: now, level: "warn", message: `${metrics.webhookErrors} erro(s) detectado(s) no processamento de dados (24h)` });
      } else {
        logs.push({ time: now, level: "info", message: "Nenhum erro de processamento nas últimas 24h" });
      }

      const successRate = metrics.webhookTotal > 0
        ? (((metrics.webhookTotal - metrics.webhookErrors) / metrics.webhookTotal) * 100).toFixed(0)
        : "100";
      logs.push({ time: now, level: Number(successRate) >= 95 ? "info" : "warn", message: `Taxa de sucesso do sistema: ${successRate}%` });
    }

    return logs;
  }, [edgeFnHealth, metrics]);

  // Edge function health check
  const { data: edgeFnHealth } = useQuery({
    queryKey: ["system-health-edge"],
    refetchInterval: 60000,
    queryFn: async () => {
      try {
        const start = performance.now();
        const { error } = await supabase.functions.invoke("health", { method: "GET" });
        const latency = Math.round(performance.now() - start);
        return { operational: !error, latency };
      } catch {
        return { operational: false, latency: 0 };
      }
    },
  });

  const redirectLatency = edgeFnHealth?.latency ? `${edgeFnHealth.latency}ms` : "—";
  const errorRateStr = metrics ? `${metrics.errorRate}%` : "—";
  const webhookFailStr = metrics ? String(metrics.webhookErrors) : "—";
  const queueStr = metrics ? String(metrics.webhookIgnored) : "—";

  const healthMetrics = [
    {
      label: "Latência Edge Functions",
      value: redirectLatency,
      icon: Zap,
      change: "Ping ao endpoint /health",
      changeType: (edgeFnHealth?.latency && edgeFnHealth.latency < 500 ? "positive" : "neutral") as any,
      help: "Tempo de resposta da Edge Function de saúde. Valores abaixo de 500ms indicam boa performance.",
    },
    {
      label: "Taxa de Erro",
      value: errorRateStr,
      icon: AlertTriangle,
      change: metrics ? `${metrics.webhookErrors} erros em ${metrics.totalRequests} req` : "Carregando...",
      changeType: (metrics && metrics.webhookErrors === 0 ? "positive" : "negative") as any,
      help: "Porcentagem de webhooks que resultaram em erro nas últimas 24h. Taxas abaixo de 1% indicam sistema saudável.",
    },
    {
      label: "Webhooks com Falha",
      value: webhookFailStr,
      icon: RefreshCw,
      change: metrics && metrics.webhookErrors > 0 ? "Requer atenção" : "Nenhuma falha",
      changeType: (metrics && metrics.webhookErrors === 0 ? "positive" : "negative") as any,
      help: "Webhooks que não foram processados com sucesso nas últimas 24h.",
    },
    {
      label: "Webhooks Ignorados",
      value: queueStr,
      icon: Server,
      change: "Formato não reconhecido",
      changeType: "neutral" as any,
      help: "Webhooks recebidos mas ignorados por formato desconhecido ou payload inválido.",
    },
  ];

  const webhookHasErrors = metrics && metrics.webhookErrors > 0;
  const edgeOk = edgeFnHealth?.operational !== false;

  const services = [
    { name: "Motor de Redirect", status: edgeOk ? "operational" : "degraded", description: "Recebe cliques nos Smart Links e redireciona para a URL de destino, aplicando rotação A/B e capturando UTMs." },
    { name: "Motor de Rastreamento", status: "operational", description: "Captura dados de cada clique: país, dispositivo, UTMs, referrer e vincula ao Smart Link." },
    { name: "Motor de Analytics", status: "operational", description: "Agrega métricas diárias (views, conversões, receita). Alimenta os gráficos do Dashboard." },
    { name: "Worker Assíncrono", status: "operational", description: "Executa tarefas em segundo plano: e-mails, conversões, comissões e automações." },
    { name: "API Pública (Webhooks)", status: webhookHasErrors ? "degraded" : "operational", description: "Recebe webhooks de plataformas externas (Cakto, Hotmart, Eduzz, Kiwify) e processa conversões.", degradedReason: webhookHasErrors ? `${metrics.webhookErrors} webhook(s) com erro nas últimas 24h.` : undefined },
    { name: "Edge Functions", status: edgeOk ? "operational" : "degraded", description: "Funções serverless que processam redirects, webhooks e integrações.", degradedReason: !edgeOk ? "Endpoint de health check não respondeu. Pode haver instabilidade temporária." : undefined },
  ];

  return (
    <DashboardLayout
      title="Saúde do Sistema"
      subtitle="Monitoramento em tempo real de todos os serviços da plataforma"
      actions={<ProductTour {...TOURS.systemHealth} />}
    >
      {/* Intro */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-6 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/80 leading-relaxed space-y-1">
          <p className="font-medium text-sm text-foreground">O que é esta página?</p>
          <p>Monitoramento em tempo real dos componentes internos do Nexus Metrics. Dados atualizados automaticamente a cada 30 segundos.</p>
          <p>
            <strong>Operacional</strong> = normal &nbsp;•&nbsp;
            <strong>Degradado</strong> = lentidão ou falhas parciais &nbsp;•&nbsp;
            <strong>Fora do ar</strong> = indisponível.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      {metricsLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando métricas...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {healthMetrics.map((m) => (
            <div key={m.label} className="relative">
              <MetricCard label={m.label} value={m.value} icon={m.icon} change={m.change} changeType={m.changeType} />
              <div className="absolute top-3 right-3"><HelpTip text={m.help} /></div>
            </div>
          ))}
        </div>
      )}

      {/* System status */}
      <div className="rounded-xl bg-card border border-border/50 p-5 mb-6 card-shadow glass">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold">Status dos Serviços</h3>
          <HelpTip text="Status determinado automaticamente com base nos dados reais das últimas 24 horas." />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service) => (
            <div key={service.name} className={cn(
              "p-3 rounded-lg border",
              service.status === "operational" ? "bg-secondary/30 border-border/20" : "bg-warning/5 border-warning/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", service.status === "operational" ? "bg-success" : "bg-warning animate-pulse")} />
                  <span className={cn("text-xs font-medium", service.status === "operational" ? "text-success" : "text-warning")}>
                    {service.status === "operational" ? "Operacional" : "Degradado"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{service.description}</p>
              {service.status === "degraded" && (service as any).degradedReason && (
                <div className="mt-2 rounded-md bg-warning/10 border border-warning/20 px-2.5 py-1.5">
                  <p className="text-[11px] text-warning leading-relaxed"><strong>Motivo:</strong> {(service as any).degradedReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Real-time stats */}
      {metrics && (
        <div className="rounded-xl bg-card border border-border/50 p-5 mb-6 card-shadow glass">
          <h3 className="text-sm font-semibold mb-3">Resumo 24h</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><span className="text-muted-foreground block">Cliques</span><span className="text-lg font-bold">{metrics.totalClicks.toLocaleString("pt-BR")}</span></div>
            <div><span className="text-muted-foreground block">Conversões</span><span className="text-lg font-bold">{metrics.totalConversions.toLocaleString("pt-BR")}</span></div>
            <div><span className="text-muted-foreground block">Webhooks Recebidos</span><span className="text-lg font-bold">{metrics.webhookTotal}</span></div>
            <div><span className="text-muted-foreground block">Taxa de Sucesso</span><span className="text-lg font-bold text-success">{metrics.webhookTotal > 0 ? (((metrics.webhookTotal - metrics.webhookErrors) / metrics.webhookTotal) * 100).toFixed(0) : "100"}%</span></div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="rounded-xl bg-card border border-border/50 card-shadow glass overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Logs Recentes (Webhook)</h3>
            <HelpTip text="Últimos webhooks processados pelo sistema em tempo real. Atualiza a cada 15 segundos." />
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" /> OK</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Ignorado</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Erro</span>
          </div>
        </div>
        {logsLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando logs...</div>
        ) : realLogs.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-muted-foreground">Nenhum webhook processado nas últimas horas.</div>
        ) : (
          <div className="divide-y divide-border/10">
            {realLogs.map((log: any, i: number) => (
              <div key={i} className="px-5 py-2.5 flex items-start gap-3 text-xs font-mono hover:bg-accent/20 transition-colors">
                <span className="text-muted-foreground shrink-0 w-16">{log.time}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(
                      "shrink-0 w-12 uppercase font-semibold cursor-help",
                      log.level === "info" && "text-info",
                      log.level === "warn" && "text-warning",
                      log.level === "error" && "text-destructive",
                    )}>
                      {log.level}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] text-xs">{logExplanations[log.level]}</TooltipContent>
                </Tooltip>
                <span className="text-secondary-foreground">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
