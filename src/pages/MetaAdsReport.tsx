import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import ExportMenu from "@/components/ExportMenu";
import ShareReportButton from "@/components/ShareReportButton";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { SortableSection } from "@/components/SortableSection";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, LabelList,
} from "recharts";
import { DollarSign, MousePointerClick, Eye, Users, Target, Percent, HelpCircle, GripVertical } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SECTION_IDS = ["kpis", "funnel", "cost-metrics", "trend-chart", "best-ads", "campaign-table", "tax-card"];

const SECTIONS = [
  { id: "kpis", label: "KPIs Principais" },
  { id: "funnel", label: "Funil de Tráfego" },
  { id: "cost-metrics", label: "Custo por Lead / CPC" },
  { id: "trend-chart", label: "Gráfico de Tendência" },
  { id: "best-ads", label: "Melhores Anúncios" },
  { id: "campaign-table", label: "Tabela de Campanhas" },
  { id: "tax-card", label: "Imposto Meta Ads" },
];

// Mock data
const mockKpis = {
  investment: 9645.35, leads: 363, clicks: 25000, impressions: 2408588, reach: 784000,
  prevInvestment: 3905, prevLeads: 104, prevClicks: 16000, prevImpressions: 690000, prevReach: 310000,
};

const mockTrend = [
  { date: "01/07", investment: 484, leads: 6, cpl: 80.67 },
  { date: "03/07", investment: 580, leads: 7, cpl: 82.86 },
  { date: "05/07", investment: 620, leads: 5, cpl: 124.00 },
  { date: "07/07", investment: 390, leads: 6, cpl: 65.00 },
  { date: "09/07", investment: 710, leads: 7, cpl: 101.43 },
  { date: "11/07", investment: 850, leads: 6, cpl: 141.67 },
  { date: "13/07", investment: 1938, leads: 5, cpl: 387.60 },
  { date: "15/07", investment: 660, leads: 8, cpl: 82.50 },
  { date: "17/07", investment: 450, leads: 5, cpl: 90.00 },
  { date: "19/07", investment: 500, leads: 6, cpl: 83.33 },
  { date: "21/07", investment: 350, leads: 4, cpl: 87.50 },
  { date: "23/07", investment: 420, leads: 5, cpl: 84.00 },
  { date: "25/07", investment: 693, leads: 2, cpl: 346.50 },
];

const mockAds = [
  { name: "Criativo 02 - Ao vivo", value: 33.9 },
  { name: "Criativo 04 - Recado", value: 10.7 },
  { name: "Criativo 03 - Direto", value: 10.7 },
  { name: "Criativo 02 - Apresenta", value: 10.7 },
  { name: "Criativo 01 - Vem aí", value: 7.4 },
  { name: "Criativo 06 - Direto", value: 7.4 },
];

const mockCampaigns = [
  { campaign: "02_[VENDAS] - 03/08...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 04 - Recado ...", investimento: 304.23, compras: 24 },
  { campaign: "02_[VENDAS] - 03/08...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 03 - Direto —...", investimento: 321.55, compras: 23 },
  { campaign: "02_[JS] [VENDAS] - 0...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 02 - Ao vivo ...", investimento: 358.47, compras: 22 },
  { campaign: "02_[JS] [LV] [VENDAS...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 06 - Direto —...", investimento: 245.32, compras: 17 },
  { campaign: "02_[LOUNGE] [VEND...", conjunto: "03_PQ - Envolvimento", anuncio: "Criativo 02 - SÁBAD...", investimento: 207.64, compras: 16 },
];

const PALETTE = [
  "hsl(0, 90%, 50%)", "hsl(5, 85%, 48%)", "hsl(12, 80%, 46%)",
  "hsl(18, 85%, 50%)", "hsl(25, 90%, 52%)", "hsl(32, 92%, 54%)",
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "hsla(240, 5%, 7%, 0.92)",
  border: "1px solid hsla(240, 4%, 20%, 0.4)",
  borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))",
  padding: "10px 14px", boxShadow: "var(--shadow-card)",
};
const TICK_STYLE = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

const KPI_HELP: Record<string, string> = {
  "Investimento": "Valor total gasto em anúncios no período selecionado.",
  "Compras": "Número total de conversões (vendas) atribuídas aos anúncios.",
  "Impressões": "Quantas vezes seus anúncios foram exibidos na tela.",
  "Cliques": "Número de cliques no link dos anúncios.",
  "Alcance": "Quantidade de pessoas únicas que viram seus anúncios.",
  "Custo por lead": "Investimento total dividido pelo número de leads gerados.",
  "CPC": "Custo por clique — investimento dividido pelo número de cliques.",
  "CTR": "Taxa de cliques — percentual de impressões que geraram cliques.",
  "Frequência": "Média de vezes que cada pessoa viu seu anúncio.",
  "CPM": "Custo por mil impressões.",
};

