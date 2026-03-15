import { useState, useMemo, useCallback, useRef } from "react";
import { 
  Search, ChevronLeft, ChevronRight, CirclePlus, Eraser, ArrowDownToLine, ArrowUpFromLine,
  Bookmark, BookmarkMinus, Gauge, MousePointerClick, BarChart2, History,
  Filter, User, ShoppingCart, Fingerprint, Tag, Crosshair, Upload, X, Check, TrendingUp, Users, Activity
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useCRM } from "@/hooks/useCRM";
import { exportToCsv } from "@/lib/csv";

const PAGE_SIZE = 20;

interface Props {
  leads: any[];
  onSelectLead: (lead: any) => void;
  onCreateLead?: () => void;
}

export default function ListView({ leads, onSelectLead, onCreateLead }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const { deleteLead, addTag, removeTag, tags, createLead } = useCRM();

  // Dialog states
  const [showImport, setShowImport] = useState(false);
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [showBulkUntag, setShowBulkUntag] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [bulkTagId, setBulkTagId] = useState("");
  const [importData, setImportData] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter((l: any) =>
      l.name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  }, [leads, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const getLeadTags = (lead: any) => {
    return (lead.lead_tag_assignments || [])
      .map((a: any) => a.lead_tags)
      .filter((t: any) => t?.id && t?.name);
  };

  const getLeadPurchaseCount = (lead: any) => (lead.lead_purchases || []).length;
  const getLeadCustomFields = (lead: any) => {
    let count = 0;
    if (lead.email) count++;
    if (lead.phone) count++;
    if (lead.source) count++;
    if (lead.notes) count++;
    return count;
  };
  const getLeadTrackingCount = (lead: any) => {
    return (lead.lead_purchases || []).filter((p: any) => {
      const conv = p.conversions;
      return conv && (conv.utm_source || conv.utm_medium || conv.utm_campaign);
    }).length;
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    return `${user.slice(0, 2)}${"*".repeat(Math.max(user.length - 2, 3))}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    if (phone.length <= 6) return phone;
    return phone.slice(0, phone.length - 6) + "******" + phone.slice(-1);
  };

  const timeAgo = (date: string) => {
    try { return formatDistanceToNow(new Date(date), { addSuffix: false, locale: ptBR }); } catch { return ""; }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    if (!selectionMode) return;
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => deleteLead.mutate(id));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${selectedIds.size} lead(s) removido(s)`);
  }, [selectedIds, deleteLead]);

  const handleExport = useCallback(() => {
    const source = selectionMode && selectedIds.size > 0
      ? filtered.filter((l: any) => selectedIds.has(l.id))
      : filtered;
    const rows = source.map((l: any) => ({
      Nome: l.name,
      Email: l.email || "",
      Telefone: l.phone || "",
      Origem: l.source || "",
      "Valor Total": l.total_value || 0,
      Tags: getLeadTags(l).map((t: any) => t.name).join(", "),
      Criado: new Date(l.created_at).toLocaleDateString("pt-BR"),
    }));
    exportToCsv(rows, "leads");
    toast.success(`${rows.length} lead(s) exportado(s)!`);
  }, [filtered, selectedIds, selectionMode]);

  // ── CSV Import ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV vazio ou sem dados"); return; }
      const headers = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(/[;,]/);
        const row: any = {};
        headers.forEach((h, i) => { row[h] = vals[i]?.trim() || ""; });
        return row;
      });
      setImportData(rows);
    };
    reader.readAsText(file);
  };

  const processImport = async () => {
    let count = 0;
    for (const row of importData) {
      const name = row.nome || row.name || row.primeiro_nome || "";
      const email = row.email || row["e-mail"] || "";
      const phone = row.telefone || row.phone || row.whatsapp || "";
      if (!name && !email) continue;
      createLead.mutate({ name: name || email, email, phone });
      count++;
    }
    toast.success(`${count} lead(s) importado(s)!`);
    setShowImport(false);
    setImportData([]);
  };

  // ── Bulk Tag Add ──
  const handleBulkAddTag = async () => {
    if (!bulkTagId || selectedIds.size === 0) return;
    let count = 0;
    for (const leadId of selectedIds) {
      addTag.mutate({ leadId, tagId: bulkTagId });
      count++;
    }
    toast.success(`Tag adicionada a ${count} lead(s)`);
    setShowBulkTag(false);
    setBulkTagId("");
  };

  // ── Bulk Tag Remove ──
  const handleBulkRemoveTag = async () => {
    if (!bulkTagId || selectedIds.size === 0) return;
    let count = 0;
    for (const leadId of selectedIds) {
      removeTag.mutate({ leadId, tagId: bulkTagId });
      count++;
    }
    toast.success(`Tag removida de ${count} lead(s)`);
    setShowBulkUntag(false);
    setBulkTagId("");
  };

  // ── Scoring overview ──
  const scoringData = useMemo(() => {
    const hot = leads.filter((l: any) => {
      const tags = getLeadTags(l).length;
      const purchases = getLeadPurchaseCount(l);
      return tags >= 3 || purchases >= 2;
    });
    const warm = leads.filter((l: any) => {
      const tags = getLeadTags(l).length;
      const purchases = getLeadPurchaseCount(l);
      const fields = getLeadCustomFields(l);
      return !hot.includes(l) && (tags >= 1 || purchases >= 1 || fields >= 3);
    });
    const cold = leads.filter(l => !hot.includes(l) && !warm.includes(l));
    return { hot, warm, cold };
  }, [leads]);

  // ── Overview metrics ──
  const overviewMetrics = useMemo(() => {
    const total = leads.length;
    const withEmail = leads.filter((l: any) => l.email).length;
    const withPhone = leads.filter((l: any) => l.phone).length;
    const withTags = leads.filter((l: any) => (l.lead_tag_assignments || []).length > 0).length;
    const withPurchases = leads.filter((l: any) => (l.lead_purchases || []).length > 0).length;
    const today = new Date();
    const last7 = leads.filter((l: any) => {
      const d = new Date(l.created_at);
      return (today.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const last30 = leads.filter((l: any) => {
      const d = new Date(l.created_at);
      return (today.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, withEmail, withPhone, withTags, withPurchases, last7, last30 };
  }, [leads]);

  const handleAction = (action: string) => {
    switch (action) {
      case "add": onCreateLead?.(); break;
      case "remove":
        if (selectionMode && selectedIds.size > 0) { handleBulkDelete(); }
        else { setSelectionMode(true); toast.info("Selecione os leads e clique em 'Exclusão em lote' novamente."); }
        break;
      case "import": setShowImport(true); break;
      case "export": handleExport(); break;
      case "add_tags_bulk":
        if (!selectionMode || selectedIds.size === 0) { setSelectionMode(true); toast.info("Selecione leads primeiro, depois clique em 'Etiquetar em massa'."); }
        else { setBulkTagId(""); setShowBulkTag(true); }
        break;
      case "remove_tags_bulk":
        if (!selectionMode || selectedIds.size === 0) { setSelectionMode(true); toast.info("Selecione leads primeiro, depois clique em 'Desetiquetar em massa'."); }
        else { setBulkTagId(""); setShowBulkUntag(true); }
        break;
      case "temperature": setShowScoring(true); break;
      case "select":
        setSelectionMode(!selectionMode);
        if (selectionMode) setSelectedIds(new Set());
        break;
      case "report": setShowOverview(true); break;
      case "restore": setShowRestore(true); break;
    }
  };

  const sidebarActions = [
    { icon: CirclePlus, label: "Novo lead", description: "Cadastre um novo contato manualmente.", action: "add" },
    { icon: Eraser, label: "Exclusão em lote", description: "Selecione e remova múltiplos leads.", action: "remove" },
    { icon: ArrowDownToLine, label: "Importar contatos", description: "Traga leads de planilhas ou outras fontes.", action: "import" },
    { icon: ArrowUpFromLine, label: "Exportar contatos", description: "Baixe a lista de leads em .CSV.", action: "export" },
    { icon: Bookmark, label: "Etiquetar em massa", description: "Atribua tags a vários leads de uma vez.", action: "add_tags_bulk" },
    { icon: BookmarkMinus, label: "Desetiquetar em massa", description: "Remova tags de múltiplos leads.", action: "remove_tags_bulk" },
    { icon: Gauge, label: "Pontuação de engajamento", description: "Classifique leads por nível de interesse.", action: "temperature" },
    { icon: MousePointerClick, label: "Modo seleção", description: "Ative para operar em múltiplos leads.", action: "select" },
    { icon: BarChart2, label: "Visão geral de leads", description: "Métricas e resumo dos seus contatos.", action: "report" },
    { icon: History, label: "Recuperar leads", description: "Restaure leads excluídos nos últimos 90 dias.", action: "restore" },
  ];

  return (
    <div className="flex gap-4">
      {/* Main leads list */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" /> Filtro avançado
          </Button>
          <span className="text-xs text-muted-foreground">{filtered.length} lead(s)</span>
        </div>

        {selectionMode && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/20 px-3 py-2 rounded-lg">
            <MousePointerClick className="h-3.5 w-3.5" />
            Modo seleção ativo — {selectedIds.size} selecionado(s)
            <Button size="sm" variant="ghost" className="text-xs h-6 ml-1" onClick={() => {
              if (selectedIds.size === filtered.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(filtered.map((l: any) => l.id)));
            }}>
              {selectedIds.size === filtered.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs ml-auto h-6" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}>
              Cancelar
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {paged.map((lead: any) => {
            const leadTags = getLeadTags(lead);
            const purchases = getLeadPurchaseCount(lead);
            const customFields = getLeadCustomFields(lead);
            const tracking = getLeadTrackingCount(lead);
            const isSelected = selectedIds.has(lead.id);
            return (
              <div
                key={lead.id}
                onClick={(e) => selectionMode ? toggleSelection(lead.id, e) : onSelectLead(lead)}
                className={cn(
                  "flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3 rounded-xl bg-card border transition-all cursor-pointer group",
                  isSelected ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-accent/20"
                )}
              >
                {selectionMode && (
                  <div className="shrink-0 mt-0.5 sm:mt-0" onClick={e => { e.stopPropagation(); toggleSelection(lead.id, e); }}>
                    <Checkbox checked={isSelected} />
                  </div>
                )}
                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0", isSelected ? "bg-primary/20" : "bg-muted/60")}>
                  <User className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                    <span className="font-medium truncate max-w-[160px] sm:max-w-none">{lead.name}</span>
                    {lead.email && (<><span className="text-muted-foreground hidden sm:inline">·</span><span className="text-muted-foreground text-xs truncate max-w-[140px] sm:max-w-none">{maskEmail(lead.email)}</span></>)}
                    {lead.phone && (<><span className="text-muted-foreground hidden sm:inline">·</span><span className="text-muted-foreground text-xs">{maskPhone(lead.phone)}</span></>)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                    <span>Criado: há {timeAgo(lead.created_at)}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>Atualizado: há {timeAgo(lead.updated_at || lead.created_at)}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {purchases > 0 && (
                    <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-0.5"><ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">{purchases}</span></div></TooltipTrigger><TooltipContent className="text-xs">{purchases} compra(s)</TooltipContent></Tooltip>
                  )}
                  {customFields > 0 && (
                    <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-0.5"><Fingerprint className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">{customFields}</span></div></TooltipTrigger><TooltipContent className="text-xs">{customFields} campo(s) preenchido(s)</TooltipContent></Tooltip>
                  )}
                  {leadTags.length > 0 && (
                    <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-0.5"><Tag className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">{leadTags.length}</span></div></TooltipTrigger><TooltipContent className="text-xs">{leadTags.map((t: any) => t.name).join(", ")}</TooltipContent></Tooltip>
                  )}
                  {tracking > 0 && (
                    <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-0.5"><Crosshair className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">{tracking}</span></div></TooltipTrigger><TooltipContent className="text-xs">Rastreamento ativo</TooltipContent></Tooltip>
                  )}
                </div>
              </div>
            );
          })}
          {paged.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm rounded-xl bg-card border border-border/50">Nenhum lead encontrado.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs gap-1"><ChevronLeft className="h-3.5 w-3.5" /> Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-xs gap-1">Próxima <ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar actions */}
      <div className="hidden lg:block w-72 shrink-0 space-y-1">
        {sidebarActions.map((item) => (
          <button
            key={item.action}
            onClick={() => handleAction(item.action)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group hover:bg-accent/30 cursor-pointer"
          >
            <div className="shrink-0"><item.icon className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium leading-tight">{item.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Import CSV Dialog ── */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Importar Contatos</DialogTitle>
            <DialogDescription>Envie um arquivo CSV com colunas: nome, email, telefone</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
              <ArrowDownToLine className="h-4 w-4" /> Selecionar arquivo CSV
            </Button>
            {importData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{importData.length} registro(s) encontrado(s)</p>
                <div className="max-h-40 overflow-y-auto rounded-md border border-border p-2 text-xs space-y-1">
                  {importData.slice(0, 5).map((r, i) => (
                    <div key={i} className="text-muted-foreground">{r.nome || r.name || "?"} — {r.email || "sem email"}</div>
                  ))}
                  {importData.length > 5 && <div className="text-muted-foreground">... e mais {importData.length - 5}</div>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImport(false); setImportData([]); }}>Cancelar</Button>
            <Button disabled={importData.length === 0} onClick={processImport}>Importar {importData.length} lead(s)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Tag Add Dialog ── */}
      <Dialog open={showBulkTag} onOpenChange={setShowBulkTag}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bookmark className="h-4 w-4" /> Etiquetar em Massa</DialogTitle>
            <DialogDescription>Adicionar tag a {selectedIds.size} lead(s) selecionado(s)</DialogDescription>
          </DialogHeader>
          <Select value={bulkTagId} onValueChange={setBulkTagId}>
            <SelectTrigger><SelectValue placeholder="Selecionar tag..." /></SelectTrigger>
            <SelectContent>
              {tags.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                    {t.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkTag(false)}>Cancelar</Button>
            <Button disabled={!bulkTagId} onClick={handleBulkAddTag}>Aplicar Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Tag Remove Dialog ── */}
      <Dialog open={showBulkUntag} onOpenChange={setShowBulkUntag}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookmarkMinus className="h-4 w-4" /> Desetiquetar em Massa</DialogTitle>
            <DialogDescription>Remover tag de {selectedIds.size} lead(s) selecionado(s)</DialogDescription>
          </DialogHeader>
          <Select value={bulkTagId} onValueChange={setBulkTagId}>
            <SelectTrigger><SelectValue placeholder="Selecionar tag para remover..." /></SelectTrigger>
            <SelectContent>
              {tags.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                    {t.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUntag(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={!bulkTagId} onClick={handleBulkRemoveTag}>Remover Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Engagement Scoring Dialog ── */}
      <Dialog open={showScoring} onOpenChange={setShowScoring}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gauge className="h-4 w-4" /> Pontuação de Engajamento</DialogTitle>
            <DialogDescription>Classificação dos seus leads por nível de interesse</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
              <TrendingUp className="h-5 w-5 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-bold text-destructive">{scoringData.hot.length}</p>
              <p className="text-xs text-muted-foreground">Quentes 🔥</p>
              <p className="text-[10px] text-muted-foreground mt-1">3+ tags ou 2+ compras</p>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-center">
              <Activity className="h-5 w-5 text-warning mx-auto mb-1" />
              <p className="text-2xl font-bold text-warning">{scoringData.warm.length}</p>
              <p className="text-xs text-muted-foreground">Mornos</p>
              <p className="text-[10px] text-muted-foreground mt-1">Alguma atividade</p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{scoringData.cold.length}</p>
              <p className="text-xs text-muted-foreground">Frios</p>
              <p className="text-[10px] text-muted-foreground mt-1">Sem interação</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
              {leads.length > 0 && (
                <>
                  <div className="bg-red-500 h-full transition-all" style={{ width: `${(scoringData.hot.length / leads.length) * 100}%` }} />
                  <div className="bg-yellow-500 h-full transition-all" style={{ width: `${(scoringData.warm.length / leads.length) * 100}%` }} />
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${(scoringData.cold.length / leads.length) * 100}%` }} />
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Leads Overview Dialog ── */}
      <Dialog open={showOverview} onOpenChange={setShowOverview}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Visão Geral de Leads</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total de leads", value: overviewMetrics.total, icon: Users },
              { label: "Com e-mail", value: overviewMetrics.withEmail, icon: ArrowUpFromLine },
              { label: "Com telefone", value: overviewMetrics.withPhone, icon: ArrowDownToLine },
              { label: "Com tags", value: overviewMetrics.withTags, icon: Tag },
              { label: "Com compras", value: overviewMetrics.withPurchases, icon: ShoppingCart },
              { label: "Novos (7 dias)", value: overviewMetrics.last7, icon: TrendingUp },
              { label: "Novos (30 dias)", value: overviewMetrics.last30, icon: Activity },
            ].map(m => (
              <div key={m.label} className="rounded-lg border border-border/50 bg-card p-3 flex items-center gap-3">
                <m.icon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Restore Leads Dialog ── */}
      <Dialog open={showRestore} onOpenChange={setShowRestore}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Recuperar Leads</DialogTitle>
            <DialogDescription>Leads excluídos são removidos permanentemente do banco de dados.</DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <History className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Nenhum lead na lixeira.</p>
            <p className="text-xs text-muted-foreground mt-1">Leads excluídos são removidos permanentemente. Para proteção, utilize exportação CSV antes de excluir.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
