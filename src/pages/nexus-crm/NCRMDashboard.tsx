import { useState, useMemo } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { Target, DollarSign, TrendingUp, CheckSquare, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "all", label: "Tudo" },
];

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-md p-5 border border-border bg-card card-shadow">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

const SCORE_COLORS = ["hsl(var(--info))", "hsl(280, 80%, 55%)", "hsl(var(--warning))", "hsl(25, 95%, 55%)", "hsl(var(--primary))"];

export default function NCRMDashboard() {
  const crm = useCRM2();
  const [period, setPeriod] = useState("30");

  const cutoff = useMemo(() => {
    if (period === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(period));
    return d.toISOString();
  }, [period]);

  const filteredLeads = useMemo(() => cutoff ? crm.leads.filter((l: any) => l.created_at >= cutoff) : crm.leads, [crm.leads, cutoff]);
  const filteredDeals = useMemo(() => cutoff ? crm.deals.filter((d: any) => d.created_at >= cutoff) : crm.deals, [crm.deals, cutoff]);
  const filteredTasks = useMemo(() => cutoff ? crm.tasks.filter((t: any) => t.created_at >= cutoff) : crm.tasks, [crm.tasks, cutoff]);

  const totalLeads = filteredLeads.length;
  const openDeals = filteredDeals.filter((d: any) => d.crm2_deal_statuses?.type === "Open");
  const pipelineValue = openDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const convertedLeads = filteredLeads.filter((l: any) => l.converted).length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
  const pendingTasks = filteredTasks.filter((t: any) => {
    const s = (t.status || "").toLowerCase().replace(/\s+/g, "_");
    return s === "todo" || s === "in_progress" || s === "backlog";
  }).length;

  const dealsByStage = crm.dealStatuses.map((s: any) => ({
    name: s.name,
    count: filteredDeals.filter((d: any) => d.status_id === s.id).length,
    value: filteredDeals.filter((d: any) => d.status_id === s.id).reduce((sum: number, d: any) => sum + (d.deal_value || 0), 0),
    color: s.color,
  }));

  const sourceMap: Record<string, number> = {};
  filteredLeads.forEach((l: any) => { const s = l.source || "Sem fonte"; sourceMap[s] = (sourceMap[s] || 0) + 1; });
  const leadsBySource = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(280, 80%, 55%)", "hsl(var(--warning))", "hsl(var(--success))", "hsl(190, 80%, 50%)"];

  const scoreBuckets = [
    { label: "0-20", min: 0, max: 20 },
    { label: "21-40", min: 21, max: 40 },
    { label: "41-60", min: 41, max: 60 },
    { label: "61-80", min: 61, max: 80 },
    { label: "81-100", min: 81, max: 100 },
  ];
  const scoreData = scoreBuckets.map((b, i) => ({
    label: b.label,
    count: filteredLeads.filter((l: any) => (l.score || 0) >= b.min && (l.score || 0) <= b.max).length,
    fill: SCORE_COLORS[i],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Painel de Controle
        </h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {PERIODS.map((p) => (
            <Button key={p.value} variant="ghost" size="sm" onClick={() => setPeriod(p.value)}
              className={cn("text-xs", period === p.value && "bg-card shadow-sm")}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Target} label="Total de Leads" value={totalLeads} color="hsl(var(--primary))" />
        <MetricCard icon={DollarSign} label="Valor do Pipeline" value={fmt(pipelineValue)} color="hsl(var(--success))" />
        <MetricCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversionRate}%`} color="hsl(var(--warning))" />
        <MetricCard icon={CheckSquare} label="Tarefas Pendentes" value={pendingTasks} color="hsl(280, 80%, 55%)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-md p-5 border border-border bg-card card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Deals por Estágio</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dealsByStage} layout="vertical" margin={{ left: 80 }}>
              <defs>
                {dealsByStage.map((d: any, i: number) => (
                  <linearGradient key={`dsg-${i}`} id={`dealStageGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={75} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} itemStyle={{ color: "hsl(var(--muted-foreground))" }} formatter={(v: number, n: string) => [n === "value" ? fmt(v) : v, n === "value" ? "Valor" : "Quantidade"]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {dealsByStage.map((_: any, i: number) => (<Cell key={i} fill={`url(#dealStageGrad-${i})`} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-md p-5 border border-border bg-card card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Fontes de Leads</h3>
          {leadsBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  {leadsBySource.map((_, i) => (
                    <linearGradient key={`pieG-${i}`} id={`pieGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={leadsBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {leadsBySource.map((_, i) => <Cell key={i} fill={`url(#pieGrad-${i})`} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados de fontes</p>
          )}
        </div>
      </div>

      <div className="rounded-md p-5 border border-border bg-card card-shadow">
        <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição de Lead Score</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={scoreData}>
            <defs>
              {SCORE_COLORS.map((c, i) => (
                <linearGradient key={`scG-${i}`} id={`scoreGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {scoreData.map((_, i) => <Cell key={i} fill={`url(#scoreGrad-${i})`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-md p-5 border border-border bg-card card-shadow">
        <h3 className="text-sm font-semibold text-foreground mb-4">Tarefas Pendentes</h3>
        <div className="space-y-2">
          {crm.tasks.filter((t: any) => {
            const s = (t.status || "").toLowerCase().replace(/\s+/g, "_");
            return s !== "done" && s !== "canceled";
          }).slice(0, 5).map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-secondary">
              <span className={`h-2 w-2 rounded-full ${t.priority === "High" ? "bg-destructive" : t.priority === "Medium" ? "bg-warning" : "bg-muted-foreground"}`} />
              <span className="text-sm text-foreground flex-1">{t.title}</span>
              {t.due_date && (
                <span className="text-xs text-muted-foreground">{new Date(t.due_date).toLocaleDateString("pt-BR")}</span>
              )}
            </div>
          ))}
          {crm.tasks.filter((t: any) => {
            const s = (t.status || "").toLowerCase().replace(/\s+/g, "_");
            return s !== "done" && s !== "canceled";
          }).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>
          )}
        </div>
      </div>
    </div>
  );
}
