import { useState, useMemo, useCallback } from "react";
import { 
  Search, ChevronLeft, ChevronRight, CirclePlus, Eraser, ArrowDownToLine, ArrowUpFromLine,
  Bookmark, BookmarkMinus, Gauge, MousePointerClick, BarChart2, History,
  Filter, User, ShoppingCart, Fingerprint, Tag, Crosshair
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const { deleteLead, addTag, removeTag, tags } = useCRM();

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

  const getLeadPurchaseCount = (lead: any) => {
    return (lead.lead_purchases || []).length;
  };

  const getLeadCustomFields = (lead: any) => {
    let count = 0;
    if (lead.email) count++;
    if (lead.phone) count++;
    if (lead.source) count++;
    if (lead.notes) count++;
    return count;
  };

  const getLeadTrackingCount = (lead: any) => {
    const purchases = lead.lead_purchases || [];
    const withUtm = purchases.filter((p: any) => {
      const conv = p.conversions;
      return conv && (conv.utm_source || conv.utm_medium || conv.utm_campaign);
    });
    return withUtm.length;
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const masked = user.slice(0, 2) + "*".repeat(Math.max(user.length - 2, 3));
    return `${masked}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    if (phone.length <= 6) return phone;
    return phone.slice(0, phone.length - 6) + "******" + phone.slice(-1);
  };

  const timeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: false, locale: ptBR });
    } catch {
      return "";
    }
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
    const rows = filtered.map((l: any) => ({
      Nome: l.name,
      Email: l.email || "",
      Telefone: l.phone || "",
      Origem: l.source || "",
      "Valor Total": l.total_value || 0,
      Tags: getLeadTags(l).map((t: any) => t.name).join(", "),
      Criado: new Date(l.created_at).toLocaleDateString("pt-BR"),
    }));
    exportToCsv(rows, "leads");
    toast.success("Leads exportados!");
  }, [filtered]);

  const sidebarActions = [
    { icon: CirclePlus, label: "Novo lead", description: "Cadastre um novo contato manualmente.", action: "add", active: true },
    { icon: Eraser, label: "Exclusão em lote", description: "Selecione e remova múltiplos leads.", action: "remove", active: true },
    { icon: ArrowDownToLine, label: "Importar contatos", description: "Traga leads de planilhas ou outras fontes.", action: "import", comingSoon: true },
    { icon: ArrowUpFromLine, label: "Exportar contatos", description: "Baixe a lista de leads em .CSV.", action: "export", active: true },
    { icon: Bookmark, label: "Etiquetar em massa", description: "Atribua tags a vários leads de uma vez.", action: "add_tags_bulk", comingSoon: true },
    { icon: BookmarkMinus, label: "Desetiquetar em massa", description: "Remova tags de múltiplos leads.", action: "remove_tags_bulk", comingSoon: true },
    { icon: Gauge, label: "Pontuação de engajamento", description: "Classifique leads por nível de interesse.", action: "temperature", comingSoon: true },
    { icon: MousePointerClick, label: "Modo seleção", description: "Ative para operar em múltiplos leads.", action: "select", active: true },
    { icon: BarChart2, label: "Visão geral de leads", description: "Métricas e resumo dos seus contatos.", action: "report", comingSoon: true },
    { icon: History, label: "Recuperar leads", description: "Restaure leads excluídos nos últimos 90 dias.", action: "restore", comingSoon: true },
  ];

  const handleAction = (action: string) => {
    switch (action) {
      case "add": onCreateLead?.(); break;
      case "remove": 
        if (selectionMode && selectedIds.size > 0) {
          handleBulkDelete();
        } else {
          setSelectionMode(true);
          toast.info("Selecione os leads que deseja remover, depois clique em 'Exclusão em lote' novamente.");
        }
        break;
      case "export": handleExport(); break;
      case "select": 
        setSelectionMode(!selectionMode);
        if (selectionMode) setSelectedIds(new Set());
        break;
    }
  };

  return (
    <div className="flex gap-4">
      {/* Main leads list */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 text-sm" />
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
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/30 hover:bg-accent/20"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0",
                  isSelected ? "bg-primary/20" : "bg-muted/60"
                )}>
                  <User className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                </div>

                {/* Lead info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                    <span className="font-medium truncate max-w-[160px] sm:max-w-none">{lead.name}</span>
                    {lead.email && (
                      <>
                        <span className="text-muted-foreground hidden sm:inline">·</span>
                        <span className="text-muted-foreground text-xs truncate max-w-[140px] sm:max-w-none">{maskEmail(lead.email)}</span>
                      </>
                    )}
                    {lead.phone && (
                      <>
                        <span className="text-muted-foreground hidden sm:inline">·</span>
                        <span className="text-muted-foreground text-xs">{maskPhone(lead.phone)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                    <span>Criado: há {timeAgo(lead.created_at)}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>Atualizado: há {timeAgo(lead.updated_at || lead.created_at)}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {purchases > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5">
                          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                            {purchases}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">{purchases} compra(s)</TooltipContent>
                    </Tooltip>
                  )}
                  {customFields > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5">
                          <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                            {customFields}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">{customFields} campo(s) preenchido(s)</TooltipContent>
                    </Tooltip>
                  )}
                  {leadTags.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                            {leadTags.length}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        {leadTags.map((t: any) => t.name).join(", ")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {tracking > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5">
                          <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                            {tracking}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Rastreamento ativo</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
          {paged.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm rounded-xl bg-card border border-border/50">
              Nenhum lead encontrado.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs gap-1">
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-xs gap-1">
                Próxima <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar actions */}
      <div className="hidden lg:block w-72 shrink-0 space-y-1">
        {sidebarActions.map((item) => (
          <button
            key={item.action}
            onClick={() => item.active && handleAction(item.action)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
              item.comingSoon
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-accent/30 cursor-pointer"
            )}
          >
            <div className="shrink-0">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium leading-tight flex items-center gap-1.5">
                {item.label}
                {item.comingSoon && <span className="text-[9px] bg-muted/50 px-1 py-0.5 rounded text-muted-foreground">em breve</span>}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
