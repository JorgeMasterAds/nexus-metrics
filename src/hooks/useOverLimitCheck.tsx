import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useUsageLimits } from "@/hooks/useSubscription";

export interface OverLimitItem {
  label: string;
  current: number;
  max: number;
}

export function useOverLimitCheck() {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const { maxProjects, maxSmartlinks, maxWebhooks, maxAgents, maxLeads, maxSurveys } = useUsageLimits();

  const { data: counts, isLoading } = useQuery({
    queryKey: ["over-limit-counts", activeAccountId, activeProjectId],
    queryFn: async () => {
      const [projects, smartlinks, webhooks, agents, leads, surveys] = await Promise.all([
        (supabase as any).from("projects").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId).eq("is_active", true),
        (supabase as any).from("smartlinks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
        (supabase as any).from("webhooks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId).neq("platform", "form"),
        (supabase as any).from("ai_agents").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
        (supabase as any).from("leads").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
        (supabase as any).from("surveys").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
      ]);
      return {
        projects: projects.count ?? 0,
        smartlinks: smartlinks.count ?? 0,
        webhooks: webhooks.count ?? 0,
        agents: agents.count ?? 0,
        leads: leads.count ?? 0,
        surveys: surveys.count ?? 0,
      };
    },
    enabled: !!activeAccountId,
    refetchInterval: 60_000,
  });

  const overLimitItems: OverLimitItem[] = [];

  if (counts) {
    if (counts.projects > maxProjects) overLimitItems.push({ label: "Projetos", current: counts.projects, max: maxProjects });
    if (counts.smartlinks > maxSmartlinks) overLimitItems.push({ label: "Smart Links", current: counts.smartlinks, max: maxSmartlinks });
    if (counts.webhooks > maxWebhooks) overLimitItems.push({ label: "Webhooks", current: counts.webhooks, max: maxWebhooks });
    if (maxAgents > 0 && counts.agents > maxAgents) overLimitItems.push({ label: "Agentes IA", current: counts.agents, max: maxAgents });
    if (counts.leads > maxLeads) overLimitItems.push({ label: "Leads", current: counts.leads, max: maxLeads });
    if (counts.surveys > maxSurveys) overLimitItems.push({ label: "Pesquisas", current: counts.surveys, max: maxSurveys });
  }

  return {
    isOverLimit: overLimitItems.length > 0,
    overLimitItems,
    isLoading,
    counts,
  };
}
