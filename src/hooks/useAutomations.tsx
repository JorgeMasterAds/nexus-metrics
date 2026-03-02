import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "@/hooks/use-toast";

export interface Automation {
  id: string;
  account_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  flow_nodes: any[];
  flow_connections: any[];
  trigger_type: string;
  trigger_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useAutomations() {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const qc = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("automations")
        .select("*")
        .eq("account_id", activeAccountId)
        .eq("project_id", activeProjectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Automation[];
    },
    enabled: !!activeAccountId && !!activeProjectId,
  });

  const createAutomation = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const startNode = { id: "start-1", type: "start", x: 100, y: 200, config: {} };
      const { data, error } = await (supabase as any)
        .from("automations")
        .insert({
          account_id: activeAccountId,
          project_id: activeProjectId,
          name: input.name,
          description: input.description || null,
          flow_nodes: [startNode],
          flow_connections: [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as Automation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast({ title: "Automação criada" });
    },
  });

  const updateAutomation = useMutation({
    mutationFn: async (input: Partial<Automation> & { id: string }) => {
      const { id, ...rest } = input;
      const { error } = await (supabase as any)
        .from("automations")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("automations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast({ title: "Automação excluída" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("automations")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  return { automations, isLoading, createAutomation, updateAutomation, deleteAutomation, toggleActive };
}
