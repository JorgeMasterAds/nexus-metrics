import { useState, useCallback } from "react";
import { Plus, MoreHorizontal, Trash2, Edit2, GripVertical, UserPlus, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const STAGE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"];

interface Props {
  crm: any;
  onSelectLead: (lead: any) => void;
}

function InlineLeadForm({ statusId, crm, onClose }: { statusId: string; crm: any; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    const [first, ...rest] = name.trim().split(" ");
    crm.createLead.mutate({ first_name: first, last_name: rest.join(" "), email: email.trim() || undefined, status_id: statusId });
    onClose();
  };

  return (
    <div className="p-3 rounded-lg border border-primary/30 bg-card space-y-2">
      <Input placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onClose()} autoFocus className="text-xs h-8" />
      <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} className="text-xs h-8" />
      <div className="flex gap-1.5">
        <Button size="sm" onClick={handleSubmit} className="text-xs h-7 flex-1">Criar</Button>
        <Button size="sm" variant="outline" onClick={onClose} className="text-xs h-7">Cancelar</Button>
      </div>
    </div>
  );
}

function KanbanColumn({ status, leads, crm, onSelectLead, onDropLead }: {
  status: any; leads: any[]; crm: any; onSelectLead: (l: any) => void;
  onDropLead: (leadId: string, statusId: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(status.name);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [isLeadDragOver, setIsLeadDragOver] = useState(false);
  const [deletingStage, setDeletingStage] = useState(false);

  return (
    <div
      className={cn(
        "flex-shrink-0 w-[280px] rounded-xl border flex flex-col max-h-[calc(100vh-260px)] transition-all kanban-column",
        isLeadDragOver ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-border/30"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsLeadDragOver(true); }}
      onDragLeave={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) setIsLeadDragOver(false);
      }}
      onDrop={(e) => { e.preventDefault(); setIsLeadDragOver(false); const id = e.dataTransfer.getData("text/lead-id"); if (id) onDropLead(id, status.id); }}
    >
      <div className="p-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
          {editingName ? (
            <Input value={newName} onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { /* would need updateLeadStatus */ setEditingName(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
              className="h-6 text-xs w-24" autoFocus />
          ) : (
            <span className="text-sm font-medium text-foreground">{status.name}</span>
          )}
          <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{leads.length}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50">
            <DropdownMenuItem onClick={() => setEditingName(true)}>
              <Edit2 className="h-3.5 w-3.5 mr-2" /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeletingStage(true)} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        {leads.map((lead) => (
          <div key={lead.id} onClick={() => onSelectLead(lead)}
            className="p-3 rounded-lg border border-border/60 cursor-pointer hover:border-primary/40 transition-all shadow-sm kanban-card"
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("text/lead-id", lead.id); e.dataTransfer.effectAllowed = "move"; e.stopPropagation(); }}
          >
            {lead.source && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/50 text-muted-foreground mb-1.5 inline-block">{lead.source}</span>
            )}
            <p className="text-sm font-medium text-foreground">{lead.first_name} {lead.last_name}</p>
            {lead.organization && <p className="text-xs text-muted-foreground mt-0.5">{lead.organization}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5",
                (lead.score || 0) >= 70 ? "bg-red-500/20 text-red-400" :
                (lead.score || 0) >= 40 ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
              )}>
                <Flame className="h-2.5 w-2.5" />{lead.score || 0}
              </span>
              <span className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-border/30">
        {showInlineCreate ? (
          <InlineLeadForm statusId={status.id} crm={crm} onClose={() => setShowInlineCreate(false)} />
        ) : (
          <button onClick={() => setShowInlineCreate(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-border/50 hover:border-primary/30 transition-all">
            <UserPlus className="h-3.5 w-3.5" /> Criar lead
          </button>
        )}
      </div>

      <AlertDialog open={deletingStage} onOpenChange={setDeletingStage}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna "{status.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Os leads ficarão sem status definido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => crm.deleteLeadStatus.mutate(status.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CRM2LeadsKanban({ crm, onSelectLead }: Props) {
  const sortedStatuses = [...crm.leadStatuses].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

  const handleDropLead = useCallback((leadId: string, statusId: string) => {
    crm.updateLead.mutate({ id: leadId, status_id: statusId });
  }, [crm.updateLead]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-260px)]">
      {sortedStatuses.map((status: any) => {
        const statusLeads = crm.leads.filter((l: any) => l.status_id === status.id);
        return (
          <KanbanColumn key={status.id} status={status} leads={statusLeads} crm={crm} onSelectLead={onSelectLead} onDropLead={handleDropLead} />
        );
      })}

      {/* Unassigned column */}
      {crm.leads.some((l: any) => !l.status_id) && (
        <div className="flex-shrink-0 w-[280px] bg-muted/10 rounded-xl border border-dashed border-border flex flex-col max-h-[calc(100vh-260px)]">
          <div className="p-3 border-b border-border/30">
            <span className="text-sm font-medium text-muted-foreground">Sem status</span>
            <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 ml-2">
              {crm.leads.filter((l: any) => !l.status_id).length}
            </span>
          </div>
          <div className="p-2 space-y-2 overflow-y-auto flex-1">
            {crm.leads.filter((l: any) => !l.status_id).map((lead: any) => (
              <div key={lead.id} onClick={() => onSelectLead(lead)}
                className="p-3 rounded-lg border border-border/60 cursor-pointer hover:border-primary/40 transition-all shadow-sm"
                draggable onDragStart={(e) => { e.dataTransfer.setData("text/lead-id", lead.id); e.dataTransfer.effectAllowed = "move"; }}>
                <p className="text-sm font-medium">{lead.first_name} {lead.last_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
