import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, GripVertical, Pencil, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import ExportMenu from "@/components/ExportMenu";
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

/** Format a raw string to display with Brazilian thousand separators */
function formatWithThousands(raw: string): string {
  const clean = raw.replace(/[^\d,]/g, "");
  const [intPart, ...decParts] = clean.split(",");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decParts.length > 0 ? `${formatted},${decParts.join("")}` : formatted;
}

/** Parse a Brazilian-formatted value string to number */
function parseThousands(raw: string): number {
  const val = parseFloat(raw.replace(/\./g, "").replace(",", "."));
  return isNaN(val) ? 0 : val;
}

function BRLInput({ value, onChange, className = "" }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [display, setDisplay] = useState(() => value > 0 ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setDisplay(value > 0 ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatWithThousands(raw);
    setDisplay(formatted);
    const num = parseThousands(formatted);
    prevValue.current = num;
    onChange(num);
  };

  return (
    <Input
      type="text"
      value={display}
      onChange={handleChange}
      placeholder="0,00"
      className={`h-7 text-xs bg-muted/80 border-border/40 font-mono text-right ${className}`}
    />
  );
}

function NumberInput({ value, onChange, className = "" }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [display, setDisplay] = useState(() => value > 0 ? value.toLocaleString("pt-BR") : "");
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setDisplay(value > 0 ? value.toLocaleString("pt-BR") : "");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setDisplay(formatted);
    const num = parseInt(raw, 10) || 0;
    prevValue.current = num;
    onChange(num);
  };

  return (
    <Input
      type="text"
      value={display}
      onChange={handleChange}
      placeholder="0"
      className={`h-7 text-xs bg-muted/80 border-border/40 font-mono text-right ${className}`}
    />
  );
}

function PercentInput({ value, onChange, className = "" }: { value: number; onChange: (v: number) => void; className?: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
    const num = parseFloat(raw);
    onChange(isNaN(num) ? 0 : num);
  };
  return (
    <Input
      type="text"
      value={value > 0 ? value.toLocaleString("pt-BR") : ""}
      onChange={handleChange}
      placeholder="0"
      className={`h-7 text-xs bg-muted/80 border-border/40 font-mono text-right ${className}`}
    />
  );
}

