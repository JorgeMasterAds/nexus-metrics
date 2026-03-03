import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ChartVisibilityMenu from "@/components/ChartVisibilityMenu";
import { useChartVisibility } from "@/hooks/useChartVisibility";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Users, UserPlus, Eye, Activity, Globe, Monitor, Smartphone, Tablet } from "lucide-react";

const SECTIONS = [
  { id: "kpis", label: "KPIs Principais" },
  { id: "access-trend", label: "Acessos no Período" },
  { id: "weekly-chart", label: "Acessos na Semana" },
  { id: "origin-chart", label: "Origem dos Acessos" },
  { id: "city-table", label: "Cidades" },
  { id: "os-chart", label: "Sistema Operacional" },
  { id: "device-chart", label: "Dispositivo" },
  { id: "url-table", label: "Acessos por URL" },
];

const mockKpis = {
  totalAccess: 3172, totalUsers: 2676, newUsers: 2088, pageViews: 0, engagementRate: 48.71,
  prevAccess: 11200, prevUsers: 9100, prevNewUsers: 8100, prevPageViews: 0, prevEngagement: 43.2,
};

const mockTrend = [
  { day: "1", value: 480 }, { day: "6", value: 1050 }, { day: "11", value: 350 },
  { day: "16", value: 280 }, { day: "21", value: 190 }, { day: "26", value: 420 }, { day: "31", value: 400 },
];

const mockWeekly = [
  { day: "segunda", value: 487 }, { day: "terça", value: 1018 }, { day: "quarta", value: 731 },
  { day: "quinta", value: 731 }, { day: "sexta", value: 168 }, { day: "sábado", value: 15 }, { day: "7", value: 712 },
];

const mockOrigin = [
  { name: "(direct)", value: 69.6 }, { name: "ig", value: 17.4 },
  { name: "fb", value: 5 }, { name: "google", value: 3 },
  { name: "Outros", value: 5 },
];

const mockCities = [
  { city: "São Paulo", sessions: 1344 }, { city: "São Bernardo do Campo", sessions: 642 },
  { city: "Diadema", sessions: 463 }, { city: "Santo André", sessions: 290 },
  { city: "Mauá", sessions: 72 }, { city: "(not set)", sessions: 35 },
  { city: "Rio de Janeiro", sessions: 34 }, { city: "São Caetano do Sul", sessions: 34 },
];

const mockOS = [
  { name: "Android", value: 53.2 }, { name: "iOS", value: 33.3 },
  { name: "Macintosh", value: 12 }, { name: "Windows", value: 1 }, { name: "Linux", value: 0.5 },
];

const mockDevice = [
  { name: "mobile", value: 86.3 }, { name: "desktop", value: 13.5 }, { name: "tablet", value: 0.2 },
];

const mockUrls = [
  { url: "www.example.com/tarde-do-bot...", sessions: 1610 },
  { url: "www.example.com/segunda-forr...", sessions: 627 },
  { url: "www.example.com/checkout", sessions: 243 },
  { url: "www.example.com/segunda-for...", sessions: 177 },
  { url: "www.example.com/francis-lopes...", sessions: 137 },
  { url: "www.example.com/segunda-forr...", sessions: 118 },
];

const PIE_COLORS = [
  "hsl(0, 85%, 55%)", "hsl(340, 75%, 55%)", "hsl(20, 80%, 55%)",
  "hsl(200, 70%, 55%)", "hsl(280, 60%, 55%)", "hsl(160, 60%, 50%)",
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "hsla(240, 5%, 7%, 0.92)",
  border: "1px solid hsla(240, 4%, 20%, 0.4)",
  borderRadius: 8, fontSize: 12, color: "#fff",
  padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
};

const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
const changeType = (v: number): "positive" | "negative" | "neutral" => v > 0 ? "positive" : v < 0 ? "negative" : "neutral";

