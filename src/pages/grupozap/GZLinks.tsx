import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, ExternalLink } from "lucide-react";
import { mockLinks } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

export default function GZLinks() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-sm text-muted-foreground">DeepLinks e rastreamento de cliques</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Criar Link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Link</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input placeholder="Aula 1 - Abertura" /></div>
              <div><Label>URL de Destino</Label><Input placeholder="https://youtube.com/watch?v=..." /></div>
              <div className="flex items-center justify-between"><Label>DeepLink ativado</Label><Switch defaultChecked /></div>
              <Button className="w-full" onClick={() => toast.success("Link criado!")}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/20 bg-muted/20"><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Nome</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">URL de Destino</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">DeepLink</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Cliques</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Histórico</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Status</th><th className="px-4 py-2.5"></th></tr></thead>
          <tbody>
            {mockLinks.map((l) => (
              <tr key={l.id} className="border-b border-border/10 hover:bg-muted/10 cursor-pointer" onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                <td className="px-4 py-2.5 font-medium">{l.name}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-40 truncate">{l.destinationUrl}</td>
                <td className="px-4 py-2.5">
                  {l.deepLink ? <Badge className="text-[10px] bg-blue-500/20 text-blue-400">Ativo</Badge> : <Badge variant="outline" className="text-[10px]">Off</Badge>}
                </td>
                <td className="px-4 py-2.5 font-bold">{l.clicks.toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <div className="h-6 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={l.clickHistory.slice(-14)}>
                        <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={cn("text-[10px]", l.active ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground")}>{l.active ? "Ativo" : "Inativo"}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`grupozap.nexus.app/l/${l.slug}`); toast.success("Link copiado!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded detail */}
      {expandedId && (() => {
        const link = mockLinks.find((l) => l.id === expandedId);
        if (!link) return null;
        return (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{link.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  grupozap.nexus.app/l/{link.slug}
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={link.clickHistory}>
                    <defs><linearGradient id="gzLink" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" fill="url(#gzLink)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
