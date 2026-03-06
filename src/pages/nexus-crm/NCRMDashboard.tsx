import { useCRM2 } from "@/hooks/useCRM2";
import { Target, DollarSign, TrendingUp, CheckSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-md p-5 border" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-[#A0A0A0]">{label}</p>
          <p className="text-xl font-bold text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

const SCORE_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#FB923C", "#E5191A"];

export default function NCRMDashboard() {
  const crm = useCRM2();

  const totalLeads = crm.leads.length;
  const openDeals = crm.deals.filter((d: any) => d.crm2_deal_statuses?.type === "Open");
  const pipelineValue = openDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const convertedLeads = crm.leads.filter((l: any) => l.converted).length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
  const pendingTasks = crm.tasks.filter((t: any) => ["Todo", "In Progress", "todo", "in_progress"].includes(t.status)).length;

  // Deals by stage chart
  const dealsByStage = crm.dealStatuses.map((s: any) => ({
    name: s.name,
    count: crm.deals.filter((d: any) => d.status_id === s.id).length,
    value: crm.deals.filter((d: any) => d.status_id === s.id).reduce((sum: number, d: any) => sum + (d.deal_value || 0), 0),
    color: s.color,
  }));

  // Leads by source
  const sourceMap: Record<string, number> = {};
  crm.leads.forEach((l: any) => { const s = l.source || "Sem fonte"; sourceMap[s] = (sourceMap[s] || 0) + 1; });
  const leadsBySource = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["#E5191A", "#3B82F6", "#8B5CF6", "#F59E0B", "#22C55E", "#06B6D4"];

  // Score distribution
  const scoreBuckets = [
    { label: "0-20", min: 0, max: 20 },
    { label: "21-40", min: 21, max: 40 },
    { label: "41-60", min: 41, max: 60 },
    { label: "61-80", min: 61, max: 80 },
    { label: "81-100", min: 81, max: 100 },
  ];
  const scoreData = scoreBuckets.map((b, i) => ({
    label: b.label,
    count: crm.leads.filter((l: any) => (l.score || 0) >= b.min && (l.score || 0) <= b.max).length,
    fill: SCORE_COLORS[i],
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Painel de Controle
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Target} label="Total de Leads" value={totalLeads} color="#E5191A" />
        <MetricCard icon={DollarSign} label="Valor do Pipeline" value={fmt(pipelineValue)} color="#22C55E" />
        <MetricCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversionRate}%`} color="#F59E0B" />
        <MetricCard icon={CheckSquare} label="Tarefas Pendentes" value={pendingTasks} color="#8B5CF6" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Deals by stage */}
        <div className="lg:col-span-3 rounded-md p-5 border" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Deals por Estágio</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dealsByStage} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 11 }} width={75} />
              <Tooltip
                contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: 6 }}
                labelStyle={{ color: "#F5F5F5" }}
                itemStyle={{ color: "#A0A0A0" }}
                formatter={(v: number, n: string) => [n === "value" ? fmt(v) : v, n === "value" ? "Valor" : "Quantidade"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {dealsByStage.map((d: any, i: number) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by source */}
        <div className="lg:col-span-2 rounded-md p-5 border" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Fontes de Leads</h3>
          {leadsBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leadsBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {leadsBySource.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#555] text-center py-16">Sem dados de fontes</p>
          )}
        </div>
      </div>

      {/* Score Distribution */}
      <div className="rounded-md p-5 border" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Distribuição de Lead Score</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={scoreData}>
            <XAxis dataKey="label" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#A0A0A0", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#1C1C1C", border: "1px solid #2A2A2A", borderRadius: 6 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {scoreData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent tasks */}
      <div className="rounded-md p-5 border" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Tarefas Pendentes</h3>
        <div className="space-y-2">
          {crm.tasks.filter((t: any) => !["Done", "Canceled", "done", "canceled"].includes(t.status)).slice(0, 5).map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-md border" style={{ background: "#111", borderColor: "#2A2A2A" }}>
              <span className={`h-2 w-2 rounded-full ${t.priority === "High" ? "bg-red-500" : t.priority === "Medium" ? "bg-amber-500" : "bg-gray-500"}`} />
              <span className="text-sm text-[#F5F5F5] flex-1">{t.title}</span>
              {t.due_date && (
                <span className="text-xs text-[#A0A0A0]">{new Date(t.due_date).toLocaleDateString("pt-BR")}</span>
              )}
            </div>
          ))}
          {crm.tasks.filter((t: any) => !["Done", "Canceled", "done", "canceled"].includes(t.status)).length === 0 && (
            <p className="text-sm text-[#555] text-center py-4">Nenhuma tarefa pendente</p>
          )}
        </div>
      </div>
    </div>
  );
}
