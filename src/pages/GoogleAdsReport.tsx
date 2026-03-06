import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import ExportMenu from "@/components/ExportMenu";
import ShareReportButton from "@/components/ShareReportButton";
import DateFilter, { DateRange, getDefaultDateRange } from "@/components/DateFilter";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import { useCustomMetrics } from "@/hooks/useCustomMetrics";
import { useAccount } from "@/hooks/useAccount";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { DollarSign, MousePointerClick, Eye, TrendingUp, Target, Loader2 } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { id: "kpis", label: "KPIs Principais" },
  { id: "spend-trend", label: "Investimento Diário" },
  { id: "clicks-trend", label: "Cliques no Período" },
  { id: "campaigns", label: "Campanhas" },
  { id: "campaign-pie", label: "Distribuição de Custo" },
];

const PIE_COLORS = [
  "hsl(0, 85%, 55%)", "hsl(30, 90%, 55%)", "hsl(200, 70%, 55%)",
  "hsl(160, 60%, 50%)", "hsl(280, 60%, 55%)", "hsl(45, 70%, 50%)",
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "hsla(240, 5%, 7%, 0.95)",
  border: "1px solid hsla(240, 4%, 20%, 0.4)",
  borderRadius: 8, fontSize: 12, color: "hsl(0, 0%, 95%)",
  padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  pointerEvents: "none" as const,
};

const CARD_CLASS = "rounded-xl border border-destructive/20 card-shadow glass";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
const changeType = (v: number): "positive" | "negative" | "neutral" => v > 0 ? "positive" : v < 0 ? "negative" : "neutral";

