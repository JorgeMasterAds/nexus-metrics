import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Zap, Clock, ArrowDown, Play, Pause } from "lucide-react";
import { toast } from "sonner";

const mockAutomations = [
  { id: "aut-1", name: "Boas-vindas Grupo Cheio", trigger: "Grupo Cheio", active: true, lastRun: "2025-01-15T18:30:00", executions: 7 },
  { id: "aut-2", name: "Lembrete pós-entrada", trigger: "Webhook", active: true, lastRun: "2025-01-14T10:00:00", executions: 23 },
  { id: "aut-3", name: "Follow-up 48h", trigger: "Grupo Cheio", active: false, lastRun: null, executions: 0 },
];

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function GZAutomations() {
  const [autos, setAutos] = useState(mockAutomations);

  const toggle = (id: string) => {
    setAutos((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a));
    toast.success("Status atualizado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automações</h1>
          <p className="text-sm text-muted-foreground">Fluxos automáticos por gatilhos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Automação</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Criar Automação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input placeholder="Boas-vindas ao grupo" /></div>
              <div><Label>Gatilho</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="group-full">Grupo Cheio</SelectItem><SelectItem value="webhook">Webhook</SelectItem></SelectContent></Select></div>
              {/* Steps builder */}
              <div className="space-y-2">
                <Label>Passos</Label>
                <Card className="bg-muted/20"><CardContent className="p-3 text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-400" /> Gatilho: Grupo Cheio</CardContent></Card>
                <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
                <Card className="bg-muted/20"><CardContent className="p-3 text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-400" /> Delay: 5 minutos</CardContent></Card>
                <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
                <Card className="bg-muted/20"><CardContent className="p-3 text-sm flex items-center gap-2">📨 Enviar mensagem de boas-vindas</CardContent></Card>
                <Button variant="outline" size="sm" className="w-full gap-1.5"><Plus className="h-3 w-3" /> Adicionar Passo</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>De</Label><Input type="time" defaultValue="08:00" /></div>
                <div><Label>Até</Label><Input type="time" defaultValue="22:00" /></div>
              </div>
              <div><Label className="mb-2 block">Dias da semana</Label>
                <div className="flex gap-2">{weekDays.map((d) => <label key={d} className="flex items-center gap-1 text-xs"><Checkbox defaultChecked />{d}</label>)}</div>
              </div>
              <Button className="w-full" onClick={() => toast.success("Automação criada!")}>Criar Automação</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {autos.map((a) => (
          <Card key={a.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <Badge variant="outline" className="text-[10px] mt-1">{a.trigger}</Badge>
                </div>
                <Switch checked={a.active} onCheckedChange={() => toggle(a.id)} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{a.executions} execuções</span>
                <span>{a.lastRun ? `Último: ${new Date(a.lastRun).toLocaleDateString("pt-BR")}` : "Nunca executou"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${a.active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-xs">{a.active ? "Ativa" : "Pausada"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
