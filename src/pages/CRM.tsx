import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Trash2, LayoutGrid, List, Tag } from "lucide-react";
import { useCRM } from "@/hooks/useCRM";
import ListView from "@/components/crm/ListView";
import KanbanView from "@/components/crm/KanbanView";
import LeadDetailPanel from "@/components/crm/LeadDetailPanel";
import CreatePipelineModal from "@/components/crm/CreatePipelineModal";
import CreateLeadModal from "@/components/crm/CreateLeadModal";
import TagsManager from "@/components/crm/TagsManager";
import { cn } from "@/lib/utils";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useActiveProject } from "@/hooks/useActiveProject";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CRM() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") || "kanban";
  const isListView = tab === "leads";
  const isTagsView = tab === "tags";

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [deletingPipelineId, setDeletingPipelineId] = useState<string | null>(null);
  const [autoCreated, setAutoCreated] = useState(false);
  const { leads, pipelines, stages, isLoading, deletePipeline, createPipeline } = useCRM();
  const { activeProject } = useActiveProject();

  // Filter out test leads (those whose ALL purchases are from excluded conversions)
  const filteredLeads = useMemo(() => {
    try {
      const stored = localStorage.getItem("nexus_excluded_conversions");
      if (!stored) return leads;
      const excludedIds = new Set<string>(JSON.parse(stored));
      if (excludedIds.size === 0) return leads;

      return leads.filter((lead: any) => {
        const purchases = lead.lead_purchases || [];
        if (purchases.length === 0) return true; // no purchases = keep

        // Check if ALL purchases are excluded
        const allExcluded = purchases.every((p: any) => {
          const txId = p.conversions?.transaction_id;
          return txId && excludedIds.has(txId);
        });

        // Also check if lead name matches test pattern
        const isTestName = /teste|test/i.test(lead.name || "");

        return !(allExcluded && isTestName);
      });
    } catch {
      return leads;
    }
  }, [leads]);

  useEffect(() => {
    if (!activePipelineId && pipelines.length > 0 && !isListView && !isTagsView) {
      setActivePipelineId(pipelines[0].id);
    }
  }, [pipelines, activePipelineId, isListView, isTagsView]);

  useEffect(() => {
    if (!isLoading && pipelines.length === 0 && !isListView && !isTagsView && !autoCreated && activeProject) {
      setAutoCreated(true);
      createPipeline.mutate({ name: activeProject.name || "Pipeline Principal" });
    }
  }, [isLoading, pipelines.length, isListView, isTagsView, autoCreated, activeProject, createPipeline]);

  const pipelineStages = activePipelineId
    ? stages.filter((s: any) => s.pipeline_id === activePipelineId)
    : stages;

  const activePipeline = pipelines.find((p: any) => p.id === activePipelineId);

  const handleDeletePipeline = () => {
    if (!deletingPipelineId) return;
    deletePipeline.mutate(deletingPipelineId);
    if (activePipelineId === deletingPipelineId) setActivePipelineId(null);
    setDeletingPipelineId(null);
  };

  const titleContent = isTagsView ? "Tags" : isListView ? "Leads" : "CRM";

  return (
    <DashboardLayout
      title={titleContent as any}
      subtitle={isTagsView ? "Gerencie suas tags de leads." : isListView ? "Gerencie seus clientes em um só lugar." : "Gerencie seus Kanbans e funis de vendas"}
      actions={
        <div className="flex items-center gap-1.5 ml-auto">
          {!isListView && !isTagsView && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border hover:bg-accent transition-colors text-sm font-medium">
                  {activePipeline?.name || "Selecionar Kanban"}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-50 bg-popover border border-border shadow-lg">
                {pipelines.map((p: any) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => setActivePipelineId(p.id)}
                    className={cn("flex items-center justify-between cursor-pointer", activePipelineId === p.id && "bg-accent")}
                  >
                    <span>{p.name}</span>
                    {pipelines.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); setDeletingPipelineId(p.id); }}
                        className="text-muted-foreground hover:text-destructive p-0.5">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowPipelineModal(true)} className="cursor-pointer">
                  <Plus className="h-3.5 w-3.5 mr-2" /> Novo Kanban
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="sm" variant={!isListView && !isTagsView ? "default" : "outline"} onClick={() => navigate("/crm?tab=kanban")} className="gap-1.5 text-xs h-8">
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </Button>
          <Button size="sm" variant={isListView ? "default" : "outline"} onClick={() => navigate("/crm?tab=leads")} className="gap-1.5 text-xs h-8">
            <List className="h-3.5 w-3.5" /> Lista
          </Button>
          <Button size="sm" variant={isTagsView ? "default" : "outline"} onClick={() => navigate("/crm?tab=tags")} className="gap-1.5 text-xs h-8">
            <Tag className="h-3.5 w-3.5" /> Tags
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : isTagsView ? (
        <TagsManager />
      ) : isListView ? (
        <ListView leads={filteredLeads} onSelectLead={setSelectedLead} onCreateLead={() => setShowCreateLead(true)} />
      ) : (
        <KanbanView onSelectLead={setSelectedLead} pipelineId={activePipelineId} stages={pipelineStages} />
      )}

      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      <CreatePipelineModal open={showPipelineModal} onOpenChange={setShowPipelineModal} />
      <CreateLeadModal open={showCreateLead} onOpenChange={setShowCreateLead} />

      <AlertDialog open={!!deletingPipelineId} onOpenChange={(o) => !o && setDeletingPipelineId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pipeline?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todas as etapas deste pipeline serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePipeline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
