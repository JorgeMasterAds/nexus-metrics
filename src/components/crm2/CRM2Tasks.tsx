import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = { Low: "text-blue-400", Medium: "text-amber-400", High: "text-red-400" };
const statusIcons: Record<string, any> = { Done: CheckCircle2, "In Progress": Clock, Todo: Circle, Backlog: Circle, Canceled: CheckCircle2 };

export default function CRM2Tasks({ crm }: { crm: any }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", due_date: "" });
  const [filter, setFilter] = useState("active");

  const tasks = crm.tasks.filter((t: any) => {
    if (filter === "active") return !["Done", "Canceled"].includes(t.status);
    if (filter === "done") return t.status === "Done";
    return true;
  });

  const handleCreate = () => {
    if (!form.title) return;
    crm.createTask.mutate({ ...form, due_date: form.due_date || undefined });
    setForm({ title: "", description: "", priority: "Medium", due_date: "" });
    setShowCreate(false);
  };

  const toggleStatus = (task: any) => {
    const newStatus = task.status === "Done" ? "Todo" : "Done";
    crm.updateTask.mutate({ id: task.id, status: newStatus });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="done">Concluídas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa encontrada</p>
        ) : tasks.map((t: any) => {
          const Icon = statusIcons[t.status] || Circle;
          return (
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/80 hover:bg-muted/20 transition-colors">
              <button onClick={() => toggleStatus(t)} className="mt-0.5">
                <Icon className={cn("h-5 w-5", t.status === "Done" ? "text-emerald-400" : "text-muted-foreground")} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", t.status === "Done" && "line-through text-muted-foreground")}>{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>}
              </div>
              <span className={cn("text-xs font-medium", priorityColors[t.priority])}>{t.priority}</span>
              {t.due_date && <span className="text-xs text-muted-foreground">{new Date(t.due_date).toLocaleDateString("pt-BR")}</span>}
            </div>
          );
        })}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Baixa</SelectItem>
                    <SelectItem value="Medium">Média</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data limite</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={crm.createTask.isPending}>Criar Tarefa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
