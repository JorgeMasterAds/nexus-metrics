import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { Activity, Clock, AlertTriangle, RefreshCw, Server, Zap, HelpCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

/* ─── Data ─── */
const healthMetrics = [
  {
    label: "Latência Redirect",
    value: "32ms",
    icon: Zap,
    change: "Média últimas 24h",
    changeType: "neutral" as const,
    help: "Tempo médio que o sistema leva para processar um clique em um Smart Link e redirecionar o visitante para a página de destino. Valores abaixo de 100ms são considerados excelentes.",
  },
  {
    label: "Taxa de Erro",
    value: "0.02%",
    icon: AlertTriangle,
    change: "3 erros em 14.2K req",
    changeType: "positive" as const,
    help: "Porcentagem de requisições que resultaram em erro (HTTP 5xx) nas últimas 24 horas. Taxas abaixo de 0.1% indicam que o sistema está saudável.",
  },
  {
    label: "Webhooks com Falha",
    value: "2",
    icon: RefreshCw,
    change: "Em retry automático",
    changeType: "negative" as const,
    help: "Quantidade de webhooks que não foram entregues com sucesso ao endpoint de destino. O sistema tenta reenviar automaticamente até 3 vezes com intervalos crescentes (retry exponencial).",
  },
  {
    label: "Fila Pendente",
    value: "14",
    icon: Server,
    change: "Processando normalmente",
    changeType: "neutral" as const,
    help: "Número de tarefas aguardando processamento na fila assíncrona (ex: envio de webhooks, cálculo de métricas). Valores abaixo de 100 indicam operação normal.",
  },
];

const services = [
  {
    name: "Motor de Redirect",
    status: "operational" as const,
    description: "Responsável por receber os cliques nos Smart Links e redirecionar o visitante para a URL de destino correta, aplicando regras de rotação A/B e capturando parâmetros UTM.",
  },
  {
    name: "Motor de Rastreamento",
    status: "operational" as const,
    description: "Captura e armazena dados de cada clique: país, dispositivo, UTMs, referrer, IP (anonimizado) e vincula ao Smart Link correspondente para análise posterior.",
  },
  {
    name: "Motor de Analytics",
    status: "operational" as const,
    description: "Processa e agrega métricas diárias (views, conversões, receita) a partir dos dados brutos de cliques e conversões. Alimenta os gráficos do Dashboard e Relatórios.",
  },
  {
    name: "Worker Assíncrono",
    status: "operational" as const,
    description: "Executa tarefas em segundo plano como envio de e-mails, processamento de conversões, cálculo de comissões e execução de automações. Opera de forma independente para não impactar a velocidade das requisições.",
  },
  {
    name: "API Pública",
    status: "operational" as const,
    description: "Endpoint responsável por receber webhooks de plataformas externas (Hotmart, Eduzz, Kiwify, Monetizze, Cakto) e processar os dados de conversão em tempo real.",
  },
  {
    name: "Dispatcher de Webhooks",
    status: "degraded" as const,
    description: "Envia notificações para endpoints externos configurados pelo usuário quando eventos ocorrem (nova venda, novo lead, etc). Status 'Degradado' significa que alguns envios estão falhando ou demorando mais que o normal — o sistema faz retry automático.",
    degradedReason: "Alguns endpoints externos estão demorando para responder (timeout), causando retries. Isso NÃO significa perda de dados — o sistema reenvia automaticamente até 3 vezes.",
  },
];

const recentLogs = [
  { time: "14:32:01", level: "info", message: "Redirect processado: /vsl-main → Variante B (32ms)" },
  { time: "14:31:58", level: "info", message: "Conversão recebida: click_id=ck_8f2a, valor=R$497,00" },
  { time: "14:31:45", level: "warn", message: "Webhook retry #2: endpoint https://hooks.app/notify (timeout)" },
  { time: "14:31:30", level: "info", message: "Bot detectado: UA=AhrefsBot, IP=xxx.xxx.xxx.xxx, marcado" },
  { time: "14:31:12", level: "info", message: "Redirect processado: /checkout-price → R$ 497 (28ms)" },
  { time: "14:30:55", level: "error", message: "Webhook falhou: endpoint inacessível após 3 tentativas" },
  { time: "14:30:40", level: "info", message: "Auto-otimização: /vsl-main pesos ajustados (50/30/20 → 55/28/17)" },
  { time: "14:30:22", level: "info", message: "Redirect processado: /lp-cold → Social Proof (41ms)" },
];

const logExplanations: Record<string, string> = {
  info: "Evento informativo — operação executada com sucesso, sem necessidade de ação.",
  warn: "Aviso — algo não saiu como esperado mas o sistema está tratando automaticamente (ex: retry de webhook).",
  error: "Erro — uma operação falhou mesmo após tentativas automáticas. Pode requerer verificação manual.",
};

/* ─── Component ─── */
export default function SystemHealth() {
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
          <p>
            Esta página mostra o estado de cada componente interno do Nexus Metrics em tempo real.
            Os <strong>cards superiores</strong> resumem métricas-chave de performance.
            A seção <strong>Status dos Serviços</strong> indica se cada módulo está operando normalmente.
            Os <strong>Logs Recentes</strong> mostram os últimos eventos processados pelo sistema.
          </p>
          <p>
            <strong>Operacional</strong> = funcionando normalmente &nbsp;•&nbsp;
            <strong>Degradado</strong> = funcionando com lentidão ou falhas parciais (retry automático ativo) &nbsp;•&nbsp;
            <strong>Fora do ar</strong> = serviço indisponível.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {healthMetrics.map((m) => (
          <div key={m.label} className="relative">
            <MetricCard label={m.label} value={m.value} icon={m.icon} change={m.change} changeType={m.changeType} />
            <div className="absolute top-3 right-3">
              <HelpTip text={m.help} />
            </div>
          </div>
        ))}
      </div>

      {/* System status */}
      <div className="rounded-xl bg-card border border-border/50 p-5 mb-6 card-shadow glass">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold">Status dos Serviços</h3>
          <HelpTip text="Cada serviço é um módulo independente do sistema. Se um serviço estiver 'Degradado', o sistema continua funcionando mas aquela funcionalidade pode estar mais lenta ou com falhas parciais." />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service) => (
            <div key={service.name} className={cn(
              "p-3 rounded-lg border",
              service.status === "operational"
                ? "bg-secondary/30 border-border/20"
                : "bg-warning/5 border-warning/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    service.status === "operational" ? "bg-success" : "bg-warning animate-pulse"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    service.status === "operational" ? "text-success" : "text-warning"
                  )}>
                    {service.status === "operational" ? "Operacional" : "Degradado"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{service.description}</p>
              {service.status === "degraded" && service.degradedReason && (
                <div className="mt-2 rounded-md bg-warning/10 border border-warning/20 px-2.5 py-1.5">
                  <p className="text-[11px] text-warning leading-relaxed">
                    <strong>Por que está degradado?</strong> {service.degradedReason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="rounded-xl bg-card border border-border/50 card-shadow glass overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Logs Recentes</h3>
            <HelpTip text="Registro cronológico dos últimos eventos processados pelo sistema. Cada linha mostra o horário, o nível (INFO, WARN, ERROR) e uma descrição do que aconteceu." />
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" /> INFO — ok</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> WARN — atenção</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> ERROR — falha</span>
          </div>
        </div>
        <div className="divide-y divide-border/10">
          {recentLogs.map((log, i) => (
            <div key={i} className="px-5 py-2.5 flex items-start gap-3 text-xs font-mono hover:bg-accent/20 transition-colors group">
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
      </div>
    </DashboardLayout>
  );
}
