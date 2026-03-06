import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NCRMSettings() {
  const crm = useCRM2();
  const [tab, setTab] = useState<"pipeline" | "score">("pipeline");

  const [newLS, setNewLS] = useState({ name: "", type: "Open", color: "#3B82F6" });
  const [newDS, setNewDS] = useState({ name: "", type: "Open", color: "#3B82F6", probability: 0 });
  const [newRule, setNewRule] = useState({ field: "email", condition: "is_not_empty", value: "", points: 10 });

  const handleAddLeadStatus = () => {
    if (!newLS.name) return;
    crm.createLeadStatus.mutate(newLS, { onSuccess: () => setNewLS({ name: "", type: "Open", color: "#3B82F6" }) });
  };

  const handleAddDealStatus = () => {
    if (!newDS.name) return;
    crm.createDealStatus.mutate(newDS, { onSuccess: () => setNewDS({ name: "", type: "Open", color: "#3B82F6", probability: 0 }) });
  };

  const handleAddRule = () => {
    crm.createScoringRule.mutate(newRule, { onSuccess: () => setNewRule({ field: "email", condition: "is_not_empty", value: "", points: 10 }) });
  };

  const inp = "w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Configurações</h1>

      <div className="flex gap-0 border-b border-border">
        {[{ key: "pipeline", label: "Pipeline" }, { key: "score", label: "Lead Score" }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn("px-4 py-2.5 text-sm transition-colors border-b-2", tab === t.key ? "text-primary border-primary" : "text-muted-foreground border-transparent")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && (
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
              <input value={newLS.name} onChange={e => setNewLS({ ...newLS, name: e.target.value })}
                placeholder="Nome do status" className={cn(inp, "flex-1")} />
              <input type="color" value={newLS.color} onChange={e => setNewLS({ ...newLS, color: e.target.value })}
                className="h-9 w-9 rounded-md cursor-pointer border border-border bg-secondary" />
              <button onClick={handleAddLeadStatus} className="h-9 px-3 rounded-md text-primary-foreground bg-primary text-sm">
                <Plus className="h-4 w-4" />
              </button>
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
              <input value={newDS.name} onChange={e => setNewDS({ ...newDS, name: e.target.value })}
                placeholder="Nome do estágio" className={cn(inp, "flex-1")} />
              <input type="color" value={newDS.color} onChange={e => setNewDS({ ...newDS, color: e.target.value })}
                className="h-9 w-9 rounded-md cursor-pointer border border-border bg-secondary" />
              <button onClick={handleAddDealStatus} className="h-9 px-3 rounded-md text-primary-foreground bg-primary text-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "score" && (
        <div className="rounded-md border border-border bg-card p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Regras de Lead Score</h3>
            <button
              onClick={() => crm.recalculateScores.mutate()}
              disabled={crm.recalculateScores.isPending}
              className="h-8 px-3 rounded-md text-xs font-medium text-foreground flex items-center gap-1.5 border border-border bg-secondary"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", crm.recalculateScores.isPending && "animate-spin")} />
              Recalcular todos
            </button>
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
            <select value={newRule.field} onChange={e => setNewRule({ ...newRule, field: e.target.value })}
              className={cn(inp, "w-36")}>
              <option value="has_email">Email</option>
              <option value="has_phone">Telefone</option>
              <option value="has_organization">Empresa</option>
              <option value="has_website">Website</option>
              <option value="has_job_title">Cargo</option>
              <option value="has_annual_revenue">Receita</option>
              <option value="source">Fonte</option>
              <option value="status_type">Status</option>
            </select>
            <select value={newRule.condition} onChange={e => setNewRule({ ...newRule, condition: e.target.value })}
              className={cn(inp, "w-32")}>
              <option value="exists">Existe</option>
              <option value="equals">Igual a</option>
            </select>
            {newRule.condition === "equals" && (
              <input value={newRule.value} onChange={e => setNewRule({ ...newRule, value: e.target.value })}
                placeholder="Valor" className={cn(inp, "w-28")} />
            )}
            <input type="number" value={newRule.points} onChange={e => setNewRule({ ...newRule, points: parseInt(e.target.value) || 0 })}
              className={cn(inp, "w-20")} />
            <button onClick={handleAddRule} className="h-9 px-3 rounded-md text-primary-foreground bg-primary text-sm">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
