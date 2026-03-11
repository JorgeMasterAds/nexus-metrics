import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Download, RefreshCw, Users } from "lucide-react";
import { mockCampaigns } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const groupStatusCls = { available: "bg-emerald-500/20 text-emerald-400", full: "bg-muted text-muted-foreground", archived: "bg-red-500/20 text-red-400" };
const groupStatusLabel = { available: "Disponível", full: "Cheio", archived: "Arquivado" };

export default function GZGroups() {
  const allGroups = mockCampaigns.flatMap((c) => c.groups.map((g) => ({ ...g, campaignName: c.name })));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos</h1>
          <p className="text-sm text-muted-foreground">{allGroups.length} grupos em {mockCampaigns.length} campanhas</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Criar Grupos</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Criar Grupos</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Campanha</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{mockCampaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Nome do Grupo</Label><Input placeholder="Novo Sandy" /><p className="text-[10px] text-muted-foreground mt-1">Será criado como "Novo Sandy 1", "Novo Sandy 2", etc.</p></div>
                <div><Label>Descrição</Label><Textarea placeholder="Descrição do grupo" rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Limite por grupo</Label><Input type="number" defaultValue={250} /></div>
                  <div><Label>Grupos simultâneos</Label><Input type="number" defaultValue={3} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>Somente admins falam</Label><Switch /></div>
                <div className="flex items-center justify-between"><Label>Criação automática</Label><Switch defaultChecked /></div>
                <div><Label>Administradores</Label><Input placeholder="Ex: 11999990001, 11999990002" /><p className="text-[10px] text-muted-foreground mt-1">DDD + número, separados por vírgula</p></div>
                <Button className="w-full" onClick={() => toast.success("Grupos criados!")}>Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Importar</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3 w-3" /> Exportar Leads</Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><RefreshCw className="h-3 w-3" /> Atualizar Contagem</Button>
      </div>

      <div className="rounded-xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/20 bg-muted/20"><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">#</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Nome</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Campanha</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Participantes</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Status</th></tr></thead>
          <tbody>
            {allGroups.map((g, i) => (
              <tr key={g.id} className="border-b border-border/10 hover:bg-muted/10">
                <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium">{g.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{g.campaignName}</td>
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
    </div>
  );
}
