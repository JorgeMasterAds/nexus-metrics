import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useUsageLimits } from "@/hooks/useSubscription";

export interface OverLimitItem {
  label: string;
  current: number;
  max: number;
}

export function useOverLimitCheck() {
  const { activeAccountId } = useAccount();
  const { maxProjects, maxSmartlinks, maxWebhooks } = useUsageLimits();

  const { data: counts, isLoading } = useQuery({
    queryKey: ["over-limit-counts", activeAccountId],
    queryFn: async () => {
      const [projects, smartlinks, webhooks] = await Promise.all([
        (supabase as any).from("projects").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId).eq("is_active", true),
        (supabase as any).from("smartlinks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId),
        (supabase as any).from("webhooks").select("id", { count: "exact", head: true }).eq("account_id", activeAccountId).neq("platform", "form"),
      ]);
      return {
        projects: projects.count ?? 0,
        smartlinks: smartlinks.count ?? 0,
        webhooks: webhooks.count ?? 0,
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
  }

  return {
    isOverLimit: overLimitItems.length > 0,
    overLimitItems,
    isLoading,
  };
}
