import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useUsageLimits } from "@/hooks/useSubscription";

export interface OverLimitItem {
  label: string;
  current: number;
  max: number;
}

const LIMIT_EMAIL_KEY = "nexus_limit_email_batch_sent";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getLastBatchSent(): number {
  try {
    return Number(localStorage.getItem(LIMIT_EMAIL_KEY) || "0");
  } catch { return 0; }
}

function markBatchSent() {
  localStorage.setItem(LIMIT_EMAIL_KEY, String(Date.now()));
}

function shouldSendBatchEmail(): boolean {
  const lastSent = getLastBatchSent();
  if (!lastSent) return true;
  return Date.now() - lastSent > SEVEN_DAYS_MS;
}

export function useOverLimitCheck() {
  const { activeAccountId } = useAccount();
  const { maxProjects, maxSmartlinks, maxWebhooks, maxAgents, maxLeads, maxSurveys } = useUsageLimits();
  const emailSentRef = useRef(false);

  // Check if current user is super_admin — skip all limit logic
  const { data: isSuperAdmin, isLoading: loadingSA } = useQuery({
    queryKey: ["overlimit-is-super-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
    staleTime: 10 * 60_000,
  });

  const { data: counts, isLoading } = useQuery({
    queryKey: ["over-limit-counts", activeAccountId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_usage_counts", {
        p_account_id: activeAccountId,
      });
      if (error) throw error;
      return data as {
        projects: number; smartlinks: number; webhooks: number;
        agents: number; leads: number; surveys: number;
      };
    },
    enabled: !!activeAccountId && !isSuperAdmin,
    refetchInterval: 300_000,
  });

  const overLimitItems: OverLimitItem[] = [];

  if (counts && !isSuperAdmin) {
    if (counts.projects > maxProjects) overLimitItems.push({ label: "Projetos", current: counts.projects, max: maxProjects });
    if (counts.smartlinks > maxSmartlinks) overLimitItems.push({ label: "Smart Links", current: counts.smartlinks, max: maxSmartlinks });
    if (counts.webhooks > maxWebhooks) overLimitItems.push({ label: "Webhooks", current: counts.webhooks, max: maxWebhooks });
    if (maxAgents > 0 && counts.agents > maxAgents) overLimitItems.push({ label: "Agentes IA", current: counts.agents, max: maxAgents });
    if (counts.leads > maxLeads) overLimitItems.push({ label: "Leads", current: counts.leads, max: maxLeads });
    if (counts.surveys > maxSurveys) overLimitItems.push({ label: "Pesquisas", current: counts.surveys, max: maxSurveys });
  }

  // Send ONE consolidated limit alert email (deduped, once per 7 days) — skip for super_admins
  useEffect(() => {
    if (isSuperAdmin) return;
    if (emailSentRef.current || overLimitItems.length === 0) return;
    if (!shouldSendBatchEmail()) return;
    emailSentRef.current = true;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "limit_alerts_batch",
            email: user.email,
            items: overLimitItems.map(i => ({
              label: i.label,
              current: i.current,
              max: i.max,
            })),
          },
        });
        markBatchSent();
      } catch (err) {
        console.error("Failed to send limit alert email:", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(overLimitItems), isSuperAdmin]);

  return {
    isOverLimit: overLimitItems.length > 0,
    overLimitItems,
    isLoading: isLoading || loadingSA,
    counts,
  };
}
