import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM2 } from "@/hooks/useCRM2";
import { useTags } from "@/hooks/useTags";
import {
  Target, Plus, List, LayoutGrid, Search, Key, Tag, Download, Upload, CheckSquare,
  Filter, X, Users, Trash2, Mail, Phone, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import CRM2LeadDetailPanel from "@/components/crm2/CRM2LeadDetailPanel";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/csv";

// ── Helpers ──
function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "—";
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `+${digits.slice(0, 4)}${"*".repeat(Math.max(0, digits.length - 6))}${digits.slice(-2)}`;
}

function relativeTime(date: string | null): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

function ScoreBadge({ score }: { score: number }) {
  let bg = "bg-info/15", color = "text-info", label = "Frio";
  if (score >= 81) { bg = "bg-primary/15"; color = "text-primary"; label = "Hot 🔥"; }
  else if (score >= 61) { bg = "bg-warning/15"; color = "text-warning"; label = "Quente"; }
  else if (score >= 31) { bg = "bg-warning/20"; color = "text-warning"; label = "Morno"; }
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", bg, color)}>{score} · {label}</span>
  );
}

// ── Lead Create Form ──
function LeadForm({ crm, onClose }: { crm: any; onClose: () => void }) {
  const [form, setForm] = useState<any>({ first_name: "", last_name: "", email: "", phone: "", organization: "", source: "", job_title: "" });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const save = () => {
    if (!form.first_name) return;
    crm.createLead.mutate(form, { onSuccess: onClose });
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={form.first_name} onChange={e => set("first_name", e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Sobrenome</Label><Input value={form.last_name} onChange={e => set("last_name", e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
      <div className="space-y-1"><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
      <div className="space-y-1"><Label className="text-xs">Empresa</Label><Input value={form.organization} onChange={e => set("organization", e.target.value)} /></div>
      <div className="space-y-1"><Label className="text-xs">Cargo</Label><Input value={form.job_title} onChange={e => set("job_title", e.target.value)} /></div>
      <div className="space-y-1">
        <Label className="text-xs">Fonte</Label>
        <Select value={form.source} onValueChange={v => set("source", v)}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>
            {["Site", "Indicação", "Google", "Redes Sociais", "Email", "Outro"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={save} disabled={crm.createLead.isPending} className="w-full">
        {crm.createLead.isPending ? "Salvando..." : "Criar Lead"}
      </Button>
    </div>
  );
}

// ── Advanced Filters Panel ──
function AdvancedFilters({ tags, onApply, onClose }: { tags: any[]; onApply: (f: any) => void; onClose: () => void }) {
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs">Filtrar por Tag</Label>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {tags.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Origem</Label>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {["Site", "Indicação", "Google", "Redes Sociais", "Email", "Outro"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApply({ tag: tagFilter, source: sourceFilter })} className="flex-1">Aplicar</Button>
        <Button size="sm" variant="outline" onClick={onClose}>Limpar</Button>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function NCRMLeads() {
  const crm = useCRM2();
  const { tags } = useTags();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkTags, setShowBulkTags] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [advFilters, setAdvFilters] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let results = crm.leads.filter((l: any) =>
      !q || (l.first_name || "").toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q) || (l.organization || "").toLowerCase().includes(q) || (l.phone || "").toLowerCase().includes(q)
    );
    if (advFilters?.source) {
      results = results.filter((l: any) => l.source === advFilters.source);
    }
    return results;
  }, [crm.leads, search, advFilters]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((l: any) => l.id)));
    }
  };

  const handleExportCsv = useCallback(() => {
    const data = (selectedIds.size > 0
      ? filtered.filter((l: any) => selectedIds.has(l.id))
      : filtered
    ).map((l: any) => ({
      nome: `${l.first_name || ""} ${l.last_name || ""}`.trim(),
      email: l.email || "",
      telefone: l.phone || "",
      empresa: l.organization || "",
      origem: l.source || "",
      criado_em: l.created_at,
    }));
    exportToCsv(data, "leads-export");
    toast.success(`${data.length} leads exportados`);
  }, [filtered, selectedIds]);

  const handleDeleteSelected = useCallback(() => {
    selectedIds.forEach(id => crm.deleteLead.mutate(id));
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, crm]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    crm.updateLead.mutate({ id: active.id as string, status_id: over.id as string });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Leads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie seus clientes em um só lugar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, email, telefone..."
              className="h-9 pl-9 pr-3 rounded-md text-sm text-foreground w-64 outline-none border border-border bg-secondary"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowFilters(true)}>
            <Filter className="h-3.5 w-3.5" /> Filtros
          </Button>
          <div className="flex rounded-md overflow-hidden border border-border">
            <button onClick={() => setView("list")} className={cn("p-2", view === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView("kanban")} className={cn("p-2", view === "kanban" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" className="gap-1.5 h-9" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant={selectionMode ? "default" : "outline"} size="sm" className="gap-1.5 text-xs" onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}>
          <CheckSquare className="h-3.5 w-3.5" /> {selectionMode ? "Cancelar seleção" : "Selecionar"}
        </Button>
        {selectionMode && (
          <>
            <Button variant="outline" size="sm" className="text-xs" onClick={selectAll}>
              {selectedIds.size === filtered.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
            <Badge variant="secondary" className="text-xs">{selectedIds.size} selecionado(s)</Badge>
          </>
        )}
        {selectedIds.size > 0 && (
          <>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportCsv}>
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive border-destructive/30" onClick={handleDeleteSelected}>
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </>
        )}
        {!selectionMode && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs ml-auto" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5" /> Exportar
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{filtered.length} leads</span>
      </div>

      {/* Active filters */}
      {advFilters && (advFilters.source || advFilters.tag) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {advFilters.source && (
            <Badge variant="outline" className="text-xs gap-1">
              Origem: {advFilters.source}
              <button onClick={() => setAdvFilters({ ...advFilters, source: "" })}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          <button onClick={() => setAdvFilters(null)} className="text-xs text-primary hover:underline">Limpar filtros</button>
        </div>
      )}

      {/* Content */}
      {crm.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Target className="h-12 w-12 text-primary opacity-40 mb-4" />
          <p className="text-lg font-semibold text-foreground">Nenhum lead ainda</p>
          <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro lead para começar</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Criar Lead</Button>
        </div>
      ) : view === "list" ? (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary">
                {selectionMode && <th className="px-3 py-3 w-10" />}
                {["Score", "Nome", "Empresa", "Email", "Telefone", "Integrações", "Tags", "Status", "Criado"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l: any) => (
                <tr key={l.id}
                  onClick={() => !selectionMode && setSelectedLead(l)}
                  className="cursor-pointer transition-colors hover:bg-muted border-b border-border"
                >
                  {selectionMode && (
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3"><ScoreBadge score={l.score || 0} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-foreground font-medium">{l.first_name} {l.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.organization || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{maskEmail(l.email)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{maskPhone(l.phone)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {l.email && (
                        <Tooltip><TooltipTrigger asChild>
                          <Mail className="h-3.5 w-3.5 text-blue-400" />
                        </TooltipTrigger><TooltipContent className="text-xs">Email disponível</TooltipContent></Tooltip>
                      )}
                      {l.phone && (
                        <Tooltip><TooltipTrigger asChild>
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                        </TooltipTrigger><TooltipContent className="text-xs">WhatsApp disponível</TooltipContent></Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip><TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        <Tag className="h-2.5 w-2.5" /> {l.lead_tag_assignments?.length || 0}
                      </span>
                    </TooltipTrigger><TooltipContent className="text-xs">Tags do lead</TooltipContent></Tooltip>
                  </td>
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
                  <td className="px-4 py-3 text-muted-foreground text-xs">{relativeTime(l.created_at)}</td>
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
                      <div key={l.id} onClick={() => setSelectedLead(l)}
                        className="kanban-card rounded-md p-3 border border-border cursor-pointer transition-all hover:border-primary">
                        <p className="text-sm font-medium text-foreground">{l.first_name} {l.last_name}</p>
                        {l.organization && <p className="text-xs text-muted-foreground mt-0.5">{l.organization}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <ScoreBadge score={l.score || 0} />
                          <div className="flex items-center gap-1 ml-auto">
                            {l.email && <Mail className="h-3 w-3 text-blue-400" />}
                            {l.phone && <MessageCircle className="h-3 w-3 text-emerald-400" />}
                          </div>
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

      {/* Detail Panel */}
      {selectedLead && <CRM2LeadDetailPanel lead={selectedLead} crm={crm} onClose={() => setSelectedLead(null)} />}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <LeadForm crm={crm} onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Filtros Avançados</DialogTitle></DialogHeader>
          <AdvancedFilters tags={tags} onApply={(f) => { setAdvFilters(f); setShowFilters(false); }} onClose={() => { setAdvFilters(null); setShowFilters(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
