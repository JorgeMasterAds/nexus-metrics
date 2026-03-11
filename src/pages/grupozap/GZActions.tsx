import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Clock, Play, CheckCircle, XCircle, RefreshCw, MessageSquare, Edit3, Image, Settings, UserPlus, UserMinus, Trash2 } from "lucide-react";
import { mockActions } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  scheduled: { label: "Agendada", icon: Clock, cls: "bg-blue-500/20 text-blue-400" },
  queued: { label: "Na Fila", icon: Clock, cls: "bg-yellow-500/20 text-yellow-400" },
  running: { label: "Executando", icon: Play, cls: "bg-purple-500/20 text-purple-400" },
  completed: { label: "Concluída", icon: CheckCircle, cls: "bg-emerald-500/20 text-emerald-400" },
  error: { label: "Erro", icon: XCircle, cls: "bg-red-500/20 text-red-400" },
};

const actionTypes = [
  { value: "message", label: "Enviar Mensagem", icon: MessageSquare },
  { value: "rename", label: "Trocar Nome", icon: Edit3 },
  { value: "image", label: "Trocar Imagem", icon: Image },
  { value: "config", label: "Trocar Configuração", icon: Settings },
  { value: "add-admin", label: "Adicionar Admin", icon: UserPlus },
  { value: "remove-admin", label: "Remover Admin", icon: UserMinus },
  { value: "remove-members", label: "Remover Participantes", icon: Trash2 },
];

export default function GZActions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ações Agendadas</h1>
          <p className="text-sm text-muted-foreground">Agende ações de configuração e envio</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Ação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Ação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Tipo de Ação</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{actionTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Escopo</Label><Select><SelectTrigger><SelectValue placeholder="Campanha ou grupo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os grupos</SelectItem><SelectItem value="camp-1">Lançamento Janeiro 2025</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data</Label><Input type="date" /></div>
                <div><Label>Hora</Label><Input type="time" /></div>
              </div>
              <Button className="w-full" onClick={() => toast.success("Ação agendada!")}>Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/20 bg-muted/20"><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Tipo</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Escopo</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Status</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Data/Hora</th><th className="px-4 py-2.5"></th></tr></thead>
          <tbody>
            {mockActions.map((a) => {
              const st = statusConfig[a.status];
              return (
                <tr key={a.id} className="border-b border-border/10 hover:bg-muted/10">
                  <td className="px-4 py-2.5 font-medium">{a.type}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{a.scope}</td>
                  <td className="px-4 py-2.5"><Badge className={cn("text-[10px] gap-1", st.cls)}><st.icon className="h-3 w-3" />{st.label}</Badge></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(a.scheduledAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2.5">
                    {a.status === "error" && <Button variant="ghost" size="sm" className="gap-1 text-xs"><RefreshCw className="h-3 w-3" /> Reprocessar</Button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
