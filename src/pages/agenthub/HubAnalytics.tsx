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

const PIE_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444"];

function MetricLine({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function HubAnalytics() {
  const { agents } = useHubAgents();
  const { data: conversations } = useHubConversations();
  const { data: quotas } = useHubQuotas();
  const [period, setPeriod] = useState("7d");

  // Mock chart data
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
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <Button key={p.value} variant="ghost" size="sm" onClick={() => setPeriod(p.value)}
              className={cn("text-xs", period === p.value && "bg-white shadow-sm")}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricLine icon={MessageSquare} label="Conversas" value={(conversations || []).length} color="bg-blue-500" />
        <MetricLine icon={BarChart3} label="Mensagens" value={(conversations || []).reduce((s: number, c: any) => s + (c.message_count || 0), 0)} color="bg-green-500" />
        <MetricLine icon={Zap} label="Tokens" value={(quotas?.tokens_used || 0).toLocaleString()} color="bg-orange-500" />
        <MetricLine icon={Clock} label="Latência média" value="—" color="bg-purple-500" />
        <MetricLine icon={CheckCircle} label="Taxa sucesso" value="—" color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Conversas por dia</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="conversas" stroke="#3B82F6" fill="#3B82F680" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribuição por canal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {channelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Performance por Agente</h3>
        </div>
        {agents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Nenhum agente criado</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Agente</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Modo</th>
                <th className="px-4 py-3 text-left">Conversas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 flex items-center gap-2"><span>{a.avatar_emoji}</span> {a.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.mode}</td>
                  <td className="px-4 py-3">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
