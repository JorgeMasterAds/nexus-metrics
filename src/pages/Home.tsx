import DashboardLayout from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useUsageLimits } from "@/hooks/useSubscription";
import {
  ShoppingCart, DollarSign, Ticket, GitBranch, Package,
  Webhook, FileCode, Smartphone, Users, TrendingUp, Pencil, Check,
  HelpCircle, RotateCcw, Target, SlidersHorizontal,
} from "lucide-react";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import { useCustomMetrics } from "@/hooks/useCustomMetrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import DateFilter, { DateRange, getDefaultDateRange } from "@/components/DateFilter";
import {
  ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, LabelList,
} from "recharts";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableSection } from "@/components/SortableSection";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import GamificationBar from "@/components/GamificationBar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { formatValueInput, parseValueInput } from "@/lib/utils";

const SECTION_IDS = ["revenue-goal", "metrics", "limits", "sales-chart", "products"];
const HOME_SECTIONS = [
  { id: "revenue-goal", label: "Meta de Faturamento" },
  { id: "metrics", label: "KPIs (Vendas, Faturamento, Ticket)" },
  { id: "limits", label: "Limites de Uso" },
  { id: "sales-chart", label: "Gráfico de Vendas" },
  { id: "products", label: "Produtos" },
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
        const dotColor = entry.dataKey === "receita" ? "hsl(142, 71%, 45%)" : entry.dataKey === "vendas" ? "hsl(160, 70%, 50%)" : entry.color || "#f5f5f5";
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

export default function Home() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [debouncedRange, setDebouncedRange] = useState<DateRange>(dateRange);
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const { order, editMode, toggleEdit, handleReorder, resetLayout } = useDashboardLayout("home", SECTION_IDS);
  const { maxSmartlinks, maxWebhooks, maxLeads, maxDevices } = useUsageLimits();
  const { visible, toggle, isVisible, resetVisibility } = useChartVisibility("home", HOME_SECTIONS);
  const { metrics: customMetrics, addMetric, removeMetric, evaluate: evalMetric } = useCustomMetrics("home");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalInputs, setGoalInputs] = useState({ daily: "", weekly: "", monthly: "", yearly: "" });

  const goalPeriods = ["daily", "weekly", "monthly", "yearly"] as const;
  const goalPeriodLabels: Record<string, string> = { daily: "Diário", weekly: "Semanal", monthly: "Mensal", yearly: "Anual" };

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

  const { data: userProfile } = useQuery({
    queryKey: ["home-user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await (supabase as any).from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      return data;
    },
  });

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
    const stored = localStorage.getItem("nexus_date_preset") || "7 dias";
    const presetGoalMap: Record<string, string> = {
      "Hoje": "daily", "Ontem": "daily",
      "7 dias": "weekly",
      "30 dias": "monthly", "Este mês": "monthly", "Mês passado": "monthly",
    };
    const mapped = presetGoalMap[stored];
    if (mapped) return revenueGoals[mapped] || revenueGoals.monthly || 1000000;
    const days = Math.max(1, Math.round((debouncedRange.to.getTime() - debouncedRange.from.getTime()) / 86400000));
    if (days <= 1) return revenueGoals.daily || revenueGoals.monthly || 1000000;
    if (days <= 7) return revenueGoals.weekly || revenueGoals.monthly || 1000000;
    if (days <= 31) return revenueGoals.monthly || 1000000;
    return revenueGoals.yearly || revenueGoals.monthly || 1000000;
  }, [revenueGoals, debouncedRange]);

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

  const { data: conversions = [] } = useQuery({
    queryKey: ["home-conversions", sinceDate, untilDate, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, amount, status, product_name, is_order_bump, created_at, smartlink_id")
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

  const { data: clicks = [] } = useQuery({
    queryKey: ["home-clicks", sinceDate, untilDate, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("clicks")
        .select("id, created_at")
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 300000,
    enabled: !!activeAccountId,
  });

  // Usage counts
  const { data: smartlinkCount = 0 } = useQuery({
    queryKey: ["home-smartlink-count", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any).from("smartlinks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { count } = await q;
      return count || 0;
    },
    enabled: !!activeAccountId,
  });

  const { data: webhookCount = 0 } = useQuery({
    queryKey: ["home-webhook-count", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any).from("webhooks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId).neq("platform", "form");
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { count } = await q;
      return count || 0;
    },
    enabled: !!activeAccountId,
  });

  const { data: formCount = 0 } = useQuery({
    queryKey: ["home-form-count", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any).from("webhook_forms").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { count } = await q;
      return count || 0;
    },
    enabled: !!activeAccountId,
  });

  const { data: leadCount = 0 } = useQuery({
    queryKey: ["home-lead-count", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any).from("leads").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { count } = await q;
      return count || 0;
    },
    enabled: !!activeAccountId,
  });

  const { data: deviceCount = 0 } = useQuery({
    queryKey: ["home-device-count", activeAccountId],
    queryFn: async () => {
      const { count } = await (supabase as any).from("whatsapp_devices").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId);
      return count || 0;
    },
    enabled: !!activeAccountId,
  });




  // Period comparison
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
    const stored = localStorage.getItem("nexus_date_preset") || "7 dias";
    return presetMap[stored] || `${periodDays} dia${periodDays > 1 ? "s" : ""} anteriores`;
  })();

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };
  const fmtChange = (val: number) => {
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1).replace(".", ",")}%`;
  };
  const changeColor = (val: number) => val > 0 ? "text-success" : val < 0 ? "text-destructive" : "text-muted-foreground";

  const { data: prevConversions = [] } = useQuery({
    queryKey: ["home-conversions-prev", prevSinceISO, prevUntilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, amount, is_order_bump")
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

  // Read excluded conversions from localStorage (shared with UTM Report & Webhook Logs)
  const [excludedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("nexus_excluded_conversions");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const computed = useMemo(() => {
    const filteredConversions = conversions.filter((c: any) => !excludedIds.has(c.id));
    const tv = clicks.length;
    const ts = filteredConversions.length;
    const tr = filteredConversions.reduce((s: number, c: any) => s + Number(c.amount), 0);
    const at = ts > 0 ? tr / ts : 0;
    const mainCount = filteredConversions.filter((c: any) => !c.is_order_bump).length;
    const obCount = filteredConversions.filter((c: any) => c.is_order_bump).length;

    const prevTs = prevConversions.length;
    const prevTr = prevConversions.reduce((s: number, c: any) => s + Number(c.amount), 0);
    const prevAt = prevTs > 0 ? prevTr / prevTs : 0;

    const comparison = {
      sales: pctChange(ts, prevTs),
      revenue: pctChange(tr, prevTr),
      ticket: pctChange(at, prevAt),
    };

    const days = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000)) + 1;
    const dayMap = new Map<string, { views: number; sales: number; revenue: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(dateRange.from.getTime() + i * 86400000);
      const ds = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      dayMap.set(ds, { views: 0, sales: 0, revenue: 0 });
    }
    clicks.forEach((c: any) => {
      const ds = new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const entry = dayMap.get(ds); if (entry) entry.views++;
    });
    filteredConversions.forEach((c: any) => {
      const ds = new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const entry = dayMap.get(ds); if (entry) { entry.sales++; entry.revenue += Number(c.amount); }
    });

    const chartData = Array.from(dayMap.entries()).map(([date, v]) => ({ date, views: v.views, vendas: v.sales, receita: v.revenue }));

    const prodMap = new Map<string, { vendas: number; receita: number }>();
    filteredConversions.forEach((c: any) => {
      const name = c.product_name || "Produto desconhecido";
      const e = prodMap.get(name) || { vendas: 0, receita: 0 };
      e.vendas++; e.receita += Number(c.amount);
      prodMap.set(name, e);
    });
    const productData = Array.from(prodMap.entries())
      .map(([name, v]) => ({ name, vendas: v.vendas, receita: v.receita, ticket: v.vendas > 0 ? v.receita / v.vendas : 0 }))
      .sort((a, b) => b.receita - a.receita);

    return { totalViews: tv, totalSales: ts, totalRevenue: tr, avgTicket: at, chartData, productData, mainCount, obCount, comparison };
  }, [clicks, conversions, dateRange, prevConversions, excludedIds]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = order.indexOf(active.id as string);
      const newIdx = order.indexOf(over.id as string);
      handleReorder(arrayMove(order, oldIdx, newIdx));
    }
  };

  const firstName = userProfile?.full_name?.split(" ")[0] || "Usuário";

  const renderSection = (id: string) => {
    switch (id) {
      case "revenue-goal":
        return (
          <div className="mb-2">
            <GamificationBar
              since={sinceISO}
              until={untilISO}
              goal={revenueGoal ?? 1000000}
              onEditGoal={() => { setGoalInputs({ daily: formatValueInput(String(revenueGoals?.daily ?? 0)), weekly: formatValueInput(String(revenueGoals?.weekly ?? 0)), monthly: formatValueInput(String(revenueGoals?.monthly ?? 1000000)), yearly: formatValueInput(String(revenueGoals?.yearly ?? 0)) }); setGoalModalOpen(true); }}
            />
            <div className="flex items-center justify-end gap-1.5 mt-2">
              {editMode ? (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 border-dashed">
                        <RotateCcw className="h-3.5 w-3.5" /> Resetar para padrão
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Resetar layout?</AlertDialogTitle>
                        <AlertDialogDescription>Todas as personalizações de ordem e visibilidade serão perdidas. Tem certeza?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { resetLayout(); resetVisibility(); }}>Resetar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button size="sm" className="text-xs gap-1.5 h-8" onClick={toggleEdit}>
                    <Check className="h-3.5 w-3.5" /> Salvar Layout
                  </Button>
                </>
              ) : (
                <div className="flex items-center rounded-lg border border-border/30 overflow-hidden h-8 bg-muted/10">
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8 rounded-none px-3 hover:bg-primary/10 hover:text-foreground transition-all" onClick={toggleEdit}>
                    <Pencil className="h-3.5 w-3.5" /> Reordenar
                  </Button>
                  <div className="w-px h-4 bg-border/30" />
                  <ChartVisibilityMenu sections={HOME_SECTIONS} visible={visible} onToggle={toggle} customMetrics={customMetrics} onAddCustomMetric={addMetric} onRemoveCustomMetric={removeMetric} />
                </div>
              )}
            </div>
          </div>
        );

      case "metrics":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="p-5 rounded-xl border border-destructive/20 card-shadow glass min-h-[130px] flex flex-col items-center text-center relative overflow-hidden group transition-all hover:border-destructive/30">
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 text-muted-foreground/40 hover:text-foreground transition-colors"><HelpCircle className="h-3 w-3" /></button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">Quantidade total de vendas aprovadas no período selecionado. Inclui vendas principais e order bumps.</TooltipContent>
              </UITooltip>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Vendas</span>
                <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold flex-1 flex items-center justify-center leading-none tracking-tight">{computed.totalSales.toLocaleString("pt-BR")}</div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-[11px] text-muted-foreground">Vendas <span className="font-mono font-bold text-foreground/80">{computed.mainCount}</span></span>
                <span className="text-[11px] text-muted-foreground">OB <span className="font-mono font-bold text-foreground/80">{computed.obCount}</span></span>
              </div>
              <div className={`text-[10px] font-medium mt-1 ${changeColor(computed.comparison.sales)}`}>
                {fmtChange(computed.comparison.sales)} vs {previousPeriodLabel}
              </div>
            </div>
            <div className="p-5 rounded-xl border border-destructive/20 card-shadow glass min-h-[130px] flex flex-col items-center text-center relative overflow-hidden group transition-all hover:border-destructive/30">
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 text-muted-foreground/40 hover:text-foreground transition-colors"><HelpCircle className="h-3 w-3" /></button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">Soma dos valores de todas as vendas aprovadas no período selecionado.</TooltipContent>
              </UITooltip>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Faturamento</span>
                <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold flex-1 flex items-center justify-center leading-none tracking-tight">{fmt(computed.totalRevenue)}</div>
              <div className={`text-[10px] font-medium mt-2 ${changeColor(computed.comparison.revenue)}`}>
                {fmtChange(computed.comparison.revenue)} vs {previousPeriodLabel}
              </div>
            </div>
            <div className="p-5 rounded-xl border border-destructive/20 card-shadow glass min-h-[130px] flex flex-col items-center text-center relative overflow-hidden group transition-all hover:border-destructive/30">
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 text-muted-foreground/40 hover:text-foreground transition-colors"><HelpCircle className="h-3 w-3" /></button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">Ticket Médio = Receita Total / Número de Vendas. Valor médio por transação.</TooltipContent>
              </UITooltip>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Ticket Médio</span>
                <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <Ticket className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold flex-1 flex items-center justify-center leading-none tracking-tight">{fmt(computed.avgTicket)}</div>
              <div className={`text-[10px] font-medium mt-2 ${changeColor(computed.comparison.ticket)}`}>
                {fmtChange(computed.comparison.ticket)} vs {previousPeriodLabel}
              </div>
            </div>
          </div>
        );

      case "limits":
        return (
          <div className="rounded-xl border border-destructive/20 card-shadow glass p-5 mb-8">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Limites de Uso
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/40 hover:text-foreground transition-colors"><HelpCircle className="h-3 w-3" /></button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">Exibe a utilização atual de cada recurso do seu plano: Smart Links, Webhooks, Formulários, Dispositivos e Leads.</TooltipContent>
              </UITooltip>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <UsageItem label="Smart Links" used={smartlinkCount} max={maxSmartlinks} icon={GitBranch} />
              <UsageItem label="Webhooks" used={webhookCount} max={maxWebhooks} icon={Webhook} />
              <UsageItem label="Formulários" used={formCount} max={maxWebhooks} icon={FileCode} />
              <UsageItem label="Dispositivos" used={deviceCount} max={maxDevices} icon={Smartphone} />
              <UsageItem label="Leads" used={leadCount} max={maxLeads} icon={Users} />
            </div>
          </div>
        );

      case "sales-chart":
        return (
          <div className="rounded-xl border border-destructive/20 p-4 sm:p-6 mb-8 card-shadow glass">
            <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Vendas Diárias
            </h3>
            {computed.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={computed.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="homeColorViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} /></linearGradient>
                    <linearGradient id="homeColorConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} /></linearGradient>
                    <linearGradient id="homeColorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} /><stop offset="100%" stopColor="hsl(142, 71%, 30%)" stopOpacity={0.35} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipContent />} />
                  <Bar yAxisId="right" dataKey="receita" name="Faturamento (R$)" fill="url(#homeColorRevenue)" radius={[4, 4, 0, 0]} />
                  <Area yAxisId="left" type="monotone" dataKey="views" name="Views" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#homeColorViews)" strokeWidth={2} />
                  <Area yAxisId="left" type="monotone" dataKey="vendas" name="Vendas" stroke="hsl(160, 70%, 50%)" fillOpacity={1} fill="url(#homeColorConv)" strokeWidth={2} />
                  <Line yAxisId="right" dataKey="receita" stroke="none" dot={false} activeDot={false}>
                    <LabelList dataKey="receita" position="top" style={{ fontSize: 9, fill: "hsl(142, 71%, 45%)" }} formatter={(v: number) => v > 0 ? `R$${(v/1000 >= 10 ? (v/1000).toFixed(1)+'k' : v.toLocaleString("pt-BR", {maximumFractionDigits:0}))}` : ""} />
                  </Line>
                  <Line yAxisId="left" dataKey="views" stroke="none" dot={false} activeDot={false}>
                    <LabelList dataKey="views" position="top" style={{ fontSize: 9, fill: "hsl(var(--chart-1))" }} formatter={(v: number) => v > 0 ? v : ""} />
                  </Line>
                  <Line yAxisId="left" dataKey="vendas" stroke="none" dot={false} activeDot={false}>
                    <LabelList dataKey="vendas" position="top" style={{ fontSize: 9, fill: "hsl(160, 70%, 50%)" }} formatter={(v: number) => v > 0 ? v : ""} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Nenhum dado no período</div>
            )}
          </div>
        );

      case "products":
        return computed.productData.length > 0 ? (
          <div className="rounded-xl border border-destructive/20 card-shadow glass overflow-hidden mb-8">
            <div className="px-5 py-3.5 border-b border-border/15 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Resumo por Produto</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/15">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Produto</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Vendas</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Receita</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Ticket</th>
                </tr></thead>
                <tbody>
                  {computed.productData.map((p, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-primary/5 transition-colors">
                      <td className="px-5 py-3 font-medium text-sm">{p.name}</td>
                      <td className="text-right px-5 py-3 font-mono text-sm tabular-nums">{p.vendas}</td>
                      <td className="text-right px-5 py-3 font-mono text-sm tabular-nums">{fmt(p.receita)}</td>
                      <td className="text-right px-5 py-3 font-mono text-sm tabular-nums">{fmt(p.ticket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null;

      default: return null;
    }
  };

  return (
    <DashboardLayout
      title={`Boas-vindas, ${firstName}`}
      subtitle="Visão geral do seu projeto"
      actions={<div className="flex items-center gap-2"><ProductTour {...TOURS.home} /><DateFilter value={dateRange} onChange={handleDateChange} /></div>}
    >

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.filter(id => id === "revenue-goal" || isVisible(id)).map(id => (
            <SortableSection key={id} id={id} editMode={editMode}>
              {renderSection(id)}
            </SortableSection>
          ))}
        </SortableContext>
      </DndContext>

      {/* Goal edit modal */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Metas de Faturamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">Defina as metas de faturamento por período (sem R$).</p>
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
            <Button variant="outline" onClick={() => setGoalModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveGoals}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function MiniMetric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="p-5 rounded-xl border border-border/20 card-shadow glass group transition-all hover:border-border/40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">{label}</span>
        <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center opacity-80">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function UsageItem({ label, used, max, icon: Icon }: { label: string; used: number; max: number; icon: any }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isHigh = pct > 80;
  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/10 border border-border/10 transition-all hover:border-primary/20 hover:bg-muted/20">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${isHigh ? 'text-warning' : 'text-muted-foreground'}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <p className="text-xs font-mono font-semibold text-foreground/80">{used} <span className="text-muted-foreground font-normal">/ {max}</span></p>
    </div>
  );
}
