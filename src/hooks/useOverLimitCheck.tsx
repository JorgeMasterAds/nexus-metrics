import { useEffect, useRef } from "react";
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

const LIMIT_EMAIL_KEY = "nexus_limit_email_sent";

function getLimitEmailSent(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LIMIT_EMAIL_KEY) || "{}");
  } catch { return {}; }
}

function markLimitEmailSent(resource: string) {
  const sent = getLimitEmailSent();
  sent[resource] = Date.now();
  localStorage.setItem(LIMIT_EMAIL_KEY, JSON.stringify(sent));
}

function shouldSendLimitEmail(resource: string): boolean {
  const sent = getLimitEmailSent();
  const lastSent = sent[resource];
  if (!lastSent) return true;
  // Only send once per 24h per resource
  return Date.now() - lastSent > 24 * 60 * 60 * 1000;
}

export function useOverLimitCheck() {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const { maxProjects, maxSmartlinks, maxWebhooks, maxAgents, maxLeads, maxSurveys } = useUsageLimits();
  const emailSentRef = useRef(false);

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

  // Send limit alert emails (deduped, once per 24h per resource)
  useEffect(() => {
    if (emailSentRef.current || overLimitItems.length === 0) return;
    emailSentRef.current = true;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        for (const item of overLimitItems) {
          if (shouldSendLimitEmail(item.label)) {
            await supabase.functions.invoke("send-notification-email", {
              body: {
                type: "limit_alert",
                email: user.email,
                resource_name: item.label,
                current: item.current,
                max: item.max,
              },
            });
            markLimitEmailSent(item.label);
          }
        }
      } catch (err) {
        console.error("Failed to send limit alert email:", err);
      }
    })();
  }, [overLimitItems.length]);

  return {
    isOverLimit: overLimitItems.length > 0,
    overLimitItems,
    isLoading,
    counts,
  };
}
