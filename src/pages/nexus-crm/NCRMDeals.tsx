import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM2 } from "@/hooks/useCRM2";
import { Kanban, Plus, DollarSign, Clock, MoreHorizontal, Trophy, XCircle, Trash2 } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        <Button onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Deal
        </Button>
      </div>

      {crm.isLoading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-[280px]">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
              {[1, 2, 3].map(card => (
                <div key={card} className="bg-card border border-border rounded-md p-4 mb-2 space-y-2">
                  <div className="h-3.5 w-36 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : crm.deals.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Kanban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum deal criado</h3>
          <p className="text-sm text-muted-foreground mb-4">Comece criando um deal ou convertendo um lead</p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Deal
          </Button>
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
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">{status.name}</span>
                        <span className="text-xs text-muted-foreground">({cards.length})</span>
                      </div>
                      <p className="text-base font-bold text-primary">{fmt(stageValue)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {cards.map((d: any) => {
                      const daysSince = Math.floor((Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div
                          key={d.id}
                          className="kanban-card rounded-md p-4 border border-border cursor-pointer transition-all hover:border-primary group/card relative"
                        >
                          <div onClick={() => navigate(`/crm/deals/${d.id}`)}>
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
                            {daysSince > 7 && (
                              <span className="text-[10px] text-warning flex items-center gap-1 mt-1">
                                <Clock className="h-2.5 w-2.5" /> {daysSince}d sem atividade
                              </span>
                            )}
                          </div>
                          {/* Quick actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="h-6 w-6 rounded flex items-center justify-center bg-card border border-border hover:bg-muted">
                                  <MoreHorizontal className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {crm.dealStatuses.filter((s: any) => s.type === "Won").map((s: any) => (
                                  <DropdownMenuItem key={s.id} onClick={(e) => { e.stopPropagation(); crm.updateDeal.mutate({ id: d.id, status_id: s.id }); }}>
                                    <Trophy className="h-3.5 w-3.5 mr-2 text-success" /> Marcar como Ganho
                                  </DropdownMenuItem>
                                ))}
                                {crm.dealStatuses.filter((s: any) => s.type === "Lost").map((s: any) => (
                                  <DropdownMenuItem key={s.id} onClick={(e) => { e.stopPropagation(); crm.updateDeal.mutate({ id: d.id, status_id: s.id }); }}>
                                    <XCircle className="h-3.5 w-3.5 mr-2 text-destructive" /> Marcar como Perdido
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); crm.deleteLead.mutate(d.id); }}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
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
              <Label>Título *</Label>
              <Input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={createForm.deal_value} onChange={e => setCreateForm({ ...createForm, deal_value: e.target.value })} className="mt-1" />
            </div>
            <Button onClick={handleCreate} disabled={crm.createDeal.isPending} className="w-full">
              {crm.createDeal.isPending ? "Criando..." : "Criar Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
