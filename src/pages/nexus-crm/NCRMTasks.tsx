import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { CheckSquare, Plus, Circle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

const TASK_STATUS = { TODO: "todo", IN_PROGRESS: "in_progress", DONE: "done", CANCELED: "canceled" } as const;

const columns = [
  { id: TASK_STATUS.TODO, label: "A Fazer", color: "hsl(var(--info))" },
  { id: TASK_STATUS.IN_PROGRESS, label: "Em Progresso", color: "hsl(var(--warning))" },
  { id: TASK_STATUS.DONE, label: "Concluído", color: "hsl(var(--success))" },
  { id: TASK_STATUS.CANCELED, label: "Cancelado", color: "hsl(var(--muted-foreground))" },
];

function normalizeStatus(s: string): string {
  const lower = (s || "").toLowerCase().replace(/\s+/g, "_");
  if (lower === "todo" || lower === "backlog") return TASK_STATUS.TODO;
  if (lower === "in_progress" || lower === "in progress") return TASK_STATUS.IN_PROGRESS;
  if (lower === "done") return TASK_STATUS.DONE;
  if (lower === "canceled") return TASK_STATUS.CANCELED;
  return TASK_STATUS.TODO;
}

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
        <Button onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      {crm.tasks.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma tarefa</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie tarefas para organizar seu trabalho</p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar primeira tarefa
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 kanban-container">
            {columns.map(col => {
              const tasks = crm.tasks.filter((t: any) => normalizeStatus(t.status) === col.id);
              return (
                <div key={col.id} className="flex-shrink-0 w-[280px]" id={col.id}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                    <span className="text-xs text-muted-foreground">{tasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {tasks.map((t: any) => {
                      const ns = normalizeStatus(t.status);
                      const isDone = ns === TASK_STATUS.DONE;
                      const isCanceled = ns === TASK_STATUS.CANCELED;
                      return (
                        <div key={t.id} className={cn("kanban-card rounded-md p-3 border border-border transition-all hover:border-primary", isCanceled && "opacity-60")}>
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => crm.updateTask.mutate({ id: t.id, status: isDone ? TASK_STATUS.TODO : TASK_STATUS.DONE })}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : isCanceled ? (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm", (isDone || isCanceled) ? "line-through text-muted-foreground" : "text-foreground")}>{t.title}</p>
                              {t.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>}
                            </div>
                            <span className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-1.5", t.priority === "High" ? "bg-destructive" : t.priority === "Medium" ? "bg-warning" : "bg-muted-foreground")} />
                          </div>
                          {t.due_date && (
                            <p className={cn("text-[10px] mt-2", new Date(t.due_date) < new Date() && !isDone && !isCanceled ? "text-destructive" : "text-muted-foreground")}>
                              📅 {new Date(t.due_date).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      );
                    })}
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
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Baixa</SelectItem>
                    <SelectItem value="Medium">Média</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data limite</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="mt-1" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={crm.createTask.isPending} className="w-full">
              {crm.createTask.isPending ? "Criando..." : "Criar Tarefa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
