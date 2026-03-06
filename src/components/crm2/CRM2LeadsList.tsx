import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowRightLeft, Trash2, Flame, LayoutGrid, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CRM2LeadsKanban from "./CRM2LeadsKanban";
import CRM2LeadDetailPanel from "./CRM2LeadDetailPanel";

function ScoreBadge({ score }: { score: number }) {
  const level = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  const colors = {
    hot: "bg-red-500/20 text-red-400 border-red-500/30",
    warm: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    cold: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${colors[level]}`}>
          <Flame className="h-2.5 w-2.5" />{score}
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs">Score: {score}/100</TooltipContent>
    </Tooltip>
  );
}

export default function CRM2LeadsList({ crm }: { crm: any }) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", organization: "", source: "", job_title: "", website: "" });

  const filtered = crm.leads
    .filter((l: any) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [l.first_name, l.last_name, l.email, l.organization, l.phone].some((v: any) => v?.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || l.status_id === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "score") return (b.score || 0) - (a.score || 0);
      return 0;
    });

  const handleCreate = () => {
    if (!form.first_name && !form.email) return;
    crm.createLead.mutate(form);
    setForm({ first_name: "", last_name: "", email: "", phone: "", organization: "", source: "", job_title: "", website: "" });
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {crm.leadStatuses.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant={sortBy === "score" ? "default" : "outline"} className="gap-1.5 text-xs"
          onClick={() => setSortBy(sortBy === "score" ? "date" : "score")}>
          <Flame className="h-3.5 w-3.5" /> Score
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => crm.recalculateScores.mutate()} disabled={crm.recalculateScores.isPending}>
          {crm.recalculateScores.isPending ? "..." : "Recalcular"}
        </Button>
        <div className="flex border border-border/30 rounded-lg overflow-hidden">
          <button onClick={() => setView("kanban")} className={`px-2.5 py-1.5 text-xs transition-colors ${view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setView("list")} className={`px-2.5 py-1.5 text-xs transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Lead
        </Button>
      </div>

      {view === "kanban" ? (
        <CRM2LeadsKanban crm={crm} onSelectLead={setSelectedLead} />
      ) : (
        <div className="rounded-xl border border-border/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Empresa</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</td></tr>
              ) : filtered.map((l: any) => (
                <tr key={l.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedLead(l)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{l.first_name} {l.last_name}</p>
                    <p className="text-xs text-muted-foreground md:hidden">{l.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{l.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{l.organization || "—"}</td>
                  <td className="px-4 py-3 text-center"><ScoreBadge score={l.score || 0} /></td>
                  <td className="px-4 py-3">
                    {l.crm2_lead_statuses ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: l.crm2_lead_statuses.color, color: l.crm2_lead_statuses.color }}>
                        {l.crm2_lead_statuses.name}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                    {l.converted && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Convertido</span>}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {!l.converted && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => crm.convertLeadToDeal.mutate(l.id)}>
                          <ArrowRightLeft className="h-3 w-3" /> Converter
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => crm.deleteLead.mutate(l.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <CRM2LeadDetailPanel lead={selectedLead} crm={crm} onClose={() => setSelectedLead(null)} />
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Nome</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Nome" /></div>
              <div><Label className="text-xs">Sobrenome</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Sobrenome" /></div>
            </div>
            <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Empresa</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Empresa" /></div>
              <div><Label className="text-xs">Cargo</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Cargo" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Origem</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Google, Indicação..." /></div>
              <div><Label className="text-xs">Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." /></div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={crm.createLead.isPending}>
              {crm.createLead.isPending ? "Criando..." : "Criar Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
