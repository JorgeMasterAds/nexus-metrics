import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const S = supabase as any;

function useUserId() {
  const { data } = useQuery({
    queryKey: ["hub-uid"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: 10 * 60_000,
  });
  return data;
}

export function useHubAgents() {
  const userId = useUserId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["hub-agents", userId],
    queryFn: async () => {
      const { data } = await S.from("hub_agents").select("*, hub_agent_settings(*)").eq("user_id", userId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const create = useMutation({
    mutationFn: async (input: {
      name: string; description?: string; mode?: string; avatar_emoji?: string;
      model_provider?: string; model_name?: string; temperature?: number; max_tokens?: number;
      system_prompt?: string; opening_statement?: string; memory_enabled?: boolean; memory_window?: number;
      rag_enabled?: boolean; rag_top_k?: number; rag_score_threshold?: number;
      knowledge_base_ids?: string[];
    }) => {
      const { name, description, mode, avatar_emoji, knowledge_base_ids, ...settings } = input;
      const { data: agent, error } = await S.from("hub_agents").insert({
        user_id: userId, name, description, mode: mode || "chat", avatar_emoji: avatar_emoji || "🤖",
      }).select().single();
      if (error) throw error;

      await S.from("hub_agent_settings").insert({ agent_id: agent.id, user_id: userId, ...settings });

      await S.from("hub_agent_workflows").insert({
        agent_id: agent.id, user_id: userId,
        graph: {
          nodes: [
            { id: "start", type: "start", position: { x: 100, y: 200 }, data: { label: "Início" } },
            { id: "llm", type: "llm", position: { x: 400, y: 200 }, data: { label: "LLM" } },
            { id: "answer", type: "answer", position: { x: 700, y: 200 }, data: { label: "Resposta" } },
          ],
          edges: [
            { id: "e1", source: "start", target: "llm" },
            { id: "e2", source: "llm", target: "answer" },
          ],
        },
      });

      if (knowledge_base_ids?.length) {
        await S.from("hub_agent_knowledge_bases").insert(
          knowledge_base_ids.map((kb_id: string) => ({ agent_id: agent.id, knowledge_base_id: kb_id, user_id: userId }))
        );
      }

      return agent;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hub-agents"] }); toast.success("Agente criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, settings, ...updates }: any) => {
      if (Object.keys(updates).length) {
        const { error } = await S.from("hub_agents").update(updates).eq("id", id);
        if (error) throw error;
      }
      if (settings) {
        const { error } = await S.from("hub_agent_settings").update(settings).eq("agent_id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hub-agents"] }); toast.success("Agente atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await S.from("hub_agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hub-agents"] }); toast.success("Agente removido!"); },
  });

  return { agents: query.data || [], isLoading: query.isLoading, create, update, remove, userId };
}

export function useHubAgent(id: string | undefined) {
  const userId = useUserId();
  return useQuery({
    queryKey: ["hub-agent", id],
    queryFn: async () => {
      const { data } = await S.from("hub_agents").select("*, hub_agent_settings(*), hub_agent_workflows(*), hub_agent_knowledge_bases(*, hub_knowledge_bases(*))").eq("id", id).single();
      return data;
    },
    enabled: !!id && !!userId,
  });
}

export function useHubKnowledgeBases() {
  const userId = useUserId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["hub-kb", userId],
    queryFn: async () => {
      const { data } = await S.from("hub_knowledge_bases").select("*, hub_knowledge_documents(count)").eq("user_id", userId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; description?: string; embedding_model?: string; chunk_size?: number; chunk_overlap?: number }) => {
      const { data, error } = await S.from("hub_knowledge_bases").insert({ user_id: userId, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hub-kb"] }); toast.success("Knowledge Base criada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await S.from("hub_knowledge_bases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hub-kb"] }); toast.success("Knowledge Base removida!"); },
  });

  return { knowledgeBases: query.data || [], isLoading: query.isLoading, create, remove, userId };
}

export function useHubConversations(filters?: { agentId?: string; channelType?: string }) {
  const userId = useUserId();
  return useQuery({
    queryKey: ["hub-conv", userId, filters],
    queryFn: async () => {
      let q = S.from("hub_conversations").select("*, hub_agents(name, avatar_emoji), hub_messages(content, role, created_at)").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50);
      if (filters?.agentId) q = q.eq("agent_id", filters.agentId);
      if (filters?.channelType) q = q.eq("channel_type", filters.channelType);
      const { data } = await q;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useHubChannels() {
  const userId = useUserId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["hub-channels", userId],
    queryFn: async () => {
      const { data } = await S.from("hub_channels").select("*, hub_agents(name, avatar_emoji)").eq("user_id", userId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const create = useMutation({
    mutationFn: async (input: { agent_id: string; channel_type: string; channel_name?: string; credentials?: any; settings?: any }) => {
      const { data, error } = await S.from("hub_channels").insert({ user_id: userId, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hub-channels"] }); toast.success("Canal conectado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { channels: query.data || [], isLoading: query.isLoading, create, userId };
}

export function useHubLogs(agentId?: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: ["hub-logs", userId, agentId],
    queryFn: async () => {
      let q = S.from("hub_agent_logs").select("*, hub_agents(name)").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
      if (agentId) q = q.eq("agent_id", agentId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useHubIntegrations() {
  const userId = useUserId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["hub-integrations", userId],
    queryFn: async () => {
      const { data } = await S.from("hub_user_integrations").select("*").eq("user_id", userId);
      return data || [];
    },
    enabled: !!userId,
  });

  const save = useMutation({
    mutationFn: async (input: { id?: string; service_type: string; service_name?: string; credentials?: any }) => {
      if (input.id) {
        const { error } = await S.from("hub_user_integrations").update({ credentials: input.credentials, service_name: input.service_name }).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await S.from("hub_user_integrations").insert({ user_id: userId, ...input });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hub-integrations"] }); toast.success("Integração salva!"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { integrations: query.data || [], isLoading: query.isLoading, save, userId };
}

export function useHubQuotas() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["hub-quotas", userId],
    queryFn: async () => {
      const { data } = await S.from("hub_user_quotas").select("*").eq("user_id", userId).maybeSingle();
      return data || { tokens_used: 0, tokens_limit: 100000, plan: "free" };
    },
    enabled: !!userId,
  });
}