export default function GA4Report() {
  const { visible, toggle, isVisible } = useChartVisibility("ga4", SECTIONS);

  return (
    <DashboardLayout
      title="Google Analytics (GA4)"
      subtitle="Métricas de acessos e comportamento do site"
      actions={<ChartVisibilityMenu sections={SECTIONS} visible={visible} onToggle={toggle} />}
    >
      <div className="space-y-6">
        {/* KPIs */}
        {isVisible("kpis") && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Acessos Totais" value={mockKpis.totalAccess.toLocaleString("pt-BR")} icon={Globe}
              change={fmtPct(pctChange(mockKpis.totalAccess, mockKpis.prevAccess))}
              changeType={changeType(pctChange(mockKpis.totalAccess, mockKpis.prevAccess))} />
            <MetricCard label="Usuários Totais" value={mockKpis.totalUsers.toLocaleString("pt-BR")} icon={Users}
              change={fmtPct(pctChange(mockKpis.totalUsers, mockKpis.prevUsers))}
              changeType={changeType(pctChange(mockKpis.totalUsers, mockKpis.prevUsers))} />
            <MetricCard label="Novos Usuários" value={mockKpis.newUsers.toLocaleString("pt-BR")} icon={UserPlus}
              change={fmtPct(pctChange(mockKpis.newUsers, mockKpis.prevNewUsers))}
              changeType={changeType(pctChange(mockKpis.newUsers, mockKpis.prevNewUsers))} />
            <MetricCard label="Visualizações de Páginas" value={mockKpis.pageViews.toLocaleString("pt-BR")} icon={Eye}
              change="N/A de mês anterior" changeType="neutral" />
            <MetricCard label="Taxa de Engajamento" value={`${mockKpis.engagementRate.toFixed(2).replace(".", ",")}%`} icon={Activity}
              change={fmtPct(pctChange(mockKpis.engagementRate, mockKpis.prevEngagement))}
              changeType={changeType(pctChange(mockKpis.engagementRate, mockKpis.prevEngagement))} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Access trend */}
          {isVisible("access-trend") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-warning" />
                Acessos no Período
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockTrend}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line dataKey="value" stroke="hsl(30, 90%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Acessos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly chart */}
          {isVisible("weekly-chart") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-3">Acessos na Semana</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockWeekly}>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="hsl(30, 90%, 55%)" name="Acessos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Origin */}
          {isVisible("origin-chart") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-3">Origem dos Acessos</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={mockOrigin} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75} paddingAngle={2}
                    label={({ value }) => `${value}%`} labelLine={false}>
                    {mockOrigin.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* OS */}
          {isVisible("os-chart") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Sistema Operacional
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={mockOS} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75} paddingAngle={2}
                    label={({ value }) => `${value}%`} labelLine={false}>
                    {mockOS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Device */}
          {isVisible("device-chart") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Dispositivo
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={mockDevice} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75} paddingAngle={2}
                    label={({ value }) => `${value}%`} labelLine={false}>
                    {mockDevice.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cities */}
          {isVisible("city-table") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-3">Cidade</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="text-left py-1.5 px-2">Cidade</th>
                    <th className="text-right py-1.5 px-2">Sessões</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCities.map((c, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-accent/30">
                      <td className="py-1.5 px-2">{c.city}</td>
                      <td className="py-1.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 rounded-full bg-destructive" style={{ width: `${(c.sessions / mockCities[0].sessions) * 60}px` }} />
                          {c.sessions.toLocaleString("pt-BR")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* URLs */}
          {isVisible("url-table") && (
            <div className="rounded-xl border border-border/20 card-shadow glass p-5">
              <h3 className="text-sm font-semibold mb-3">Acessos por URL</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="text-left py-1.5 px-2">URL</th>
                    <th className="text-right py-1.5 px-2">Acessos</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUrls.map((u, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-accent/30">
                      <td className="py-1.5 px-2 text-primary max-w-[200px] truncate">{u.url}</td>
                      <td className="py-1.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 rounded-full bg-destructive" style={{ width: `${(u.sessions / mockUrls[0].sessions) * 60}px` }} />
                          {u.sessions.toLocaleString("pt-BR")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          ⚠️ Dados de demonstração — conecte o Google Analytics (GA4) em Integrações para dados reais.
        </p>
      </div>
    </DashboardLayout>
  );
}
