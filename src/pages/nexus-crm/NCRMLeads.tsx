import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM2 } from "@/hooks/useCRM2";
import { Target, Plus, List, LayoutGrid, Search, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

function ScoreBadge({ score }: { score: number }) {
  let bg = "bg-info/15", color = "text-info", label = "Frio";
  if (score >= 81) { bg = "bg-primary/15"; color = "text-primary"; label = "Hot 🔥"; }
  else if (score >= 61) { bg = "bg-warning/15"; color = "text-warning"; label = "Quente"; }
  else if (score >= 31) { bg = "bg-warning/20"; color = "text-warning"; label = "Morno"; }
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", bg, color)}>{score} · {label}</span>
  );
}

function LeadForm({ crm, onClose }: { crm: any; onClose: () => void }) {
  const [form, setForm] = useState<any>({ first_name: "", last_name: "", email: "", phone: "", organization: "", source: "", job_title: "" });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const save = () => {
    if (!form.first_name) return;
    crm.createLead.mutate(form, { onSuccess: onClose });
  };

  const Field = ({ label, field, placeholder }: { label: string; field: string; placeholder?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome *" field="first_name" />
        <Field label="Sobrenome" field="last_name" />
      </div>
      <Field label="Email" field="email" />
      <Field label="Telefone" field="phone" />
      <Field label="Empresa" field="organization" />
      <Field label="Cargo" field="job_title" />
      <div className="space-y-1">
        <Label className="text-xs">Fonte</Label>
        <Select value={form.source} onValueChange={v => set("source", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            {["Site", "Indicação", "Google", "Redes Sociais", "Email", "Outro"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={save}
        disabled={crm.createLead.isPending}
        className="w-full"
      >
        {crm.createLead.isPending ? "Salvando..." : "Criar Lead"}
      </Button>
    </div>
  );
}

export default function NCRMLeads() {
  const crm = useCRM2();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return crm.leads.filter((l: any) =>
      !q || (l.first_name || "").toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q) || (l.organization || "").toLowerCase().includes(q)
    );
  }, [crm.leads, search]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const statusId = over.id as string;
    crm.updateLead.mutate({ id: active.id as string, status_id: statusId });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Leads</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar leads..."
              className="h-9 pl-9 pr-3 rounded-md text-sm text-foreground w-56 outline-none border border-border bg-secondary"
            />
          </div>
          <div className="flex rounded-md overflow-hidden border border-border">
            <button onClick={() => setView("list")} className={cn("p-2", view === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView("kanban")} className={cn("p-2", view === "kanban" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary flex items-center gap-1.5 transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo Lead
          </button>
        </div>
      </div>

      {crm.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Target className="h-12 w-12 text-primary opacity-40 mb-4" />
          <p className="text-lg font-semibold text-foreground">Nenhum lead ainda</p>
          <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro lead para começar</p>
          <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary">
            <Plus className="h-4 w-4 inline mr-1" /> Criar Lead
          </button>
        </div>
      ) : view === "list" ? (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary">
                {["Score", "Nome", "Empresa", "Email", "Telefone", "Status", "Criado em"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l: any) => (
                <tr
                  key={l.id}
                  onClick={() => navigate(`/crm/leads/${l.id}`)}
                  className="cursor-pointer transition-colors hover:bg-muted border-b border-border"
                >
                  <td className="px-4 py-3"><ScoreBadge score={l.score || 0} /></td>
                  <td className="px-4 py-3 text-foreground font-medium">{l.first_name} {l.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.organization || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.phone || "—"}</td>
                  <td className="px-4 py-3">
                    {l.crm2_lead_statuses && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: `${l.crm2_lead_statuses.color}20`,
                        color: l.crm2_lead_statuses.color,
                      }}>
                        {l.crm2_lead_statuses.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 kanban-container">
            {crm.leadStatuses.map((status: any) => {
              const cards = filtered.filter((l: any) => l.status_id === status.id);
              return (
                <div key={status.id} className="flex-shrink-0 w-[280px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
                    <span className="text-sm font-medium text-foreground">{status.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{cards.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]" id={status.id}>
                    {cards.map((l: any) => (
                      <div
                        key={l.id}
                        onClick={() => navigate(`/crm/leads/${l.id}`)}
                        className="kanban-card rounded-md p-3 border border-border cursor-pointer transition-all hover:border-primary"
                      >
                        <p className="text-sm font-medium text-foreground">{l.first_name} {l.last_name}</p>
                        {l.organization && <p className="text-xs text-muted-foreground mt-0.5">{l.organization}</p>}
                        <div className="mt-2">
                          <ScoreBadge score={l.score || 0} />
                        </div>
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
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <LeadForm crm={crm} onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