const InfoIcon = ({ label }: { label: string }) => (
  <UITooltip>
    <TooltipTrigger asChild>
      <button className="text-muted-foreground hover:text-foreground transition-colors">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs max-w-[200px]">{KPI_HELP[label] || label}</TooltipContent>
  </UITooltip>
);

const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
const changeType = (v: number): "positive" | "negative" | "neutral" => v > 0 ? "positive" : v < 0 ? "negative" : "neutral";

const CARD_CLASS = "rounded-xl border border-border/30 card-shadow glass";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "hsl(var(--foreground))", marginBottom: 4, fontWeight: 500 }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ fontSize: 12 }}>
          <span style={{ color: entry.color, marginRight: 6 }}>●</span>
          {entry.name}: {typeof entry.value === "number" && entry.name !== "Leads" ? fmt(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function MetaAdsReport() {
  const { visible, toggle, isVisible } = useChartVisibility("meta-ads", SECTIONS);
  const { order, editMode, toggleEdit, handleReorder, resetLayout } = useDashboardLayout("meta-ads", SECTION_IDS);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const cpl = mockKpis.leads > 0 ? mockKpis.investment / mockKpis.leads : 0;
  const cpc = mockKpis.clicks > 0 ? mockKpis.investment / mockKpis.clicks : 0;
  const ctr = mockKpis.impressions > 0 ? (mockKpis.clicks / mockKpis.impressions) * 100 : 0;
  const cpm = mockKpis.impressions > 0 ? (mockKpis.investment / mockKpis.impressions) * 1000 : 0;
  const frequency = mockKpis.reach > 0 ? mockKpis.impressions / mockKpis.reach : 0;

  const taxRate = 0.0638 + 0.05;
  const taxAmount = mockKpis.investment * taxRate;

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(String(active.id));
      const newIndex = order.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...order];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, String(active.id));
        handleReorder(newOrder);
      }
    }
  };

  const renderSection = (sectionId: string) => {
    if (!isVisible(sectionId)) return null;
    switch (sectionId) {
      case "kpis":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Investimento" value={fmt(mockKpis.investment)} icon={DollarSign}
              change={fmtPct(pctChange(mockKpis.investment, mockKpis.prevInvestment))}
              changeType={changeType(pctChange(mockKpis.investment, mockKpis.prevInvestment))}
              helpText={KPI_HELP["Investimento"]} />
            <MetricCard label="Compras" value={mockKpis.leads.toLocaleString("pt-BR")} icon={Target}
              change={fmtPct(pctChange(mockKpis.leads, mockKpis.prevLeads))}
              changeType={changeType(pctChange(mockKpis.leads, mockKpis.prevLeads))}
              helpText={KPI_HELP["Compras"]} />
            <MetricCard label="Impressões" value={mockKpis.impressions.toLocaleString("pt-BR")} icon={Eye}
              change={fmtPct(pctChange(mockKpis.impressions, mockKpis.prevImpressions))}
              changeType={changeType(pctChange(mockKpis.impressions, mockKpis.prevImpressions))}
              helpText={KPI_HELP["Impressões"]} />
            <MetricCard label="Cliques" value={mockKpis.clicks.toLocaleString("pt-BR")} icon={MousePointerClick}
              change={fmtPct(pctChange(mockKpis.clicks, mockKpis.prevClicks))}
              changeType={changeType(pctChange(mockKpis.clicks, mockKpis.prevClicks))}
              helpText={KPI_HELP["Cliques"]} />
            <MetricCard label="Alcance" value={(mockKpis.reach / 1000).toFixed(0) + " mil"} icon={Users}
              change={fmtPct(pctChange(mockKpis.reach, mockKpis.prevReach))}
              changeType={changeType(pctChange(mockKpis.reach, mockKpis.prevReach))}
              helpText={KPI_HELP["Alcance"]} />
          </div>
        );

      case "funnel":
        return (
          <div className={`${CARD_CLASS} p-5`}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Funil de Tráfego
            </h3>
            <div className="flex flex-col items-center gap-2">
              {[
                { label: "Impressões", value: "2,4 mi", bg: "linear-gradient(180deg, hsl(0, 90%, 55%), hsl(0, 85%, 45%))" },
                { label: "Alcance", value: "784 mil", bg: "linear-gradient(180deg, hsl(5, 88%, 50%), hsl(8, 85%, 42%))" },
                { label: "Cliques", value: "25 mil", bg: "linear-gradient(180deg, hsl(10, 85%, 48%), hsl(15, 82%, 40%))" },
                { label: "Checkouts", value: "606", bg: "linear-gradient(180deg, hsl(18, 82%, 45%), hsl(22, 80%, 38%))" },
                { label: "Compras", value: "363", bg: "linear-gradient(180deg, hsl(25, 80%, 42%), hsl(30, 78%, 35%))" },
              ].map((step, i) => (
                <div key={i} className="text-center" style={{ width: `${100 - i * 15}%` }}>
                  <div className="py-2.5 rounded-lg font-bold text-lg border-0" style={{ background: step.bg, color: "hsl(0, 0%, 95%)" }}>
                    <div className="text-[10px] font-normal opacity-80">{step.label}</div>
                    {step.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center p-2 rounded-lg border border-border/20">
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">CTR <InfoIcon label="CTR" /></div>
                <div className="text-sm font-bold">{ctr.toFixed(2).replace(".", ",")}</div>
              </div>
              <div className="text-center p-2 rounded-lg border border-border/20">
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">Frequência <InfoIcon label="Frequência" /></div>
                <div className="text-sm font-bold">{frequency.toFixed(1).replace(".", ",")}</div>
              </div>
              <div className="text-center p-2 rounded-lg border border-border/20">
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">CPM <InfoIcon label="CPM" /></div>
                <div className="text-sm font-bold">{fmt(cpm)}</div>
              </div>
            </div>
          </div>
        );

      case "cost-metrics":
        return (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Custo por lead" value={fmt(cpl)} icon={DollarSign} helpText={KPI_HELP["Custo por lead"]}
              change="↑ R$ 4,44" changeType="negative" />
            <MetricCard label="CPC" value={fmt(cpc)} icon={MousePointerClick} helpText={KPI_HELP["CPC"]}
              change="↑ 25,5%" changeType="negative" />
          </div>
        );

      case "trend-chart":
        return (
          <div className={`${CARD_CLASS} p-4`}>
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Leads × Investimento × CPL
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={mockTrend}>
                <defs>
                  <linearGradient id="metaBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0, 90%, 50%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(0, 90%, 50%)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsla(0,0%,100%,0.03)" }} />
                <Bar yAxisId="left" dataKey="investment" fill="url(#metaBarGrad)" name="Investimento" radius={[4, 4, 0, 0]} barSize={18} />
                <Line yAxisId="right" dataKey="leads" stroke="hsl(5, 85%, 48%)" strokeWidth={2} name="Leads" dot={false} />
                <Line yAxisId="right" dataKey="cpl" stroke="hsl(25, 90%, 52%)" strokeWidth={2} name="CPL" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case "best-ads":
        return (
          <div className={`${CARD_CLASS} p-5`}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Melhores Anúncios
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(160, mockAds.length * 38)}>
              <BarChart data={mockAds} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
                <defs>
                  {mockAds.map((_, i) => (
                    <linearGradient key={`adGrad${i}`} id={`adGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={TICK_STYLE} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 14) + "…" : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Performance" radius={[0, 4, 4, 0]} barSize={22}>
                  {mockAds.map((_, i) => <Cell key={i} fill={`url(#adGrad-${i})`} />)}
                  <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: 600 }} formatter={(v: number) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case "tax-card":
        return (
          <div className={`${CARD_CLASS} p-5`}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              Imposto Meta Ads (estimativa)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Investimento Bruto</div>
                <div className="text-lg font-bold">{fmt(mockKpis.investment)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground mb-1">IOF (6,38%)</div>
                <div className="text-lg font-bold text-destructive">{fmt(mockKpis.investment * 0.0638)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground mb-1">ISS (5%)</div>
                <div className="text-lg font-bold text-destructive">{fmt(mockKpis.investment * 0.05)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Total Impostos</div>
                <div className="text-lg font-bold text-warning">{fmt(taxAmount)}</div>
              </div>
            </div>
          </div>
        );

      case "campaign-table":
        return (
          <div className={`${CARD_CLASS} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Campanhas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase">#</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase">Campanhas</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase">Conjuntos</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase">Anúncios</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase">Investimento</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase">Compras</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCampaigns.map((c, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-5 text-muted-foreground">{i + 1}.</td>
                      <td className="py-3 px-5 max-w-[160px] truncate font-medium">{c.campaign}</td>
                      <td className="py-3 px-5 max-w-[140px] truncate">{c.conjunto}</td>
                      <td className="py-3 px-5 max-w-[160px] truncate">{c.anuncio}</td>
                      <td className="py-3 px-5 text-right font-mono font-semibold">{fmt(c.investimento)}</td>
                      <td className="py-3 px-5 text-right font-mono font-bold">{c.compras}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Meta Ads"
      subtitle="Relatório de performance de anúncios"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={toggleEdit}
            >
              <GripVertical className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reordenar</span>
            </Button>
            <ChartVisibilityMenu sections={SECTIONS} visible={visible} onToggle={toggle} />
          </div>
          <ExportMenu
            data={mockCampaigns}
            filename="meta-ads-report"
            title="Meta Ads Report"
            size="default"
          />
          <ShareReportButton />
        </div>
      }
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {order.map((sectionId) => {
              const content = renderSection(sectionId);
              if (!content) return null;
              return (
                <SortableSection key={sectionId} id={sectionId} editMode={editMode}>
                  {content}
                </SortableSection>
              );
            })}

            <p className="text-[10px] text-muted-foreground text-center">
              ⚠️ Dados de demonstração — conecte o Meta Ads em Integrações para dados reais.
            </p>
          </div>
        </SortableContext>
      </DndContext>
    </DashboardLayout>
  );
}
