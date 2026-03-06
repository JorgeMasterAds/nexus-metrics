import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function NCRMSettings() {
  const crm = useCRM2();

  const [newLS, setNewLS] = useState({ name: "", type: "Open", color: "#3B82F6" });
  const [newDS, setNewDS] = useState({ name: "", type: "Open", color: "#3B82F6", probability: 0 });
  const [newRule, setNewRule] = useState({ field: "has_email", condition: "exists", value: "", points: 10 });

  const handleAddLeadStatus = () => {
    if (!newLS.name) return;
    crm.createLeadStatus.mutate(newLS, { onSuccess: () => setNewLS({ name: "", type: "Open", color: "#3B82F6" }) });
  };

  const handleAddDealStatus = () => {
    if (!newDS.name) return;
    crm.createDealStatus.mutate(newDS, { onSuccess: () => setNewDS({ name: "", type: "Open", color: "#3B82F6", probability: 0 }) });
  };

  const handleAddRule = () => {
    crm.createScoringRule.mutate(newRule, { onSuccess: () => setNewRule({ field: "has_email", condition: "exists", value: "", points: 10 }) });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Configurações</h1>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="score">Lead Score</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-md border border-border bg-card p-5 card-shadow">
              <h3 className="text-sm font-semibold text-foreground mb-4">Status de Leads</h3>
              <div className="space-y-2 mb-4">
                {crm.leadStatuses.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary">
                    <span className="h-4 w-4 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-sm text-foreground flex-1">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted">{s.type}</span>
                    <button onClick={() => crm.deleteLeadStatus.mutate(s.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newLS.name} onChange={e => setNewLS({ ...newLS, name: e.target.value })}
                  placeholder="Nome do status" className="flex-1" />
                <input type="color" value={newLS.color} onChange={e => setNewLS({ ...newLS, color: e.target.value })}
                  className="h-9 w-9 rounded-md cursor-pointer border border-border bg-secondary" />
                <Button onClick={handleAddLeadStatus} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-5 card-shadow">
              <h3 className="text-sm font-semibold text-foreground mb-4">Estágios de Deal</h3>
              <div className="space-y-2 mb-4">
                {crm.dealStatuses.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary">
                    <span className="h-4 w-4 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-sm text-foreground flex-1">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground">{s.probability}%</span>
                    <button onClick={() => crm.deleteDealStatus.mutate(s.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newDS.name} onChange={e => setNewDS({ ...newDS, name: e.target.value })}
                  placeholder="Nome do estágio" className="flex-1" />
                <input type="color" value={newDS.color} onChange={e => setNewDS({ ...newDS, color: e.target.value })}
                  className="h-9 w-9 rounded-md cursor-pointer border border-border bg-secondary" />
                <Button onClick={handleAddDealStatus} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="score">
          <div className="rounded-md border border-border bg-card p-5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Regras de Lead Score</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => crm.recalculateScores.mutate()}
                disabled={crm.recalculateScores.isPending}
                className="gap-1.5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", crm.recalculateScores.isPending && "animate-spin")} />
                Recalcular todos
              </Button>
            </div>

            <div className="space-y-2 mb-4">
              {crm.scoringRules.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-secondary">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{r.field} · {r.condition}{r.value ? ` · ${r.value}` : ""}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">+{r.points}</span>
                  <button
                    onClick={() => crm.updateScoringRule.mutate({ id: r.id, is_active: !r.is_active })}
                    className={cn("text-xs px-2 py-0.5 rounded-full", r.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}
                  >
                    {r.is_active ? "Ativo" : "Inativo"}
                  </button>
                  <button onClick={() => crm.deleteScoringRule.mutate(r.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={newRule.field} onValueChange={v => setNewRule({ ...newRule, field: v })}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="has_email">Email</SelectItem>
                  <SelectItem value="has_phone">Telefone</SelectItem>
                  <SelectItem value="has_organization">Empresa</SelectItem>
                  <SelectItem value="has_website">Website</SelectItem>
                  <SelectItem value="has_job_title">Cargo</SelectItem>
                  <SelectItem value="has_annual_revenue">Receita</SelectItem>
                  <SelectItem value="source">Fonte</SelectItem>
                  <SelectItem value="status_type">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newRule.condition} onValueChange={v => setNewRule({ ...newRule, condition: v })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exists">Existe</SelectItem>
                  <SelectItem value="equals">Igual a</SelectItem>
                </SelectContent>
              </Select>
              {newRule.condition === "equals" && (
                <Input value={newRule.value} onChange={e => setNewRule({ ...newRule, value: e.target.value })}
                  placeholder="Valor" className="w-28" />
              )}
              <Input type="number" value={newRule.points} onChange={e => setNewRule({ ...newRule, points: parseInt(e.target.value) || 0 })}
                className="w-20" />
              <Button onClick={handleAddRule} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
