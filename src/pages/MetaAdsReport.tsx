import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line, Area,
} from "recharts";
import { DollarSign, MousePointerClick, Eye, Users, Target, TrendingUp, Percent } from "lucide-react";
import { useMemo } from "react";

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
  { name: "Outros", value: 19.2 },
];

const mockCampaigns = [
  { campaign: "02_[VENDAS] - 03/08...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 04 - Recado ...", investimento: 304.23, compras: 24 },
  { campaign: "02_[VENDAS] - 03/08...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 03 - Direto —...", investimento: 321.55, compras: 23 },
  { campaign: "02_[JS] [VENDAS] - 0...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 02 - Ao vivo ...", investimento: 358.47, compras: 22 },
  { campaign: "02_[JS] [LV] [VENDAS...", conjunto: "06_Externo - Interess...", anuncio: "Criativo 06 - Direto —...", investimento: 245.32, compras: 17 },
  { campaign: "02_[LOUNGE] [VEND...", conjunto: "03_PQ - Envolvimento", anuncio: "Criativo 02 - SÁBAD...", investimento: 207.64, compras: 16 },
];

const PIE_COLORS = [
  "hsl(0, 85%, 55%)", "hsl(340, 75%, 55%)", "hsl(20, 80%, 55%)",
  "hsl(200, 70%, 55%)", "hsl(280, 60%, 55%)", "hsl(160, 60%, 50%)", "hsl(45, 70%, 50%)",
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "hsla(240, 5%, 7%, 0.92)",
  border: "1px solid hsla(240, 4%, 20%, 0.4)",
  borderRadius: 8, fontSize: 12, color: "#fff",
  padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
};

const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
const changeType = (v: number): "positive" | "negative" | "neutral" => v > 0 ? "positive" : v < 0 ? "negative" : "neutral";

