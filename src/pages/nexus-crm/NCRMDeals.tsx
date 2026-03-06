import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM2 } from "@/hooks/useCRM2";
import { Kanban, Plus, DollarSign } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function NCRMDeals() {
  const crm = useCRM2();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", deal_value: "" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const openDeals = crm.deals.filter((d: any) => d.crm2_deal_statuses?.type !== "Lost" && d.crm2_deal_statuses?.type !== "Won");
  const totalValue = openDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    crm.updateDeal.mutate({ id: active.id as string, status_id: over.id as string });
  };

  const handleCreate = () => {
    if (!createForm.title) return;
    crm.createDeal.mutate({
      title: createForm.title,
      deal_value: parseFloat(createForm.deal_value) || 0,
    }, { onSuccess: () => { setShowCreate(false); setCreateForm({ title: "", deal_value: "" }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Valor total: <span className="font-bold text-primary">{fmt(totalValue)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Novo Deal
        </button>
      </div>

      {crm.isLoading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="w-[280px] h-[300px] rounded-md bg-muted animate-pulse flex-shrink-0" />)}
        </div>
      ) : crm.deals.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Kanban className="h-12 w-12 text-primary opacity-40 mb-4" />
          <p className="text-lg font-semibold text-foreground">Nenhum deal criado</p>
          <p className="text-sm text-muted-foreground mb-4">Comece criando ou convertendo um lead</p>
          <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary">
            <Plus className="h-4 w-4 inline mr-1" /> Novo Deal
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 kanban-container">
            {crm.dealStatuses.map((status: any) => {
              const cards = crm.deals.filter((d: any) => d.status_id === status.id);
              const stageValue = cards.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
              return (
                <div key={status.id} className="flex-shrink-0 w-[280px]" id={status.id}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
                    <span className="text-sm font-medium text-foreground">{status.name}</span>
                    <span className="text-xs text-muted-foreground">{cards.length}</span>
                    <span className="ml-auto text-xs font-bold text-primary">{fmt(stageValue)}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {cards.map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => navigate(`/crm/deals/${d.id}`)}
                        className="kanban-card rounded-md p-4 border border-border cursor-pointer transition-all hover:border-primary"
                      >
                        <p className="text-sm font-medium text-foreground">{d.title}</p>
                        {d.crm2_organizations?.name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{d.crm2_organizations.name}</p>
                        )}
                        <p className="text-lg font-bold mt-2 text-primary" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                          {fmt(d.deal_value || 0)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {d.probability != null && <span>{d.probability}%</span>}
                          {d.expected_closure_date && (
                            <span>📅 {new Date(d.expected_closure_date).toLocaleDateString("pt-BR")}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowCreate(true); }}
                      className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + Adicionar deal
                    </button>
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
            <DialogTitle>Novo Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
              <input
                value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
              <input
                type="number"
                value={createForm.deal_value}
                onChange={e => setCreateForm({ ...createForm, deal_value: e.target.value })}
                className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={crm.createDeal.isPending}
              className="w-full h-10 rounded-md text-sm font-medium text-primary-foreground bg-primary"
            >
              {crm.createDeal.isPending ? "Criando..." : "Criar Deal"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
