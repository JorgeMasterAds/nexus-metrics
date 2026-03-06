import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Eye, TrendingUp, Clock, BarChart3, Search } from "lucide-react";
import { mockForms, mockResponses } from "@/lib/formMockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

export default function FormsResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const form = mockForms.find(f => f.id === id);
  const responses = mockResponses[id!] || [];

  if (!form) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Formulário não encontrado.</div>;

  const finished = responses.filter(r => r.finished);
  const completionRate = responses.length > 0 ? Math.round((finished.length / responses.length) * 100) : 0;
  const avgTime = Math.round(finished.reduce((s, r) => {
    if (r.completedAt && r.startedAt) {
      return s + (new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000;
    }
    return s;
  }, 0) / Math.max(1, finished.length));

  // Mock chart data
  const chartData = [
    { name: "Boa", count: Math.floor(responses.length * 0.35), fill: "hsl(var(--primary))" },
    { name: "Excelente", count: Math.floor(responses.length * 0.30), fill: "hsl(142 71% 45%)" },
    { name: "Normal", count: Math.floor(responses.length * 0.20), fill: "hsl(48 96% 53%)" },
    { name: "Ruim", count: Math.floor(responses.length * 0.15), fill: "hsl(0 84% 60%)" },
  ];

  // NPS mock
  const promoters = Math.floor(responses.length * 0.45);
  const passives = Math.floor(responses.length * 0.30);
  const detractors = responses.length - promoters - passives;
  const npsScore = Math.round(((promoters - detractors) / Math.max(1, responses.length)) * 100);

  const filteredResponses = responses.filter(r => {
    if (!search) return true;
    return JSON.stringify(r.data).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">{form.name}</h1>
          <p className="text-sm text-muted-foreground">Análise de respostas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/forms")} className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Eye className="h-4 w-4" /> <span className="text-xs">Total de respostas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{responses.length}</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" /> <span className="text-xs">Taxa de conclusão</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" /> <span className="text-xs">Tempo médio</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgTime}s</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" /> <span className="text-xs">NPS Score</span>
          </div>
          <p className={cn("text-2xl font-bold", npsScore >= 50 ? "text-success" : npsScore >= 0 ? "text-warning" : "text-destructive")}>{npsScore}</p>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="responses">Respostas ({responses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 mt-4">
          {/* Choice chart */}
          <div className="rounded-xl border border-border/30 bg-card/80 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição de respostas</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* NPS gauge */}
          <div className="rounded-xl border border-border/30 bg-card/80 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Net Promoter Score</h3>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{npsScore}</p>
                <p className="text-xs text-muted-foreground">NPS</p>
              </div>
              <div className="flex-1 flex gap-1 h-8 rounded-lg overflow-hidden">
                <div className="bg-destructive/80 flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${(detractors / responses.length) * 100}%` }}>
                  {detractors}
                </div>
                <div className="bg-warning/80 flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${(passives / responses.length) * 100}%` }}>
                  {passives}
                </div>
                <div className="bg-success/80 flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${(promoters / responses.length) * 100}%` }}>
                  {promoters}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Detratores</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Passivos</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Promotores</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="responses" className="mt-4">
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar respostas..." className="pl-9" />
            </div>
          </div>
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Início</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Conclusão</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.slice(0, 50).map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{r.id.slice(0, 12)}...</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px]", r.finished ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                        {r.finished ? "Concluído" : "Incompleto"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.startedAt).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.completedAt ? new Date(r.completedAt).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
