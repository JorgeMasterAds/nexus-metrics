import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, Legend, LabelList,
} from "recharts";
import {
  MousePointerClick, TrendingUp, DollarSign, BarChart3, Ticket, Download,
  ShoppingCart, CreditCard, Pencil, Check, Target, Globe, Megaphone,
  Monitor, FileText, Package, Eye, Percent, Layers, HelpCircle, Users, RotateCcw,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import GamificationBar from "@/components/GamificationBar";
import DateFilter, { DateRange, getDefaultDateRange } from "@/components/DateFilter";
import ProductTour, { TOURS } from "@/components/ProductTour";
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportToCsv } from "@/lib/csv";
import ExportMenu from "@/components/ExportMenu";
import ShareReportButton from "@/components/ShareReportButton";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import { useCustomMetrics } from "@/hooks/useCustomMetrics";

import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
// Investment now comes from ad_spend (Meta + Google Ads) only
import { SortableSection } from "@/components/SortableSection";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn, formatValueInput, parseValueInput } from "@/lib/utils";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { useI18n } from "@/lib/i18n";

const SECTION_IDS = [
  "kpi-views", "kpi-sales", "kpi-abandono", "kpi-conv", "kpi-investment", "kpi-revenue", "kpi-roas", "kpi-ticket",
  "traffic-chart", "smartlinks", "products", "order-bumps", "events-chart",
  "chart-source", "chart-campaign", "chart-medium", "chart-content", "chart-product", "chart-payment",
  // Meta Ads
  "meta-kpi-spend", "meta-kpi-leads", "meta-kpi-ctr", "meta-kpi-cpm", "meta-funnel", "meta-campaigns",
  // Google Ads
  "gads-kpi-spend", "gads-kpi-clicks", "gads-kpi-ctr", "gads-kpi-cpc",
  // GA4
  "ga4-kpi-sessions", "ga4-kpi-users", "ga4-kpi-engagement", "ga4-origin", "ga4-devices",
  // UTM detalhado
  "utm-source-table", "utm-campaign-table", "utm-medium-table",
];

const getChartSections = (t: (k: string) => string) => [
  { id: "kpi-views", label: t("kpi_views") },
  { id: "kpi-sales", label: t("kpi_sales") },
  { id: "kpi-abandono", label: t("kpi_abandonment") },
  { id: "kpi-conv", label: t("kpi_conv") },
  { id: "kpi-investment", label: t("kpi_investment") },
  { id: "kpi-revenue", label: t("kpi_revenue") },
  { id: "kpi-roas", label: t("kpi_roas") },
  { id: "kpi-ticket", label: t("kpi_ticket") },
  { id: "traffic-chart", label: t("daily_sales") },
  { id: "events-chart", label: t("conversion_events") },
  { id: "smartlinks", label: "Smart Links" },
  { id: "products", label: t("product_summary") },
  { id: "order-bumps", label: t("order_bumps") },
  { id: "chart-source", label: t("revenue_by_source") },
  { id: "chart-campaign", label: t("revenue_by_campaign") },
  { id: "chart-medium", label: t("revenue_by_medium") },
  { id: "chart-content", label: t("revenue_by_content") },
  { id: "chart-product", label: t("revenue_by_product") },
  { id: "chart-payment", label: t("payment_methods") },
  { id: "meta-kpi-spend", label: `Meta Ads: ${t("investment")}` },
  { id: "meta-kpi-leads", label: `Meta Ads: ${t("leads")}` },
  { id: "meta-kpi-ctr", label: `Meta Ads: ${t("ctr")}` },
  { id: "meta-kpi-cpm", label: `Meta Ads: ${t("cpm")}` },
  { id: "meta-funnel", label: `Meta Ads: ${t("funnel")}` },
  { id: "meta-campaigns", label: `Meta Ads: ${t("campaigns")}` },
  { id: "gads-kpi-spend", label: `Google Ads: ${t("investment")}` },
  { id: "gads-kpi-clicks", label: `Google Ads: ${t("clicks")}` },
  { id: "gads-kpi-ctr", label: `Google Ads: ${t("ctr")}` },
  { id: "gads-kpi-cpc", label: `Google Ads: ${t("cpc")}` },
  { id: "ga4-kpi-sessions", label: `GA4: ${t("sessions")}` },
  { id: "ga4-kpi-users", label: `GA4: ${t("users")}` },
  { id: "ga4-kpi-engagement", label: `GA4: ${t("engagement")}` },
  { id: "ga4-origin", label: `GA4: ${t("origin_access")}` },
  { id: "ga4-devices", label: `GA4: ${t("device_breakdown")}` },
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "hsla(240, 5%, 7%, 0.92)",
  border: "1px solid hsla(240, 4%, 20%, 0.4)",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
  padding: "10px 14px",
  boxShadow: "var(--shadow-card)",
};
const TICK_STYLE = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

const CHART_PALETTES = [
  ["hsl(0, 90%, 50%)", "hsl(5, 85%, 48%)", "hsl(12, 80%, 46%)", "hsl(18, 85%, 50%)", "hsl(25, 90%, 52%)", "hsl(32, 92%, 54%)", "hsl(38, 94%, 50%)", "hsl(15, 82%, 44%)"],
  ["hsl(5, 85%, 48%)", "hsl(0, 90%, 50%)", "hsl(18, 85%, 50%)", "hsl(12, 80%, 46%)", "hsl(32, 92%, 54%)", "hsl(25, 90%, 52%)", "hsl(15, 82%, 44%)", "hsl(38, 94%, 50%)"],
  ["hsl(12, 80%, 46%)", "hsl(18, 85%, 50%)", "hsl(0, 90%, 50%)", "hsl(25, 90%, 52%)", "hsl(5, 85%, 48%)", "hsl(38, 94%, 50%)", "hsl(32, 92%, 54%)", "hsl(15, 82%, 44%)"],
  ["hsl(18, 85%, 50%)", "hsl(25, 90%, 52%)", "hsl(32, 92%, 54%)", "hsl(0, 90%, 50%)", "hsl(5, 85%, 48%)", "hsl(12, 80%, 46%)", "hsl(38, 94%, 50%)", "hsl(15, 82%, 44%)"],
  ["hsl(25, 90%, 52%)", "hsl(32, 92%, 54%)", "hsl(38, 94%, 50%)", "hsl(18, 85%, 50%)", "hsl(12, 80%, 46%)", "hsl(5, 85%, 48%)", "hsl(0, 90%, 50%)", "hsl(15, 82%, 44%)"],
  ["hsl(32, 92%, 54%)", "hsl(38, 94%, 50%)", "hsl(25, 90%, 52%)", "hsl(18, 85%, 50%)", "hsl(12, 80%, 46%)", "hsl(5, 85%, 48%)", "hsl(0, 90%, 50%)", "hsl(15, 82%, 44%)"],
];

const CHART_TOOLTIPS: Record<string, string> = {
  "traffic-chart": "Exibe a evolução diária de visualizações (views) e vendas no período selecionado.",
  "products": "Resumo de vendas, receita, ticket médio e participação percentual por produto.",
  "order-bumps": "Comparação proporcional entre vendas de produto principal e order bumps.",
  "smartlinks": "Desempenho de cada Smart Link: views, vendas, receita e taxa de conversão.",
  "sales-chart": "Volume de vendas e receita diários no período selecionado.",
  "events-chart": "Distribuição de eventos: abandono de carrinho, boleto gerado, pix gerado, compra recusada, chargeback e reembolso.",
  "source": "Receita agrupada por origem de tráfego (utm_source).",
  "campaign": "Receita agrupada por campanha de marketing (utm_campaign).",
  "medium": "Receita agrupada por meio de tráfego (utm_medium).",
  "content": "Receita agrupada por conteúdo de anúncio (utm_content).",
  "product": "Receita agrupada por produto vendido.",
  "payment": "Receita agrupada por meio de pagamento utilizado.",
};

const METRIC_TOOLTIPS: Record<string, string> = {
  "total_views": "Número total de cliques registrados nos Smart Links no período selecionado.",
  "sales": "Quantidade total de vendas aprovadas no período selecionado.",
  "conv_rate": "Taxa de Conversão = (Vendas / Views) × 100. Percentual de visitantes que compraram.",
  "revenue": "Soma dos valores de todas as vendas aprovadas no período.",
  "avg_ticket": "Ticket Médio = Receita Total / Número de Vendas. Valor médio por transação.",
  "smart_links": "Quantidade de Smart Links criados neste projeto.",
};

function ChartHeader({ title, icon, tooltipKey }: { title: string; icon: React.ReactNode; tooltipKey: string }) {
  return (
    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
      {icon}
      {title}
      <UITooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          {CHART_TOOLTIPS[tooltipKey] || "Dados do período selecionado."}
        </TooltipContent>
      </UITooltip>
    </h3>
  );
}

function MetricWithTooltip({
  label,
  value,
  icon: Icon,
  tooltipKey,
  change,
  changeType,
}: {
  label: string;
  value: string;
  icon: any;
  tooltipKey: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="relative">
      <MetricCard label={label} value={value} icon={Icon} change={change} changeType={changeType} />
      <UITooltip>
        <TooltipTrigger asChild>
          <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {METRIC_TOOLTIPS[tooltipKey] || "Métrica do período selecionado."}
        </TooltipContent>
      </UITooltip>
    </div>
  );
}

