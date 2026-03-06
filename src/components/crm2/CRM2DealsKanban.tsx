import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CRM2DealsKanban({ crm }: { crm: any }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", deal_value: "", source: "" });
  const [dragDealId, setDragDealId] = useState<string | null>(null);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openStatuses = crm.dealStatuses.filter((s: any) => s.type === "Open");
  const terminalStatuses = crm.dealStatuses.filter((s: any) => s.type !== "Open");
  const columns = [...openStatuses, ...terminalStatuses];

  const handleCreate = () => {
    if (!form.title) return;
    crm.createDeal.mutate({ title: form.title, deal_value: form.deal_value ? parseFloat(form.deal_value) : undefined, source: form.source });
    setForm({ title: "", deal_value: "", source: "" });
    setShowCreate(false);
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDragDealId(dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (dragDealId) {
      crm.updateDeal.mutate({ id: dragDealId, status_id: statusId });
      setDragDealId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Deal
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col: any) => {
          const colDeals = crm.deals.filter((d: any) => d.status_id === col.id);
          const colValue = colDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);

          return (
            <div
              key={col.id}
              className="min-w-[260px] w-[260px] shrink-0 rounded-xl border border-border/30 bg-muted/20 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-medium flex-1">{col.name}</span>
                  <span className="text-xs text-muted-foreground">{colDeals.length}</span>
                </div>
                {colValue > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{fmt(colValue)}</p>
                )}
              </div>

              <div className="p-2 flex-1 space-y-2 min-h-[100px]">
                {colDeals.map((deal: any) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    className={cn(
                      "p-3 rounded-lg border border-border/30 bg-card/90 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all",
                      dragDealId === deal.id && "opacity-50"
                    )}
                  >
                    <p className="text-sm font-medium truncate">{deal.title || "Deal sem título"}</p>
                    {deal.crm2_organizations?.name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{deal.crm2_organizations.name}</p>
                    )}
                    {deal.deal_value && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                        <DollarSign className="h-3 w-3" />
                        {fmt(deal.deal_value)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nome do negócio" /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={form.deal_value} onChange={(e) => setForm({ ...form, deal_value: e.target.value })} placeholder="0.00" /></div>
            <div><Label>Origem</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Google, Indicação..." /></div>
            <Button className="w-full" onClick={handleCreate} disabled={crm.createDeal.isPending}>
              {crm.createDeal.isPending ? "Criando..." : "Criar Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
