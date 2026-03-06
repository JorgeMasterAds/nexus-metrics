import { useState, useMemo } from "react";
import { useHubAgents, useHubConversations, useHubQuotas } from "@/hooks/useAgentHub";
import { BarChart3, MessageSquare, Zap, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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

  // Build chart data from real conversations
  const chartData = useMemo(() => {
    const convs = conversations || [];
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    const dateMap: Record<string, { conversas: number; mensagens: number }> = {};

    // Initialize all dates
    for (let i = 0; i < Math.min(days, 14); i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      dateMap[key] = { conversas: 0, mensagens: 0 };
    }

    // Fill with real data
    convs.forEach((conv: any) => {
      const date = new Date(conv.created_at);
      if (date < cutoff) return;
      const key = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (dateMap[key]) {
        dateMap[key].conversas++;
        dateMap[key].mensagens += conv.message_count || 0;
      }
    });

    return Object.entries(dateMap).map(([date, data]) => ({ date, ...data }));
  }, [conversations, days]);

  // Build channel distribution from real data
  const channelData = useMemo(() => {
    const convs = conversations || [];
    const map: Record<string, number> = {};
    convs.forEach((c: any) => {
      const ch = c.channel_type || "web";
      map[ch] = (map[ch] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [conversations]);

  const tokensPct = quotas ? Math.round((quotas.tokens_used / quotas.tokens_limit) * 100) : 0;
  const tokenColor = tokensPct >= 90 ? "bg-destructive" : tokensPct >= 75 ? "bg-warning" : "bg-primary";

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

      {/* Token usage bar with alert */}
      <div className="rounded-md border border-border bg-card p-5 card-shadow">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground font-medium">Uso de Tokens</span>
          <span className="text-muted-foreground">{(quotas?.tokens_used || 0).toLocaleString()} / {(quotas?.tokens_limit || 100000).toLocaleString()}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", tokenColor)} style={{ width: `${Math.min(tokensPct, 100)}%` }} />
        </div>
        {tokensPct >= 80 && (
          <p className="text-xs text-warning flex items-center gap-1 mt-2">
            <AlertTriangle className="h-3 w-3" />
            {100 - tokensPct}% de tokens restantes neste ciclo
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border border-border bg-card p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Conversas por dia</h3>
          {chartData.some(d => d.conversas > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="hubAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" }} />
                <Area type="monotone" dataKey="conversas" stroke="hsl(var(--primary))" fill="url(#hubAreaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-sm">Nenhuma conversa no período selecionado</p>
            </div>
          )}
        </div>

        <div className="rounded-md border border-border bg-card p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição por canal</h3>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <defs>
                  {PIE_COLORS.map((c, i) => (
                    <linearGradient key={`hubPie-${i}`} id={`hubPieGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={1} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.45} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {channelData.map((_, i) => <Cell key={i} fill={`url(#hubPieGrad-${i})`} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
              <BarChart3 className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-sm">Nenhum dado de canal disponível</p>
            </div>
          )}
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
                  <td className="px-4 py-3 text-foreground">
                    {(conversations || []).filter((c: any) => c.agent_id === a.id).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
