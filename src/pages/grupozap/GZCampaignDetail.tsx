import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MousePointerClick, Users, UserMinus, TrendingUp, Copy, Download, RefreshCw } from "lucide-react";
import { mockCampaigns } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = Array.from({ length: 28 }, (_, i) => ({
  day: `${i + 1}`,
  clicks: Math.floor(Math.random() * 200 + 50),
  entries: Math.floor(Math.random() * 100 + 20),
  exits: Math.floor(Math.random() * 30),
}));

const groupStatusCls = { available: "bg-emerald-500/20 text-emerald-400", full: "bg-muted text-muted-foreground", archived: "bg-red-500/20 text-red-400" };
const groupStatusLabel = { available: "Disponível", full: "Cheio", archived: "Arquivado" };

export default function GZCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaign = mockCampaigns.find((c) => c.id === id);

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Campanha não encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/grupozap/campaigns")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.mode === "launch" ? "Lançamento" : "Lista"} • {campaign.groups.length} grupos</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: MousePointerClick, label: "Cliques", value: campaign.clicks, color: "text-blue-400" },
          { icon: Users, label: "Participantes", value: campaign.participants, color: "text-emerald-400" },
          { icon: UserMinus, label: "Saídas", value: campaign.exits, color: "text-red-400" },
          { icon: TrendingUp, label: "Taxa Conversão", value: `${((campaign.participants / campaign.clicks) * 100).toFixed(1)}%`, color: "text-primary" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <m.icon className={cn("h-5 w-5 mx-auto mb-2", m.color)} />
              <p className="text-2xl font-bold">{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Últimos 28 dias</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gzBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gzGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fill="url(#gzBlue)" strokeWidth={2} />
                <Area type="monotone" dataKey="entries" stroke="#10b981" fill="url(#gzGreen)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3 w-3" /> Exportar Leads</Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><RefreshCw className="h-3 w-3" /> Atualizar Contagem</Button>
          </div>
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/20 bg-muted/20"><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">#</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Nome</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Participantes</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Status</th></tr></thead>
              <tbody>
                {campaign.groups.map((g, i) => (
                  <tr key={g.id} className="border-b border-border/10 hover:bg-muted/10">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{g.name}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 max-w-24 rounded-full bg-muted/40 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(g.participants / g.limit) * 100}%` }} /></div>
                        <span className="text-xs text-muted-foreground">{g.participants}/{g.limit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><Badge className={cn("text-[10px]", groupStatusCls[g.status])}>{groupStatusLabel[g.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <p className="text-sm text-muted-foreground">Acesse a seção de Mensagens para enviar ou agendar.</p>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <p className="text-sm text-muted-foreground">Acesse a seção de Ações Agendadas para configurar.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
