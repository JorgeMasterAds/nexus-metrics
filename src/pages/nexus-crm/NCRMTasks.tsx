import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { CheckSquare, Plus, Circle, Clock, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

const columns = [
  { id: "Todo", label: "A Fazer", color: "hsl(var(--info))" },
  { id: "In Progress", label: "Em Progresso", color: "hsl(var(--warning))" },
  { id: "Done", label: "Concluído", color: "hsl(var(--success))" },
];

export default function NCRMTasks() {
  const crm = useCRM2();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", due_date: "" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    crm.updateTask.mutate({ id: active.id as string, status: over.id as string });
  };

  const handleCreate = () => {
    if (!form.title) return;
    crm.createTask.mutate({ ...form, due_date: form.due_date || undefined }, {
      onSuccess: () => { setShowCreate(false); setForm({ title: "", description: "", priority: "Medium", due_date: "" }); }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tarefas</h1>
        <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </button>
      </div>

      {crm.tasks.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <CheckSquare className="h-12 w-12 text-primary opacity-40 mb-4" />
          <p className="text-lg font-semibold text-foreground">Nenhuma tarefa</p>
          <p className="text-sm text-muted-foreground">Crie tarefas para organizar seu trabalho</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 kanban-container">
            {columns.map(col => {
              const tasks = crm.tasks.filter((t: any) => {
                const s = (t.status || "Todo");
                if (col.id === "Todo") return s === "Todo" || s === "Backlog" || s === "todo" || s === "backlog";
                if (col.id === "In Progress") return s === "In Progress" || s === "in_progress";
                if (col.id === "Done") return s === "Done" || s === "done" || s === "Canceled" || s === "canceled";
                return false;
              });
              return (
                <div key={col.id} className="flex-shrink-0 w-[300px]" id={col.id}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                    <span className="text-xs text-muted-foreground">{tasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {tasks.map((t: any) => (
                      <div key={t.id} className="kanban-card rounded-md p-3 border border-border transition-all hover:border-primary">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => crm.updateTask.mutate({ id: t.id, status: t.status === "Done" ? "Todo" : "Done" })}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {(t.status === "Done" || t.status === "done") ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm", (t.status === "Done" || t.status === "done") ? "line-through text-muted-foreground" : "text-foreground")}>{t.title}</p>
                            {t.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>}
                          </div>
                          <span className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-1.5", t.priority === "High" ? "bg-destructive" : t.priority === "Medium" ? "bg-warning" : "bg-muted-foreground")} />
                        </div>
                        {t.due_date && (
                          <p className={cn("text-[10px] mt-2", new Date(t.due_date) < new Date() && t.status !== "Done" ? "text-destructive" : "text-muted-foreground")}>
                            📅 {new Date(t.due_date).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary">
                  <option value="Low">Baixa</option>
                  <option value="Medium">Média</option>
                  <option value="High">Alta</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data limite</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary" />
              </div>
            </div>
            <button onClick={handleCreate} disabled={crm.createTask.isPending}
              className="w-full h-10 rounded-md text-sm font-medium text-primary-foreground bg-primary">
              {crm.createTask.isPending ? "Criando..." : "Criar Tarefa"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
