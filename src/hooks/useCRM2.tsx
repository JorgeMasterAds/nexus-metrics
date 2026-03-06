import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "sonner";

const S = supabase as any;

export function useCRM2() {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const qc = useQueryClient();

  const scoringRulesQuery = useQuery({
    queryKey: ["crm2-scoring-rules", activeAccountId],
    queryFn: async () => {
      const { data } = await S.from("crm2_scoring_rules").select("*").eq("account_id", activeAccountId).order("created_at");
      if (!data || data.length === 0) {
        await S.rpc("crm2_seed_default_scoring_rules", { p_account_id: activeAccountId });
        const { data: seeded } = await S.from("crm2_scoring_rules").select("*").eq("account_id", activeAccountId).order("created_at");
        return seeded || [];
      }
      return data;
    },
    enabled: !!activeAccountId,
  });

  const leadStatusesQuery = useQuery({
    queryKey: ["crm2-lead-statuses", activeAccountId],
    queryFn: async () => {
      const { data } = await S.from("crm2_lead_statuses").select("*").eq("account_id", activeAccountId).order("position");
      if (!data || data.length === 0) {
        await S.rpc("crm2_seed_default_statuses", { p_account_id: activeAccountId });
        const { data: seeded } = await S.from("crm2_lead_statuses").select("*").eq("account_id", activeAccountId).order("position");
        return seeded || [];
      }
      return data;
    },
    enabled: !!activeAccountId,
  });

  const dealStatusesQuery = useQuery({
    queryKey: ["crm2-deal-statuses", activeAccountId],
    queryFn: async () => {
      const { data } = await S.from("crm2_deal_statuses").select("*").eq("account_id", activeAccountId).order("position");
      if (!data || data.length === 0) {
        await S.rpc("crm2_seed_default_statuses", { p_account_id: activeAccountId });
        const { data: seeded } = await S.from("crm2_deal_statuses").select("*").eq("account_id", activeAccountId).order("position");
        return seeded || [];
      }
      return data;
    },
    enabled: !!activeAccountId,
  });

  const leadsQuery = useQuery({
    queryKey: ["crm2-leads", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await S.from("crm2_leads").select("*, crm2_lead_statuses(id,name,type,color)")
        .eq("account_id", activeAccountId).eq("project_id", activeProjectId)
        .order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!activeAccountId && !!activeProjectId,
    staleTime: 30000,
  });

  const dealsQuery = useQuery({
    queryKey: ["crm2-deals", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await S.from("crm2_deals")
        .select("*, crm2_deal_statuses(id,name,type,color,probability), crm2_organizations(id,name)")
        .eq("account_id", activeAccountId).eq("project_id", activeProjectId)
        .order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!activeAccountId && !!activeProjectId,
    staleTime: 30000,
  });

  const contactsQuery = useQuery({
    queryKey: ["crm2-contacts", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await S.from("crm2_contacts").select("*, crm2_organizations(id,name)")
        .eq("account_id", activeAccountId).eq("project_id", activeProjectId)
        .order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!activeAccountId && !!activeProjectId,
  });

  const organizationsQuery = useQuery({
    queryKey: ["crm2-organizations", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await S.from("crm2_organizations").select("*")
        .eq("account_id", activeAccountId).eq("project_id", activeProjectId)
        .order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!activeAccountId && !!activeProjectId,
  });

  const tasksQuery = useQuery({
    queryKey: ["crm2-tasks", activeAccountId],
    queryFn: async () => {
      const { data } = await S.from("crm2_tasks").select("*")
        .eq("account_id", activeAccountId).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  // Mutations
  const createLead = useMutation({
    mutationFn: async (lead: { first_name?: string; last_name?: string; email?: string; phone?: string; organization?: string; source?: string; status_id?: string; job_title?: string; website?: string; industry?: string; territory?: string }) => {
      const defaultStatus = leadStatusesQuery.data?.find((s: any) => s.type === "Open");
      const { data: inserted, error } = await S.from("crm2_leads").insert({
        account_id: activeAccountId, project_id: activeProjectId,
        status_id: lead.status_id || defaultStatus?.id, created_by: (await supabase.auth.getUser()).data.user?.id,
        ...lead,
      }).select("id").single();
      if (error) throw error;
      // Auto-calculate score
      if (inserted?.id) {
        await S.rpc("crm2_calculate_lead_score", { p_lead_id: inserted.id, p_account_id: activeAccountId });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-leads"] }); toast.success("Lead criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [k: string]: any }) => {
      const { error } = await S.from("crm2_leads").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      // Recalculate score on update
      await S.rpc("crm2_calculate_lead_score", { p_lead_id: id, p_account_id: activeAccountId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm2-leads"] }),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await S.from("crm2_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-leads"] }); toast.success("Lead removido!"); },
  });

  const convertLeadToDeal = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await S.rpc("crm2_convert_lead_to_deal", {
        p_lead_id: leadId, p_account_id: activeAccountId, p_project_id: activeProjectId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm2-leads"] });
      qc.invalidateQueries({ queryKey: ["crm2-deals"] });
      qc.invalidateQueries({ queryKey: ["crm2-contacts"] });
      qc.invalidateQueries({ queryKey: ["crm2-organizations"] });
      toast.success("Lead convertido em Deal!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createDeal = useMutation({
    mutationFn: async (deal: { title?: string; deal_value?: number; status_id?: string; organization_id?: string; source?: string }) => {
      const defaultStatus = dealStatusesQuery.data?.find((s: any) => s.type === "Open");
      const { error } = await S.from("crm2_deals").insert({
        account_id: activeAccountId, project_id: activeProjectId,
        status_id: deal.status_id || defaultStatus?.id, created_by: (await supabase.auth.getUser()).data.user?.id,
        ...deal,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-deals"] }); toast.success("Deal criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [k: string]: any }) => {
      const { error } = await S.from("crm2_deals").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm2-deals"] }),
  });

  const createContact = useMutation({
    mutationFn: async (c: { first_name: string; last_name?: string; email?: string; phone?: string; job_title?: string; organization_id?: string }) => {
      const { error } = await S.from("crm2_contacts").insert({
        account_id: activeAccountId, project_id: activeProjectId,
        created_by: (await supabase.auth.getUser()).data.user?.id, ...c,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-contacts"] }); toast.success("Contato criado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const createOrganization = useMutation({
    mutationFn: async (o: { name: string; website?: string; industry?: string }) => {
      const { error } = await S.from("crm2_organizations").insert({
        account_id: activeAccountId, project_id: activeProjectId,
        created_by: (await supabase.auth.getUser()).data.user?.id, ...o,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-organizations"] }); toast.success("Empresa criada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const createTask = useMutation({
    mutationFn: async (t: { title: string; description?: string; priority?: string; due_date?: string; reference_type?: string; reference_id?: string }) => {
      const { error } = await S.from("crm2_tasks").insert({
        account_id: activeAccountId,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        assigned_to: (await supabase.auth.getUser()).data.user?.id, ...t,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-tasks"] }); toast.success("Tarefa criada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [k: string]: any }) => {
      const { error } = await S.from("crm2_tasks").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm2-tasks"] }),
  });

  const addNote = useMutation({
    mutationFn: async (n: { title?: string; content: string; reference_type: string; reference_id: string }) => {
      const { error } = await S.from("crm2_notes").insert({
        account_id: activeAccountId,
        created_by: (await supabase.auth.getUser()).data.user?.id, ...n,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-notes"] }); toast.success("Nota salva!"); },
  });

  // Mutations for settings
  const createLeadStatus = useMutation({
    mutationFn: async (s: { name: string; type: string; color: string }) => {
      const maxPos = Math.max(0, ...(leadStatusesQuery.data || []).map((x: any) => x.position));
      const { error } = await S.from("crm2_lead_statuses").insert({ account_id: activeAccountId, position: maxPos + 1, ...s });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-lead-statuses"] }); toast.success("Status criado!"); },
  });

  const createDealStatus = useMutation({
    mutationFn: async (s: { name: string; type: string; color: string; probability?: number }) => {
      const maxPos = Math.max(0, ...(dealStatusesQuery.data || []).map((x: any) => x.position));
      const { error } = await S.from("crm2_deal_statuses").insert({ account_id: activeAccountId, position: maxPos + 1, ...s });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-deal-statuses"] }); toast.success("Status criado!"); },
  });

  const deleteLeadStatus = useMutation({
    mutationFn: async (id: string) => { const { error } = await S.from("crm2_lead_statuses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm2-lead-statuses"] }),
  });

  const deleteDealStatus = useMutation({
    mutationFn: async (id: string) => { const { error } = await S.from("crm2_deal_statuses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm2-deal-statuses"] }),
  });

  // Scoring rules mutations
  const createScoringRule = useMutation({
    mutationFn: async (r: { field: string; condition: string; value?: string; points: number }) => {
      const { error } = await S.from("crm2_scoring_rules").insert({ account_id: activeAccountId, ...r });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-scoring-rules"] }); toast.success("Regra criada!"); },
  });

  const updateScoringRule = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [k: string]: any }) => {
      const { error } = await S.from("crm2_scoring_rules").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm2-scoring-rules"] }),
  });

  const deleteScoringRule = useMutation({
    mutationFn: async (id: string) => { const { error } = await S.from("crm2_scoring_rules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-scoring-rules"] }); toast.success("Regra removida!"); },
  });

  const recalculateScores = useMutation({
    mutationFn: async () => {
      const { error } = await S.rpc("crm2_recalculate_all_scores", { p_account_id: activeAccountId });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm2-leads"] }); toast.success("Scores recalculados!"); },
  });

  return {
    leads: leadsQuery.data || [],
    deals: dealsQuery.data || [],
    contacts: contactsQuery.data || [],
    organizations: organizationsQuery.data || [],
    tasks: tasksQuery.data || [],
    leadStatuses: leadStatusesQuery.data || [],
    dealStatuses: dealStatusesQuery.data || [],
    scoringRules: scoringRulesQuery.data || [],
    isLoading: leadsQuery.isLoading || dealStatusesQuery.isLoading,
    createLead, updateLead, deleteLead, convertLeadToDeal,
    createDeal, updateDeal,
    createContact, createOrganization,
    createTask, updateTask,
    addNote,
    createLeadStatus, createDealStatus, deleteLeadStatus, deleteDealStatus,
    createScoringRule, updateScoringRule, deleteScoringRule, recalculateScores,
  };
}

export function useCRM2Activities(refType: string | null, refId: string | null) {
  const { activeAccountId } = useAccount();
  return useQuery({
    queryKey: ["crm2-activities", refType, refId],
    queryFn: async () => {
      const { data } = await S.from("crm2_activities").select("*")
        .eq("account_id", activeAccountId).eq("reference_type", refType).eq("reference_id", refId)
        .order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!activeAccountId && !!refType && !!refId,
  });
}

export function useCRM2Notes(refType: string | null, refId: string | null) {
  const { activeAccountId } = useAccount();
  return useQuery({
    queryKey: ["crm2-notes", refType, refId],
    queryFn: async () => {
      const { data } = await S.from("crm2_notes").select("*")
        .eq("account_id", activeAccountId).eq("reference_type", refType).eq("reference_id", refId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!activeAccountId && !!refType && !!refId,
  });
}