// Custom tooltip component for recharts with white text
function CustomTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const seen = new Set<string>();
  const filtered = payload.filter((entry: any) => {
    if (seen.has(entry.dataKey)) return false;
    seen.add(entry.dataKey);
    return true;
  });
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#e0e0e0", marginBottom: 4, fontWeight: 500 }}>{label}</p>
      {filtered.map((entry: any, i: number) => {
        const dotColor = entry.dataKey === "revenue" ? "hsl(142, 71%, 45%)" : entry.dataKey === "sales" || entry.dataKey === "vendas" ? "hsl(160, 70%, 50%)" : entry.color || "#f5f5f5";
        return (
          <p key={i} style={{ color: "#ffffff", fontSize: 12 }}>
            <span style={{ color: dotColor, marginRight: 6 }}>●</span>
            {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString("pt-BR") : entry.value}
          </p>
        );
      })}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#ffffff", fontWeight: 500 }}>{entry.name}</p>
      <p style={{ color: "#e0e0e0", fontSize: 12 }}>{entry.value} vendas</p>
    </div>
  );
}

// Helper functions
const pctChange = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
};

const fmtChange = (val: number, isAbsolute = false) => {
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(isAbsolute ? 2 : 1).replace(".", ",")}%`;
};

const changeType = (val: number): "positive" | "negative" | "neutral" =>
  val > 0 ? "positive" : val < 0 ? "negative" : "neutral";

function ComparisonBadge({ value, isAbsolute = false }: { value: number; isAbsolute?: boolean }) {
  const type = changeType(value);
  return (
    <span className={cn(
      "text-[10px] font-normal",
      type === "positive" && "text-success",
      type === "negative" && "text-destructive",
      type === "neutral" && "text-muted-foreground",
    )}>
      {fmtChange(value, isAbsolute)}
    </span>
  );
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [debouncedRange, setDebouncedRange] = useState<DateRange>(dateRange);
  const [periodLabel, setPeriodLabel] = useState("7 dias");
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const { order, editMode, toggleEdit, handleReorder, resetLayout } = useDashboardLayout("dashboard", SECTION_IDS);
  const { visible, toggle: toggleVisibility, resetVisibility } = useChartVisibility("dashboard", CHART_SECTIONS);
  const { metrics: customMetrics, addMetric, removeMetric, evaluate: evalMetric } = useCustomMetrics("dashboard");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const { toast } = useToast();
  const qc = useQueryClient();

  // Debounce date range changes (300ms)
  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedRange(range), 300);
  }, []);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const sinceISO = debouncedRange.from.toISOString();
  const untilISO = debouncedRange.to.toISOString();
  const sinceDate = debouncedRange.from.toISOString().slice(0, 10);
  const untilDate = debouncedRange.to.toISOString().slice(0, 10);
  
  // Calculate period days correctly (inclusive of both endpoints)
  const periodMs = debouncedRange.to.getTime() - debouncedRange.from.getTime();
  const periodDays = Math.max(1, Math.round(periodMs / 86400000));
  const prevUntil = new Date(debouncedRange.from.getTime() - 1);
  const prevSince = new Date(prevUntil.getTime() - periodMs);
  const prevSinceISO = prevSince.toISOString();
  const prevUntilISO = prevUntil.toISOString();
  const previousPeriodLabel = (() => {
    const presetMap: Record<string, string> = {
      "Hoje": "dia anterior",
      "Ontem": "dia anterior",
      "7 dias": "7 dias anteriores",
      "30 dias": "30 dias anteriores",
      "Este mês": "mês anterior",
      "Mês passado": "mês anterior",
    };
    return presetMap[periodLabel] || `${periodDays} dia${periodDays > 1 ? "s" : ""} anteriores`;
  })();

  const periodKey = `${sinceISO}__${untilISO}`;
  // Investment now comes purely from ad spend (Meta + Google Ads)

  // Fetch ad spend from integrations (Meta Ads / Google Ads) for investment auto-fill
  const { data: adSpendRows = [] } = useQuery({
    queryKey: ["ad-spend-rows", sinceDate, untilDate, activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ad_spend")
        .select("spend, clicks, impressions, platform, campaign_name, adset_name, ad_name, date")
        .eq("account_id", activeAccountId)
        .gte("date", sinceDate)
        .lte("date", untilDate);
      return data || [];
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  // GA4 metrics from synced data
  const { data: ga4Rows = [] } = useQuery({
    queryKey: ["ga4-metrics", sinceDate, untilDate, activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ga4_metrics")
        .select("sessions, users, new_users, page_views, engagement_rate, avg_session_duration, bounce_rate, conversions, source, medium, campaign, device_category, date")
        .eq("account_id", activeAccountId)
        .gte("date", sinceDate)
        .lte("date", untilDate);
      return data || [];
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  const ga4Metrics = useMemo(() => {
    const totalSessions = ga4Rows.reduce((s: number, r: any) => s + Number(r.sessions || 0), 0);
    const totalUsers = ga4Rows.reduce((s: number, r: any) => s + Number(r.users || 0), 0);
    const totalPageViews = ga4Rows.reduce((s: number, r: any) => s + Number(r.page_views || 0), 0);
    const totalConversions = ga4Rows.reduce((s: number, r: any) => s + Number(r.conversions || 0), 0);
    const avgEngagement = ga4Rows.length > 0
      ? ga4Rows.reduce((s: number, r: any) => s + Number(r.engagement_rate || 0), 0) / ga4Rows.length * 100
      : 0;
    const avgBounce = ga4Rows.length > 0
      ? ga4Rows.reduce((s: number, r: any) => s + Number(r.bounce_rate || 0), 0) / ga4Rows.length * 100
      : 0;

    // Origin breakdown
    const originMap = new Map<string, number>();
    ga4Rows.forEach((r: any) => {
      const src = r.source || "(direto)";
      originMap.set(src, (originMap.get(src) || 0) + Number(r.sessions || 0));
    });
    const originData = Array.from(originMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Device breakdown
    const deviceMap = new Map<string, number>();
    ga4Rows.forEach((r: any) => {
      const dev = r.device_category || "other";
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + Number(r.sessions || 0));
    });
    const deviceData = Array.from(deviceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { totalSessions, totalUsers, totalPageViews, totalConversions, avgEngagement, avgBounce, originData, deviceData };
  }, [ga4Rows]);

  const adSpendTotal = useMemo(() => adSpendRows.reduce((s: number, r: any) => s + Number(r.spend || 0), 0), [adSpendRows]);

  const adMetrics = useMemo(() => {
    const metaRows = adSpendRows.filter((r: any) => r.platform === "meta");
    const gadsRows = adSpendRows.filter((r: any) => r.platform === "google");
    const sum = (rows: any[], key: string) => rows.reduce((s: number, r: any) => s + Number(r[key] || 0), 0);
    const metaSpend = sum(metaRows, "spend");
    const metaClicks = sum(metaRows, "clicks");
    const metaImpressions = sum(metaRows, "impressions");
    const metaCtr = metaImpressions > 0 ? (metaClicks / metaImpressions) * 100 : 0;
    const metaCpm = metaImpressions > 0 ? (metaSpend / metaImpressions) * 1000 : 0;
    const gadsSpend = sum(gadsRows, "spend");
    const gadsClicks = sum(gadsRows, "clicks");
    const gadsImpressions = sum(gadsRows, "impressions");
    const gadsCtr = gadsImpressions > 0 ? (gadsClicks / gadsImpressions) * 100 : 0;
    const gadsCpc = gadsClicks > 0 ? gadsSpend / gadsClicks : 0;

    // Campaign breakdown for Meta
    const metaCampaignMap = new Map<string, { spend: number; clicks: number; impressions: number }>();
    metaRows.forEach((r: any) => {
      const name = r.campaign_name || "(sem campanha)";
      const e = metaCampaignMap.get(name) || { spend: 0, clicks: 0, impressions: 0 };
      e.spend += Number(r.spend || 0); e.clicks += Number(r.clicks || 0); e.impressions += Number(r.impressions || 0);
      metaCampaignMap.set(name, e);
    });
    const metaCampaigns = Array.from(metaCampaignMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    // UTM detailed tables
    return {
      metaSpend, metaClicks, metaImpressions, metaCtr, metaCpm, metaCampaigns,
      metaLeads: 0, // placeholder until leads tracking
      gadsSpend, gadsClicks, gadsImpressions, gadsCtr, gadsCpc,
    };
  }, [adSpendRows]);

  // Use ad spend if available and no manual input
  const effectiveInvestment = adSpendTotal;

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalInputs, setGoalInputs] = useState({ daily: "", weekly: "", monthly: "", yearly: "" });

  const goalPeriods = ["daily", "weekly", "monthly", "yearly"] as const;
  const goalPeriodLabels: Record<string, string> = { daily: "Diário", weekly: "Semanal", monthly: "Mensal", yearly: "Anual" };

  const { data: revenueGoals } = useQuery({
    queryKey: ["revenue-goals", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("revenue_goals")
        .select("goal, period")
        .eq("account_id", activeAccountId)
        .eq("project_id", activeProjectId);
      const map: Record<string, number> = { daily: 0, weekly: 0, monthly: 1000000, yearly: 0 };
      (data || []).forEach((r: any) => { if (r.period) map[r.period] = r.goal; });
      return map;
    },
    staleTime: 60000,
    enabled: !!activeAccountId && !!activeProjectId,
  });

  const revenueGoal = useMemo(() => {
    if (!revenueGoals) return 1000000;
    const presetGoalMap: Record<string, string> = {
      "Hoje": "daily", "Ontem": "daily",
      "7 dias": "weekly",
      "30 dias": "monthly", "Este mês": "monthly", "Mês passado": "monthly",
    };
    const mapped = presetGoalMap[periodLabel];
    if (mapped) return revenueGoals[mapped] || revenueGoals.monthly || 1000000;
    // Custom: pick based on day span
    const days = Math.max(1, Math.round((debouncedRange.to.getTime() - debouncedRange.from.getTime()) / 86400000));
    if (days <= 1) return revenueGoals.daily || revenueGoals.monthly || 1000000;
    if (days <= 7) return revenueGoals.weekly || revenueGoals.monthly || 1000000;
    if (days <= 31) return revenueGoals.monthly || 1000000;
    return revenueGoals.yearly || revenueGoals.monthly || 1000000;
  }, [revenueGoals, periodLabel, debouncedRange]);

  const saveGoals = async () => {
    const rows = goalPeriods.map(p => {
      const val = parseValueInput(goalInputs[p] || "0");
      return { account_id: activeAccountId, project_id: activeProjectId, period: p, goal: val < 0 ? 0 : val, updated_at: new Date().toISOString() };
    });
    const { error } = await (supabase as any)
      .from("revenue_goals")
      .upsert(rows, { onConflict: "account_id,project_id,period" });
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Metas salvas!" });
    qc.invalidateQueries({ queryKey: ["revenue-goals"] });
    setGoalModalOpen(false);
  };

  // Read from conversions with specific columns only
  const { data: conversions = [] } = useQuery({
    queryKey: ["dash-conversions", sinceISO, untilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, amount, fees, net_amount, status, product_name, is_order_bump, payment_method, utm_source, utm_campaign, utm_medium, utm_content, created_at, click_id, smartlink_id, variant_id, paid_at")
        .eq("status", "approved")
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  // Read clicks with minimal columns
  const { data: clicks = [] } = useQuery({
    queryKey: ["dash-clicks", sinceISO, untilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("clicks")
        .select("id, click_id, created_at, smartlink_id, variant_id")
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  const { data: prevConversions = [] } = useQuery({
    queryKey: ["dash-conversions-prev", prevSinceISO, prevUntilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, amount, product_name, is_order_bump, smartlink_id, variant_id")
        .eq("status", "approved")
        .gte("created_at", prevSinceISO)
        .lte("created_at", prevUntilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  const { data: abandonedConversions = [] } = useQuery({
    queryKey: ["dash-abandoned", sinceISO, untilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, smartlink_id, variant_id, status, created_at")
        .in("status", ["waiting_payment", "abandoned_cart", "boleto_generated", "pix_generated", "declined", "refunded", "chargedback"])
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  const { data: prevClicks = [] } = useQuery({
    queryKey: ["dash-clicks-prev", prevSinceISO, prevUntilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("clicks")
        .select("id, click_id, smartlink_id, variant_id")
        .gte("created_at", prevSinceISO)
        .lte("created_at", prevUntilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  const { data: smartLinks = [] } = useQuery({
    queryKey: ["dash-smartlinks", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("smartlinks")
        .select("id, name, slug, is_active, created_at, smartlink_variants(id, name, url, weight, is_active)")
        .eq("account_id", activeAccountId)
        .order("created_at", { ascending: true, referencedTable: "smartlink_variants" })
        .order("created_at", { ascending: false });
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      q = q.limit(50);
      const { data } = await q;
      return data || [];
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  // Read excluded conversions from localStorage (shared with UTM Report & Webhook Logs)
  const [excludedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("nexus_excluded_conversions");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const computed = useMemo(() => {
    const filteredConversions = conversions.filter((c: any) => !excludedIds.has(c.id));
    // Deduplicate clicks by click_id for unique view count
    const seenClickIds = new Set<string>();
    const uniqueClicks = clicks.filter((c: any) => {
      if (!c.click_id || seenClickIds.has(c.click_id)) return false;
      seenClickIds.add(c.click_id);
      return true;
    });
    const tv = uniqueClicks.length;
    const ts = filteredConversions.length;
    const tr = filteredConversions.reduce((s: number, c: any) => s + Number(c.amount), 0);
    const totalFees = filteredConversions.reduce((s: number, c: any) => s + Number(c.fees || 0), 0);
    const totalNet = filteredConversions.reduce((s: number, c: any) => s + Number(c.net_amount || c.amount || 0), 0);
    const cr = tv > 0 ? (ts / tv) * 100 : 0;
    const at = ts > 0 ? tr / ts : 0;

    const seenPrevClickIds = new Set<string>();
    const uniquePrevClicks = prevClicks.filter((c: any) => {
      if (!c.click_id || seenPrevClickIds.has(c.click_id)) return false;
      seenPrevClickIds.add(c.click_id);
      return true;
    });
    const prevTv = uniquePrevClicks.length;
    const prevTs = prevConversions.length;
    const prevTr = prevConversions.reduce((s: number, c: any) => s + Number(c.amount), 0);
    const prevCr = prevTv > 0 ? (prevTs / prevTv) * 100 : 0;
    const prevAt = prevTs > 0 ? prevTr / prevTs : 0;

    // Previous period product-level data
    const prevProdMap = new Map<string, { vendas: number; receita: number }>();
    prevConversions.forEach((c: any) => {
      const name = c.product_name || "Produto desconhecido";
      const e = prevProdMap.get(name) || { vendas: 0, receita: 0 };
      e.vendas++; e.receita += Number(c.amount);
      prevProdMap.set(name, e);
    });

    const prevMainCount = prevConversions.filter((c: any) => !c.is_order_bump).length;
    const prevObCount = prevConversions.filter((c: any) => c.is_order_bump).length;
    const prevMainRevenue = prevConversions.filter((c: any) => !c.is_order_bump).reduce((s: number, c: any) => s + Number(c.amount), 0);
    const prevObRevenue = prevConversions.filter((c: any) => c.is_order_bump).reduce((s: number, c: any) => s + Number(c.amount), 0);

    const comparison = {
      views: pctChange(tv, prevTv),
      sales: pctChange(ts, prevTs),
      revenue: pctChange(tr, prevTr),
      convRate: cr - prevCr,
      ticket: pctChange(at, prevAt),
    };

    const days = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000)) + 1;
    const dayMap = new Map<string, { views: number; sales: number; revenue: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(dateRange.from.getTime() + i * 86400000);
      const ds = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      dayMap.set(ds, { views: 0, sales: 0, revenue: 0 });
    }
    uniqueClicks.forEach((c: any) => {
      const ds = new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const entry = dayMap.get(ds); if (entry) entry.views++;
    });
    filteredConversions.forEach((c: any) => {
      const ds = new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const entry = dayMap.get(ds); if (entry) { entry.sales++; entry.revenue += Number(c.amount); }
    });

    const chartData = Array.from(dayMap.entries()).map(([date, v]) => ({ date, views: v.views, sales: v.sales, revenue: v.revenue }));
    const salesChartData = Array.from(dayMap.entries()).map(([date, v]) => ({ date, vendas: v.sales, receita: v.revenue }));

    const groupBy = (key: string) => {
      const map = new Map<string, number>();
      filteredConversions.forEach((c: any) => {
        const k = c[key] || "(não informado)";
        map.set(k, (map.get(k) || 0) + Number(c.amount));
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    };

    const paymentMap = new Map<string, { vendas: number; receita: number }>();
    filteredConversions.forEach((c: any) => {
      const pm = c.payment_method || "(não informado)";
      const e = paymentMap.get(pm) || { vendas: 0, receita: 0 };
      e.vendas++; e.receita += Number(c.amount);
      paymentMap.set(pm, e);
    });
    const paymentData = Array.from(paymentMap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.receita - a.receita);

    // Fees by platform
    const feePlatformMap = new Map<string, { fees: number; vendas: number; receita: number }>();
    filteredConversions.forEach((c: any) => {
      const plat = c.platform || c.payment_method || "(não informado)";
      const e = feePlatformMap.get(plat) || { fees: 0, vendas: 0, receita: 0 };
      e.fees += Number(c.fees || 0);
      e.vendas++;
      e.receita += Number(c.amount);
      feePlatformMap.set(plat, e);
    });
    const feesData = Array.from(feePlatformMap.entries())
      .map(([name, v]) => ({ name, fees: v.fees, vendas: v.vendas, receita: v.receita, percent: tr > 0 ? (v.fees / tr) * 100 : 0 }))
      .filter(f => f.fees > 0)
      .sort((a, b) => b.fees - a.fees);

    const prodMap = new Map<string, { vendas: number; receita: number; isOrderBump: boolean }>();
    filteredConversions.forEach((c: any) => {
      const name = c.product_name || "Produto desconhecido";
      const e = prodMap.get(name) || { vendas: 0, receita: 0, isOrderBump: c.is_order_bump };
      e.vendas++; e.receita += Number(c.amount);
      prodMap.set(name, e);
    });
    const productData = Array.from(prodMap.entries())
      .map(([name, v]) => {
        const prev = prevProdMap.get(name);
        return {
          name, vendas: v.vendas, receita: v.receita, ticket: v.vendas > 0 ? v.receita / v.vendas : 0,
          percentual: tr > 0 ? (v.receita / tr) * 100 : 0, isOrderBump: v.isOrderBump,
          vendasChange: prev ? pctChange(v.vendas, prev.vendas) : (v.vendas > 0 ? 100 : 0),
          receitaChange: prev ? pctChange(v.receita, prev.receita) : (v.receita > 0 ? 100 : 0),
        };
      })
      .sort((a, b) => b.receita - a.receita);

    const mainProducts = filteredConversions.filter((c: any) => !c.is_order_bump);
    const orderBumps = filteredConversions.filter((c: any) => c.is_order_bump);
    const mainRevenue = mainProducts.reduce((s: number, c: any) => s + Number(c.amount), 0);
    const obRevenue = orderBumps.reduce((s: number, c: any) => s + Number(c.amount), 0);
    const totalPieValue = mainProducts.length + orderBumps.length;
    const pieData = [
      { name: "Produto Principal", value: mainProducts.length, receita: mainRevenue, percent: totalPieValue > 0 ? (mainProducts.length / totalPieValue * 100) : 0 },
      { name: "Order Bump", value: orderBumps.length, receita: obRevenue, percent: totalPieValue > 0 ? (orderBumps.length / totalPieValue * 100) : 0 },
    ];

    const linkStats = smartLinks.map((link: any) => {
      const lv = uniqueClicks.filter((c: any) => c.smartlink_id === link.id).length;
      const lConvs = filteredConversions.filter((c: any) => c.smartlink_id === link.id);
      const lMainConvs = lConvs.filter((c: any) => !c.is_order_bump);
      const lObConvs = lConvs.filter((c: any) => c.is_order_bump);
      const lc = lConvs.length;
      const lr = lConvs.reduce((s: number, c: any) => s + Number(c.amount), 0);
      const prevLv = uniquePrevClicks.filter((c: any) => c.smartlink_id === link.id).length;
      const prevLConvs = prevConversions.filter((c: any) => c.smartlink_id === link.id);
      const prevLc = prevLConvs.length;
      const prevLr = prevLConvs.reduce((s: number, c: any) => s + Number(c.amount), 0);
      const rate = lv > 0 ? (lc / lv) * 100 : 0;
      const prevRate = prevLv > 0 ? (prevLc / prevLv) * 100 : 0;
      const abandoned = abandonedConversions.filter((c: any) => c.smartlink_id === link.id).length;
      return {
        ...link, views: lv, sales: lc, mainSales: lMainConvs.length, obSales: lObConvs.length, revenue: lr,
        abandoned,
        rate, ticket: lc > 0 ? lr / lc : 0,
        viewsChange: pctChange(lv, prevLv), salesChange: pctChange(lc, prevLc),
        revenueChange: pctChange(lr, prevLr), rateChange: rate - prevRate,
        prevViews: prevLv, prevSales: prevLc, prevRevenue: prevLr,
      };
    });


    // Events chart data (non-approved statuses)
    const EVENT_STATUS_LABELS: Record<string, string> = {
      abandoned_cart: "Abandono",
      boleto_generated: "Boleto Gerado",
      pix_generated: "Pix Gerado",
      waiting_payment: "Aguardando Pgto",
      declined: "Recusada",
      chargedback: "Chargeback",
      refunded: "Reembolso",
    };
    const eventStatusCounts: Record<string, number> = {};
    const eventDayMap = new Map<string, Record<string, number>>();

    // Initialize days
    for (let i = 0; i < days; i++) {
      const d = new Date(dateRange.from.getTime() + i * 86400000);
      const ds = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      eventDayMap.set(ds, {});
    }

    abandonedConversions.forEach((c: any) => {
      const st = c.status || "unknown";
      eventStatusCounts[st] = (eventStatusCounts[st] || 0) + 1;
      const ds = new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const dayEntry = eventDayMap.get(ds);
      if (dayEntry) dayEntry[st] = (dayEntry[st] || 0) + 1;
    });

    const eventBarData = Object.entries(eventStatusCounts)
      .map(([status, count]) => ({ name: EVENT_STATUS_LABELS[status] || status, value: count, status }))
      .sort((a, b) => b.value - a.value);

    const eventDailyData = Array.from(eventDayMap.entries()).map(([date, counts]) => ({
      date,
      ...Object.fromEntries(Object.entries(counts).map(([k, v]) => [EVENT_STATUS_LABELS[k] || k, v])),
    }));

    // All event keys for stacked bar
    const eventKeys = [...new Set(abandonedConversions.map((c: any) => EVENT_STATUS_LABELS[c.status] || c.status))];

    return {
      totalViews: tv, totalSales: ts, totalRevenue: tr, totalFees, totalNet, convRate: cr, avgTicket: at,
      comparison,
      chartData, salesChartData, paymentData, productData, feesData,
      sourceData: groupBy("utm_source"),
      campaignData: groupBy("utm_campaign"),
      mediumData: groupBy("utm_medium"),
      contentData: groupBy("utm_content"),
      productChartData: productData.map(p => ({ name: p.name, value: p.receita })).slice(0, 8),
      linkStats, pieData,
      mainProductsCount: mainProducts.length, orderBumpsCount: orderBumps.length,
      mainRevenue, obRevenue,
      prevMainCount, prevObCount, prevMainRevenue, prevObRevenue,
      // Events
      eventBarData, eventDailyData, eventKeys, eventStatusCounts, EVENT_STATUS_LABELS,
    };
  }, [clicks, conversions, smartLinks, dateRange, prevClicks, prevConversions, excludedIds, abandonedConversions]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = order.indexOf(active.id as string);
      const newIdx = order.indexOf(over.id as string);
      handleReorder(arrayMove(order, oldIdx, newIdx));
    }
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const PIE_COLORS = ["hsl(0, 90%, 50%)", "hsl(350, 75%, 35%)"];

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = computed.pieData[index]?.percent ?? 0;
    if (pct < 5) return null;
    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
        {pct.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
      </text>
    );
  };

  const buildFullExportData = () => {
    const rows: Record<string, any>[] = [];
    const roas = effectiveInvestment > 0 ? computed.totalRevenue / effectiveInvestment : 0;
    const fmtNum = (v: number) => Number(v.toFixed(2));
    rows.push({ "Seção": "Resumo", "Métrica": "Total Views", "Valor": computed.totalViews });
    rows.push({ "Seção": "Resumo", "Métrica": "Vendas", "Valor": computed.totalSales });
    rows.push({ "Seção": "Resumo", "Métrica": "Taxa Conv. (%)", "Valor": fmtNum(computed.convRate) });
    rows.push({ "Seção": "Resumo", "Métrica": "Investimento", "Valor": effectiveInvestment > 0 ? fmtNum(effectiveInvestment) : 0 });
    rows.push({ "Seção": "Resumo", "Métrica": "Faturamento", "Valor": fmtNum(computed.totalRevenue) });
    rows.push({ "Seção": "Resumo", "Métrica": "ROAS", "Valor": effectiveInvestment > 0 ? fmtNum(roas) : 0 });
    rows.push({ "Seção": "Resumo", "Métrica": "Ticket Médio", "Valor": fmtNum(computed.avgTicket) });
    computed.chartData.forEach((d: any) => {
      rows.push({ "Seção": "Tráfego Diário", "Data": d.date, "Views": d.views, "Vendas": d.sales, "Receita": fmtNum(d.revenue) });
    });
    computed.productData.forEach((p: any) => {
      rows.push({ "Seção": "Produtos", "Produto": p.name, "Vendas": p.vendas, "Receita": fmtNum(p.receita), "Ticket Médio": fmtNum(p.ticket), "Percentual (%)": fmtNum(p.percentual), "Tipo": p.isOrderBump ? "Order Bump" : "Principal" });
    });
    rows.push({ "Seção": "Order Bumps", "Categoria": "Produto Principal", "Vendas": computed.mainProductsCount, "Receita": fmtNum(computed.mainRevenue) });
    rows.push({ "Seção": "Order Bumps", "Categoria": "Order Bump", "Vendas": computed.orderBumpsCount, "Receita": fmtNum(computed.obRevenue) });
    computed.linkStats.forEach((l: any) => {
      rows.push({ "Seção": "Smart Links", "Nome": l.name, "Slug": l.slug, "Views": l.views, "Vendas": l.sales, "Receita": fmtNum(l.revenue), "Taxa Conv. (%)": fmtNum(l.rate), "Status": l.is_active ? "Ativo" : "Pausado" });
    });
    computed.sourceData.forEach((s: any) => { rows.push({ "Seção": "Receita por Origem", "Nome": s.name, "Receita": fmtNum(s.value) }); });
    computed.campaignData.forEach((s: any) => { rows.push({ "Seção": "Receita por Campanha", "Nome": s.name, "Receita": fmtNum(s.value) }); });
    computed.mediumData.forEach((s: any) => { rows.push({ "Seção": "Receita por Medium", "Nome": s.name, "Receita": fmtNum(s.value) }); });
    computed.contentData.forEach((s: any) => { rows.push({ "Seção": "Receita por Content", "Nome": s.name, "Receita": fmtNum(s.value) }); });
    computed.productChartData.forEach((s: any) => { rows.push({ "Seção": "Receita por Produto", "Nome": s.name, "Receita": fmtNum(s.value) }); });
    computed.paymentData.forEach((p: any) => { rows.push({ "Seção": "Meios de Pagamento", "Nome": p.name, "Vendas": p.vendas, "Receita": fmtNum(p.receita) }); });
    return rows;
  };

  const renderSection = (id: string) => {
    const roas = effectiveInvestment > 0 ? computed.totalRevenue / effectiveInvestment : 0;
    const roasColor = roas >= 3 ? "hsl(142, 71%, 45%)" : roas >= 1 ? "hsl(48, 96%, 53%)" : "hsl(0, 84%, 60%)";

    switch (id) {
      case "gamification":
        return null;

      case "kpi-views":
        return (
          <MetricWithTooltip
            label="Total Views"
            value={computed.totalViews.toLocaleString("pt-BR")}
            icon={Eye}
            tooltipKey="total_views"
            change={`${fmtChange(computed.comparison.views)} vs ${previousPeriodLabel}`}
            changeType={changeType(computed.comparison.views)}
          />
        );

      case "kpi-sales":
        return (
          <div className="p-4 rounded-xl border border-border/30 card-shadow glass h-[130px] flex flex-col items-center text-center relative">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Vendas</span>
              <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center">
                <ShoppingCart className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs">
                Total de vendas aprovadas (Produto Principal + Order Bumps) no período selecionado.
              </TooltipContent>
            </UITooltip>
            <div className="text-2xl font-bold flex-1 flex items-center justify-center">{computed.totalSales.toLocaleString("pt-BR")}</div>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-[13px] text-muted-foreground">Vendas <span className="font-mono font-semibold text-foreground/80">{computed.mainProductsCount}</span></span>
              <span className="text-[13px] text-muted-foreground">OB <span className="font-mono font-semibold text-foreground/80">{computed.orderBumpsCount}</span></span>
            </div>
            <div className={cn("text-[10px] font-normal mt-0.5", changeType(computed.comparison.sales) === "positive" ? "text-success" : changeType(computed.comparison.sales) === "negative" ? "text-destructive" : "text-muted-foreground")}>
              {fmtChange(computed.comparison.sales)} vs {previousPeriodLabel}
            </div>
          </div>
        );

      case "kpi-abandono":
        return (
          <div className="p-4 rounded-xl border border-border/30 card-shadow glass h-[130px] flex flex-col items-center text-center relative">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Abandono</span>
              <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center">
                <ShoppingCart className="h-3.5 w-3.5 text-destructive" />
              </div>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs">
                Total de eventos não finalizados: abandono, boleto/pix gerado, recusadas, chargebacks e reembolsos.
              </TooltipContent>
            </UITooltip>
            <div className="text-2xl font-bold flex-1 flex items-center justify-center text-foreground">{abandonedConversions.length.toLocaleString("pt-BR")}</div>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              {Object.entries(computed.eventStatusCounts).slice(0, 3).map(([status, count]) => (
                <span key={status} className="text-[10px] text-muted-foreground">
                  {computed.EVENT_STATUS_LABELS[status] || status} <span className="font-mono font-semibold text-foreground/80">{count}</span>
                </span>
              ))}
            </div>
          </div>
        );

      case "kpi-conv":
        return <MetricWithTooltip label="Taxa Conv." value={`${computed.convRate.toFixed(2)}%`} icon={Percent} tooltipKey="conv_rate" change={`${fmtChange(computed.comparison.convRate, true)} vs ${previousPeriodLabel}`} changeType={changeType(computed.comparison.convRate)} />;

      case "kpi-investment":
        return (
          <div className="p-4 rounded-xl border border-border/30 card-shadow glass h-[130px] flex flex-col items-center text-center relative">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Investimento</span>
              <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs">
                Soma do investimento em Meta Ads e Google Ads no período.
              </TooltipContent>
            </UITooltip>
            <div className="text-2xl font-bold flex-1 flex items-center justify-center">
              {adSpendTotal > 0 ? fmt(adSpendTotal) : "R$ 0,00"}
            </div>
            {adSpendTotal > 0 && (
              <p className="text-[9px] text-muted-foreground mt-0.5">Via Meta + Google Ads</p>
            )}
          </div>
        );

      case "kpi-revenue":
        return <MetricWithTooltip label="Faturamento" value={fmt(computed.totalRevenue)} icon={DollarSign} tooltipKey="revenue" change={`${fmtChange(computed.comparison.revenue)} vs ${previousPeriodLabel}`} changeType={changeType(computed.comparison.revenue)} />;

      case "kpi-roas":
        return (
          <div className="p-4 rounded-xl border border-border/30 card-shadow glass h-[130px] flex flex-col items-center text-center relative">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">ROAS</span>
              <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs">
                ROAS = Faturamento / Investimento. Indica o retorno sobre cada R$1 investido em tráfego.
              </TooltipContent>
            </UITooltip>
            <div className="text-2xl font-bold font-mono flex-1 flex items-center justify-center" style={{ color: effectiveInvestment > 0 ? roasColor : undefined }}>
              {effectiveInvestment > 0 ? roas.toFixed(2) + "x" : "—"}
            </div>
          </div>
        );

      case "kpi-ticket":
        return <MetricWithTooltip label="Ticket Médio" value={fmt(computed.avgTicket)} icon={Ticket} tooltipKey="avg_ticket" change={`${fmtChange(computed.comparison.ticket)} vs ${previousPeriodLabel}`} changeType={changeType(computed.comparison.ticket)} />;

      case "traffic-chart":
        return (
          <div className="rounded-xl border border-border/30 p-3 sm:p-5 mb-6 card-shadow glass">
            <ChartHeader title="Vendas Diárias" icon={<TrendingUp className="h-4 w-4 text-primary" />} tooltipKey="traffic-chart" />
            {computed.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={computed.chartData} margin={{ top: 25, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} /><stop offset="100%" stopColor="hsl(142, 71%, 30%)" stopOpacity={0.35} /></linearGradient>
                  </defs>
                   <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} />
                  <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipContent />} />
                  <Bar yAxisId="right" dataKey="revenue" name="Faturamento (R$)" fill="url(#colorRevenue)" radius={[3, 3, 0, 0]} />
                  <Area yAxisId="left" type="monotone" dataKey="views" name="Views" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                  <Area yAxisId="left" type="monotone" dataKey="sales" name="Vendas" stroke="hsl(160, 70%, 50%)" fillOpacity={1} fill="url(#colorConv)" strokeWidth={2} />
                  <Line yAxisId="right" dataKey="revenue" stroke="none" dot={false} activeDot={false}>
                    <LabelList dataKey="revenue" position="top" style={{ fontSize: 9, fill: "hsl(142, 71%, 45%)" }} formatter={(v: number) => v > 0 ? `R$${(v/100 >= 10 ? (v/1000).toFixed(1)+'k' : v.toLocaleString("pt-BR", {maximumFractionDigits:0}))}` : ""} />
                  </Line>
                  <Line yAxisId="left" dataKey="views" stroke="none" dot={false} activeDot={false}>
                    <LabelList dataKey="views" position="top" style={{ fontSize: 9, fill: "hsl(var(--chart-1))" }} formatter={(v: number) => v > 0 ? v : ""} />
                  </Line>
                  <Line yAxisId="left" dataKey="sales" stroke="none" dot={false} activeDot={false}>
                    <LabelList dataKey="sales" position="top" style={{ fontSize: 9, fill: "hsl(160, 70%, 50%)" }} formatter={(v: number) => v > 0 ? v : ""} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Nenhum dado no período" />}
          </div>
        );

      case "events-chart": {
        const EVENT_COLORS: Record<string, string> = {
          "Abandono": "hsl(38, 92%, 50%)",
          "Boleto Gerado": "hsl(210, 70%, 55%)",
          "Pix Gerado": "hsl(160, 70%, 45%)",
          "Aguardando Pgto": "hsl(48, 96%, 53%)",
          "Recusada": "hsl(0, 84%, 60%)",
          "Chargeback": "hsl(330, 80%, 50%)",
          "Reembolso": "hsl(280, 60%, 55%)",
        };
        const hasEvents = computed.eventBarData.length > 0;
        return (
          <div className="rounded-xl border border-border/30 p-3 sm:p-5 mb-6 card-shadow glass">
            <ChartHeader title="Eventos de Conversão" icon={<ShoppingCart className="h-4 w-4 text-primary" />} tooltipKey="events-chart" />
            {hasEvents ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart: totais por status */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Total por Status</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={computed.eventBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} horizontal={false} />
                      <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} width={110} />
                      <Tooltip content={<CustomTooltipContent />} />
                      <Bar dataKey="value" name="Eventos" radius={[0, 4, 4, 0]}>
                        {computed.eventBarData.map((entry: any, i: number) => (
                          <Cell key={i} fill={EVENT_COLORS[entry.name] || "hsl(var(--chart-1))"} />
                        ))}
                        <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Stacked area chart: evolução diária */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Evolução Diária</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={computed.eventDailyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} />
                      <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltipContent />} />
                      {computed.eventKeys.map((key: string) => (
                        <Area
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stackId="1"
                          stroke={EVENT_COLORS[key] || "hsl(var(--chart-1))"}
                          fill={EVENT_COLORS[key] || "hsl(var(--chart-1))"}
                          fillOpacity={0.4}
                          strokeWidth={1.5}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* KPI cards for each event type */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {computed.eventBarData.map((e: any) => (
                    <div key={e.status} className="p-3 rounded-lg glass border border-border/30 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{e.name}</p>
                      <p className="text-xl font-bold font-mono" style={{ color: EVENT_COLORS[e.name] || "hsl(var(--foreground))" }}>
                        {e.value.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyState text="Nenhum evento registrado no período" />}
          </div>
        );
      }

      case "products":
        return computed.productData.length > 0 ? (
          <div className="rounded-xl border border-border/30 card-shadow glass overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Resumo por Produto</h3>
              <UITooltip>
                <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">{CHART_TOOLTIPS["products"]}</TooltipContent>
              </UITooltip>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Produto</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Vendas</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Receita</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Ticket</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">% Faturamento</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                </tr></thead>
                <tbody>
                  {computed.productData.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-sm">{p.name}</td>
                      <td className="text-center px-5 py-3 text-sm">
                        <div className="font-mono font-semibold">{p.vendas}</div>
                        <div><ComparisonBadge value={p.vendasChange} /></div>
                      </td>
                      <td className="text-center px-5 py-3 text-sm">
                        <div className="font-mono font-semibold">{fmt(p.receita)}</div>
                        <div><ComparisonBadge value={p.receitaChange} /></div>
                      </td>
                      <td className="text-center px-5 py-3 font-mono text-sm">{fmt(p.ticket)}</td>
                      <td className="text-center px-5 py-3 font-mono text-sm text-muted-foreground">{p.percentual.toFixed(1)}%</td>
                      <td className="text-center px-5 py-3">
                         <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.isOrderBump ? "bg-accent text-accent-foreground" : "bg-primary/20 text-primary"}`}>
                           {p.isOrderBump ? "Order Bump" : "Principal"}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null;

      case "order-bumps":
        return (
          <div className="rounded-xl border border-border/30 card-shadow glass p-5 mb-6">
            <ChartHeader title="Produtos vs Order Bumps" icon={<Layers className="h-4 w-4 text-primary" />} tooltipKey="order-bumps" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex justify-center">
                {computed.totalSales > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={computed.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={115}
                        dataKey="value"
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {computed.pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} stroke="none" strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
                        formatter={(value) => <span className="text-foreground/80">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyState text="Sem dados de Order Bump" />}
              </div>
              <div className="flex flex-col justify-center space-y-3">
                <div className="p-3 rounded-lg glass border border-border/30">
                  <p className="text-[11px] text-muted-foreground">Vendas Principais</p>
                  <p className="text-xl font-bold">
                    {computed.mainProductsCount}
                    <span className="ml-2"><ComparisonBadge value={pctChange(computed.mainProductsCount, computed.prevMainCount)} /></span>
                  </p>
                </div>
                <div className="p-3 rounded-lg glass border border-border/30">
                  <p className="text-[11px] text-muted-foreground">Vendas Order Bumps</p>
                  <p className="text-xl font-bold">
                    {computed.orderBumpsCount}
                    <span className="ml-2"><ComparisonBadge value={pctChange(computed.orderBumpsCount, computed.prevObCount)} /></span>
                  </p>
                </div>
                <div className="p-3 rounded-lg glass border border-border/30">
                  <p className="text-[11px] text-muted-foreground">Receita Principais</p>
                  <p className="text-xl font-bold">
                    {fmt(computed.mainRevenue)}
                    <span className="ml-2"><ComparisonBadge value={pctChange(computed.mainRevenue, computed.prevMainRevenue)} /></span>
                  </p>
                </div>
                <div className="p-3 rounded-lg glass border border-border/30">
                  <p className="text-[11px] text-muted-foreground">Receita Order Bumps</p>
                  <p className="text-xl font-bold">
                    {fmt(computed.obRevenue)}
                    <span className="ml-2"><ComparisonBadge value={pctChange(computed.obRevenue, computed.prevObRevenue)} /></span>
                  </p>
                </div>
                <div className="p-3 rounded-lg glass border border-primary/20">
                  <p className="text-[11px] text-muted-foreground">Influência OB na Receita</p>
                  <p className="text-xl font-bold text-primary">
                    {computed.mainRevenue > 0 ? `+${((computed.obRevenue / computed.mainRevenue) * 100).toFixed(1)}%` : "0%"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Order Bumps adicionaram este % à receita principal</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "smartlinks":
        return (
          <div className="rounded-xl border border-border/30 card-shadow glass overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Smart Links</h3>
              <UITooltip>
                <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">{CHART_TOOLTIPS["smartlinks"]}</TooltipContent>
              </UITooltip>
            </div>
            {smartLinks.length === 0 ? (
              <EmptyState text="Nenhum Smart Link criado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Nome</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Slug</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Views</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Abandono</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Vendas</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">OB</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Receita</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Taxa</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr></thead>
                  <tbody>
                    {computed.linkStats.map((link: any) => {
                      const variants = link.smartlink_variants || [];
                      // Compute variant stats for highlighting
                      const variantStats = variants.map((v: any) => {
                        const vConvs = conversions.filter((c: any) => c.variant_id === v.id);
                        const vMainSales = vConvs.filter((c: any) => !c.is_order_bump).length;
                        const vObSales = vConvs.filter((c: any) => c.is_order_bump).length;
                        const vSales = vConvs.length;
                        const vRevenue = vConvs.reduce((s: number, c: any) => s + Number(c.amount), 0);
                        const vClicks = clicks.filter((c: any) => c.variant_id === v.id).length;
                        const vTicket = vSales > 0 ? vRevenue / vSales : 0;
                        const vRate = vClicks > 0 ? (vSales / vClicks) * 100 : 0;
                        const vAbandoned = abandonedConversions.filter((c: any) => c.variant_id === v.id).length;
                        return { id: v.id, sales: vSales, mainSales: vMainSales, obSales: vObSales, revenue: vRevenue, clicks: vClicks, ticket: vTicket, rate: vRate, abandoned: vAbandoned };
                      });
                      // Best variant by REVENUE
                      const bestVariant = variantStats.length > 0
                        ? variantStats.reduce((best: any, curr: any) => curr.revenue > best.revenue ? curr : best, variantStats[0])
                        : null;
                      const bestVariantId = bestVariant && bestVariant.revenue > 0 ? bestVariant.id : null;
                      // Per-column max among variants for individual green highlights
                      const maxViews = Math.max(...variantStats.map((v: any) => v.clicks), 0);
                      const maxSales = Math.max(...variantStats.map((v: any) => v.mainSales), 0);
                      const maxOb = Math.max(...variantStats.map((v: any) => v.obSales), 0);
                      const maxRevenue = Math.max(...variantStats.map((v: any) => v.revenue), 0);
                      const maxTicket = Math.max(...variantStats.map((v: any) => v.ticket), 0);

                      return (
                        <React.Fragment key={link.id}>
                          <tr className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                            <td className="px-5 py-3 font-medium text-[13px]">{link.name}</td>
                            <td className="px-5 py-3 text-[13px] text-muted-foreground font-mono">/{link.slug}</td>
                            <td className="text-center px-5 py-3 font-mono text-[13px] font-bold">
                              {link.views.toLocaleString("pt-BR")}
                              <div><ComparisonBadge value={link.viewsChange} /></div>
                            </td>
                            <td className="text-center px-5 py-3 font-mono text-[13px] font-bold text-foreground">{link.abandoned || 0}</td>
                            <td className="text-center px-5 py-3 font-mono text-[13px] font-bold">
                              {link.mainSales.toLocaleString("pt-BR")}
                              <div><ComparisonBadge value={link.salesChange} /></div>
                            </td>
                            <td className="text-center px-5 py-3 font-mono text-[13px] font-bold text-muted-foreground">{link.obSales.toLocaleString("pt-BR")}</td>
                            <td className="text-center px-5 py-3 font-mono text-[13px] font-bold">
                              {fmt(link.revenue)}
                              <div><ComparisonBadge value={link.revenueChange} /></div>
                            </td>
                            <td className="text-center px-5 py-3 font-mono text-[13px] font-bold">
                              {link.rate.toFixed(2)}%
                              <div><ComparisonBadge value={link.rateChange} isAbsolute /></div>
                            </td>
                            <td className="text-center px-5 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${link.is_active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${link.is_active ? "bg-primary" : "bg-muted-foreground"}`} />
                                {link.is_active ? "Ativo" : "Pausado"}
                              </span>
                            </td>
                          </tr>
                          {variants.map((v: any) => {
                            const vs = variantStats.find((s: any) => s.id === v.id) || { clicks: 0, mainSales: 0, obSales: 0, sales: 0, revenue: 0, ticket: 0, rate: 0, abandoned: 0 };
                            const vRate = vs.rate.toFixed(2);
                            const isBest = v.id === bestVariantId;
                            return (
                              <tr key={v.id} className={cn(
                                "border-b border-border/10 hover:bg-accent/10 transition-colors",
                                isBest && "bg-success/5 border-l-2 border-l-success"
                              )}>
                                <td className="px-5 py-3 font-medium text-[13px]">
                                  <span className="text-muted-foreground mr-1">↳</span>
                                  {v.name}
                                  {isBest && <span className="ml-1.5 text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full font-semibold">★ Melhor</span>}
                                </td>
                                <td className="px-5 py-3 text-[13px] text-muted-foreground font-mono truncate max-w-[140px]" title={v.url}>{v.url}</td>
                                <td className={cn("text-center px-5 py-3 font-mono text-[13px] font-bold", variantStats.length > 1 && vs.clicks === maxViews && maxViews > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                                  {vs.clicks.toLocaleString("pt-BR")}
                                  {(() => { const prevVC = prevClicks.filter((c: any) => c.variant_id === v.id).length; return <div><ComparisonBadge value={pctChange(vs.clicks, prevVC)} /></div>; })()}
                                </td>
                                <td className="text-center px-5 py-3 font-mono text-[13px] font-bold text-foreground">{vs.abandoned}</td>
                                <td className={cn("text-center px-5 py-3 font-mono text-[13px] font-bold", variantStats.length > 1 && vs.mainSales === maxSales && maxSales > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                                  {vs.mainSales.toLocaleString("pt-BR")}
                                  {(() => { const prevVS = prevConversions.filter((c: any) => c.variant_id === v.id).length; return <div><ComparisonBadge value={pctChange(vs.sales, prevVS)} /></div>; })()}
                                </td>
                                <td className={cn("text-center px-5 py-3 font-mono text-[13px] font-bold", variantStats.length > 1 && vs.obSales === maxOb && maxOb > 0 ? "text-emerald-400" : "text-muted-foreground")}>{vs.obSales.toLocaleString("pt-BR")}</td>
                                <td className={cn("text-center px-5 py-3 font-mono text-[13px] font-bold", variantStats.length > 1 && vs.revenue === maxRevenue && maxRevenue > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                                  {fmt(vs.revenue)}
                                  {(() => { const prevVR = prevConversions.filter((c: any) => c.variant_id === v.id).reduce((s: number, c: any) => s + Number(c.amount), 0); return <div><ComparisonBadge value={pctChange(vs.revenue, prevVR)} /></div>; })()}
                                </td>
                                <td className="text-center px-5 py-3 font-mono text-[13px] font-bold">
                                  {vRate}%
                                  {(() => { const prevVC = prevClicks.filter((c: any) => c.variant_id === v.id).length; const prevVS = prevConversions.filter((c: any) => c.variant_id === v.id).length; const prevVRate = prevVC > 0 ? (prevVS / prevVC) * 100 : 0; return <div><ComparisonBadge value={parseFloat(vRate) - prevVRate} isAbsolute /></div>; })()}</td>
                                <td className="text-center px-5 py-2">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${v.is_active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                                    {v.is_active ? "Ativa" : "Inativa"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "chart-source":
        return computed.sourceData.length > 0 ? <MiniBarChart title="Receita por Origem" icon={<Globe className="h-4 w-4 text-primary" />} tooltipKey="source" data={computed.sourceData} paletteIdx={0} fmt={fmt} /> : null;
      case "chart-campaign":
        return computed.campaignData.length > 0 ? <MiniBarChart title="Receita por Campanha" icon={<Megaphone className="h-4 w-4 text-primary" />} tooltipKey="campaign" data={computed.campaignData} paletteIdx={1} fmt={fmt} /> : null;
      case "chart-medium":
        return computed.mediumData.length > 0 ? <MiniBarChart title="Receita por Medium" icon={<Monitor className="h-4 w-4 text-primary" />} tooltipKey="medium" data={computed.mediumData} paletteIdx={2} fmt={fmt} /> : null;
      case "chart-content":
        return computed.contentData.length > 0 ? <MiniBarChart title="Receita por Content" icon={<FileText className="h-4 w-4 text-primary" />} tooltipKey="content" data={computed.contentData} paletteIdx={3} fmt={fmt} /> : null;
      case "chart-product":
        return computed.productChartData.length > 0 ? <MiniBarChart title="Receita por Produto" icon={<Package className="h-4 w-4 text-primary" />} tooltipKey="product" data={computed.productChartData} paletteIdx={4} fmt={fmt} /> : null;
      case "chart-payment":
        return computed.paymentData.length > 0 ? <MiniBarChart title="Meios de Pagamento" icon={<CreditCard className="h-4 w-4 text-primary" />} tooltipKey="payment" data={computed.paymentData.map(p => ({ name: p.name, value: p.receita }))} paletteIdx={5} fmt={fmt} /> : null;

      // ── Meta Ads ──
      case "meta-kpi-spend":
        return <MetricCard label="Meta Ads: Invest." value={adMetrics.metaSpend > 0 ? fmt(adMetrics.metaSpend) : "—"} icon={DollarSign} />;
      case "meta-kpi-leads":
        return <MetricCard label="Meta Ads: Leads" value={adMetrics.metaLeads > 0 ? adMetrics.metaLeads.toLocaleString("pt-BR") : "—"} icon={Users} />;
      case "meta-kpi-ctr":
        return <MetricCard label="Meta Ads: CTR" value={adMetrics.metaImpressions > 0 ? `${adMetrics.metaCtr.toFixed(2)}%` : "—"} icon={Percent} />;
      case "meta-kpi-cpm":
        return <MetricCard label="Meta Ads: CPM" value={adMetrics.metaImpressions > 0 ? fmt(adMetrics.metaCpm) : "—"} icon={Eye} />;
      case "meta-funnel":
        return adMetrics.metaImpressions > 0 ? (
          <div className="rounded-xl border border-border/30 card-shadow glass p-5 mb-6">
            <ChartHeader title="Meta Ads: Funil" icon={<TrendingUp className="h-4 w-4 text-primary" />} tooltipKey="meta-funnel" />
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg glass border border-border/20">
                <p className="text-[10px] text-muted-foreground uppercase">Impressões</p>
                <p className="text-lg font-bold font-mono">{adMetrics.metaImpressions.toLocaleString("pt-BR")}</p>
              </div>
              <div className="text-center p-3 rounded-lg glass border border-border/20">
                <p className="text-[10px] text-muted-foreground uppercase">Cliques</p>
                <p className="text-lg font-bold font-mono">{adMetrics.metaClicks.toLocaleString("pt-BR")}</p>
              </div>
              <div className="text-center p-3 rounded-lg glass border border-border/20">
                <p className="text-[10px] text-muted-foreground uppercase">Investimento</p>
                <p className="text-lg font-bold font-mono">{fmt(adMetrics.metaSpend)}</p>
              </div>
            </div>
          </div>
        ) : null;
      case "meta-campaigns":
        return adMetrics.metaCampaigns.length > 0 ? (
          <div className="rounded-xl border border-border/30 card-shadow glass overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Meta Ads: Campanhas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Campanha</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Invest.</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Cliques</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Impressões</th>
                </tr></thead>
                <tbody>
                  {adMetrics.metaCampaigns.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-sm truncate max-w-[200px]">{c.name}</td>
                      <td className="text-center px-5 py-3 font-mono text-sm">{fmt(c.spend)}</td>
                      <td className="text-center px-5 py-3 font-mono text-sm">{c.clicks.toLocaleString("pt-BR")}</td>
                      <td className="text-center px-5 py-3 font-mono text-sm">{c.impressions.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null;

      // ── Google Ads ──
      case "gads-kpi-spend":
        return <MetricCard label="Google Ads: Invest." value={adMetrics.gadsSpend > 0 ? fmt(adMetrics.gadsSpend) : "—"} icon={DollarSign} />;
      case "gads-kpi-clicks":
        return <MetricCard label="Google Ads: Cliques" value={adMetrics.gadsClicks > 0 ? adMetrics.gadsClicks.toLocaleString("pt-BR") : "—"} icon={MousePointerClick} />;
      case "gads-kpi-ctr":
        return <MetricCard label="Google Ads: CTR" value={adMetrics.gadsImpressions > 0 ? `${adMetrics.gadsCtr.toFixed(2)}%` : "—"} icon={Percent} />;
      case "gads-kpi-cpc":
        return <MetricCard label="Google Ads: CPC" value={adMetrics.gadsClicks > 0 ? fmt(adMetrics.gadsCpc) : "—"} icon={DollarSign} />;

      // ── GA4 ──
      case "ga4-kpi-sessions":
        return <MetricCard label="GA4: Sessões" value={ga4Metrics.totalSessions > 0 ? ga4Metrics.totalSessions.toLocaleString("pt-BR") : "—"} icon={Eye} />;
      case "ga4-kpi-users":
        return <MetricCard label="GA4: Usuários" value={ga4Metrics.totalUsers > 0 ? ga4Metrics.totalUsers.toLocaleString("pt-BR") : "—"} icon={Users} />;
      case "ga4-kpi-engagement":
        return <MetricCard label="GA4: Engajamento" value={ga4Metrics.avgEngagement > 0 ? `${ga4Metrics.avgEngagement.toFixed(1)}%` : "—"} icon={TrendingUp} />;
      case "ga4-origin":
        if (ga4Metrics.originData.length === 0) return null;
        return (
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-5">
            <h3 className="text-sm font-semibold mb-4">GA4: Origem dos Acessos</h3>
            <div className="space-y-2">
              {ga4Metrics.originData.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-foreground font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.value.toLocaleString("pt-BR")} sessões</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "ga4-devices":
        if (ga4Metrics.deviceData.length === 0) return null;
        return (
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-5">
            <h3 className="text-sm font-semibold mb-4">GA4: Dispositivos</h3>
            <div className="space-y-2">
              {ga4Metrics.deviceData.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-foreground font-medium capitalize">{item.name}</span>
                  <span className="text-muted-foreground">{item.value.toLocaleString("pt-BR")} sessões</span>
                </div>
              ))}
            </div>
          </div>
        );


      default: return null;
    }
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Visão geral do seu projeto"
      actions={
        <div className="flex items-center gap-1.5 flex-wrap">
          <ProductTour {...TOURS.dashboard} />
          <DateFilter value={dateRange} onChange={handleDateChange} onPresetChange={setPeriodLabel} />
        </div>
      }
    >
      <div className="mb-6">
        <GamificationBar
          since={sinceISO}
          until={untilISO}
          goal={revenueGoal ?? 1000000}
          onEditGoal={() => { setGoalInputs({ daily: formatValueInput(String(revenueGoals?.daily ?? 0)), weekly: formatValueInput(String(revenueGoals?.weekly ?? 0)), monthly: formatValueInput(String(revenueGoals?.monthly ?? 1000000)), yearly: formatValueInput(String(revenueGoals?.yearly ?? 0)) }); setGoalModalOpen(true); }}
        />
      </div>

        <div className="flex items-center justify-end mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            {editMode ? (
              <>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 border-dashed" onClick={() => { resetLayout(); resetVisibility(); }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Resetar para padrão
                </Button>
                <Button variant="default" size="sm" className="text-xs gap-1.5 h-8" onClick={toggleEdit}>
                  <Check className="h-3.5 w-3.5" /> Salvar
                </Button>
              </>
            ) : (
              <div className="flex items-center rounded-lg border border-border/40 overflow-hidden h-8">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8 rounded-none border-r border-border/30 px-3 hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)] hover:text-foreground" onClick={toggleEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Reordenar
                </Button>
                <ChartVisibilityMenu sections={CHART_SECTIONS} visible={visible} onToggle={toggleVisibility} customMetrics={customMetrics} onAddCustomMetric={addMetric} onRemoveCustomMetric={removeMetric} />
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8 rounded-none border-l border-border/30 px-3 hover:bg-primary/10 hover:text-foreground" onClick={() => { resetLayout(); resetVisibility(); }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Resetar
                </Button>
              </div>
            )}
            <ExportMenu
              data={buildFullExportData()}
              filename="dashboard-nexus"
              title="Dashboard Completo — Nexus Metrics"
              snapshotSelector="#dashboard-export-root"
              periodLabel={`Período: ${periodLabel}`}
              kpis={[
                { label: "Views", value: computed.totalViews.toLocaleString("pt-BR") },
                { label: "Vendas", value: computed.totalSales.toLocaleString("pt-BR") },
                { label: "Taxa Conv.", value: computed.convRate.toFixed(2) + "%" },
                { label: "Investimento", value: effectiveInvestment > 0 ? fmt(effectiveInvestment) : "—" },
                { label: "Faturamento", value: fmt(computed.totalRevenue) },
                { label: "ROAS", value: effectiveInvestment > 0 ? (computed.totalRevenue / effectiveInvestment).toFixed(2) + "x" : "—" },
                { label: "Ticket Médio", value: fmt(computed.avgTicket) },
              ]}
              size="default"
            />
            <ShareReportButton />
          </div>
        </div>

      <div id="dashboard-export-root">

      {(() => {
        const KPI_IDS = [
          "kpi-views", "kpi-sales", "kpi-abandono", "kpi-conv", "kpi-investment", "kpi-revenue", "kpi-roas", "kpi-ticket",
          "meta-kpi-spend", "meta-kpi-leads", "meta-kpi-ctr", "meta-kpi-cpm",
          "gads-kpi-spend", "gads-kpi-clicks", "gads-kpi-ctr", "gads-kpi-cpc",
          "ga4-kpi-sessions", "ga4-kpi-users", "ga4-kpi-engagement",
        ];
        const CHART_IDS = ["chart-source", "chart-campaign", "chart-medium", "chart-content", "chart-product", "chart-payment"];
        const visibleOrder = order.filter(id => visible[id] !== false);
        const kpis = visibleOrder.filter(id => KPI_IDS.includes(id));
        const charts = visibleOrder.filter(id => CHART_IDS.includes(id));
        const others = visibleOrder.filter(id => !KPI_IDS.includes(id) && !CHART_IDS.includes(id));

        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {/* KPI Grid */}
              {kpis.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                  {kpis.map(id => (
                    <SortableSection key={id} id={id} editMode={editMode}>
                      {renderSection(id)}
                    </SortableSection>
                  ))}
                </div>
              )}
              {/* Custom Metrics */}
              {customMetrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                  {customMetrics.map(cm => {
                    const dataCtx: Record<string, number> = {
                      vendas: computed.totalSales,
                      faturamento: computed.totalRevenue,
                      views: computed.totalViews,
                      ticket_medio: computed.avgTicket,
                      taxa_conversao: computed.convRate,
                      investimento: effectiveInvestment,
                      roas: effectiveInvestment > 0 ? computed.totalRevenue / effectiveInvestment : 0,
                      leads: 0,
                      abandono: abandonedConversions.length,
                      order_bumps: computed.orderBumpsCount,
                      ob_receita: computed.obRevenue,
                      meta_spend: adMetrics.metaSpend,
                      meta_impressions: adMetrics.metaImpressions,
                      meta_clicks: adMetrics.metaClicks,
                      meta_ctr: adMetrics.metaCtr,
                      meta_cpm: adMetrics.metaCpm,
                      gads_spend: adMetrics.gadsSpend,
                      gads_clicks: adMetrics.gadsClicks,
                      gads_impressions: adMetrics.gadsImpressions,
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
              {/* Main sections */}
              {others.map(id => (
                <SortableSection key={id} id={id} editMode={editMode}>
                  {renderSection(id)}
                </SortableSection>
              ))}
              {/* Mini-charts Grid */}
              {charts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {charts.map(id => (
                    <SortableSection key={id} id={id} editMode={editMode}>
                      {renderSection(id)}
                    </SortableSection>
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>
        );
      })()}
      </div>{/* end dashboard-export-root */}

      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Metas de Faturamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">Defina as metas de faturamento por período para este projeto.</p>
            {goalPeriods.map(p => (
              <div key={p} className="flex items-center gap-3">
                <label className="text-sm font-medium w-20">{goalPeriodLabels[p]}</label>
                <Input
                  value={goalInputs[p]}
                  onChange={(e) => setGoalInputs(prev => ({ ...prev, [p]: formatValueInput(e.target.value) }))}
                  placeholder="0"
                  className="font-mono flex-1"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGoalModalOpen(false)}>Cancelar</Button>
            <Button size="sm" className="gradient-bg border-0 text-primary-foreground" onClick={saveGoals}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </DashboardLayout>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">{text}</div>;
}

function MiniBarChart({ title, icon, tooltipKey, data, paletteIdx, fmt }: { title: string; icon?: React.ReactNode; tooltipKey: string; data: { name: string; value: number }[]; paletteIdx: number; fmt: (v: number) => string }) {
  const palette = CHART_PALETTES[paletteIdx % CHART_PALETTES.length];
  const miniTooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--foreground))",
    padding: "10px 14px",
    boxShadow: "var(--shadow-card)",
  };

  function MiniCustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div style={miniTooltipStyle}>
        <p style={{ color: "#e0e0e0", marginBottom: 4, fontWeight: 500 }}>{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: "#ffffff", fontSize: 12 }}>
            <span style={{ color: entry.color || "#f5f5f5", marginRight: 6 }}>●</span>
            {entry.name}: {fmt(entry.value)}
          </p>
        ))}
      </div>
    );
  }

  const chartData = data.slice(0, 6);

  return (
    <div className="rounded-xl border border-border/30 p-4 card-shadow glass">
      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
        {icon}{title}
        <UITooltip>
          <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px] text-xs">{CHART_TOOLTIPS[tooltipKey] || "Dados do período."}</TooltipContent>
        </UITooltip>
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 38)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
          <defs>
            {chartData.map((_, i) => (
              <linearGradient key={`miniGrad${i}`} id={`miniGrad-${paletteIdx}-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={palette[i % palette.length]} stopOpacity={0.95} />
                <stop offset="100%" stopColor={palette[i % palette.length]} stopOpacity={0.5} />
              </linearGradient>
            ))}
          </defs>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 12) + "…" : v} />
          <Tooltip content={<MiniCustomTooltip />} />
          <Bar dataKey="value" name="Receita" radius={[0, 4, 4, 0]} barSize={22}>
            {chartData.map((_, i) => <Cell key={i} fill={`url(#miniGrad-${paletteIdx}-${i})`} />)}
            <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: 600 }} formatter={(v: number) => fmt(v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

