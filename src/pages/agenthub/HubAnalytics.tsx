import { useState } from "react";
import { useHubAgents, useHubConversations, useHubQuotas } from "@/hooks/useAgentHub";
import { BarChart3, MessageSquare, Zap, Clock, CheckCircle, Bot } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

const PIE_COLORS = ["hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--primary))"];

function MetricLine({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-md border border-border bg-card p-5 flex items-center gap-3 card-shadow">
      <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function HubAnalytics() {
  const { agents } = useHubAgents();
  const { data: conversations } = useHubConversations();
  const { data: quotas } = useHubQuotas();
  const [period, setPeriod] = useState("7d");

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const chartData = Array.from({ length: Math.min(days, 14) }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), conversas: Math.floor(Math.random() * 20), mensagens: Math.floor(Math.random() * 100) };
  });

  const channelData = [
    { name: "Web", value: 45 },
    { name: "WhatsApp", value: 30 },
    { name: "Instagram", value: 15 },
    { name: "API", value: 10 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Analytics</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {PERIODS.map((p) => (
            <Button key={p.value} variant="ghost" size="sm" onClick={() => setPeriod(p.value)}
              className={cn("text-xs", period === p.value && "bg-card shadow-sm")}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricLine icon={MessageSquare} label="Conversas" value={(conversations || []).length} color="hsl(var(--info))" />
        <MetricLine icon={BarChart3} label="Mensagens" value={(conversations || []).reduce((s: number, c: any) => s + (c.message_count || 0), 0)} color="hsl(var(--success))" />
        <MetricLine icon={Zap} label="Tokens" value={(quotas?.tokens_used || 0).toLocaleString()} color="hsl(var(--warning))" />
        <MetricLine icon={Clock} label="Latência média" value="—" color="hsl(280, 80%, 55%)" />
        <MetricLine icon={CheckCircle} label="Taxa sucesso" value="—" color="hsl(var(--success))" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border border-border bg-card p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Conversas por dia</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" }} />
              <Area type="monotone" dataKey="conversas" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border border-border bg-card p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição por canal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {channelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden card-shadow">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Performance por Agente</h3>
        </div>
        {agents.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum agente criado</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Agente</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Modo</th>
                <th className="px-4 py-3 text-left">Conversas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agents.map((a: any) => (
                <tr key={a.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 flex items-center gap-2 text-foreground"><span>{a.avatar_emoji}</span> {a.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.mode}</td>
                  <td className="px-4 py-3 text-foreground">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
