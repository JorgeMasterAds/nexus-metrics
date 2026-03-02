import { useState, useMemo } from "react";
import { 
  Search, ChevronLeft, ChevronRight, UserPlus, Trash2, Upload, Download, 
  Tags, TagIcon, Thermometer, CheckSquare, FileBarChart, RotateCcw, 
  Filter, User, ShoppingCart, KeyRound, Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAGE_SIZE = 20;

interface Props {
  leads: any[];
  onSelectLead: (lead: any) => void;
  onCreateLead?: () => void;
}

const sidebarActions = [
  { icon: UserPlus, label: "Adicionar lead", description: "Faça o cadastro de um novo lead.", action: "add" },
  { icon: Trash2, label: "Remover leads", description: "Exclua leads em massa", action: "remove", comingSoon: true },
  { icon: Upload, label: "Importações", description: "Visualize as suas importações de leads.", action: "import", comingSoon: true },
  { icon: Download, label: "Exportar leads", description: "Exporte seus leads para um arquivo .CSV", action: "export", comingSoon: true },
  { icon: Tags, label: "Adicionar tags em massa", description: "Adicione tags aos leads que quiser", action: "add_tags_bulk", comingSoon: true },
  { icon: TagIcon, label: "Remover tags em massa", description: "Retire as tags dos leads que quiser", action: "remove_tags_bulk", comingSoon: true },
  { icon: Thermometer, label: "Calcular temperatura por abertura de email", description: "Identifique leads quentes, mornos e frios", action: "temperature", comingSoon: true },
  { icon: CheckSquare, label: "Seleção de leads", description: "Selecione mais de um lead para configurar", action: "select", comingSoon: true },
  { icon: FileBarChart, label: "Relatório de leads", description: "Relatório sobre os dados dos leads", action: "report", comingSoon: true },
  { icon: RotateCcw, label: "Restaurar leads", description: "Recupera leads de no máx. últimos 90 dias", action: "restore", comingSoon: true },
];

export default function ListView({ leads, onSelectLead, onCreateLead }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

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
    return lead.total_value > 0 ? 1 : 0;
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

  const handleAction = (action: string) => {
    if (action === "add" && onCreateLead) {
      onCreateLead();
    }
  };

  return (
    <div className="flex gap-4">
      {/* Main leads list */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" /> Filtro avançado
          </Button>
        </div>

        <div className="space-y-2">
          {paged.map((lead: any) => {
            const leadTags = getLeadTags(lead);
            const purchases = getLeadPurchaseCount(lead);
            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-accent/20 transition-all cursor-pointer group"
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate">{lead.name}</span>
                    {lead.email && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-xs truncate">{maskEmail(lead.email)}</span>
                      </>
                    )}
                    {lead.phone && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-xs">{maskPhone(lead.phone)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>Criado: há {timeAgo(lead.created_at)}</span>
                    <span>·</span>
                    <span>Atualizado: há {timeAgo(lead.updated_at || lead.created_at)}</span>
                  </div>
                </div>

                {/* Badges (purchases, tags count, tag icon) */}
                <div className="flex items-center gap-1.5 shrink-0">
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
                      <TooltipContent className="text-xs">Compras</TooltipContent>
                    </Tooltip>
                  )}
                  {lead.source && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5">
                          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                            {lead.source?.length || 0}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Origem: {lead.source}</TooltipContent>
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
            onClick={() => !item.comingSoon && handleAction(item.action)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
              item.comingSoon
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-accent/30 cursor-pointer"
            )}
          >
            <div className="shrink-0">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium leading-tight">{item.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
