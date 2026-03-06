import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import ExportMenu from "@/components/ExportMenu";
import ShareReportButton from "@/components/ShareReportButton";
import DateFilter, { DateRange, getDefaultDateRange } from "@/components/DateFilter";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import { useCustomMetrics } from "@/hooks/useCustomMetrics";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Users, UserPlus, Eye, Activity, Globe, Monitor, Smartphone, Tablet, Pencil, Loader2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { format, parseISO, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const SECTIONS = [
  { id: "kpis", label: "KPIs Principais" },
  { id: "access-trend", label: "Acessos no Período" },
  { id: "weekly-chart", label: "Acessos na Semana" },
  { id: "origin-chart", label: "Origem dos Acessos" },
  { id: "city-table", label: "Cidades" },
  { id: "os-chart", label: "Sistema Operacional" },
  { id: "device-chart", label: "Dispositivo" },
];

const PIE_COLORS = [
  "hsl(30, 90%, 55%)", "hsl(0, 85%, 55%)", "hsl(200, 70%, 55%)",
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

const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
const changeType = (v: number): "positive" | "negative" | "neutral" => v > 0 ? "positive" : v < 0 ? "negative" : "neutral";

const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export default function GA4Report() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const { visible, toggle, isVisible } = useChartVisibility("ga4", SECTIONS);
  const { metrics: customMetrics, addMetric, removeMetric, evaluate: evalMetric } = useCustomMetrics("ga4");
  const { activeAccountId } = useAccount();

  const sinceISO = dateRange.from.toISOString().slice(0, 10);
  const untilISO = dateRange.to.toISOString().slice(0, 10);

  // Fetch previous period for comparison
  const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) + 1;
  const prevFrom = new Date(dateRange.from.getTime() - daysDiff * 86400000).toISOString().slice(0, 10);
  const prevUntil = new Date(dateRange.from.getTime() - 86400000).toISOString().slice(0, 10);

  const { data: ga4Rows = [], isLoading } = useQuery({
    queryKey: ["ga4-report-data", activeAccountId, sinceISO, untilISO],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ga4_metrics")
        .select("*")
        .eq("account_id", activeAccountId)
        .gte("date", sinceISO)
        .lte("date", untilISO);
      return data || [];
    },
    enabled: !!activeAccountId,
    staleTime: 10 * 60_000,
  });

  const { data: prevRows = [] } = useQuery({
    queryKey: ["ga4-report-prev", activeAccountId, prevFrom, prevUntil],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ga4_metrics")
        .select("sessions, users, new_users, page_views, engagement_rate")
        .eq("account_id", activeAccountId)
        .gte("date", prevFrom)
        .lte("date", prevUntil);
      return data || [];
    },
    enabled: !!activeAccountId,
    staleTime: 10 * 60_000,
  });

  const hasData = ga4Rows.length > 0;

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const totalSessions = ga4Rows.reduce((s: number, r: any) => s + (r.sessions || 0), 0);
    const totalUsers = ga4Rows.reduce((s: number, r: any) => s + (r.users || 0), 0);
    const newUsers = ga4Rows.reduce((s: number, r: any) => s + (r.new_users || 0), 0);
    const pageViews = ga4Rows.reduce((s: number, r: any) => s + (r.page_views || 0), 0);
    const engRates = ga4Rows.filter((r: any) => r.engagement_rate != null);
    const avgEngagement = engRates.length > 0
      ? engRates.reduce((s: number, r: any) => s + (r.engagement_rate || 0), 0) / engRates.length * 100
      : 0;

    const prevSessions = prevRows.reduce((s: number, r: any) => s + (r.sessions || 0), 0);
    const prevUsers = prevRows.reduce((s: number, r: any) => s + (r.users || 0), 0);
    const prevNewUsers = prevRows.reduce((s: number, r: any) => s + (r.new_users || 0), 0);
    const prevPageViews = prevRows.reduce((s: number, r: any) => s + (r.page_views || 0), 0);
    const prevEngRates = prevRows.filter((r: any) => r.engagement_rate != null);
    const prevAvgEngagement = prevEngRates.length > 0
      ? prevEngRates.reduce((s: number, r: any) => s + (r.engagement_rate || 0), 0) / prevEngRates.length * 100
      : 0;

    return {
      totalSessions, totalUsers, newUsers, pageViews, avgEngagement,
      prevSessions, prevUsers, prevNewUsers, prevPageViews, prevAvgEngagement,
    };
  }, [ga4Rows, prevRows]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    ga4Rows.forEach((r: any) => {
      map.set(r.date, (map.get(r.date) || 0) + (r.sessions || 0));
    });
    try {
      const days = eachDayOfInterval({ start: parseISO(sinceISO), end: parseISO(untilISO) });
      return days.map(d => {
        const key = format(d, "yyyy-MM-dd");
        return { day: format(d, "dd/MM"), value: map.get(key) || 0 };
      });
    } catch {
      return Array.from(map.entries()).map(([date, value]) => ({ day: date.slice(5), value }));
    }
  }, [ga4Rows, sinceISO, untilISO]);

  // Weekly aggregation
  const weeklyData = useMemo(() => {
    const weekMap = [0, 0, 0, 0, 0, 0, 0];
    ga4Rows.forEach((r: any) => {
      try {
        const d = parseISO(r.date);
        weekMap[d.getDay()] += r.sessions || 0;
      } catch {}
    });
    return WEEKDAYS.map((name, i) => ({ day: name, value: weekMap[i] }));
  }, [ga4Rows]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    ga4Rows.forEach((r: any) => {
      const src = r.source || "(direct)";
      map.set(src, (map.get(src) || 0) + (r.sessions || 0));
    });
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    const result = top5.map(([name, value]) => ({ name, value }));
    if (others > 0) result.push({ name: "Outros", value: others });
    return result;
  }, [ga4Rows]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const map = new Map<string, number>();
    ga4Rows.forEach((r: any) => {
      const dev = r.device_category || "desktop";
      const label = dev.charAt(0).toUpperCase() + dev.slice(1);
      map.set(label, (map.get(label) || 0) + (r.sessions || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [ga4Rows]);

  return (
    <DashboardLayout
      title="Google Analytics (GA4)"
      subtitle="Relatório de acessos e comportamento"
      actions={
        <div className="flex items-center gap-2">
          <ProductTour {...TOURS.ga4Report} />
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      }
    >
      <div className="flex items-center justify-end mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-border/40 overflow-hidden h-8">
            <ChartVisibilityMenu sections={SECTIONS} visible={visible} onToggle={toggle} customMetrics={customMetrics} onAddCustomMetric={addMetric} onRemoveCustomMetric={removeMetric} />
          </div>
          <ExportMenu data={ga4Rows} filename="ga4-report" title="GA4 Report" size="default" />
          <ShareReportButton />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="text-center py-16 space-y-3">
          <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhum dado GA4 encontrado para este período.</p>
          <p className="text-xs text-muted-foreground">Conecte e sincronize uma propriedade GA4 em <strong>Integrações → Google</strong>.</p>
        </div>
      )}

      {!isLoading && hasData && (
        <div className="space-y-6">
          {/* Custom Metrics */}
          {customMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {customMetrics.map(cm => {
                const dataCtx: Record<string, number> = {
                  vendas: 0, faturamento: 0, views: kpis.totalSessions,
                  ticket_medio: 0, taxa_conversao: 0, investimento: 0,
                  roas: 0, leads: 0, abandono: 0, order_bumps: 0, ob_receita: 0,
                  meta_spend: 0, meta_impressions: 0, meta_clicks: 0, meta_ctr: 0, meta_cpm: 0,
                  gads_spend: 0, gads_clicks: 0, gads_impressions: 0,
                };
                const val = evalMetric(cm.formula, dataCtx);
                let display: string;
                if (cm.format === "currency") display = `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
              <MetricCard label="Total de Acessos" value={kpis.totalSessions.toLocaleString("pt-BR")} icon={Globe}
                change={fmtPct(pctChange(kpis.totalSessions, kpis.prevSessions))}
                changeType={changeType(pctChange(kpis.totalSessions, kpis.prevSessions))} />
              <MetricCard label="Usuários Totais" value={kpis.totalUsers.toLocaleString("pt-BR")} icon={Users}
                change={fmtPct(pctChange(kpis.totalUsers, kpis.prevUsers))}
                changeType={changeType(pctChange(kpis.totalUsers, kpis.prevUsers))} />
              <MetricCard label="Novos Usuários" value={kpis.newUsers.toLocaleString("pt-BR")} icon={UserPlus}
                change={fmtPct(pctChange(kpis.newUsers, kpis.prevNewUsers))}
                changeType={changeType(pctChange(kpis.newUsers, kpis.prevNewUsers))} />
              <MetricCard label="Visualizações de Páginas" value={kpis.pageViews.toLocaleString("pt-BR")} icon={Eye}
                change={fmtPct(pctChange(kpis.pageViews, kpis.prevPageViews))}
                changeType={changeType(pctChange(kpis.pageViews, kpis.prevPageViews))} />
              <MetricCard label="Taxa de Engajamento" value={`${kpis.avgEngagement.toFixed(2).replace(".", ",")}%`} icon={Activity}
                change={fmtPct(pctChange(kpis.avgEngagement, kpis.prevAvgEngagement))}
                changeType={changeType(pctChange(kpis.avgEngagement, kpis.prevAvgEngagement))} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Access trend */}
            {isVisible("access-trend") && (
              <div className={`${CARD_CLASS} p-5`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-warning" />
                  Acessos no Período
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyTrend}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "hsla(0,0%,100%,0.1)" }} />
                    <Line dataKey="value" stroke="hsl(30, 90%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Sessões" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Weekly chart */}
            {isVisible("weekly-chart") && (
              <div className={`${CARD_CLASS} p-5`}>
                <h3 className="text-sm font-semibold mb-3">Acessos na Semana</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsla(0,0%,100%,0.03)" }} />
                    <Bar dataKey="value" fill="hsl(30, 90%, 55%)" name="Sessões" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Origin */}
            {isVisible("origin-chart") && sourceData.length > 0 && (
              <div className={`${CARD_CLASS} p-5`}>
                <h3 className="text-sm font-semibold mb-3">Origem dos Acessos</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Device */}
            {isVisible("device-chart") && deviceData.length > 0 && (
              <div className={`${CARD_CLASS} p-5`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Dispositivo
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {deviceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
