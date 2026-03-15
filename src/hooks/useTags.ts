import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { toast } from "sonner";

const S = supabase as any;

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  lead_count: number;
  webhook_count: number;
}

export function useTags() {
  const { activeAccountId } = useAccount();
  const qc = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags", activeAccountId],
    queryFn: async () => {
      const { data: tags, error } = await S
        .from("lead_tags")
        .select("*")
        .eq("account_id", activeAccountId)
        .order("name");
      if (error) throw error;

      // Get lead counts per tag
      const { data: assignments } = await S
        .from("lead_tag_assignments")
        .select("tag_id");

      // Get webhook tag counts
      const { data: webhookTags } = await S
        .from("webhook_tags")
        .select("tag_id");

      const leadCounts: Record<string, number> = {};
      const webhookCounts: Record<string, number> = {};

      (assignments || []).forEach((a: any) => {
        leadCounts[a.tag_id] = (leadCounts[a.tag_id] || 0) + 1;
      });
      (webhookTags || []).forEach((w: any) => {
        webhookCounts[w.tag_id] = (webhookCounts[w.tag_id] || 0) + 1;
      });

      return (tags || []).map((t: any) => ({
        ...t,
        lead_count: leadCounts[t.id] || 0,
        webhook_count: webhookCounts[t.id] || 0,
      })) as Tag[];
    },
    enabled: !!activeAccountId,
  });

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const normalized = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { data, error } = await S
        .from("lead_tags")
        .insert({ account_id: activeAccountId, name: normalized, color })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag criada com sucesso");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar tag"),
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const normalized = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { error } = await S
        .from("lead_tags")
        .update({ name: normalized, color })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag atualizada");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar tag"),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await S.from("lead_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag removida");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover tag"),
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    createTag,
    updateTag,
    deleteTag,
  };
}