export default function MetaAdsReport() {
  const { visible, toggle, isVisible } = useChartVisibility("meta-ads", SECTIONS);

  const cpl = mockKpis.leads > 0 ? mockKpis.investment / mockKpis.leads : 0;
  const cpc = mockKpis.clicks > 0 ? mockKpis.investment / mockKpis.clicks : 0;
  const ctr = mockKpis.impressions > 0 ? (mockKpis.clicks / mockKpis.impressions) * 100 : 0;
  const cpm = mockKpis.impressions > 0 ? (mockKpis.investment / mockKpis.impressions) * 1000 : 0;
  const frequency = mockKpis.reach > 0 ? mockKpis.impressions / mockKpis.reach : 0;

  // Tax calculation (Meta Ads IOF + ISS approximation)
  const taxRate = 0.0638 + 0.05; // ~11.38% total (IOF 6.38% + ISS 5%)
  const taxAmount = mockKpis.investment * taxRate;

  return (
    <DashboardLayout
      title="Meta Ads"
      subtitle="Relatório de performance de anúncios"
      actions={<ChartVisibilityMenu sections={SECTIONS} visible={visible} onToggle={toggle} />}
    >
      <div className="space-y-6">
        {/* KPIs */}
        {isVisible("kpis") && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Investimento" value={fmt(mockKpis.investment)} icon={DollarSign}
              change={fmtPct(pctChange(mockKpis.investment, mockKpis.prevInvestment))}
              changeType={changeType(pctChange(mockKpis.investment, mockKpis.prevInvestment))} />
            <MetricCard label="Compras" value={mockKpis.leads.toLocaleString("pt-BR")} icon={Target}
              change={fmtPct(pctChange(mockKpis.leads, mockKpis.prevLeads))}
              changeType={changeType(pctChange(mockKpis.leads, mockKpis.prevLeads))} />
            <MetricCard label="Impressões" value={mockKpis.impressions.toLocaleString("pt-BR")} icon={Eye}
              change={fmtPct(pctChange(mockKpis.impressions, mockKpis.prevImpressions))}
              changeType={changeType(pctChange(mockKpis.impressions, mockKpis.prevImpressions))} />
            <MetricCard label="Cliques" value={mockKpis.clicks.toLocaleString("pt-BR")} icon={MousePointerClick}
              change={fmtPct(pctChange(mockKpis.clicks, mockKpis.prevClicks))}
              changeType={changeType(pctChange(mockKpis.clicks, mockKpis.prevClicks))} />
            <MetricCard label="Alcance" value={(mockKpis.reach / 1000).toFixed(0) + " mil"} icon={Users}
              change={fmtPct(pctChange(mockKpis.reach, mockKpis.prevReach))}
              changeType={changeType(pctChange(mockKpis.reach, mockKpis.prevReach))} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Funnel */}
          {isVisible("funnel") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-4">Funil de Tráfego</h3>
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
                  <div className="text-[10px] text-muted-foreground">CTR</div>
                  <div className="text-sm font-bold">{ctr.toFixed(2).replace(".", ",")}</div>
                </div>
                <div className="text-center p-2 rounded-lg border border-border/20">
                  <div className="text-[10px] text-muted-foreground">Frequência</div>
                  <div className="text-sm font-bold">{frequency.toFixed(1).replace(".", ",")}</div>
                </div>
                <div className="text-center p-2 rounded-lg border border-border/20">
                  <div className="text-[10px] text-muted-foreground">CPM</div>
                  <div className="text-sm font-bold">{fmt(cpm)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Cost metrics + Trend chart */}
          <div className="space-y-4">
            {isVisible("cost-metrics") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/20 card-shadow glass p-4 text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">Custo por lead</div>
                  <div className="text-xl font-bold">{fmt(cpl)}</div>
                  <div className="text-[10px] text-success mt-1">↑ R$ 4,44</div>
                </div>
                <div className="rounded-xl border border-border/20 card-shadow glass p-4 text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">CPC</div>
                  <div className="text-xl font-bold">{fmt(cpc)}</div>
                  <div className="text-[10px] text-destructive mt-1">↑ 25,5%</div>
                </div>
              </div>
            )}

            {isVisible("trend-chart") && (
              <div className="rounded-xl border border-border/20 card-shadow glass p-4">
                <h3 className="text-xs font-semibold mb-3">Leads × Investimento × CPL</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={mockTrend}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar yAxisId="left" dataKey="investment" fill="hsl(142, 71%, 45%)" opacity={0.7} name="Investimento" />
                    <Line yAxisId="right" dataKey="leads" stroke="hsl(190, 90%, 50%)" strokeWidth={2} name="Leads" dot={{ r: 3 }} />
                    <Line yAxisId="right" dataKey="cpl" stroke="hsl(0, 85%, 55%)" strokeWidth={2} name="CPL" dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Best Ads pie chart */}
          {isVisible("best-ads") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-4">Melhores Anúncios</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={mockAds} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90} paddingAngle={2}
                    label={({ value }) => `${value}%`} labelLine={false} stroke="none">
                    {mockAds.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tax Card */}
        {isVisible("tax-card") && (
          <div className="rounded-xl border border-border/20 card-shadow glass p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Percent className="h-4 w-4 text-warning" />
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
        )}

        {/* Campaign Table */}
        {isVisible("campaign-table") && (
          <div className="rounded-xl border border-border/20 card-shadow glass p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">Campanhas</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Campanhas</th>
                  <th className="text-left py-2 px-2">Conjuntos</th>
                  <th className="text-left py-2 px-2">Anúncios</th>
                  <th className="text-right py-2 px-2">Investimento</th>
                  <th className="text-right py-2 px-2">Compras</th>
                </tr>
              </thead>
              <tbody>
                {mockCampaigns.map((c, i) => (
                  <tr key={i} className="border-b border-border/10 hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2 text-muted-foreground">{i + 1}.</td>
                    <td className="py-2 px-2 max-w-[160px] truncate">{c.campaign}</td>
                    <td className="py-2 px-2 max-w-[140px] truncate">{c.conjunto}</td>
                    <td className="py-2 px-2 max-w-[160px] truncate">{c.anuncio}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="inline-block bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                        {fmt(c.investimento)}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-semibold">{c.compras}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          ⚠️ Dados de demonstração — conecte o Meta Ads em Integrações para dados reais.
        </p>
      </div>
    </DashboardLayout>
  );
}