function EditCell({ value, onChange, type = "number", step, className = "" }: { value: number | string; onChange: (v: any) => void; type?: string; step?: string; className?: string }) {
  if (type === "text") {
    return (
      <Input
        type="text"
        value={String(value)}
        onChange={e => onChange(e.target.value)}
        className={`h-7 text-xs bg-muted/80 border-border/40 font-mono text-right ${className}`}
      />
    );
  }
  return <BRLInput value={typeof value === "number" ? value : 0} onChange={onChange} className={className} />;
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

function Row({ label, value, editable, editValue, onChange, step, highlight, className = "", inputType }: any) {
  return (
    <div className={`flex items-center border-b border-border/15 last:border-b-0 transition-colors ${highlight ? "bg-primary/5" : "hover:bg-accent/10"} ${className}`}>
      <div className="flex-1 text-[11px] px-4 py-2 text-muted-foreground font-medium">{label}</div>
      <div className="w-28 text-right pr-2">
        {editable ? (
          inputType === "int" ? (
            <NumberInput value={editValue ?? 0} onChange={onChange} />
          ) : inputType === "percent" ? (
            <PercentInput value={editValue ?? 0} onChange={onChange} />
          ) : (
            <BRLInput value={editValue ?? 0} onChange={onChange} />
          )
        ) : (
          <ReadCell value={String(value)} />
        )}
      </div>
    </div>
  );
}

const ALL_SECTIONS = [
  { id: "resultados-vendas", label: "Resultados das Vendas" },
  { id: "venda-ingressos", label: "Meta de Ingressos" },
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
  metaFaturamento: 0,
  verbaMetaDiario: 0, verbaMetaSemanal: 0, verbaMetaMensal: 0,
  verbaGoogleDiario: 0, verbaGoogleSemanal: 0, verbaGoogleMensal: 0,
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
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => onSave(next), 1500);
      return next;
    });
  }, [onSave]);

  useEffect(() => () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); }, []);

  const c = useMemo(() => {
    const orcQuinzenal = d.orcamentoMensal / 2;
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
    const simImpressoes = d.simBudget > 0 && d.simCpm > 0 ? (d.simBudget / d.simCpm) * 1000 : 0;
    const simCliques = simImpressoes > 0 ? simImpressoes * (d.simCtr / 100) : 0;
    const simCpc = simCliques > 0 ? d.simBudget / simCliques : 0;
    const simVendas = simCliques > 0 ? simCliques * (d.simConvRate / 100) : 0;
    const simFat = simVendas * d.simTicket;
    const simRoas = d.simBudget > 0 ? simFat / d.simBudget : 0;
    const convLTIngPP = totalVendasLT > 0 && d.ppVendas > 0 ? (d.ppVendas / totalVendasLT) * 100 : 0;
    const percentMetaFat = d.metaFaturamento > 0 ? (totalFunil / d.metaFaturamento) * 100 : 0;
    return {
      orcQuinzenal, orcSemanal, orcDiario, diasRestantes,
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
      convLTIngPP, percentMetaFat,
    };
  }, [d]);

  const { order, editMode, toggleEdit, handleReorder, resetLayout } = useDashboardLayout("planning", DEFAULT_ORDER);
  const { visible, toggle: toggleVisibility, resetVisibility } = useChartVisibility("planning", ALL_SECTIONS);
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
            {d.metaFaturamento > 0 && (
              <div className="px-5 pb-5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Meta de Faturamento</span>
                  <span className="font-medium">{fmtBRL(d.metaFaturamento)}</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(c.percentMetaFat, 100)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{c.percentMetaFat.toFixed(0)}% da meta</p>
              </div>
            )}
          </CardSection>
        );
      case "venda-ingressos":
        return (
          <CardSection title="Meta de Ingressos">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground font-medium">Meta de Ingressos:</span>
                <NumberInput value={d.metaIngressos} onChange={(v: number) => update("metaIngressos", v)} className="w-24 text-center" />
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
                <NumberInput value={d.metaVendasPP} onChange={(v: number) => update("metaVendasPP", v)} className="w-24 text-center" />
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
                <NumberInput value={d.metaVendas} onChange={(v: number) => update("metaVendas", v)} className="w-24 text-center" />
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
            <Row label="Meta de Faturamento" editable editValue={d.metaFaturamento} onChange={(v: number) => update("metaFaturamento", v)} value={fmtBRL(d.metaFaturamento)} />
            <div className="border-b border-border/15" />
            <Row label="Orçamento Mensal" editable editValue={d.orcamentoMensal} onChange={(v: number) => update("orcamentoMensal", v)} value={fmtBRL(d.orcamentoMensal)} />
            <Row label="Orçamento Quinzenal" value={fmtBRL(c.orcQuinzenal)} />
            <Row label="Orçamento Semanal" value={fmtBRL(c.orcSemanal)} />
            <Row label="Orçamento Diário" value={fmtBRL(c.orcDiario)} />
            <div className="border-b border-border/15" />
            <div className="px-4 py-2 bg-muted/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Verba Meta Ads</p>
            </div>
            <Row label="Mensal" editable editValue={d.verbaMetaMensal} onChange={(v: number) => update("verbaMetaMensal", v)} value={fmtBRL(d.verbaMetaMensal)} />
            <Row label="Semanal" editable editValue={d.verbaMetaSemanal} onChange={(v: number) => update("verbaMetaSemanal", v)} value={fmtBRL(d.verbaMetaSemanal)} />
            <Row label="Diário" editable editValue={d.verbaMetaDiario} onChange={(v: number) => update("verbaMetaDiario", v)} value={fmtBRL(d.verbaMetaDiario)} />
            <div className="border-b border-border/15" />
            <div className="px-4 py-2 bg-muted/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Verba Google Ads / YT</p>
            </div>
            <Row label="Mensal" editable editValue={d.verbaGoogleMensal} onChange={(v: number) => update("verbaGoogleMensal", v)} value={fmtBRL(d.verbaGoogleMensal)} />
            <Row label="Semanal" editable editValue={d.verbaGoogleSemanal} onChange={(v: number) => update("verbaGoogleSemanal", v)} value={fmtBRL(d.verbaGoogleSemanal)} />
            <Row label="Diário" editable editValue={d.verbaGoogleDiario} onChange={(v: number) => update("verbaGoogleDiario", v)} value={fmtBRL(d.verbaGoogleDiario)} />
            <div className="border-b border-border/15" />
            <Row label="Dia Atual" editable editValue={d.diaAtual} onChange={(v: number) => update("diaAtual", v)} value={d.diaAtual} inputType="int" />
            <Row label="Total de Dias do Mês" editable editValue={d.diasMes} onChange={(v: number) => update("diasMes", v)} value={d.diasMes} inputType="int" />
            <Row label="Dias Restantes" value={c.diasRestantes} />
          </CardSection>
        );
      case "simulacao":
        return (
          <CardSection title="Simulação Mensal">
            <Row label="CPM" editable editValue={d.cpm} onChange={(v: number) => update("cpm", v)} value={fmtBRL(d.cpm)} />
            <Row label="CTR" editable editValue={d.ctr} onChange={(v: number) => update("ctr", v)} value={`${d.ctr}%`} inputType="percent" />
            <Row label="Connect Rate" editable editValue={d.connectRate} onChange={(v: number) => update("connectRate", v)} value={`${d.connectRate}%`} inputType="percent" />
            <Row label="Tx. Conv. Página > Compra" editable editValue={d.txConvPaginaCompra} onChange={(v: number) => update("txConvPaginaCompra", v)} value={`${d.txConvPaginaCompra}%`} inputType="percent" />
            <Row label="Previsão de CPA" value={fmtBRL(c.previsaoCPA)} />
            <Row label="Previsão de Vendas" value={c.previsaoVendas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} />
            <Row label="Ticket Médio" value={fmtBRL(c.ticketMedioSim)} />
            <Row label="Faturamento" value={fmtBRL(c.fatSim)} />
            <Row label="ROAS" value={c.roasSim.toFixed(2)} />
            <Row label="Conv. Ingressos → PP" value={c.convLTIngPP > 0 ? `${c.convLTIngPP.toFixed(1)}%` : "—"} />
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
                  <BRLInput value={d.simBudget} onChange={(v: number) => update("simBudget", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">CPM (R$)</p>
                  <BRLInput value={d.simCpm} onChange={(v: number) => update("simCpm", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">CTR (%)</p>
                  <PercentInput value={d.simCtr} onChange={(v: number) => update("simCtr", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Tx. Conv. (%)</p>
                  <PercentInput value={d.simConvRate} onChange={(v: number) => update("simConvRate", v)} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Ticket (R$)</p>
                  <BRLInput value={d.simTicket} onChange={(v: number) => update("simTicket", v)} />
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
                <div className="px-1"><BRLInput value={d[row.tKey]} onChange={(v: number) => update(row.tKey, v)} /></div>
                <ReadCell value={`${row.conv.toFixed(1)}%`} />
                <div className="px-1"><NumberInput value={d[row.vKey]} onChange={(v: number) => update(row.vKey, v)} /></div>
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
                <div className="px-1"><BRLInput value={d[row.tKey]} onChange={(v: number) => update(row.tKey, v)} /></div>
                <ReadCell value={`${row.conv.toFixed(1)}%`} />
                <div className="px-1"><NumberInput value={d[row.vKey]} onChange={(v: number) => update(row.vKey, v)} /></div>
                <ReadCell value={fmtBRL(row.fat)} />
              </div>
            ))}
            <div className="grid grid-cols-6 text-[11px] border-b border-border/20 items-center">
              <div className="px-2 py-0.5 font-medium text-[10px]">UPSELL</div>
              <div className="px-1"><EditCell value={d.upsellNome} onChange={(v: string) => update("upsellNome", v)} type="text" className="text-left text-[10px]" /></div>
              <div className="px-1"><BRLInput value={d.upsellTicket} onChange={(v: number) => update("upsellTicket", v)} /></div>
              <ReadCell value="—" />
              <div className="px-1"><NumberInput value={d.upsellVendas} onChange={(v: number) => update("upsellVendas", v)} /></div>
              <ReadCell value={fmtBRL(c.fatUpsell)} />
            </div>
            <div className="grid grid-cols-6 text-[11px] border-b border-border/20 items-center">
              <div className="px-2 py-0.5 font-medium text-[10px]">PRINCIPAL</div>
              <div className="px-1"><EditCell value={d.ppNome} onChange={(v: string) => update("ppNome", v)} type="text" className="text-left text-[10px]" /></div>
              <div className="px-1"><BRLInput value={d.ppTicket} onChange={(v: number) => update("ppTicket", v)} /></div>
              <ReadCell value="—" />
              <div className="px-1"><NumberInput value={d.ppVendas} onChange={(v: number) => update("ppVendas", v)} /></div>
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
              <Row label="Acessos Página" editable editValue={d.acessosPagina} onChange={(v: number) => update("acessosPagina", v)} value={d.acessosPagina} inputType="int" />
              <Row label="Acessos Checkout" editable editValue={d.acessosCheckout} onChange={(v: number) => update("acessosCheckout", v)} value={d.acessosCheckout} inputType="int" />
              <Row label="CAC" value={c.cac > 0 ? fmtBRL(c.cac) : "—"} highlight />
              <Row label="Tx. Pág. > Checkout" value={c.convPagCheckout > 0 ? `${c.convPagCheckout.toFixed(1)}%` : "—"} />
              <Row label="Tx. Checkout > Compra" value={c.convCheckoutCompra > 0 ? `${c.convCheckoutCompra.toFixed(1)}%` : "—"} />
              <Row label="Tx. Pág. > Compra" value={c.convPagCompra > 0 ? `${c.convPagCompra.toFixed(1)}%` : "—"} />
            </CardSection>
            <CardSection title="Produto Principal">
              <Row label="Ticket Médio" value={d.ppTicket > 0 ? fmtBRL(d.ppTicket) : "—"} />
              <Row label="Acessos Página" editable editValue={d.ppAcessosPagina} onChange={(v: number) => update("ppAcessosPagina", v)} value={d.ppAcessosPagina} inputType="int" />
              <Row label="Acessos Checkout" editable editValue={d.ppAcessosCheckout} onChange={(v: number) => update("ppAcessosCheckout", v)} value={d.ppAcessosCheckout} inputType="int" />
              <Row label="CAC" value={d.ppVendas > 0 ? fmtBRL(c.ppCac) : "—"} highlight />
              <Row label="Tx. Pág. > Checkout" value={c.ppConvPagCheckout > 0 ? `${c.ppConvPagCheckout.toFixed(1)}%` : "—"} />
              <Row label="Tx. Checkout > Compra" value={c.ppConvCheckoutCompra > 0 ? `${c.ppConvCheckoutCompra.toFixed(1)}%` : "—"} />
              <Row label="Tx. Pág. > Compra" value={d.ppAcessosPagina > 0 ? `${c.ppConvPagCompra.toFixed(1)}%` : "—"} />
            </CardSection>
          </div>
        );
      case "gerais":
        return (
          <CardSection title="Resultados Gerais">
            <Row label="Faturamento" value={fmtBRL(c.totalFunil)} highlight />
            <Row label="Investimento" editable editValue={d.investimentoGasto} onChange={(v: number) => update("investimentoGasto", v)} value={fmtBRL(d.investimentoGasto)} />
            <Row label="ROAS" value={c.roas.toFixed(2)} />
            <Row label="Conv. Ingressos → PP" value={c.convLTIngPP > 0 ? `${c.convLTIngPP.toFixed(1)}%` : "0%"} />
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
                <div className="w-14"><NumberInput value={d.reembolsosLT} onChange={(v: number) => update("reembolsosLT", v)} /></div>
                <span className="text-xs w-14 text-right">{c.taxaReembolsoLT.toFixed(1)}%</span>
              </div>
            </div>
            <div className="border-b border-border/20 px-3 py-1.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">Order Bumps</span>
              <div className="flex items-center gap-2">
                <div className="w-14"><NumberInput value={d.reembolsosOB} onChange={(v: number) => update("reembolsosOB", v)} /></div>
                <span className="text-xs w-14 text-right">{c.taxaReembolsoOB.toFixed(1)}%</span>
              </div>
            </div>
            <div className="px-3 py-1.5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">Produto Principal</span>
              <div className="flex items-center gap-2">
                <div className="w-14"><NumberInput value={d.reembolsosPP} onChange={(v: number) => update("reembolsosPP", v)} /></div>
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

  // Build export data
  const exportData = useMemo(() => {
    const rows: Record<string, any>[] = [
      { seção: "Resultados", Métrica: "Investimento Total", Valor: fmtBRL(d.investimentoGasto) },
      { seção: "Resultados", Métrica: "Faturamento Total", Valor: fmtBRL(c.totalFunil) },
      { seção: "Resultados", Métrica: "ROAS", Valor: c.roas.toFixed(2) },
      { seção: "Resultados", Métrica: "Meta de Faturamento", Valor: fmtBRL(d.metaFaturamento) },
      { seção: "Investimento", Métrica: "Orçamento Mensal", Valor: fmtBRL(d.orcamentoMensal) },
      { seção: "Investimento", Métrica: "Orçamento Quinzenal", Valor: fmtBRL(c.orcQuinzenal) },
      { seção: "Investimento", Métrica: "Orçamento Semanal", Valor: fmtBRL(c.orcSemanal) },
      { seção: "Investimento", Métrica: "Orçamento Diário", Valor: fmtBRL(c.orcDiario) },
      { seção: "Investimento", Métrica: "Verba Meta Ads (Mensal)", Valor: fmtBRL(d.verbaMetaMensal) },
      { seção: "Investimento", Métrica: "Verba Meta Ads (Semanal)", Valor: fmtBRL(d.verbaMetaSemanal) },
      { seção: "Investimento", Métrica: "Verba Meta Ads (Diário)", Valor: fmtBRL(d.verbaMetaDiario) },
      { seção: "Investimento", Métrica: "Verba Google/YT (Mensal)", Valor: fmtBRL(d.verbaGoogleMensal) },
      { seção: "Investimento", Métrica: "Verba Google/YT (Semanal)", Valor: fmtBRL(d.verbaGoogleSemanal) },
      { seção: "Investimento", Métrica: "Verba Google/YT (Diário)", Valor: fmtBRL(d.verbaGoogleDiario) },
      { seção: "Simulação", Métrica: "CPM", Valor: fmtBRL(d.cpm) },
      { seção: "Simulação", Métrica: "CTR", Valor: `${d.ctr}%` },
      { seção: "Simulação", Métrica: "Previsão Vendas", Valor: c.previsaoVendas.toFixed(1) },
      { seção: "Simulação", Métrica: "ROAS Previsto", Valor: c.roasSim.toFixed(2) },
      { seção: "Funil", Métrica: d.ltNome || "Low Ticket", Valor: `${d.ltVendas} vendas — ${fmtBRL(c.fatLT)}` },
      { seção: "Funil", Métrica: d.lt2Nome || "Low Ticket 2", Valor: `${d.lt2Vendas} vendas — ${fmtBRL(c.fatLT2)}` },
      { seção: "Funil", Métrica: d.ob1Nome || "Order Bump 1", Valor: `${d.ob1Vendas} vendas — ${fmtBRL(c.fatOB1)}` },
      { seção: "Funil", Métrica: d.ob2Nome || "Order Bump 2", Valor: `${d.ob2Vendas} vendas — ${fmtBRL(c.fatOB2)}` },
      { seção: "Funil", Métrica: d.ob3Nome || "Order Bump 3", Valor: `${d.ob3Vendas} vendas — ${fmtBRL(c.fatOB3)}` },
      { seção: "Funil", Métrica: d.upsellNome || "Upsell", Valor: `${d.upsellVendas} vendas — ${fmtBRL(c.fatUpsell)}` },
      { seção: "Funil", Métrica: d.ppNome || "Produto Principal", Valor: `${d.ppVendas} vendas — ${fmtBRL(c.fatPP)}` },
      { seção: "Funil", Métrica: "TOTAL FUNIL", Valor: fmtBRL(c.totalFunil) },
      { seção: "Gerais", Métrica: "Vendas/Dia", Valor: c.vendasMediaDia.toFixed(1) },
      { seção: "Gerais", Métrica: "Faltou Investir", Valor: fmtBRL(c.faltouInvestir) },
    ];
    return rows;
  }, [d, c]);

  const exportKpis = useMemo(() => [
    { label: "Investimento", value: fmtBRL(d.investimentoGasto) },
    { label: "Faturamento", value: fmtBRL(c.totalFunil) },
    { label: "ROAS", value: c.roas.toFixed(2) },
    { label: "Vendas LT", value: String(c.totalVendasLT) },
  ], [d, c]);

  const sideBySidePairs: Record<string, string> = { investimento: "simulacao" };

  // Styled Excel export matching the uploaded spreadsheet format
  const handleExportExcel = useCallback(async () => {
    const ExcelJS = await import("exceljs");
    const { formatDateForFilename } = await import("@/lib/csv");
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Planejamento");

    // Colors
    const DARK_BG = "FF0F0F12";
    const CARD_BG = "FF16161C";
    const HEADER_BG = "FF1F1F28";
    const RED_ACCENT = "FFC82828";
    const GREEN = "FF22C55E";
    const AMBER = "FFFBBF24";
    const BLUE = "FF3B82F6";
    const WHITE = "FFFFFFFF";
    const GRAY = "FF8C8C96";
    const LIGHT = "FFE6E6EB";
    const BORDER_COLOR = "FF2D2D32";

    const thin = { style: "thin" as const, color: { argb: BORDER_COLOR } };
    const cellBorder = { top: thin, bottom: thin, left: thin, right: thin };

    const setCell = (row: number, col: number, value: string | number, opts?: { bg?: string; fg?: string; bold?: boolean; size?: number; align?: "left" | "center" | "right" }) => {
      const cell = ws.getCell(row, col);
      cell.value = value;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts?.bg || DARK_BG } };
      cell.font = { bold: opts?.bold || false, color: { argb: opts?.fg || LIGHT }, size: opts?.size || 10, name: "Calibri" };
      cell.alignment = { horizontal: opts?.align || "left", vertical: "middle" };
      cell.border = cellBorder;
    };

    // Set column widths
    for (let i = 1; i <= 19; i++) ws.getColumn(i).width = 16;
    ws.getColumn(1).width = 28;

    // ─── Title row ───
    let r = 1;
    ws.mergeCells(r, 1, r, 10);
    setCell(r, 1, "Planejamento Lançamento Pago", { bg: RED_ACCENT, fg: WHITE, bold: true, size: 14 });
    r += 2;

    // ─── Section: Planejamento Investimento ───
    setCell(r, 1, "Planejamento Investimento de Tráfego", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 1, r, 3);
    setCell(r, 5, "Lançamento Pago", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 5, r, 10);
    setCell(r, 12, "Meta de Vendas de Ingressos", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 12, r, 14);
    r++;

    const investRows = [
      ["Orçamento Mensal", fmtBRL(d.orcamentoMensal)],
      ["Orçamento Quinzenal", fmtBRL(c.orcQuinzenal)],
      ["Orçamento Semanal", fmtBRL(c.orcSemanal)],
      ["Orçamento Diário", fmtBRL(c.orcDiario)],
      ["Verba Meta Ads (Mensal)", fmtBRL(d.verbaMetaMensal)],
      ["Verba Meta Ads (Semanal)", fmtBRL(d.verbaMetaSemanal)],
      ["Verba Meta Ads (Diário)", fmtBRL(d.verbaMetaDiario)],
      ["Verba Google/YT (Mensal)", fmtBRL(d.verbaGoogleMensal)],
      ["Verba Google/YT (Semanal)", fmtBRL(d.verbaGoogleSemanal)],
      ["Verba Google/YT (Diário)", fmtBRL(d.verbaGoogleDiario)],
      ["Dia Atual", d.diaAtual],
      ["Total de Dias do Mês Atual", d.diasMes],
      ["Dias Restantes", c.diasRestantes],
    ];

    // Funil header
    setCell(r, 5, "Nome", { bg: HEADER_BG, fg: WHITE, bold: true, align: "center" });
    setCell(r, 6, "Ticket", { bg: HEADER_BG, fg: WHITE, bold: true, align: "right" });
    setCell(r, 7, "Conversão", { bg: HEADER_BG, fg: WHITE, bold: true, align: "right" });
    setCell(r, 8, "Vendas", { bg: HEADER_BG, fg: WHITE, bold: true, align: "right" });
    setCell(r, 9, "Faturamento", { bg: HEADER_BG, fg: WHITE, bold: true, align: "right" });
    setCell(r, 10, "Total", { bg: HEADER_BG, fg: WHITE, bold: true, align: "right" });

    // Meta de ingressos
    setCell(r, 12, String(d.metaIngressos || 0), { bg: CARD_BG, fg: GREEN, bold: true, size: 14, align: "center" });

    r++;

    const funilRows = [
      { label: d.ltNome || "Low Ticket", ticket: fmtBRL(d.ltTicket), conv: `${c.convLT.toFixed(2)}%`, vendas: d.ltVendas, fat: fmtBRL(c.fatLT) },
      { label: d.lt2Nome || "Low Ticket 2", ticket: fmtBRL(d.lt2Ticket), conv: "0.00%", vendas: d.lt2Vendas, fat: fmtBRL(c.fatLT2) },
      { label: d.ob1Nome || "Order Bump 1", ticket: fmtBRL(d.ob1Ticket), conv: `${c.convOB1.toFixed(2)}%`, vendas: d.ob1Vendas, fat: fmtBRL(c.fatOB1) },
      { label: d.ob2Nome || "Order Bump 2", ticket: fmtBRL(d.ob2Ticket), conv: `${c.convOB2.toFixed(2)}%`, vendas: d.ob2Vendas, fat: fmtBRL(c.fatOB2) },
      { label: d.ob3Nome || "Order Bump 3", ticket: fmtBRL(d.ob3Ticket), conv: `${c.convOB3.toFixed(2)}%`, vendas: d.ob3Vendas, fat: fmtBRL(c.fatOB3) },
      { label: d.upsellNome || "Upsell", ticket: fmtBRL(d.upsellTicket), conv: "0.00%", vendas: d.upsellVendas, fat: fmtBRL(c.fatUpsell) },
      { label: d.ppNome || "Produto Principal", ticket: fmtBRL(d.ppTicket), conv: "0.00%", vendas: d.ppVendas, fat: fmtBRL(c.fatPP) },
    ];

    let runningTotal = 0;
    investRows.forEach((ir, i) => {
      setCell(r + i, 1, ir[0] as string, { bg: CARD_BG, fg: GRAY });
      setCell(r + i, 2, ir[1] as string | number, { bg: CARD_BG, fg: WHITE, bold: true, align: "right" });
    });

    funilRows.forEach((fr, i) => {
      const fatNum = parseFloat(String(fr.fat).replace("R$ ", "").replace(/\./g, "").replace(",", ".")) || 0;
      runningTotal += fatNum;
      if (r + i < r + investRows.length) {
        setCell(r + i, 5, fr.label, { bg: CARD_BG, fg: LIGHT, align: "center" });
        setCell(r + i, 6, fr.ticket, { bg: CARD_BG, fg: WHITE, align: "right" });
        setCell(r + i, 7, fr.conv, { bg: CARD_BG, fg: WHITE, align: "right" });
        setCell(r + i, 8, fr.vendas, { bg: CARD_BG, fg: WHITE, align: "right" });
        setCell(r + i, 9, fr.fat, { bg: CARD_BG, fg: WHITE, align: "right" });
        setCell(r + i, 10, fmtBRL(runningTotal), { bg: CARD_BG, fg: GRAY, align: "right" });
      }

      // Meta de ingressos progress
      if (i === 0) {
        setCell(r + i, 12, "Porcentagem da Meta:", { bg: CARD_BG, fg: GRAY });
        setCell(r + i, 13, `${c.percentMetaIngressos.toFixed(0)}%`, { bg: CARD_BG, fg: c.percentMetaIngressos >= 100 ? GREEN : AMBER, bold: true, align: "center" });
      }
    });

    r += Math.max(investRows.length, funilRows.length) + 2;

    // ─── Simulação ───
    setCell(r, 1, "Simulação Mensal", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 1, r, 3);
    setCell(r, 5, "Low Ticket", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 5, r, 7);
    setCell(r, 8, "Produto Principal", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 8, r, 10);
    setCell(r, 12, "Resultados das Vendas", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 12, r, 14);
    r++;

    const simRows = [
      ["CPM", fmtBRL(d.cpm)],
      ["CTR", `${d.ctr.toFixed(2)}%`],
      ["Connect Rate", `${d.connectRate.toFixed(2)}%`],
      ["Tx. Conv. Página > Compra", `${d.txConvPaginaCompra.toFixed(2)}%`],
      ["Previsão de CPA", fmtBRL(c.previsaoCPA)],
      ["Previsão de Vendas", c.previsaoVendas.toFixed(1)],
      ["Ticket Médio", fmtBRL(c.ticketMedioSim)],
      ["Faturamento", fmtBRL(c.fatSim)],
      ["ROAS", c.roasSim.toFixed(2)],
      ["Conv. Ingressos → PP", `${c.convLTIngPP.toFixed(2)}%`],
      ["Líquido", fmtBRL(c.liquidoSim)],
    ];

    const ltDetailRows = [
      ["Ticket Médio", c.ticketMedioLT > 0 ? fmtBRL(c.ticketMedioLT) : "—"],
      ["Acessos a Página", d.acessosPagina],
      ["Acessos Checkout", d.acessosCheckout],
      ["CAC", c.cac > 0 ? fmtBRL(c.cac) : "—"],
      ["Tx. Pág. > Checkout", `${c.convPagCheckout.toFixed(2)}%`],
      ["Tx. Checkout > Compra", `${c.convCheckoutCompra.toFixed(2)}%`],
      ["Tx. Pág. > Compra", `${c.convPagCompra.toFixed(2)}%`],
    ];

    const ppDetailRows = [
      ["Ticket Médio", d.ppTicket > 0 ? fmtBRL(d.ppTicket) : "—"],
      ["Acessos a Página", d.ppAcessosPagina],
      ["Acessos Checkout", d.ppAcessosCheckout],
      ["CAC", d.ppVendas > 0 ? fmtBRL(c.ppCac) : "—"],
      ["Tx. Pág. > Checkout", `${c.ppConvPagCheckout.toFixed(2)}%`],
      ["Tx. Checkout > Compra", `${c.ppConvCheckoutCompra.toFixed(2)}%`],
      ["Tx. Pág. > Compra", `${c.ppConvPagCompra.toFixed(2)}%`],
    ];

    const resultRows = [
      ["Faturamento", fmtBRL(c.totalFunil)],
      ["Investimento", fmtBRL(d.investimentoGasto)],
      ["ROAS", c.roas.toFixed(2)],
      ["Vendas/Dia", c.vendasMediaDia.toFixed(1)],
      ["Faltou Investir", fmtBRL(c.faltouInvestir)],
    ];

    const maxRows = Math.max(simRows.length, ltDetailRows.length, resultRows.length);
    for (let i = 0; i < maxRows; i++) {
      if (simRows[i]) {
        setCell(r + i, 1, simRows[i][0] as string, { bg: CARD_BG, fg: GRAY });
        setCell(r + i, 2, simRows[i][1] as string, { bg: CARD_BG, fg: i === maxRows - 1 && c.liquidoSim < 0 ? "FFEF4444" : WHITE, bold: true, align: "right" });
      }
      if (ltDetailRows[i]) {
        setCell(r + i, 5, ltDetailRows[i][0] as string, { bg: CARD_BG, fg: GRAY });
        setCell(r + i, 6, String(ltDetailRows[i][1]), { bg: CARD_BG, fg: WHITE, align: "right" });
      }
      if (ppDetailRows[i]) {
        setCell(r + i, 8, ppDetailRows[i][0] as string, { bg: CARD_BG, fg: GRAY });
        setCell(r + i, 9, String(ppDetailRows[i][1]), { bg: CARD_BG, fg: WHITE, align: "right" });
      }
      if (resultRows[i]) {
        setCell(r + i, 12, resultRows[i][0] as string, { bg: CARD_BG, fg: GRAY });
        setCell(r + i, 13, resultRows[i][1] as string, { bg: CARD_BG, fg: WHITE, bold: true, align: "right" });
      }
    }

    r += maxRows + 2;

    // ─── Referência de métricas ───
    setCell(r, 1, "Referência de Métricas", { bg: HEADER_BG, fg: WHITE, bold: true, size: 11 });
    ws.mergeCells(r, 1, r, 5);
    r++;
    setCell(r, 1, "MÉTRICA", { bg: HEADER_BG, fg: WHITE, bold: true, align: "center" });
    setCell(r, 2, "RUIM", { bg: HEADER_BG, fg: "FFEF4444", bold: true, align: "center" });
    setCell(r, 3, "ACEITÁVEL", { bg: HEADER_BG, fg: "FFEAB308", bold: true, align: "center" });
    setCell(r, 4, "BOM", { bg: HEADER_BG, fg: GREEN, bold: true, align: "center" });
    setCell(r, 5, "EXCELENTE", { bg: HEADER_BG, fg: BLUE, bold: true, align: "center" });
    r++;

    const refRows = [
      ["CPM", "> R$50", "R$35–50", "R$25–35", "< R$25"],
      ["CTR", "< 1,0%", "1,0–1,4%", "1,5–2,0%", "> 2,0%"],
      ["Connect Rate", "< 65%", "65–75%", "75–85%", "> 85%"],
      ["Conv. Página → Checkout", "< 25%", "25–35%", "35–50%", "> 50%"],
      ["Conv. Checkout → Compra", "< 15%", "15–20%", "20–30%", "> 30%"],
      ["Conv. Página → Compra", "< 5%", "5–7%", "7–10%", "> 10%"],
      ["CPA (Low Ticket)", "> Ticket", "≈ Ticket", "< Ticket", "≤ 70% Ticket"],
      ["ROAS", "< 1.0", "1.0–1.2", "1.2–1.6", "> 1.6"],
    ];

    refRows.forEach((row, i) => {
      setCell(r + i, 1, row[0], { bg: CARD_BG, fg: WHITE, bold: true });
      setCell(r + i, 2, row[1], { bg: CARD_BG, fg: "FFEF4444", align: "center" });
      setCell(r + i, 3, row[2], { bg: CARD_BG, fg: "FFEAB308", align: "center" });
      setCell(r + i, 4, row[3], { bg: CARD_BG, fg: GREEN, align: "center" });
      setCell(r + i, 5, row[4], { bg: CARD_BG, fg: BLUE, align: "center" });
    });

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planejamento_${formatDateForFilename()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [d, c]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Planejamento LowTicket / Lançamento Pago</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Campos com fundo escuro são editáveis. Dados salvos automaticamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            data={exportData}
            filename="planejamento"
            title="Planejamento LowTicket"
            kpis={exportKpis}
          />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleExportExcel}>
            <Calculator className="h-3.5 w-3.5" /> Exportar Excel Completo
          </Button>
          <ChartVisibilityMenu sections={ALL_SECTIONS} visible={visible} onToggle={toggleVisibility} />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { resetLayout(); resetVisibility(); }}>
            <RotateCcw className="h-3.5 w-3.5" />
            Resetar
          </Button>
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
            {(() => {
              const rendered = new Set<string>();
              return visibleOrder.map(id => {
                if (rendered.has(id)) return null;
                rendered.add(id);

                const pairedId = sideBySidePairs[id];
                if (pairedId && isVisible(pairedId) && !rendered.has(pairedId)) {
                  rendered.add(pairedId);
                  return (
                    <div key={id} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <SortableSection id={id} editMode={editMode}>
                        {renderSection(id)}
                      </SortableSection>
                      <SortableSection id={pairedId} editMode={editMode}>
                        {renderSection(pairedId)}
                      </SortableSection>
                    </div>
                  );
                }

                return (
                  <SortableSection key={id} id={id} editMode={editMode}>
                    {renderSection(id)}
                  </SortableSection>
                );
              });
            })()}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
