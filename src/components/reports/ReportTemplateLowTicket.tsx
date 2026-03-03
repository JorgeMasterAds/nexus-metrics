import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, GripVertical, Pencil, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import { SortableSection } from "@/components/SortableSection";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

function StatusBadge({ value, thresholds }: { value: number; thresholds: { bad: number; ok: number; good: number; invert?: boolean } }) {
  const { bad, ok, good, invert } = thresholds;
  let color: string;
  let label: string;
  if (invert) {
    if (value > bad) { color = "bg-red-500/20 text-red-400 border-red-500/30"; label = "Ruim"; }
    else if (value > ok) { color = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"; label = "Aceitável"; }
    else if (value > good) { color = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"; label = "Bom"; }
    else { color = "bg-blue-500/20 text-blue-400 border-blue-500/30"; label = "Excelente"; }
  } else {
    if (value < bad) { color = "bg-red-500/20 text-red-400 border-red-500/30"; label = "Ruim"; }
    else if (value < ok) { color = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"; label = "Aceitável"; }
    else if (value < good) { color = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"; label = "Bom"; }
    else { color = "bg-blue-500/20 text-blue-400 border-blue-500/30"; label = "Excelente"; }
  }
  return <Badge variant="outline" className={`${color} text-[10px] font-medium`}>{label}</Badge>;
}

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function EditCell({ value, onChange, type = "number", step, className = "" }: { value: number | string; onChange: (v: any) => void; type?: string; step?: string; className?: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "number") {
      const raw = e.target.value.replace(/[^\d.,\-]/g, "").replace(",", ".");
      const num = parseFloat(raw);
      onChange(isNaN(num) ? 0 : num);
    } else {
      onChange(e.target.value);
    }
  };
  const displayValue = type === "number" && typeof value === "number"
    ? value.toLocaleString("pt-BR")
    : value;
  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={`h-7 text-xs bg-muted/80 border-border/40 font-mono text-right ${className}`}
    />
  );
}

function ReadCell({ value, className = "" }: { value: string; className?: string }) {
  return <div className={`h-7 flex items-center justify-end text-xs font-mono px-2 ${className}`}>{value}</div>;
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border/30 card-shadow overflow-hidden transition-all hover:border-border/50">
      <div className="px-5 py-3.5 border-b border-border/30 bg-muted/5">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, editable, editValue, onChange, step, highlight, className = "" }: any) {
  return (
    <div className={`flex items-center border-b border-border/15 last:border-b-0 transition-colors ${highlight ? "bg-primary/5" : "hover:bg-accent/10"} ${className}`}>
      <div className="flex-1 text-[11px] px-4 py-2 text-muted-foreground font-medium">{label}</div>
      <div className="w-28 text-right pr-2">
        {editable ? (
          <EditCell value={editValue ?? value} onChange={onChange} step={step} />
        ) : (
          <ReadCell value={String(value)} />
        )}
      </div>
    </div>
  );
}

const ALL_SECTIONS = [
  { id: "resultados-vendas", label: "Resultados das Vendas" },
  { id: "venda-ingressos", label: "Venda de Ingressos / Low Ticket" },
  { id: "meta-vendas-pp", label: "Meta de Vendas Produto Principal" },
  { id: "meta-vendas", label: "Meta de Vendas do Mês" },
  { id: "investimento", label: "Planejamento de Investimento" },
  { id: "simulacao", label: "Simulação Mensal" },
  { id: "simulador-cpm", label: "Simulador de CPM" },
  { id: "funil", label: "Funil — Tráfego Pago" },
  { id: "lt-pp", label: "Low Ticket + Produto Principal" },
  { id: "gerais", label: "Resultados Gerais" },
  { id: "reembolsos", label: "Reembolsos" },
  { id: "trafego", label: "Tráfego" },
  { id: "calculadora", label: "Calculadora de CPM" },
  { id: "referencia", label: "Referência de Métricas" },
];

const DEFAULT_ORDER = ALL_SECTIONS.map(s => s.id);

const DEFAULTS: Record<string, any> = {
  orcamentoMensal: 0, diasMes: 30, diaAtual: 0, verbaMeta: 0, verbaGoogle: 0, metaVendas: 0,
  cpm: 0, ctr: 0, connectRate: 0, txConvPaginaCompra: 0,
  ltNome: "", ltTicket: 0, ltVendas: 0, lt2Nome: "", lt2Ticket: 0, lt2Vendas: 0,
  ob1Nome: "", ob1Ticket: 0, ob1Vendas: 0, ob2Nome: "", ob2Ticket: 0, ob2Vendas: 0,
  ob3Nome: "", ob3Ticket: 0, ob3Vendas: 0,
  upsellNome: "", upsellTicket: 0, upsellVendas: 0,
  ppNome: "", ppTicket: 0, ppVendas: 0, pp2Vendas: 0, pp3Vendas: 0,
  acessosPagina: 0, acessosCheckout: 0, ppAcessosPagina: 0, ppAcessosCheckout: 0,
  investimentoGasto: 0, reembolsosLT: 0, reembolsosOB: 0, reembolsosPP: 0,
  metaVendasPP: 0, metaIngressos: 0,
  simCpm: 0, simCtr: 0, simBudget: 0, simConvRate: 0, simTicket: 0,
};

interface Props {
  tabId: string;
  initialData: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
}

export default function ReportTemplateLowTicket({ tabId, initialData, onSave }: Props) {
  const [d, setD] = useState<Record<string, any>>(() => ({ ...DEFAULTS, ...initialData }));
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const update = useCallback((key: string, value: any) => {
    setD(prev => {
      const next = { ...prev, [key]: value };
      // Auto-save with debounce
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => onSave(next), 1500);
      return next;
    });
  }, [onSave]);

  // Cleanup
  useEffect(() => () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); }, []);

  const c = useMemo(() => {
    const orcSemanal = d.orcamentoMensal / 4;
    const orcDiario = d.diasMes > 0 ? d.orcamentoMensal / d.diasMes : 0;
    const diasRestantes = Math.max(0, d.diasMes - d.diaAtual);
    const fatLT = d.ltVendas * d.ltTicket;
    const fatLT2 = d.lt2Vendas * d.lt2Ticket;
    const fatOB1 = d.ob1Vendas * d.ob1Ticket;
    const fatOB2 = d.ob2Vendas * d.ob2Ticket;
    const fatOB3 = d.ob3Vendas * d.ob3Ticket;
    const fatUpsell = d.upsellVendas * d.upsellTicket;
    const fatPP = d.ppVendas * d.ppTicket;
    const totalVendasLT = d.ltVendas + d.lt2Vendas;
    const totalLT = fatLT + fatLT2;
    const totalOB = fatOB1 + fatOB2 + fatOB3;
    const totalFunil = totalLT + totalOB + fatUpsell + fatPP;
    const convOB1 = totalVendasLT > 0 ? (d.ob1Vendas / totalVendasLT) * 100 : 0;
    const convOB2 = totalVendasLT > 0 ? (d.ob2Vendas / totalVendasLT) * 100 : 0;
    const convOB3 = totalVendasLT > 0 ? (d.ob3Vendas / totalVendasLT) * 100 : 0;
    const convLT = d.acessosPagina > 0 ? (d.ltVendas / d.acessosPagina) * 100 : 0;
    const roas = d.investimentoGasto > 0 ? totalFunil / d.investimentoGasto : 0;
    const ticketMedioLT = totalVendasLT > 0 ? totalLT / totalVendasLT : 0;
    const cac = totalVendasLT > 0 ? d.investimentoGasto / totalVendasLT : 0;
    const convPagCheckout = d.acessosPagina > 0 ? (d.acessosCheckout / d.acessosPagina) * 100 : 0;
    const convCheckoutCompra = d.acessosCheckout > 0 ? (d.ltVendas / d.acessosCheckout) * 100 : 0;
    const convPagCompra = d.acessosPagina > 0 ? (d.ltVendas / d.acessosPagina) * 100 : 0;
    const ppConvPagCheckout = d.ppAcessosPagina > 0 ? (d.ppAcessosCheckout / d.ppAcessosPagina) * 100 : 0;
    const ppConvCheckoutCompra = d.ppAcessosCheckout > 0 ? (d.ppVendas / d.ppAcessosCheckout) * 100 : 0;
    const ppConvPagCompra = d.ppAcessosPagina > 0 ? (d.ppVendas / d.ppAcessosPagina) * 100 : 0;
    const ppCac = d.ppVendas > 0 ? d.investimentoGasto / d.ppVendas : 0;
    const previsaoCPA = totalVendasLT > 0 ? d.investimentoGasto / totalVendasLT : 0;
    const previsaoVendas = d.diasMes > 0 && d.diaAtual > 0 ? (totalVendasLT / d.diaAtual) * d.diasMes : 0;
    const ticketMedioSim = totalVendasLT > 0 ? totalLT / totalVendasLT : 0;
    const fatSim = previsaoVendas * ticketMedioSim;
    const roasSim = d.orcamentoMensal > 0 ? fatSim / d.orcamentoMensal : 0;
    const liquidoSim = fatSim - d.orcamentoMensal;
    const vendasMediaDia = d.diaAtual > 0 ? totalVendasLT / d.diaAtual : 0;
    const faltouInvestir = d.orcamentoMensal - d.investimentoGasto;
    const percentMeta = d.metaVendas > 0 ? (totalVendasLT / d.metaVendas) * 100 : 0;
    const totalVendasAll = d.ltVendas + d.lt2Vendas + d.ob1Vendas + d.ob2Vendas + d.ob3Vendas + d.upsellVendas + d.ppVendas;
    const totalOBVendas = d.ob1Vendas + d.ob2Vendas + d.ob3Vendas;
    const taxaReembolsoLT = totalVendasLT > 0 ? (d.reembolsosLT / totalVendasLT) * 100 : 0;
    const taxaReembolsoOB = totalOBVendas > 0 ? (d.reembolsosOB / totalOBVendas) * 100 : 0;
    const taxaReembolsoPP = d.ppVendas > 0 ? (d.reembolsosPP / d.ppVendas) * 100 : 0;
    const impressoes = d.investimentoGasto > 0 && d.cpm > 0 ? (d.investimentoGasto / d.cpm) * 1000 : 0;
    const cliques = impressoes > 0 ? impressoes * (d.ctr / 100) : 0;
    const cpc = cliques > 0 ? d.investimentoGasto / cliques : 0;
    const percentMetaPP = d.metaVendasPP > 0 ? (d.ppVendas / d.metaVendasPP) * 100 : 0;
    const percentMetaIngressos = d.metaIngressos > 0 ? (totalVendasLT / d.metaIngressos) * 100 : 0;
    // CPM simulator
    const simImpressoes = d.simBudget > 0 && d.simCpm > 0 ? (d.simBudget / d.simCpm) * 1000 : 0;
    const simCliques = simImpressoes > 0 ? simImpressoes * (d.simCtr / 100) : 0;
    const simCpc = simCliques > 0 ? d.simBudget / simCliques : 0;
    const simVendas = simCliques > 0 ? simCliques * (d.simConvRate / 100) : 0;
    const simFat = simVendas * d.simTicket;
    const simRoas = d.simBudget > 0 ? simFat / d.simBudget : 0;
    return {
      orcSemanal, orcDiario, diasRestantes,
      fatLT, fatLT2, fatOB1, fatOB2, fatOB3, fatUpsell, fatPP, totalLT, totalOB, totalFunil,
      convOB1, convOB2, convOB3, convLT, roas, ticketMedioLT, cac,
      convPagCheckout, convCheckoutCompra, convPagCompra,
      ppConvPagCheckout, ppConvCheckoutCompra, ppConvPagCompra, ppCac,
      previsaoCPA, previsaoVendas, ticketMedioSim, fatSim, roasSim, liquidoSim,
      vendasMediaDia, faltouInvestir, percentMeta,
      totalVendasAll, totalVendasLT,
      taxaReembolsoLT, taxaReembolsoOB, taxaReembolsoPP,
      impressoes, cliques, cpc,
      percentMetaPP, percentMetaIngressos,
      simImpressoes, simCliques, simCpc, simVendas, simFat, simRoas,
    };
  }, [d]);

  // Layout & visibility
  const { order, editMode, toggleEdit, handleReorder, resetLayout } = useDashboardLayout("planning", DEFAULT_ORDER);
  const { visible, toggle: toggleVisibility } = useChartVisibility("planning", ALL_SECTIONS);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    handleReorder(arrayMove(order, oldIndex, newIndex));
  }, [order, handleReorder]);

  const isVisible = (id: string) => visible[id] !== false;

  const renderSection = (id: string) => {
    if (!isVisible(id)) return null;
    switch (id) {
      case "resultados-vendas":
        return (
          <CardSection title="Resultados das Vendas">
            <div className="grid grid-cols-2 gap-4 p-5">
              <div className="text-center p-3 rounded-lg bg-muted/10 border border-border/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Investimento Total</p>
                <p className="text-xl font-bold">{fmtBRL(d.investimentoGasto)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/10 border border-border/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Faturamento Total</p>
                <p className="text-xl font-bold">{fmtBRL(c.totalFunil)}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 pb-5">
              <span className="text-xs text-muted-foreground font-medium">ROAS</span>
              <span className="text-3xl font-bold tabular-nums">{c.roas.toFixed(2)}</span>
              <StatusBadge value={c.roas} thresholds={{ bad: 1.0, ok: 1.2, good: 1.6 }} />
            </div>
          </CardSection>
        );
      case "venda-ingressos":
        return (
          <CardSection title="Venda de Ingressos / Low Ticket">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground font-medium">Meta de Ingressos:</span>
                <EditCell value={d.metaIngressos} onChange={(v: number) => update("metaIngressos", v)} className="w-20 text-center" />
              </div>
              <div className="text-3xl font-bold tabular-nums">{c.totalVendasLT} <span className="text-sm text-muted-foreground font-normal">/ {d.metaIngressos > 0 ? d.metaIngressos.toLocaleString("pt-BR") : "—"}</span></div>
              {d.metaIngressos > 0 && (
                <>
                  <div className="w-full bg-muted/30 rounded-full h-3 mt-4 overflow-hidden">
                    <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(c.percentMetaIngressos, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{c.percentMetaIngressos.toFixed(0)}% da meta</p>
                </>
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-2 rounded-lg bg-muted/10 border border-border/10">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Faturamento LT</p>
                  <p className="text-sm font-bold">{fmtBRL(c.totalLT)}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/10 border border-border/10">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Ticket Médio</p>
                  <p className="text-sm font-bold">{c.ticketMedioLT > 0 ? fmtBRL(c.ticketMedioLT) : "—"}</p>
                </div>
              </div>
            </div>
          </CardSection>
        );
      case "meta-vendas-pp":
        return (
          <CardSection title="Meta de Vendas — Produto Principal">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground font-medium">Meta PP:</span>
                <EditCell value={d.metaVendasPP} onChange={(v: number) => update("metaVendasPP", v)} className="w-20 text-center" />
              </div>
              <div className="text-3xl font-bold tabular-nums">{d.ppVendas} <span className="text-sm text-muted-foreground font-normal">/ {d.metaVendasPP > 0 ? d.metaVendasPP.toLocaleString("pt-BR") : "—"}</span></div>
              {d.metaVendasPP > 0 && (
                <>
                  <div className="w-full bg-muted/30 rounded-full h-3 mt-4 overflow-hidden">
                    <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(c.percentMetaPP, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{c.percentMetaPP.toFixed(0)}% da meta</p>
                </>
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-2 rounded-lg bg-muted/10 border border-border/10">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Faturamento PP</p>
                  <p className="text-sm font-bold">{c.fatPP > 0 ? fmtBRL(c.fatPP) : "—"}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/10 border border-border/10">
                  <p className="text-[10px] text-muted-foreground mb-0.5">CAC PP</p>
                  <p className="text-sm font-bold">{d.ppVendas > 0 ? fmtBRL(c.ppCac) : "—"}</p>
                </div>
              </div>
            </div>
          </CardSection>
        );
      case "meta-vendas":
        return (
          <CardSection title="Meta de Vendas do Mês">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground font-medium">Meta:</span>
                <EditCell value={d.metaVendas} onChange={(v: number) => update("metaVendas", v)} className="w-20 text-center" />
              </div>
              <div className="text-3xl font-bold tabular-nums">{c.totalVendasLT} <span className="text-sm text-muted-foreground font-normal">/ {d.metaVendas > 0 ? d.metaVendas.toLocaleString("pt-BR") : "—"}</span></div>
              {d.metaVendas > 0 && (
                <>
                  <div className="w-full bg-muted/30 rounded-full h-3 mt-4 overflow-hidden">
                    <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(c.percentMeta, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{c.percentMeta.toFixed(0)}% da meta</p>
                </>
              )}
            </div>
          </CardSection>
        );
      case "investimento":
        return (
          <CardSection title="Planejamento de Investimento">
            <Row label="Orçamento Mensal" editable editValue={d.orcamentoMensal} onChange={(v: number) => update("orcamentoMensal", v)} value={fmtBRL(d.orcamentoMensal)} />
            <Row label="Orçamento Semanal" value={fmtBRL(c.orcSemanal)} />
            <Row label="Orçamento Diário" value={fmtBRL(c.orcDiario)} />
            <Row label="Verba Meta Ads" editable editValue={d.verbaMeta} onChange={(v: number) => update("verbaMeta", v)} value={fmtBRL(d.verbaMeta)} />
            <Row label="Verba Google/YT" editable editValue={d.verbaGoogle} onChange={(v: number) => update("verbaGoogle", v)} value={fmtBRL(d.verbaGoogle)} />
            <Row label="Dia Atual" editable editValue={d.diaAtual} onChange={(v: number) => update("diaAtual", v)} value={d.diaAtual} />
            <Row label="Total de Dias do Mês" editable editValue={d.diasMes} onChange={(v: number) => update("diasMes", v)} value={d.diasMes} />
            <Row label="Dias Restantes" value={c.diasRestantes} />
          </CardSection>
        );
      case "simulacao":
        return (
          <CardSection title="Simulação Mensal">
            <Row label="CPM" editable editValue={d.cpm} onChange={(v: number) => update("cpm", v)} step="0.01" value={fmtBRL(d.cpm)} />
            <Row label="CTR" editable editValue={d.ctr} onChange={(v: number) => update("ctr", v)} step="0.01" value={`${d.ctr}%`} />
            <Row label="Connect Rate" editable editValue={d.connectRate} onChange={(v: number) => update("connectRate", v)} step="0.01" value={`${d.connectRate}%`} />
            <Row label="Tx. Conv. Página > Compra" editable editValue={d.txConvPaginaCompra} onChange={(v: number) => update("txConvPaginaCompra", v)} step="0.01" value={`${d.txConvPaginaCompra}%`} />
            <Row label="Previsão de CPA" value={fmtBRL(c.previsaoCPA)} />
            <Row label="Previsão de Vendas" value={c.previsaoVendas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} />
            <Row label="Ticket Médio" value={fmtBRL(c.ticketMedioSim)} />
            <Row label="Faturamento" value={fmtBRL(c.fatSim)} />
            <Row label="ROAS" value={c.roasSim.toFixed(2)} />
            <Row label="Líquido" value={fmtBRL(c.liquidoSim)} className={c.liquidoSim < 0 ? "text-destructive" : ""} />
          </CardSection>
        );
      case "simulador-cpm":
        return (
          <CardSection title="Simulador de CPM">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Investimento</p>
                  <EditCell value={d.simBudget} onChange={(v: number) => update("simBudget", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">CPM (R$)</p>
                  <EditCell value={d.simCpm} onChange={(v: number) => update("simCpm", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">CTR (%)</p>
                  <EditCell value={d.simCtr} onChange={(v: number) => update("simCtr", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Tx. Conv. (%)</p>
                  <EditCell value={d.simConvRate} onChange={(v: number) => update("simConvRate", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Ticket (R$)</p>
                  <EditCell value={d.simTicket} onChange={(v: number) => update("simTicket", v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: "Impressões", value: c.simImpressoes.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) },
                  { label: "Cliques", value: c.simCliques.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) },
                  { label: "CPC", value: fmtBRL(c.simCpc) },
                  { label: "Vendas Prev.", value: c.simVendas.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) },
                  { label: "Fat. Prev.", value: fmtBRL(c.simFat) },
                  { label: "ROAS Prev.", value: c.simRoas.toFixed(2) },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardSection>
        );
      case "funil":
        return (
          <CardSection title="Funil — Tráfego Pago">
            <div className="grid grid-cols-6 text-[10px] font-bold text-muted-foreground border-b border-border/30 bg-muted/20">
              <div className="px-2 py-1.5 col-span-1"></div>
              <div className="px-1 py-1.5 text-center">Nome</div>
              <div className="px-1 py-1.5 text-right">Ticket</div>
              <div className="px-1 py-1.5 text-right">Conv.</div>
              <div className="px-1 py-1.5 text-right">Vendas</div>
              <div className="px-1 py-1.5 text-right">Fat.</div>
            </div>
            {[
              { label: "LOW TICKET", nKey: "ltNome", tKey: "ltTicket", vKey: "ltVendas", conv: c.convLT, fat: c.fatLT },
              { label: "LOW TICKET 2", nKey: "lt2Nome", tKey: "lt2Ticket", vKey: "lt2Vendas", conv: 0, fat: c.fatLT2 },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-6 text-[11px] border-b border-border/20 items-center">
                <div className="px-2 py-0.5 font-medium text-[10px]">{row.label}</div>
                <div className="px-1"><EditCell value={d[row.nKey]} onChange={(v: string) => update(row.nKey, v)} type="text" className="text-left text-[10px]" /></div>
                <div className="px-1"><EditCell value={d[row.tKey]} onChange={(v: number) => update(row.tKey, v)} /></div>
                <ReadCell value={`${row.conv.toFixed(1)}%`} />
                <div className="px-1"><EditCell value={d[row.vKey]} onChange={(v: number) => update(row.vKey, v)} /></div>
                <ReadCell value={fmtBRL(row.fat)} />
              </div>
            ))}
            {[
              { label: "ORDER BUMP 1", nKey: "ob1Nome", tKey: "ob1Ticket", vKey: "ob1Vendas", conv: c.convOB1, fat: c.fatOB1 },
              { label: "ORDER BUMP 2", nKey: "ob2Nome", tKey: "ob2Ticket", vKey: "ob2Vendas", conv: c.convOB2, fat: c.fatOB2 },
              { label: "ORDER BUMP 3", nKey: "ob3Nome", tKey: "ob3Ticket", vKey: "ob3Vendas", conv: c.convOB3, fat: c.fatOB3 },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-6 text-[11px] border-b border-border/20 items-center">
                <div className="px-2 py-0.5 font-medium text-[10px]">{row.label}</div>
                <div className="px-1"><EditCell value={d[row.nKey]} onChange={(v: string) => update(row.nKey, v)} type="text" className="text-left text-[10px]" /></div>
                <div className="px-1"><EditCell value={d[row.tKey]} onChange={(v: number) => update(row.tKey, v)} /></div>
                <ReadCell value={`${row.conv.toFixed(1)}%`} />
                <div className="px-1"><EditCell value={d[row.vKey]} onChange={(v: number) => update(row.vKey, v)} /></div>
                <ReadCell value={fmtBRL(row.fat)} />
              </div>
            ))}
            <div className="grid grid-cols-6 text-[11px] border-b border-border/20 items-center">
              <div className="px-2 py-0.5 font-medium text-[10px]">UPSELL</div>
              <div className="px-1"><EditCell value={d.upsellNome} onChange={(v: string) => update("upsellNome", v)} type="text" className="text-left text-[10px]" /></div>
              <div className="px-1"><EditCell value={d.upsellTicket} onChange={(v: number) => update("upsellTicket", v)} /></div>
              <ReadCell value="—" />
              <div className="px-1"><EditCell value={d.upsellVendas} onChange={(v: number) => update("upsellVendas", v)} /></div>
              <ReadCell value={fmtBRL(c.fatUpsell)} />
            </div>
            <div className="grid grid-cols-6 text-[11px] border-b border-border/20 items-center">
              <div className="px-2 py-0.5 font-medium text-[10px]">PRINCIPAL</div>
              <div className="px-1"><EditCell value={d.ppNome} onChange={(v: string) => update("ppNome", v)} type="text" className="text-left text-[10px]" /></div>
              <div className="px-1"><EditCell value={d.ppTicket} onChange={(v: number) => update("ppTicket", v)} /></div>
              <ReadCell value="—" />
              <div className="px-1"><EditCell value={d.ppVendas} onChange={(v: number) => update("ppVendas", v)} /></div>
              <ReadCell value={fmtBRL(c.fatPP)} />
            </div>
            <div className="grid grid-cols-6 text-[11px] items-center bg-accent/30">
              <div className="px-2 py-1.5 font-bold text-[10px] col-span-4">TOTAL FUNIL</div>
              <ReadCell value={String(c.totalVendasAll)} className="font-bold" />
              <ReadCell value={fmtBRL(c.totalFunil)} className="font-bold" />
            </div>
          </CardSection>
        );
      case "lt-pp":
        return (
          <div className="grid grid-cols-2 gap-4">
            <CardSection title="Low Ticket">
              <Row label="Ticket Médio" value={c.ticketMedioLT > 0 ? fmtBRL(c.ticketMedioLT) : "—"} />
              <Row label="Acessos Página" editable editValue={d.acessosPagina} onChange={(v: number) => update("acessosPagina", v)} value={d.acessosPagina} />
              <Row label="Acessos Checkout" editable editValue={d.acessosCheckout} onChange={(v: number) => update("acessosCheckout", v)} value={d.acessosCheckout} />
              <Row label="CAC" value={c.cac > 0 ? fmtBRL(c.cac) : "—"} highlight />
              <Row label="Tx. Conv." value={c.convPagCompra > 0 ? `${c.convPagCompra.toFixed(1)}%` : "—"} />
            </CardSection>
            <CardSection title="Produto Principal">
              <Row label="Ticket Médio" value={d.ppTicket > 0 ? fmtBRL(d.ppTicket) : "—"} />
              <Row label="Acessos Página" editable editValue={d.ppAcessosPagina} onChange={(v: number) => update("ppAcessosPagina", v)} value={d.ppAcessosPagina} />
              <Row label="Acessos Checkout" editable editValue={d.ppAcessosCheckout} onChange={(v: number) => update("ppAcessosCheckout", v)} value={d.ppAcessosCheckout} />
              <Row label="CAC" value={d.ppVendas > 0 ? fmtBRL(c.ppCac) : "—"} highlight />
              <Row label="Tx. Conv." value={d.ppAcessosPagina > 0 ? `${c.ppConvPagCompra.toFixed(1)}%` : "—"} />
            </CardSection>
          </div>
        );
      case "gerais":
        return (
          <CardSection title="Resultados Gerais">
            <Row label="Faturamento" value={fmtBRL(c.totalFunil)} highlight />
            <Row label="Investimento" editable editValue={d.investimentoGasto} onChange={(v: number) => update("investimentoGasto", v)} value={fmtBRL(d.investimentoGasto)} />
            <Row label="ROAS" value={c.roas.toFixed(2)} />
            <Row label="Dias de Vendas" value={d.diaAtual} />
            <Row label="Vendas/Dia" value={c.vendasMediaDia.toFixed(1)} />
            <Row label="Faltou Investir" value={fmtBRL(c.faltouInvestir)} />
          </CardSection>
        );
      case "reembolsos":
        return (
          <CardSection title="Reembolsos">
            <div className="border-b border-border/20 px-3 py-1.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">LT</span>
              <div className="flex items-center gap-2">
                <div className="w-14"><EditCell value={d.reembolsosLT} onChange={(v: number) => update("reembolsosLT", v)} /></div>
                <span className="text-xs w-14 text-right">{c.taxaReembolsoLT.toFixed(1)}%</span>
              </div>
            </div>
            <div className="border-b border-border/20 px-3 py-1.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">Order Bumps</span>
              <div className="flex items-center gap-2">
                <div className="w-14"><EditCell value={d.reembolsosOB} onChange={(v: number) => update("reembolsosOB", v)} /></div>
                <span className="text-xs w-14 text-right">{c.taxaReembolsoOB.toFixed(1)}%</span>
              </div>
            </div>
            <div className="px-3 py-1.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">Produto Principal</span>
              <div className="flex items-center gap-2">
                <div className="w-14"><EditCell value={d.reembolsosPP} onChange={(v: number) => update("reembolsosPP", v)} /></div>
                <span className="text-xs w-14 text-right">{c.taxaReembolsoPP.toFixed(1)}%</span>
              </div>
            </div>
          </CardSection>
        );
      case "trafego":
        return (
          <CardSection title="Tráfego">
            <div className="grid grid-cols-3 text-[10px] font-bold text-muted-foreground border-b border-border/30 bg-muted/20 px-3 py-1.5">
              <div></div><div className="text-right">%</div><div className="text-right">Vendas</div>
            </div>
            <div className="grid grid-cols-3 text-[11px] border-b border-border/20 px-3 py-1.5">
              <div>Tráfego Pago</div>
              <div className="text-right">100%</div>
              <div className="text-right font-bold">{c.totalVendasAll}</div>
            </div>
            <div className="grid grid-cols-3 text-[11px] px-3 py-1.5">
              <div>Orgânico</div>
              <div className="text-right">0%</div>
              <div className="text-right">0</div>
            </div>
          </CardSection>
        );
      case "calculadora":
        return (
          <CardSection title="Calculadora de CPM">
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Impressões", value: c.impressoes.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) },
                  { label: "Cliques", value: c.cliques.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) },
                  { label: "CPC", value: fmtBRL(c.cpc) },
                  { label: "CPM", value: fmtBRL(d.cpm), badge: d.cpm > 0 ? <StatusBadge value={d.cpm} thresholds={{ bad: 50, ok: 35, good: 25, invert: true }} /> : null },
                  { label: "CTR", value: `${d.ctr.toFixed(2)}%`, badge: d.ctr > 0 ? <StatusBadge value={d.ctr} thresholds={{ bad: 1.0, ok: 1.4, good: 2.0 }} /> : null },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center justify-center gap-1">{item.label} {(item as any).badge}</p>
                    <p className="text-sm font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardSection>
        );
      case "referencia":
        return (
          <CardSection title="Referência de Métricas (Funil LowTicket)">
            <div className="p-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 text-muted-foreground font-medium">Métrica</th>
                    <th className="text-center py-2 text-red-400 font-medium">Ruim</th>
                    <th className="text-center py-2 text-yellow-400 font-medium">Aceitável</th>
                    <th className="text-center py-2 text-emerald-400 font-medium">Bom</th>
                    <th className="text-center py-2 text-blue-400 font-medium">Excelente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { name: "CPM", bad: "> R$50", ok: "R$35–50", good: "R$25–35", excellent: "< R$25" },
                    { name: "CTR", bad: "< 1,0%", ok: "1,0–1,4%", good: "1,5–2,0%", excellent: "> 2,0%" },
                    { name: "Connect Rate", bad: "< 65%", ok: "65–75%", good: "75–85%", excellent: "> 85%" },
                    { name: "Conv. Página → Checkout", bad: "< 25%", ok: "25–35%", good: "35–50%", excellent: "> 50%" },
                    { name: "Conv. Checkout → Compra", bad: "< 15%", ok: "15–20%", good: "20–30%", excellent: "> 30%" },
                    { name: "Conv. Página → Compra", bad: "< 5%", ok: "5–7%", good: "7–10%", excellent: "> 10%" },
                    { name: "CPA (Low Ticket)", bad: "> Ticket", ok: "≈ Ticket", good: "< Ticket", excellent: "≤ 70% Ticket" },
                    { name: "ROAS", bad: "< 1.0", ok: "1.0–1.2", good: "1.2–1.6", excellent: "> 1.6" },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="py-2 font-medium">{row.name}</td>
                      <td className="py-2 text-center text-red-400">{row.bad}</td>
                      <td className="py-2 text-center text-yellow-400">{row.ok}</td>
                      <td className="py-2 text-center text-emerald-400">{row.good}</td>
                      <td className="py-2 text-center text-blue-400">{row.excellent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardSection>
        );
      default:
        return null;
    }
  };

  const visibleOrder = order.filter(id => isVisible(id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Planejamento LowTicket / Lançamento Pago</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Campos com fundo escuro são editáveis. Dados salvos automaticamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <ChartVisibilityMenu sections={ALL_SECTIONS} visible={visible} onToggle={toggleVisibility} />
          {editMode && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={resetLayout}>
              <RotateCcw className="h-3.5 w-3.5" />
              Redefinir
            </Button>
          )}
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={toggleEdit}
          >
            {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {editMode ? "Salvar ordem" : "Reordenar"}
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">
            {visibleOrder.map(id => (
              <SortableSection key={id} id={id} editMode={editMode}>
                {renderSection(id)}
              </SortableSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
