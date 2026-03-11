import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Send, Flame, Thermometer, Snowflake } from "lucide-react";
import { mockLeads } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const classConfig = {
  hot: { label: "Quente", icon: Flame, cls: "bg-red-500/20 text-red-400 border-red-500/30", color: "text-red-400" },
  warm: { label: "Morno", icon: Thermometer, cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", color: "text-yellow-400" },
  cold: { label: "Frio", icon: Snowflake, cls: "bg-blue-500/20 text-blue-400 border-blue-500/30", color: "text-blue-400" },
};

export default function GZLeadScoring() {
  const [filter, setFilter] = useState<string>("all");
  const sorted = [...mockLeads].sort((a, b) => b.score - a.score);
  const filtered = filter === "all" ? sorted : sorted.filter((l) => l.classification === filter);

  const counts = { hot: mockLeads.filter((l) => l.classification === "hot").length, warm: mockLeads.filter((l) => l.classification === "warm").length, cold: mockLeads.filter((l) => l.classification === "cold").length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Scoring</h1>
          <p className="text-sm text-muted-foreground">Engajamento dos participantes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 text-xs" onClick={() => toast.success("CSV exportado!")}><Download className="h-3 w-3" /> Exportar</Button>
          <Button className="gap-1.5 text-xs" onClick={() => toast.success("Mensagem enviada para leads quentes!")}><Send className="h-3 w-3" /> Enviar p/ Quentes</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["hot", "warm", "cold"] as const).map((c) => {
          const cfg = classConfig[c];
          return (
            <Card key={c} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setFilter(filter === c ? "all" : c)}>
              <CardContent className="p-4 text-center">
                <cfg.icon className={cn("h-6 w-6 mx-auto mb-2", cfg.color)} />
                <p className="text-2xl font-bold">{counts[c]}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="hot">🔥 Quentes</SelectItem>
            <SelectItem value="warm">🌡️ Mornos</SelectItem>
            <SelectItem value="cold">🧊 Frios</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} leads</span>
      </div>

      <div className="rounded-xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/20 bg-muted/20"><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">#</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Nome</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Telefone</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Pontuação</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Classificação</th></tr></thead>
          <tbody>
            {filtered.map((l, i) => {
              const cfg = classConfig[l.classification];
              return (
                <tr key={l.id} className="border-b border-border/10 hover:bg-muted/10">
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{l.name || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.phone}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted/40 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${l.score}%` }} /></div>
                      <span className="font-bold text-xs">{l.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><Badge className={cn("text-[10px] gap-1", cfg.cls)}><cfg.icon className="h-3 w-3" />{cfg.label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
