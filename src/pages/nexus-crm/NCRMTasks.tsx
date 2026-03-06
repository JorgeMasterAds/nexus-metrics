import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { CheckSquare, Plus, Circle, Clock, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

const columns = [
  { id: "Todo", label: "A Fazer", color: "#3B82F6" },
  { id: "In Progress", label: "Em Progresso", color: "#F59E0B" },
  { id: "Done", label: "Concluído", color: "#22C55E" },
];

const priorityColors: Record<string, string> = { High: "#EF4444", Medium: "#F59E0B", Low: "#6B7280" };

export default function NCRMTasks() {
  const crm = useCRM2();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", due_date: "" });
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
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
        <h1 className="text-2xl font-bold text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tarefas</h1>
        <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-white flex items-center gap-1.5" style={{ background: "#E5191A" }}>
          <Plus className="h-4 w-4" /> Nova Tarefa
        </button>
      </div>

      {crm.tasks.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <CheckSquare className="h-12 w-12 text-[#E5191A] opacity-40 mb-4" />
          <p className="text-lg font-semibold text-[#F5F5F5]">Nenhuma tarefa</p>
          <p className="text-sm text-[#A0A0A0]">Crie tarefas para organizar seu trabalho</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
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
                    <span className="text-sm font-medium text-[#F5F5F5]">{col.label}</span>
                    <span className="text-xs text-[#555]">{tasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {tasks.map((t: any) => (
                      <div key={t.id} className="rounded-md p-3 border transition-all hover:border-[#E5191A]"
                        style={{ background: "#161616", borderColor: "#2A2A2A" }}>
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => crm.updateTask.mutate({ id: t.id, status: t.status === "Done" ? "Todo" : "Done" })}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {(t.status === "Done" || t.status === "done") ? (
                              <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                            ) : (
                              <Circle className="h-4 w-4 text-[#555]" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm", (t.status === "Done" || t.status === "done") ? "line-through text-[#555]" : "text-[#F5F5F5]")}>{t.title}</p>
                            {t.description && <p className="text-xs text-[#555] mt-0.5 truncate">{t.description}</p>}
                          </div>
                          <span className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: priorityColors[t.priority] || "#6B7280" }} />
                        </div>
                        {t.due_date && (
                          <p className={cn("text-[10px] mt-2", new Date(t.due_date) < new Date() && t.status !== "Done" ? "text-[#EF4444]" : "text-[#555]")}>
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
        <DialogContent style={{ background: "#161616", borderColor: "#2A2A2A" }}>
          <DialogHeader><DialogTitle className="text-[#F5F5F5]">Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#A0A0A0] mb-1 block">Título *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full h-9 px-3 rounded-md text-sm text-[#F5F5F5] outline-none" style={{ background: "#111", border: "1px solid #2A2A2A" }} />
            </div>
            <div>
              <label className="text-xs text-[#A0A0A0] mb-1 block">Descrição</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full h-9 px-3 rounded-md text-sm text-[#F5F5F5] outline-none" style={{ background: "#111", border: "1px solid #2A2A2A" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Prioridade</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full h-9 px-3 rounded-md text-sm text-[#F5F5F5] outline-none" style={{ background: "#111", border: "1px solid #2A2A2A" }}>
                  <option value="Low">Baixa</option>
                  <option value="Medium">Média</option>
                  <option value="High">Alta</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Data limite</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full h-9 px-3 rounded-md text-sm text-[#F5F5F5] outline-none" style={{ background: "#111", border: "1px solid #2A2A2A" }} />
              </div>
            </div>
            <button onClick={handleCreate} disabled={crm.createTask.isPending}
              className="w-full h-10 rounded-md text-sm font-medium text-white" style={{ background: "#E5191A" }}>
              {crm.createTask.isPending ? "Criando..." : "Criar Tarefa"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
