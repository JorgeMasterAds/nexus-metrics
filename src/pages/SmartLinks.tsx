import { useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Copy, ExternalLink, Download, AlertTriangle, Clock, Eraser, FlaskConical, EyeOff, HelpCircle, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import SmartLinkModal from "@/components/SmartLinkModal";
import DateFilter, { DateRange, getDefaultDateRange } from "@/components/DateFilter";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { exportToCsv } from "@/lib/csv";
import { useUsageLimits } from "@/hooks/useSubscription";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectRole } from "@/hooks/useProjectRole";

export default function SmartLinks() {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [editingLink, setEditingLink] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDomainWarning, setShowDomainWarning] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [slugValue, setSlugValue] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const { maxSmartlinks } = useUsageLimits();
  const { canCreate, canEdit, canDelete, isViewer, isMember } = useProjectRole();

  // Fetch active custom domain for this account
  // Fetch active custom domain for THIS PROJECT (never cross-project)
  const { data: customDomain } = useQuery({
    queryKey: ["active-custom-domain", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("custom_domains")
        .select("domain")
        .eq("account_id", activeAccountId)
        .eq("is_verified", true)
        .eq("is_active", true);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data } = await q.limit(1).maybeSingle();
      return data?.domain || null;
    },
    enabled: !!activeAccountId,
  });
  const sinceDate = dateRange.from.toISOString().split("T")[0];
  const untilDate = dateRange.to.toISOString().split("T")[0];

  // Period comparison
  const periodMs = dateRange.to.getTime() - dateRange.from.getTime();
  const periodDays = Math.max(1, Math.round(periodMs / 86400000));
  const prevUntil = new Date(dateRange.from.getTime() - 1);
  const prevSince = new Date(prevUntil.getTime() - periodMs);
  const prevSinceDate = prevSince.toISOString().split("T")[0];
  const prevUntilDate = prevUntil.toISOString().split("T")[0];
  const previousPeriodLabel = `${periodDays}d ant.`;

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };
  const fmtPct = (val: number) => {
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1).replace(".", ",")}%`;
  };
  const changeColor = (val: number) => val > 0 ? "text-success" : val < 0 ? "text-destructive" : "text-muted-foreground";

  const { data: smartLinks = [], isLoading } = useQuery({
    queryKey: ["smartlinks", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("smartlinks")
        .select("*, smartlink_variants(*)")
        .eq("account_id", activeAccountId)
        .order("created_at", { ascending: false });
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  const { data: totalSmartLinksCount = 0 } = useQuery({
    queryKey: ["smartlinks-total-count", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("smartlinks")
        .select("id", { count: "exact", head: true })
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!activeAccountId,
  });

  const atLimit = totalSmartLinksCount >= maxSmartlinks;

  // Use clicks table directly for views (same source as Dashboard for consistency)
  const { data: clicksData = [] } = useQuery({
    queryKey: ["sl-clicks", sinceDate, untilDate, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("clicks")
        .select("id, smartlink_id, variant_id")
        .gte("created_at", sinceDate + "T00:00:00")
        .lte("created_at", untilDate + "T23:59:59")
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data } = await q.limit(1000);
      return data || [];
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  const { data: prevClicksData = [] } = useQuery({
    queryKey: ["sl-clicks-prev", prevSinceDate, prevUntilDate, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("clicks")
        .select("id, smartlink_id, variant_id")
        .gte("created_at", prevSinceDate + "T00:00:00")
        .lte("created_at", prevUntilDate + "T23:59:59")
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data } = await q.limit(1000);
      return data || [];
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  // Conversions for sales/revenue
  const { data: conversionsData = [] } = useQuery({
    queryKey: ["sl-conversions", sinceDate, untilDate, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, smartlink_id, variant_id, amount, is_order_bump, product_name")
        .eq("status", "approved")
        .gte("created_at", sinceDate + "T00:00:00")
        .lte("created_at", untilDate + "T23:59:59")
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data } = await q.limit(1000);
      return data || [];
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  const { data: prevConversionsData = [] } = useQuery({
    queryKey: ["sl-conversions-prev", prevSinceDate, prevUntilDate, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, smartlink_id, variant_id, amount, is_order_bump")
        .eq("status", "approved")
        .gte("created_at", prevSinceDate + "T00:00:00")
        .lte("created_at", prevUntilDate + "T23:59:59")
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data } = await q.limit(1000);
      return data || [];
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  // Build variant adjustments map from smartlinks data
  const variantAdjustments = useMemo(() => {
    const map = new Map<string, number>();
    smartLinks.forEach((link: any) => {
      (link.smartlink_variants || []).forEach((v: any) => {
        map.set(v.id, Number(v.views_adjustment || 0));
      });
    });
    return map;
  }, [smartLinks]);

  const metricsMap = useMemo(() => {
    const byLink = new Map<string, { views: number; sales: number; revenue: number }>();
    const byVariant = new Map<string, { views: number; sales: number; revenue: number }>();

    // Count views from clicks
    clicksData.forEach((c: any) => {
      if (c.smartlink_id) {
        const entry = byLink.get(c.smartlink_id) || { views: 0, sales: 0, revenue: 0 };
        entry.views++;
        byLink.set(c.smartlink_id, entry);
      }
      if (c.variant_id) {
        const entry = byVariant.get(c.variant_id) || { views: 0, sales: 0, revenue: 0 };
        entry.views++;
        byVariant.set(c.variant_id, entry);
      }
    });

    // Add sales/revenue from conversions
    const productsByLink = new Map<string, Map<string, { vendas: number; receita: number }>>();
    const obByLink = new Map<string, { mainSales: number; obSales: number }>();
    const obByVariant = new Map<string, { mainSales: number; obSales: number }>();
    conversionsData.forEach((c: any) => {
      if (c.smartlink_id) {
        const entry = byLink.get(c.smartlink_id) || { views: 0, sales: 0, revenue: 0 };
        entry.sales++;
        entry.revenue += Number(c.amount);
        byLink.set(c.smartlink_id, entry);

        const name = c.product_name || "Produto desconhecido";
        if (!productsByLink.has(c.smartlink_id)) productsByLink.set(c.smartlink_id, new Map());
        const pMap = productsByLink.get(c.smartlink_id)!;
        const pe = pMap.get(name) || { vendas: 0, receita: 0 };
        pe.vendas++;
        pe.receita += Number(c.amount);
        pMap.set(name, pe);

        const ob = obByLink.get(c.smartlink_id) || { mainSales: 0, obSales: 0 };
        if (c.is_order_bump) ob.obSales++; else ob.mainSales++;
        obByLink.set(c.smartlink_id, ob);
      }
      if (c.variant_id) {
        const entry = byVariant.get(c.variant_id) || { views: 0, sales: 0, revenue: 0 };
        entry.sales++;
        entry.revenue += Number(c.amount);
        byVariant.set(c.variant_id, entry);

        const vob = obByVariant.get(c.variant_id) || { mainSales: 0, obSales: 0 };
        if (c.is_order_bump) vob.obSales++; else vob.mainSales++;
        obByVariant.set(c.variant_id, vob);
      }
    });

    // Apply views_adjustment to variants and recalculate link totals
    byVariant.forEach((entry, variantId) => {
      const adj = variantAdjustments.get(variantId) || 0;
      entry.views += adj;
    });
    // Recalculate link views as sum of variant views + non-variant clicks
    // First, calculate variant views per link
    smartLinks.forEach((link: any) => {
      const linkEntry = byLink.get(link.id);
      if (!linkEntry) return;
      let variantViewsTotal = 0;
      let realClicksForLink = 0;
      clicksData.forEach((c: any) => { if (c.smartlink_id === link.id) realClicksForLink++; });
      (link.smartlink_variants || []).forEach((v: any) => {
        const ve = byVariant.get(v.id);
        if (ve) variantViewsTotal += ve.views;
      });
      // If variants have adjustments, use the sum of variant views
      const totalAdj = (link.smartlink_variants || []).reduce((s: number, v: any) => s + Number(v.views_adjustment || 0), 0);
      if (totalAdj !== 0) {
        linkEntry.views = realClicksForLink + totalAdj;
      }
    });

    // Build prev metrics maps
    const prevByLink = new Map<string, { views: number; sales: number; revenue: number }>();
    const prevByVariant = new Map<string, { views: number; sales: number; revenue: number }>();
    prevClicksData.forEach((c: any) => {
      if (c.smartlink_id) {
        const entry = prevByLink.get(c.smartlink_id) || { views: 0, sales: 0, revenue: 0 };
        entry.views++;
        prevByLink.set(c.smartlink_id, entry);
      }
      if (c.variant_id) {
        const entry = prevByVariant.get(c.variant_id) || { views: 0, sales: 0, revenue: 0 };
        entry.views++;
        prevByVariant.set(c.variant_id, entry);
      }
    });
    prevConversionsData.forEach((c: any) => {
      if (c.smartlink_id) {
        const entry = prevByLink.get(c.smartlink_id) || { views: 0, sales: 0, revenue: 0 };
        entry.sales++;
        entry.revenue += Number(c.amount);
        prevByLink.set(c.smartlink_id, entry);
      }
      if (c.variant_id) {
        const entry = prevByVariant.get(c.variant_id) || { views: 0, sales: 0, revenue: 0 };
        entry.sales++;
        entry.revenue += Number(c.amount);
        prevByVariant.set(c.variant_id, entry);
      }
    });

    return { byLink, byVariant, productsByLink, obByLink, obByVariant, prevByLink, prevByVariant };
  }, [clicksData, conversionsData, prevClicksData, prevConversionsData, variantAdjustments, smartLinks]);

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("smartlinks").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smartlinks"] }),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("smartlinks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smartlinks"] });
      qc.invalidateQueries({ queryKey: ["smartlinks-total-count"] });
      toast({ title: "Smart Link excluído" });
    },
  });

  const requestDeletion = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await (supabase as any).from("deletion_requests").insert({
        account_id: activeAccountId,
        project_id: activeProjectId,
        requested_by: (await supabase.auth.getUser()).data.user?.id,
        resource_type: "smartlink",
        resource_id: id,
        resource_name: name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Solicitação enviada", description: "Um administrador do projeto precisa aprovar a exclusão." });
    },
  });

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleDelete = (link: any) => {
    if (canDelete) {
      setDeleteTarget(link);
      setDeleteConfirmName("");
    } else if (isMember) {
      if (confirm("Você não tem permissão para excluir diretamente. Deseja solicitar a exclusão para um administrador?")) {
        requestDeletion.mutate({ id: link.id, name: link.name });
      }
    }
  };

  const confirmDelete = () => {
    if (deleteTarget && deleteConfirmName === deleteTarget.name) {
      deleteLink.mutate(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConfirmName("");
    }
  };

  const updateSlug = useMutation({
    mutationFn: async ({ id, slug }: { id: string; slug: string }) => {
      const { error } = await (supabase as any).from("smartlinks").update({ slug }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smartlinks"] });
      setEditingSlug(null);
      toast({ title: "Slug atualizado!" });
    },
  });

  const toggleVariant = useMutation({
    mutationFn: async ({ id, is_active, smartLinkId }: { id: string; is_active: boolean; smartLinkId: string }) => {
      const { error } = await (supabase as any).from("smartlink_variants").update({ is_active }).eq("id", id);
      if (error) throw error;
      const { data: activeVariants } = await (supabase as any)
        .from("smartlink_variants")
        .select("id")
        .eq("smartlink_id", smartLinkId)
        .eq("is_active", true);
      if (activeVariants && activeVariants.length > 0) {
        const w = Math.floor(100 / activeVariants.length);
        const remainder = 100 - w * activeVariants.length;
        for (let i = 0; i < activeVariants.length; i++) {
          await (supabase as any).from("smartlink_variants").update({ weight: w + (i === 0 ? remainder : 0) }).eq("id", activeVariants[i].id);
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smartlinks"] }),
  });

  // Edit variant views adjustment
  const [editingViewsVariant, setEditingViewsVariant] = useState<string | null>(null);
  const [editViewsValue, setEditViewsValue] = useState("");

  const updateVariantViews = useMutation({
    mutationFn: async ({ variantId, desiredViews, realViews }: { variantId: string; desiredViews: number; realViews: number }) => {
      const adjustment = desiredViews - realViews;
      const { error } = await (supabase as any).from("smartlink_variants").update({ views_adjustment: adjustment }).eq("id", variantId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smartlinks"] });
      setEditingViewsVariant(null);
      toast({ title: "Views atualizado!" });
    },
  });

  const clearViews = useMutation({
    mutationFn: async (smartlinkId: string) => {
      const { error } = await (supabase as any)
        .from("clicks")
        .delete()
        .eq("smartlink_id", smartlinkId)
        .eq("account_id", activeAccountId);
      if (error) throw error;
      const { error: dmError } = await (supabase as any)
        .from("daily_metrics")
        .delete()
        .eq("smartlink_id", smartlinkId)
        .eq("account_id", activeAccountId);
      if (dmError) throw dmError;
      // Also reset all variant adjustments
      const { data: variants } = await (supabase as any)
        .from("smartlink_variants")
        .select("id")
        .eq("smartlink_id", smartlinkId);
      if (variants) {
        for (const v of variants) {
          await (supabase as any).from("smartlink_variants").update({ views_adjustment: 0 }).eq("id", v.id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smartlinks"] });
      qc.invalidateQueries({ queryKey: ["sl-clicks"] });
      toast({ title: "Views zerados com sucesso" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao limpar views", description: err.message, variant: "destructive" });
    },
  });

  const [clearViewsTarget, setClearViewsTarget] = useState<any>(null);
  const [internalBrowser, setInternalBrowser] = useState(() => localStorage.getItem("nexus_internal_browser") === "true");

  const toggleInternalBrowser = () => {
    const next = !internalBrowser;
    setInternalBrowser(next);
    if (next) {
      localStorage.setItem("nexus_internal_browser", "true");
      toast({ title: "Modo interno ativado", description: "Seus acessos não serão contabilizados nos views." });
    } else {
      localStorage.removeItem("nexus_internal_browser");
      toast({ title: "Modo interno desativado", description: "Seus acessos voltarão a ser contabilizados." });
    }
  };

  const handleClearViews = (link: any) => {
    setClearViewsTarget(link);
  };

  const confirmClearViews = () => {
    if (clearViewsTarget) {
      clearViews.mutate(clearViewsTarget.id);
      setClearViewsTarget(null);
    }
  };

  const PLATFORM_SMARTLINK_DOMAIN = "smartlink.nexusmetrics.jmads.com.br";

  const getRedirectUrl = (slug: string) => {
    if (customDomain) {
      return `https://${customDomain}/${slug}`;
    }
    return `https://${PLATFORM_SMARTLINK_DOMAIN}/${slug}`;
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(getRedirectUrl(slug));
    toast({ title: "Link copiado!" });
  };

  const handleNewClick = () => {
    if (atLimit) {
      toast({ title: "Limite atingido", description: `Você atingiu o limite de ${maxSmartlinks} Smart Links na sua conta.`, variant: "destructive" });
      return;
    }
    if (!customDomain) {
      // Platform domain is always available, no warning needed
    }
    setEditingLink(null);
    setShowModal(true);
  };

  const proceedCreateSmartLink = () => {
    setShowDomainWarning(false);
    setEditingLink(null);
    setShowModal(true);
  };

  return (
    <DashboardLayout
      title="Smart Links"
      subtitle={`${totalSmartLinksCount}/${maxSmartlinks} Smart Links usados`}
      actions={
        <div className="flex items-center gap-2">
          <ProductTour {...TOURS.smartLinks} />
          <DateFilter value={dateRange} onChange={setDateRange} />
          {canCreate && (
            <Button
              size="sm"
              className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
              onClick={handleNewClick}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          )}
        </div>
      }
    >
      {showModal && (
        <SmartLinkModal
          link={editingLink}
          accountId={activeAccountId}
          projectId={activeProjectId}
          onClose={() => { setShowModal(false); setEditingLink(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["smartlinks"] }); qc.invalidateQueries({ queryKey: ["smartlinks-total-count"] }); }}
        />
      )}

      {/* Domain warning modal */}
      {showDomainWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-card border border-border/50 rounded-xl card-shadow p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <h3 className="text-base font-semibold">Domínio não configurado</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você ainda não configurou seu <strong>Domínio Personalizado</strong>. Isso é altamente recomendado para profissionalizar seus links e evitar exposição do domínio técnico.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={proceedCreateSmartLink}>
                Continuar mesmo assim
              </Button>
              <Button
                size="sm"
                className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
                onClick={() => { setShowDomainWarning(false); navigate("/resources"); }}
              >
                Ir para Recursos → Domínios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom domain is optional — platform domain is always available */}

      {atLimit && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mb-4 text-xs text-warning">
          Você atingiu o limite de {maxSmartlinks} Smart Links na sua conta.
        </div>
      )}

      {/* Ocultar IP toggle - prominent line */}
      <div className="flex items-center justify-between rounded-lg bg-card border border-border/50 card-shadow px-4 py-3 mb-4">
        <div className="flex items-center gap-2.5">
          <EyeOff className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-xs font-medium">{internalBrowser ? "IP oculto — seus acessos NÃO são contabilizados" : "Ocultar meu IP das métricas"}</span>
          </div>
          <UITooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              Quando ativado, seus cliques nos Smart Links não serão contabilizados como visualizações nas métricas. Útil para testar links sem inflar os números.
            </TooltipContent>
          </UITooltip>
        </div>
        <Switch
          checked={internalBrowser}
          onCheckedChange={toggleInternalBrowser}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : smartLinks.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">Nenhum Smart Link nesta conta.</p>
          <Button className="gradient-bg border-0 text-primary-foreground" onClick={handleNewClick}>
            <Plus className="h-4 w-4 mr-1" /> Criar primeiro Smart Link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {smartLinks.map((link: any) => {
            const isExpanded = !collapsedIds.has(link.id);
            const linkData = metricsMap.byLink.get(link.id) || { views: 0, sales: 0, revenue: 0 };
            const prevLinkData = metricsMap.prevByLink.get(link.id) || { views: 0, sales: 0, revenue: 0 };
            const obData = metricsMap.obByLink.get(link.id) || { mainSales: 0, obSales: 0 };
            const convRate = linkData.views > 0 ? ((linkData.sales / linkData.views) * 100).toFixed(2) : "0.00";
            const prevConvRate = prevLinkData.views > 0 ? ((prevLinkData.sales / prevLinkData.views) * 100) : 0;
            const ticket = linkData.sales > 0 ? (linkData.revenue / linkData.sales).toFixed(2) : "0.00";
            const prevTicket = prevLinkData.sales > 0 ? (prevLinkData.revenue / prevLinkData.sales) : 0;

            return (
              <div key={link.id} className="rounded-xl bg-card border border-border/50 card-shadow overflow-hidden">
                <div className="flex items-center px-5 py-4 gap-3">
                  <button
                    onClick={() => setCollapsedIds(prev => { const next = new Set(prev); if (isExpanded) next.add(link.id); else next.delete(link.id); return next; })}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", link.is_active ? "bg-success" : "bg-muted-foreground")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{link.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {editingSlug === link.id ? (
                          <span className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            /
                            <Input
                              value={slugValue}
                              onChange={(e) => setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                              className="h-6 w-32 text-xs inline"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") updateSlug.mutate({ id: link.id, slug: slugValue });
                                if (e.key === "Escape") setEditingSlug(null);
                              }}
                            />
                            <button onClick={() => updateSlug.mutate({ id: link.id, slug: slugValue })} className="text-success text-xs">✓</button>
                          </span>
                        ) : (
                          <span
                            className="cursor-pointer hover:text-foreground"
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingSlug(link.id); setSlugValue(link.slug); }}
                            title="Duplo clique para editar"
                          >
                            /{link.slug} · {link.smartlink_variants?.length || 0} variantes
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => copyLink(link.slug)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Copiar link">
                      <Copy className="h-4 w-4" />
                    </button>
                    <a href={`${getRedirectUrl(link.slug)}?no_track=1`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-primary" title="Testar sem contabilizar view">
                      <FlaskConical className="h-4 w-4" />
                    </a>
                    {canEdit && (
                      <button onClick={() => toggleActive.mutate({ id: link.id, is_active: !link.is_active })} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title={link.is_active ? "Pausar" : "Ativar"}>
                        {link.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditingLink(link); setShowModal(true); }} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {(canDelete || isMember) && (
                      <button onClick={() => handleDelete(link)} className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive" title={isMember && !canDelete ? "Solicitar exclusão" : "Excluir"}>
                        {isMember && !canDelete ? <Clock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI cards for this SmartLink */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-5 pb-4">
                  <div className="rounded-xl border border-border/20 card-shadow glass p-4 h-[140px] flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider w-full flex items-center justify-between">
                      <span className="flex items-center gap-1">Views</span>
                      <div className="flex items-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => handleClearViews(link)}
                            className="p-0.5 rounded hover:bg-warning/20 transition-all text-muted-foreground hover:text-warning"
                            title="Limpar views"
                          >
                            <Eraser className="h-3 w-3" />
                          </button>
                        )}
                        <UITooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Cliques registrados neste Smart Link no período selecionado.</TooltipContent></UITooltip>
                      </div>
                    </div>
                    <div className="text-2xl font-bold flex-1 flex items-center justify-center tabular-nums">{linkData.views.toLocaleString("pt-BR")}</div>
                    <div className={`text-[10px] font-normal leading-tight ${changeColor(pctChange(linkData.views, prevLinkData.views))}`}>{fmtPct(pctChange(linkData.views, prevLinkData.views))}</div>
                  </div>
                  <div className="rounded-xl border border-border/20 card-shadow glass p-4 h-[140px] flex flex-col items-center text-center relative overflow-hidden">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider w-full flex items-center justify-between">
                      Vendas
                      <UITooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Total de vendas (Principal + OB) deste Smart Link no período.</TooltipContent></UITooltip>
                    </div>
                    <div className="text-2xl font-bold flex-1 flex items-center justify-center tabular-nums">{(obData.mainSales + obData.obSales).toLocaleString("pt-BR")}</div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[13px] text-muted-foreground">Vendas <span className="font-mono font-semibold text-foreground/80">{obData.mainSales}</span></span>
                      <span className="text-[13px] text-muted-foreground">OB <span className="font-mono font-semibold text-foreground/80">{obData.obSales}</span></span>
                    </div>
                    <div className={`text-[10px] font-normal leading-tight ${changeColor(pctChange(linkData.sales, prevLinkData.sales))}`}>{fmtPct(pctChange(linkData.sales, prevLinkData.sales))}</div>
                  </div>
                  <div className="rounded-xl border border-border/20 card-shadow glass p-4 h-[140px] flex flex-col items-center text-center relative overflow-hidden">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider w-full flex items-center justify-between">
                      Receita
                      <UITooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Soma de todas as vendas aprovadas deste Smart Link.</TooltipContent></UITooltip>
                    </div>
                    <div className="text-2xl font-bold flex-1 flex items-center justify-center tabular-nums">R$ {linkData.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    <div className={`text-[10px] font-normal leading-tight ${changeColor(pctChange(linkData.revenue, prevLinkData.revenue))}`}>{fmtPct(pctChange(linkData.revenue, prevLinkData.revenue))}</div>
                  </div>
                  <div className="rounded-xl border border-border/20 card-shadow glass p-4 h-[140px] flex flex-col items-center text-center relative overflow-hidden">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider w-full flex items-center justify-between">
                      Conv.
                      <UITooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Taxa de conversão = Vendas / Views × 100.</TooltipContent></UITooltip>
                    </div>
                    <div className="text-2xl font-bold flex-1 flex items-center justify-center tabular-nums text-success">{convRate}%</div>
                    <div className={`text-[10px] font-normal leading-tight ${changeColor(parseFloat(convRate) - prevConvRate)}`}>{fmtPct(pctChange(parseFloat(convRate), prevConvRate))}</div>
                  </div>
                  <div className="rounded-xl border border-border/20 card-shadow glass p-4 h-[140px] flex flex-col items-center text-center relative overflow-hidden">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider w-full flex items-center justify-between">
                      Ticket
                      <UITooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Ticket Médio = Receita / Vendas deste Smart Link.</TooltipContent></UITooltip>
                    </div>
                    <div className="text-2xl font-bold flex-1 flex items-center justify-center tabular-nums">R$ {ticket}</div>
                    <div className={`text-[10px] font-normal leading-tight ${changeColor(pctChange(parseFloat(ticket), prevTicket))}`}>{fmtPct(pctChange(parseFloat(ticket), prevTicket))}</div>
                  </div>
                </div>

                <div className="px-5 pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5">
                    <span className="font-mono truncate">{getRedirectUrl(link.slug)}</span>
                    <button onClick={() => copyLink(link.slug)} className="shrink-0 hover:text-foreground"><Copy className="h-3 w-3" /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/30">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/20">
                            <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Variante</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">URL destino</th>
                            <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Peso</th>
                             <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Views</th>
                             <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Vendas</th>
                             <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">OB</th>
                             <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Taxa</th>
                             <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Receita</th>
                             <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(link.smartlink_variants || []).map((v: any) => {
                            const realViews = clicksData.filter((c: any) => c.variant_id === v.id).length;
                            const vData = metricsMap.byVariant.get(v.id) || { views: 0, sales: 0, revenue: 0 };
                            const vPrev = metricsMap.prevByVariant.get(v.id) || { views: 0, sales: 0, revenue: 0 };
                            const vOb = metricsMap.obByVariant.get(v.id) || { mainSales: 0, obSales: 0 };
                            const vRate = vData.views > 0 ? ((vData.sales / vData.views) * 100).toFixed(2) : "0.00";
                            const isEditingViews = editingViewsVariant === v.id;
                            return (
                              <tr key={v.id} className="border-b border-border/10 hover:bg-accent/10 transition-colors">
                                <td className="px-5 py-3 font-medium text-[13px]">{v.name}</td>
                                <td className="px-4 py-3 text-[13px] text-muted-foreground truncate max-w-[200px]">{v.url}</td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-semibold">{v.weight}%</td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold">
                                  {isEditingViews ? (
                                    <div className="flex items-center gap-1 justify-center">
                                      <Input
                                        type="number"
                                        value={editViewsValue}
                                        onChange={(e) => setEditViewsValue(e.target.value)}
                                        className="h-7 w-20 text-xs text-center"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            const desired = parseInt(editViewsValue);
                                            if (!isNaN(desired) && desired >= 0) {
                                              updateVariantViews.mutate({ variantId: v.id, desiredViews: desired, realViews });
                                            }
                                          }
                                          if (e.key === "Escape") setEditingViewsVariant(null);
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          const desired = parseInt(editViewsValue);
                                          if (!isNaN(desired) && desired >= 0) {
                                            updateVariantViews.mutate({ variantId: v.id, desiredViews: desired, realViews });
                                          }
                                        }}
                                        className="text-success hover:text-success/80"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={() => setEditingViewsVariant(null)} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 justify-center group">
                                      <span>{vData.views.toLocaleString("pt-BR")}</span>
                                      {canEdit && (
                                        <button
                                          onClick={() => { setEditingViewsVariant(v.id); setEditViewsValue(String(vData.views)); }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                      )}
                                      <div className={`text-[10px] font-normal ${changeColor(pctChange(vData.views, vPrev.views))}`}>{fmtPct(pctChange(vData.views, vPrev.views))}</div>
                                    </div>
                                  )}
                                </td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold">
                                  {vOb.mainSales}
                                  <div className={`text-[10px] font-normal ${changeColor(pctChange(vOb.mainSales, vPrev.sales))}`}>{fmtPct(pctChange(vOb.mainSales, vPrev.sales))}</div>
                                </td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold text-muted-foreground">{vOb.obSales}</td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold text-success">{vRate}%</td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold">
                                  R$ {vData.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  <div className={`text-[10px] font-normal ${changeColor(pctChange(vData.revenue, vPrev.revenue))}`}>{fmtPct(pctChange(vData.revenue, vPrev.revenue))}</div>
                                </td>
                                <td className="text-center px-4 py-3">
                                  <button
                                    onClick={() => toggleVariant.mutate({ id: v.id, is_active: !v.is_active, smartLinkId: link.id })}
                                    className={cn("text-xs px-2 py-0.5 rounded-full cursor-pointer", v.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}
                                  >
                                    {v.is_active ? "Ativa" : "Inativa"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const prods = metricsMap.productsByLink.get(link.id);
                      if (!prods || prods.size === 0) return null;
                      const linkViews = linkData.views;
                      return (
                        <div className="border-t border-border/30 px-5 py-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Produtos vendidos</h4>
                          <div className="space-y-1.5">
                            {Array.from(prods.entries()).sort((a, b) => b[1].receita - a[1].receita).map(([name, data]) => (
                              <div key={name} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-muted/20">
                                <span className="font-medium">{name}</span>
                                <div className="flex items-center gap-4 text-muted-foreground">
                                  <span>{data.vendas} vendas</span>
                                  <span className="font-mono">R$ {data.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                  <span className="text-success">{linkViews > 0 ? ((data.vendas / linkViews) * 100).toFixed(2) : "0.00"}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Views Confirmation Modal */}
      {clearViewsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-card border border-border/50 rounded-xl card-shadow p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-base font-semibold">Limpar visualizações</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você está prestes a limpar <strong>todos os views (cliques)</strong> do Smart Link <strong>"{clearViewsTarget.name}"</strong>.
            </p>
            <p className="text-xs text-destructive/80">
              ⚠️ Essa ação é irreversível e não tem como recuperar os dados.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setClearViewsTarget(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmClearViews}
                disabled={clearViews.isPending}
              >
                {clearViews.isPending ? "Limpando..." : "Confirmar limpeza"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Smart Link Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-card border border-border/50 rounded-xl card-shadow p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-base font-semibold">Excluir Smart Link</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você está prestes a excluir permanentemente o Smart Link <strong>"{deleteTarget.name}"</strong> e todos os seus dados associados.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Para confirmar, digite o nome do Smart Link: <strong>{deleteTarget.name}</strong>
              </Label>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={deleteTarget.name}
                className="text-sm"
              />
            </div>
            <p className="text-xs text-destructive/80">
              ⚠️ Essa ação é irreversível.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => { setDeleteTarget(null); setDeleteConfirmName(""); }}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteConfirmName !== deleteTarget.name || deleteLink.isPending}
              >
                {deleteLink.isPending ? "Excluindo..." : "Excluir permanentemente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