export default function GoogleAdsReport() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const { visible, toggle, isVisible } = useChartVisibility("gads", SECTIONS);
  const { metrics: customMetrics, addMetric, removeMetric, evaluate: evalMetric } = useCustomMetrics("gads");
  const { activeAccountId } = useAccount();

  const { data: adSpendRows = [], isLoading } = useQuery({
    queryKey: ["gads-ad-spend", activeAccountId, dateRange],
    queryFn: async () => {
      if (!activeAccountId) return [];
      const { data } = await (supabase as any)
        .from("ad_spend")
        .select("*")
        .eq("account_id", activeAccountId)
        .eq("platform", "google_ads")
        .gte("date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("date", format(dateRange.to, "yyyy-MM-dd"))
        .order("date", { ascending: true });
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  const { data: googleIntegration } = useQuery({
    queryKey: ["google-integration-check", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("integrations_safe")
        .select("id")
        .eq("account_id", activeAccountId)
        .eq("provider", "google")
        .maybeSingle();
      return data;
    },
    enabled: !!activeAccountId,
  });

  const stats = useMemo(() => {
    const totalSpend = adSpendRows.reduce((s: number, r: any) => s + (r.spend || 0), 0);
    const totalClicks = adSpendRows.reduce((s: number, r: any) => s + (r.clicks || 0), 0);
    const totalImpressions = adSpendRows.reduce((s: number, r: any) => s + (r.impressions || 0), 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Daily trend
    const dailyMap = new Map<string, { spend: number; clicks: number; impressions: number }>();
    adSpendRows.forEach((r: any) => {
      const existing = dailyMap.get(r.date) || { spend: 0, clicks: 0, impressions: 0 };
      existing.spend += r.spend || 0;
      existing.clicks += r.clicks || 0;
      existing.impressions += r.impressions || 0;
      dailyMap.set(r.date, existing);
    });
    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: format(parseISO(date), "dd/MM", { locale: ptBR }),
        spend: vals.spend,
        clicks: vals.clicks,
        impressions: vals.impressions,
      }));

    // Campaign breakdown
    const campaignMap = new Map<string, { spend: number; clicks: number; impressions: number }>();
    adSpendRows.forEach((r: any) => {
      const name = r.campaign_name || "Sem campanha";
      const existing = campaignMap.get(name) || { spend: 0, clicks: 0, impressions: 0 };
      existing.spend += r.spend || 0;
      existing.clicks += r.clicks || 0;
      existing.impressions += r.impressions || 0;
      campaignMap.set(name, existing);
    });
    const campaigns = Array.from(campaignMap.entries())
      .map(([name, vals]) => ({ name, ...vals, cpc: vals.clicks > 0 ? vals.spend / vals.clicks : 0 }))
      .sort((a, b) => b.spend - a.spend);

    const campaignPie = campaigns.slice(0, 6).map(c => ({ name: c.name.length > 25 ? c.name.slice(0, 22) + "..." : c.name, value: c.spend }));

    return { totalSpend, totalClicks, totalImpressions, ctr, cpc, dailyTrend, campaigns, campaignPie };
  }, [adSpendRows]);

  const hasData = adSpendRows.length > 0;

  return (
    <DashboardLayout
      title="Google Ads"
      subtitle="Relatório de campanhas e investimentos"
      actions={
        <div className="flex items-center gap-2">
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      }
    >
      <div className="flex items-center justify-end mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-border/40 overflow-hidden h-8">
            <ChartVisibilityMenu sections={SECTIONS} visible={visible} onToggle={toggle} customMetrics={customMetrics} onAddCustomMetric={addMetric} onRemoveCustomMetric={removeMetric} />
          </div>
          <ExportMenu data={stats.campaigns} filename="google-ads-report" title="Google Ads Report" size="default" />
          <ShareReportButton />
        </div>
      </div>

      {!googleIntegration && !isLoading && (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-3 mb-6">
          <p className="text-sm text-muted-foreground">Conecte sua conta Google para visualizar dados do Google Ads.</p>
          <Link to="/integrations?tab=google">
            <Button size="sm" className="text-xs">Conectar Google</Button>
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Custom Metrics */}
          {customMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {customMetrics.map(cm => {
                const dataCtx: Record<string, number> = {
                  gads_spend: stats.totalSpend, gads_clicks: stats.totalClicks, gads_impressions: stats.totalImpressions,
                  gads_ctr: stats.ctr, gads_cpc: stats.cpc,
                };
                const val = evalMetric(cm.formula, dataCtx);
                let display: string;
                if (cm.format === "currency") display = fmtBRL(val);
                else if (cm.format === "percent") display = `${val.toFixed(2).replace(".", ",")}%`;
                else display = val.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
                return (
                  <div key={cm.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5 card-shadow flex flex-col items-center text-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2">{cm.name}</span>
                    <div className="text-xl font-bold">{display}</div>
                    {cm.description && <p className="text-[9px] text-muted-foreground mt-1">{cm.description}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* KPIs */}
          {isVisible("kpis") && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <MetricCard label="Investimento" value={fmtBRL(stats.totalSpend)} icon={DollarSign} change="" changeType="neutral" />
              <MetricCard label="Cliques" value={stats.totalClicks.toLocaleString("pt-BR")} icon={MousePointerClick} change="" changeType="neutral" />
              <MetricCard label="Impressões" value={stats.totalImpressions.toLocaleString("pt-BR")} icon={Eye} change="" changeType="neutral" />
              <MetricCard label="CTR" value={`${stats.ctr.toFixed(2).replace(".", ",")}%`} icon={Target} change="" changeType="neutral" />
              <MetricCard label="CPC Médio" value={fmtBRL(stats.cpc)} icon={TrendingUp} change="" changeType="neutral" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Spend trend */}
            {isVisible("spend-trend") && (
              <div className={`${CARD_CLASS} p-5`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Investimento Diário
                </h3>
                {stats.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.dailyTrend}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsla(0,0%,100%,0.03)" }} formatter={(v: any) => fmtBRL(v)} />
                      <Bar dataKey="spend" fill="hsl(0, 85%, 55%)" name="Investimento" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-12">Sem dados no período selecionado.</p>
                )}
              </div>
            )}

            {/* Clicks trend */}
            {isVisible("clicks-trend") && (
              <div className={`${CARD_CLASS} p-5`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                  Cliques no Período
                </h3>
                {stats.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.dailyTrend}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "hsla(0,0%,100%,0.1)" }} />
                      <Line dataKey="clicks" stroke="hsl(30, 90%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Cliques" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-12">Sem dados no período selecionado.</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Campaign pie */}
            {isVisible("campaign-pie") && (
              <div className={`${CARD_CLASS} p-5`}>
                <h3 className="text-sm font-semibold mb-3">Distribuição de Custo</h3>
                {stats.campaignPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={stats.campaignPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={45} outerRadius={80} paddingAngle={2}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} stroke="none">
                        {stats.campaignPie.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtBRL(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-12">Sem dados.</p>
                )}
              </div>
            )}

            {/* Campaign table */}
            {isVisible("campaigns") && (
              <div className={`${CARD_CLASS} p-5 lg:col-span-2`}>
                <h3 className="text-sm font-semibold mb-3">Campanhas</h3>
                {stats.campaigns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/30 text-muted-foreground">
                          <th className="text-left py-1.5 px-2">Campanha</th>
                          <th className="text-right py-1.5 px-2">Custo</th>
                          <th className="text-right py-1.5 px-2">Cliques</th>
                          <th className="text-right py-1.5 px-2">Impressões</th>
                          <th className="text-right py-1.5 px-2">CPC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.campaigns.map((c, i) => (
                          <tr key={i} className="border-b border-border/10 hover:bg-accent/30">
                            <td className="py-1.5 px-2 max-w-[200px] truncate" title={c.name}>{c.name}</td>
                            <td className="py-1.5 px-2 text-right font-medium">{fmtBRL(c.spend)}</td>
                            <td className="py-1.5 px-2 text-right">{c.clicks.toLocaleString("pt-BR")}</td>
                            <td className="py-1.5 px-2 text-right">{c.impressions.toLocaleString("pt-BR")}</td>
                            <td className="py-1.5 px-2 text-right">{fmtBRL(c.cpc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-12">Nenhuma campanha encontrada no período.</p>
                )}
              </div>
            )}
          </div>

          {!hasData && googleIntegration && (
            <p className="text-[10px] text-muted-foreground text-center">
              ⚠️ Nenhum dado encontrado — aguarde a próxima sincronização ou clique em "Sincronizar agora" nas Integrações.
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
