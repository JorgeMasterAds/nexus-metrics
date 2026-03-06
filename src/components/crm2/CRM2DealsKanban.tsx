import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import CRM2DealDetailPanel from "./CRM2DealDetailPanel";

export default function CRM2DealsKanban({ crm }: { crm: any }) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [form, setForm] = useState({ title: "", deal_value: "", source: "", organization_id: "" });
  const [dragDealId, setDragDealId] = useState<string | null>(null);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openStatuses = crm.dealStatuses.filter((s: any) => s.type === "Open");
  const terminalStatuses = crm.dealStatuses.filter((s: any) => s.type !== "Open");
  const columns = [...openStatuses, ...terminalStatuses];

  const handleCreate = () => {
    if (!form.title) return;
    crm.createDeal.mutate({
      title: form.title,
      deal_value: form.deal_value ? parseFloat(form.deal_value) : undefined,
      source: form.source || undefined,
      organization_id: form.organization_id || undefined,
    });
    setForm({ title: "", deal_value: "", source: "", organization_id: "" });
    setShowCreate(false);
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

      <div className="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-260px)]">
        {columns.map((col: any) => {
          const colDeals = crm.deals.filter((d: any) => d.status_id === col.id);
          const colValue = colDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);

          return (
            <div key={col.id}
              className={cn("min-w-[260px] w-[260px] shrink-0 rounded-xl border flex flex-col transition-all",
                dragDealId ? "border-primary/30" : "border-border/30", "bg-muted/20")}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}>
              <div className="p-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-medium flex-1">{col.name}</span>
                  <span className="text-xs text-muted-foreground">{colDeals.length}</span>
                </div>
                {colValue > 0 && <p className="text-xs text-muted-foreground mt-1">{fmt(colValue)}</p>}
              </div>

              <div className="p-2 flex-1 space-y-2 min-h-[100px] overflow-y-auto">
                {colDeals.map((deal: any) => (
                  <div key={deal.id} draggable
                    onDragStart={(e) => { setDragDealId(deal.id); e.dataTransfer.effectAllowed = "move"; }}
                    onClick={() => setSelectedDeal(deal)}
                    className={cn("p-3 rounded-lg border border-border/30 bg-card/90 cursor-pointer hover:border-primary/30 transition-all",
                      dragDealId === deal.id && "opacity-50")}>
                    <p className="text-sm font-medium truncate">{deal.title || "Deal sem título"}</p>
                    {deal.crm2_organizations?.name && <p className="text-xs text-muted-foreground mt-0.5">{deal.crm2_organizations.name}</p>}
                    {deal.next_step && <p className="text-[10px] text-primary mt-1">→ {deal.next_step}</p>}
                    {deal.deal_value && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                        <DollarSign className="h-3 w-3" />{fmt(deal.deal_value)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDeal && <CRM2DealDetailPanel deal={selectedDeal} crm={crm} onClose={() => setSelectedDeal(null)} />}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nome do negócio" /></div>
            <div><Label className="text-xs">Valor (R$)</Label><Input type="number" value={form.deal_value} onChange={(e) => setForm({ ...form, deal_value: e.target.value })} placeholder="0.00" /></div>
            <div><Label className="text-xs">Origem</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Google, Indicação..." /></div>
            {crm.organizations.length > 0 && (
              <div>
                <Label className="text-xs">Empresa</Label>
                <Select value={form.organization_id} onValueChange={(v) => setForm({ ...form, organization_id: v })}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {crm.organizations.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={handleCreate} disabled={crm.createDeal.isPending}>
              {crm.createDeal.isPending ? "Criando..." : "Criar Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
