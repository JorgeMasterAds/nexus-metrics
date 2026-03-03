import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useToast } from "@/hooks/use-toast";
import ReportTemplateLowTicket from "./ReportTemplateLowTicket";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlanningTab {
  id: string;
  name: string;
  data: Record<string, any>;
  created_at: string;
}

export default function ReportTemplates() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tabs = [], isLoading } = useQuery({
    queryKey: ["planning-tabs", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      let query = (supabase as any)
        .from("planning_tabs")
        .select("id, name, data, created_at")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: true });
      if (activeProjectId) {
        query = query.eq("project_id", activeProjectId);
      }
      const { data } = await query;
      return (data || []) as PlanningTab[];
    },
    enabled: !!activeAccountId,
  });

  // Auto-select first tab
  useEffect(() => {
    if (tabs.length > 0 && (!activeTabId || !tabs.find(t => t.id === activeTabId))) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  const createTab = async (copyFrom?: PlanningTab) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || !activeAccountId) return;
    const name = copyFrom ? `${copyFrom.name} (cópia)` : "Novo Planejamento";
    const data = copyFrom ? copyFrom.data : {};
    const { data: row, error } = await (supabase as any)
      .from("planning_tabs")
      .insert({
        account_id: activeAccountId,
        project_id: activeProjectId || null,
        user_id: user.user.id,
        name,
        data,
      })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["planning-tabs"] });
    if (row) setActiveTabId(row.id);
    toast({ title: copyFrom ? "Cópia criada!" : "Aba criada!" });
  };

  const deleteTab = async () => {
    if (!deleteId) return;
    await (supabase as any).from("planning_tabs").delete().eq("id", deleteId);
    qc.invalidateQueries({ queryKey: ["planning-tabs"] });
    if (activeTabId === deleteId) setActiveTabId(null);
    setDeleteId(null);
    toast({ title: "Aba excluída" });
  };

  const renameTab = async (id: string) => {
    if (!nameInput.trim()) return;
    await (supabase as any).from("planning_tabs").update({ name: nameInput.trim(), updated_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["planning-tabs"] });
    setEditingName(null);
    toast({ title: "Nome atualizado" });
  };

  const saveTabData = async (id: string, data: Record<string, any>) => {
    await (supabase as any).from("planning_tabs").update({ data, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs bar */}
      <div className="flex items-center gap-1 border-b border-border/50 pb-0 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "group relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap",
              activeTabId === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
            onClick={() => setActiveTabId(tab.id)}
          >
            {editingName === tab.id ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="h-6 text-xs w-32"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") renameTab(tab.id); if (e.key === "Escape") setEditingName(null); }}
                />
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => renameTab(tab.id)}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => setEditingName(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <span>{tab.name}</span>
                <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <button
                    className="p-0.5 hover:text-primary"
                    title="Renomear"
                    onClick={e => { e.stopPropagation(); setEditingName(tab.id); setNameInput(tab.name); }}
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                  <button
                    className="p-0.5 hover:text-primary"
                    title="Duplicar"
                    onClick={e => { e.stopPropagation(); createTab(tab); }}
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </button>
                  {tabs.length > 1 && (
                    <button
                      className="p-0.5 hover:text-destructive"
                      title="Excluir"
                      onClick={e => { e.stopPropagation(); setDeleteId(tab.id); }}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 shrink-0"
          onClick={() => createTab()}
        >
          <Plus className="h-3.5 w-3.5" />
          Nova aba
        </Button>
      </div>

      {/* Content */}
      {activeTab ? (
        <ReportTemplateLowTicket
          key={activeTab.id}
          tabId={activeTab.id}
          initialData={activeTab.data}
          onSave={(data) => saveTabData(activeTab.id, data)}
        />
      ) : tabs.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-muted-foreground text-sm">Nenhum planejamento criado ainda.</p>
          <Button onClick={() => createTab()} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar primeiro planejamento
          </Button>
        </div>
      ) : null}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aba?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os dados desta aba serão perdidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTab}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
