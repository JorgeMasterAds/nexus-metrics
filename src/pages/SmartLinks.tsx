import React, { useState, useMemo, useCallback } from "react"; // v2
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Copy, ExternalLink, Download, AlertTriangle, Clock, Eraser, FlaskConical, EyeOff, HelpCircle, Check, X, ArrowUpDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import SmartLinkModal from "@/components/SmartLinkModal";
import DateFilter, { DateRange, getDefaultDateRange } from "@/components/DateFilter";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { exportToCsv } from "@/lib/csv";
import { useUsageLimits } from "@/hooks/useSubscription";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectRole } from "@/hooks/useProjectRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeepLinksTab from "@/components/DeepLinksTab";
import DailyChart from "@/components/DailyChart";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";

export default function SmartLinks() {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [editingLink, setEditingLink] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDomainWarning, setShowDomainWarning] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [slugValue, setSlugValue] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [variantSortByLink, setVariantSortByLink] = useState<Record<string, { key: string; direction: "asc" | "desc" }>>({});
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const { maxSmartlinks } = useUsageLimits();
  const { canCreate, canEdit, canDelete, isViewer, isMember } = useProjectRole();

  const getVariantSort = useCallback((linkId: string) => {
    return variantSortByLink[linkId] || { key: "created_at", direction: "asc" as const };
  }, [variantSortByLink]);

  const handleVariantSort = useCallback((linkId: string, key: string) => {
    setVariantSortByLink((prev) => {
      const current = prev[linkId] || { key: "created_at", direction: "asc" as const };
      const nextDirection = current.key === key && current.direction === "asc" ? "desc" : "asc";
      return { ...prev, [linkId]: { key, direction: nextDirection } };
    });
  }, []);

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
  const sinceISO = dateRange.from.toISOString();
  const untilISO = dateRange.to.toISOString();

  // Period comparison
  const periodMs = dateRange.to.getTime() - dateRange.from.getTime();
  const periodDays = Math.max(1, Math.round(periodMs / 86400000));
  const prevUntil = new Date(dateRange.from.getTime() - 1);
  const prevSince = new Date(prevUntil.getTime() - periodMs);
  const prevSinceISO = prevSince.toISOString();
  const prevUntilISO = prevUntil.toISOString();
  const previousPeriodLabel = (() => {
    const presetMap: Record<string, string> = {
      "Hoje": "dia anterior",
      "Ontem": "dia anterior",
      "7 dias": "7 dias anteriores",
      "30 dias": "30 dias anteriores",
      "Este mês": "mês anterior",
      "Mês passado": "mês anterior",
    };
    const stored = localStorage.getItem("nexus_date_preset") || "7 dias";
    return presetMap[stored] || `${periodDays}d ant.`;
  })();

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
        .eq("is_archived", false)
        .order("created_at", { ascending: true, referencedTable: "smartlink_variants" })
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
    queryKey: ["sl-clicks", sinceISO, untilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("clicks")
        .select("id, click_id, smartlink_id, variant_id, created_at")
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  const { data: prevClicksData = [] } = useQuery({
    queryKey: ["sl-clicks-prev", prevSinceISO, prevUntilISO, activeAccountId, activeProjectId],

    queryFn: async () => {
      let q = (supabase as any)
        .from("clicks")
        .select("id, click_id, smartlink_id, variant_id")
        .gte("created_at", prevSinceISO)
        .lte("created_at", prevUntilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  // Conversions for sales/revenue
  const { data: conversionsData = [] } = useQuery({
    queryKey: ["sl-conversions", sinceISO, untilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, smartlink_id, variant_id, amount, is_order_bump, product_name, created_at")
        .eq("status", "approved")
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  // Abandoned cart / checkout access conversions (all non-approved statuses that indicate checkout visit)
  const { data: abandonedData = [] } = useQuery({
    queryKey: ["sl-abandoned", sinceISO, untilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, smartlink_id, variant_id, status")
        .in("status", ["waiting_payment", "abandoned_cart", "boleto_generated", "pix_generated", "declined"])
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  const { data: prevAbandonedData = [] } = useQuery({
    queryKey: ["sl-abandoned-prev", prevSinceISO, prevUntilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, smartlink_id, variant_id, status")
        .in("status", ["waiting_payment", "abandoned_cart", "boleto_generated", "pix_generated", "declined"])
        .gte("created_at", prevSinceISO)
        .lte("created_at", prevUntilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });
  const { data: prevConversionsData = [] } = useQuery({
    queryKey: ["sl-conversions-prev", prevSinceISO, prevUntilISO, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("id, smartlink_id, variant_id, amount, is_order_bump")
        .eq("status", "approved")
        .gte("created_at", prevSinceISO)
        .lte("created_at", prevUntilISO)
        .eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      return await fetchAllRows(q);
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

    // Deduplicate clicks by click_id for unique view count
    const seenClickIds = new Set<string>();
    const uniqueClicks = clicksData.filter((c: any) => {
      if (!c.click_id || seenClickIds.has(c.click_id)) return false;
      seenClickIds.add(c.click_id);
      return true;
    });

    // Count views from unique clicks
    uniqueClicks.forEach((c: any) => {
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
      uniqueClicks.forEach((c: any) => { if (c.smartlink_id === link.id) realClicksForLink++; });
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

    // Build prev metrics maps (also deduplicated)
    const prevByLink = new Map<string, { views: number; sales: number; revenue: number }>();
    const prevByVariant = new Map<string, { views: number; sales: number; revenue: number }>();
    const seenPrevClickIds = new Set<string>();
    prevClicksData.forEach((c: any) => {
      if (c.click_id && seenPrevClickIds.has(c.click_id)) return;
      if (c.click_id) seenPrevClickIds.add(c.click_id);
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
    const prevObByLink = new Map<string, { mainSales: number; obSales: number }>();
    const prevObByVariant = new Map<string, { mainSales: number; obSales: number }>();
    prevConversionsData.forEach((c: any) => {
      if (c.smartlink_id) {
        const entry = prevByLink.get(c.smartlink_id) || { views: 0, sales: 0, revenue: 0 };
        entry.sales++;
        entry.revenue += Number(c.amount);
        prevByLink.set(c.smartlink_id, entry);

        const ob = prevObByLink.get(c.smartlink_id) || { mainSales: 0, obSales: 0 };
        if (c.is_order_bump) ob.obSales++; else ob.mainSales++;
        prevObByLink.set(c.smartlink_id, ob);
      }
      if (c.variant_id) {
        const entry = prevByVariant.get(c.variant_id) || { views: 0, sales: 0, revenue: 0 };
        entry.sales++;
        entry.revenue += Number(c.amount);
        prevByVariant.set(c.variant_id, entry);

        const ob = prevObByVariant.get(c.variant_id) || { mainSales: 0, obSales: 0 };
        if (c.is_order_bump) ob.obSales++; else ob.mainSales++;
        prevObByVariant.set(c.variant_id, ob);
      }
    });

    // Abandoned cart counts
    const abandonByLink = new Map<string, number>();
    const abandonByVariant = new Map<string, number>();
    abandonedData.forEach((c: any) => {
      if (c.smartlink_id) abandonByLink.set(c.smartlink_id, (abandonByLink.get(c.smartlink_id) || 0) + 1);
      if (c.variant_id) abandonByVariant.set(c.variant_id, (abandonByVariant.get(c.variant_id) || 0) + 1);
    });

    // Previous period abandoned counts
    const prevAbandonByLink = new Map<string, number>();
    const prevAbandonByVariant = new Map<string, number>();
    prevAbandonedData.forEach((c: any) => {
      if (c.smartlink_id) prevAbandonByLink.set(c.smartlink_id, (prevAbandonByLink.get(c.smartlink_id) || 0) + 1);
      if (c.variant_id) prevAbandonByVariant.set(c.variant_id, (prevAbandonByVariant.get(c.variant_id) || 0) + 1);
    });

    return { byLink, byVariant, productsByLink, obByLink, obByVariant, prevByLink, prevByVariant, prevObByLink, prevObByVariant, abandonByLink, abandonByVariant, prevAbandonByLink, prevAbandonByVariant };
  }, [clicksData, conversionsData, prevClicksData, prevConversionsData, variantAdjustments, smartLinks, abandonedData, prevAbandonedData]);

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("smartlinks").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smartlinks"] }),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      // Try hard delete first (DB trigger blocks if data exists)
      const { error } = await (supabase as any).from("smartlinks").delete().eq("id", id);
      if (error) {
        // If blocked by trigger, soft-delete (archive) instead
        if (error.message?.includes('Cannot delete smartlink')) {
          const { error: archiveError } = await (supabase as any)
            .from("smartlinks")
            .update({ is_archived: true, is_active: false })
            .eq("id", id);
          if (archiveError) throw archiveError;
          // Archive all variants too
          await (supabase as any)
            .from("smartlink_variants")
            .update({ is_active: false, weight: 0 })
            .eq("smartlink_id", id);
        } else {
          throw error;
        }
      }
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
  // Always keep internal browser mode on — no toggle exposed
  useState(() => {
    localStorage.setItem("nexus_internal_browser", "true");
  });

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
        </div>
      }
    >
      <Tabs defaultValue="smartlinks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="smartlinks">Smart Links</TabsTrigger>
          <TabsTrigger value="deeplinks">Deep Links</TabsTrigger>
        </TabsList>

        <TabsContent value="smartlinks">
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
                onClick={() => { setShowDomainWarning(false); navigate("/recursos"); }}
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



      {canCreate && (
        <div className="flex justify-end mb-4">
          <Button
            size="sm"
            className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
            onClick={handleNewClick}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
        </div>
      )}

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
        <div className="space-y-6">
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
                      <div className="font-bold text-base">{link.name}</div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 px-5 pb-4">
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
                  {/* Abandono card */}
                  <div className="rounded-xl border border-border/20 card-shadow glass p-4 h-[140px] flex flex-col items-center text-center relative overflow-hidden">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider w-full flex items-center justify-between">
                      Checkout
                      <UITooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[240px] text-xs">Checkout = todos que acessaram a página de pagamento. Abandono = quem acessou mas não finalizou.</TooltipContent></UITooltip>
                    </div>
                    <div className="text-2xl font-bold flex-1 flex items-center justify-center tabular-nums text-foreground">{(((metricsMap.abandonByLink.get(link.id) || 0) + obData.mainSales) > 0 ? ((metricsMap.abandonByLink.get(link.id) || 0) + obData.mainSales).toLocaleString("pt-BR") : "—")}</div>
                    <div className="text-[13px] text-muted-foreground">Abandono <span className="font-mono font-semibold">{(metricsMap.abandonByLink.get(link.id) || 0).toLocaleString("pt-BR")}</span></div>
                    {(() => {
                      const prevObData = metricsMap.prevObByLink.get(link.id) || { mainSales: 0, obSales: 0 };
                      const currCheckout = (metricsMap.abandonByLink.get(link.id) || 0) + obData.mainSales;
                      const prevCheckout = (metricsMap.prevAbandonByLink.get(link.id) || 0) + prevObData.mainSales;
                      return <div className={`text-[10px] font-normal leading-tight ${changeColor(pctChange(currCheckout, prevCheckout))}`}>{fmtPct(pctChange(currCheckout, prevCheckout))}</div>;
                    })()}
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
                      Ticket Médio
                      <UITooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Ticket Médio = Receita / Vendas deste Smart Link.</TooltipContent></UITooltip>
                    </div>
                    <div className="text-2xl font-bold flex-1 flex items-center justify-center tabular-nums">R$ {ticket}</div>
                    <div className={`text-[10px] font-normal leading-tight ${changeColor(pctChange(parseFloat(ticket), prevTicket))}`}>{fmtPct(pctChange(parseFloat(ticket), prevTicket))}</div>
                  </div>
                  {/* Funnel inline */}
                  <div className="rounded-xl p-3 h-[160px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {(() => {
                      const abandonCount = metricsMap.abandonByLink.get(link.id) || 0;
                      const steps = [
                        { label: "Views", value: linkData.views },
                        { label: "Checkout", value: abandonCount + obData.mainSales },
                        { label: "Vendas", value: obData.mainSales + obData.obSales },
                      ];
                      const topW = [110, 90, 68];
                      const botW = [94, 74, 58];
                      const cx = 58;
                      const sh = 44;
                      const gap2 = 2;
                      return (
                        <svg width="108" height={steps.length * (sh + gap2) - gap2} viewBox={`0 0 108 ${steps.length * (sh + gap2) - gap2}`} className="overflow-visible">
                          <defs>
                            <linearGradient id={`fG0-${link.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142, 65%, 52%)" /><stop offset="100%" stopColor="hsl(142, 60%, 40%)" /></linearGradient>
                            <linearGradient id={`fG1-${link.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(148, 55%, 44%)" /><stop offset="100%" stopColor="hsl(148, 50%, 33%)" /></linearGradient>
                            <linearGradient id={`fG2-${link.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(155, 48%, 36%)" /><stop offset="100%" stopColor="hsl(155, 42%, 26%)" /></linearGradient>
                          </defs>
                          {steps.map((step, i) => {
                            const y = i * (sh + gap2);
                            const tw = topW[i], bw = botW[i];
                            return (
                              <g key={i}>
                                <polygon points={`${cx-tw/2},${y} ${cx+tw/2},${y} ${cx+bw/2},${y+sh} ${cx-bw/2},${y+sh}`} fill={`url(#fG${i}-${link.id})`} />
                                <text x={cx} y={y+13} textAnchor="middle" fill="hsla(0,0%,100%,0.75)" fontSize="7" fontWeight="400">{step.label}</text>
                                <text x={cx} y={y+26} textAnchor="middle" fill="hsl(0,0%,96%)" fontSize="11" fontWeight="700">{step.value.toLocaleString("pt-BR")}</text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
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
                    <div>
                      {/* Variant table */}
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/20">
                            {[
                              { key: "name", label: "Variante", align: "left", className: "px-5", tooltip: "Nome da variante do Smart Link." },
                              { key: "url", label: "URL destino", align: "left", className: "px-4", tooltip: "URL para onde o visitante é redirecionado." },
                              { key: "weight", label: "Peso", align: "center", className: "px-4", tooltip: "Percentual de tráfego direcionado a esta variante." },
                              { key: "views", label: "Views", align: "center", className: "px-4", tooltip: "Total de cliques únicos registrados nesta variante no período." },
                              { key: "checkout", label: "Checkout", align: "center", className: "px-4", tooltip: "Checkout = vendas principais + abandono de carrinho." },
                              { key: "abandono", label: "Abandono", align: "center", className: "px-4", tooltip: "Quantidade de acessos ao checkout que não finalizaram a compra." },
                              { key: "sales", label: "Vendas", align: "center", className: "px-4", tooltip: "Total de vendas do produto principal aprovadas nesta variante." },
                              { key: "ob", label: "OB", align: "center", className: "px-4", tooltip: "Order Bumps — vendas de produtos complementares adicionados no checkout." },
                              { key: "rate", label: "Taxa", align: "center", className: "px-4", tooltip: "Taxa de conversão = (Vendas / Views) × 100. Mede quantos visitantes compraram." },
                              { key: "revenue", label: "Receita", align: "center", className: "px-4", tooltip: "Soma total das vendas aprovadas (principal + OB) nesta variante." },
                              { key: "is_active", label: "Status", align: "center", className: "px-4", tooltip: "Indica se a variante está ativa e recebendo tráfego." },
                            ].map((col) => {
                              const activeSort = getVariantSort(link.id);
                              const isActive = activeSort.key === col.key;
                              return (
                                <th key={col.key} className={cn(col.align === "center" ? "text-center" : "text-left", col.className, "py-2.5 text-xs font-medium text-muted-foreground")}>
                                  <UITooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleVariantSort(link.id, col.key)}
                                        className={cn(
                                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                                          col.align === "center" ? "mx-auto" : ""
                                        )}
                                      >
                                        <span>{col.label}</span>
                                        {isActive ? (
                                          activeSort.direction === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                        ) : (
                                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[220px] text-xs">{col.tooltip}</TooltipContent>
                                  </UITooltip>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const variants = [...(link.smartlink_variants || [])];
                            const activeSort = getVariantSort(link.id);
                            const sortedVariants = variants.sort((a: any, b: any) => {
                              const aData = metricsMap.byVariant.get(a.id) || { views: 0, sales: 0, revenue: 0 };
                              const bData = metricsMap.byVariant.get(b.id) || { views: 0, sales: 0, revenue: 0 };
                              const aOb = metricsMap.obByVariant.get(a.id) || { mainSales: 0, obSales: 0 };
                              const bOb = metricsMap.obByVariant.get(b.id) || { mainSales: 0, obSales: 0 };
                              const aRate = aData.views > 0 ? (aData.sales / aData.views) * 100 : 0;
                              const bRate = bData.views > 0 ? (bData.sales / bData.views) * 100 : 0;
                              const aCheckout = (metricsMap.abandonByVariant.get(a.id) || 0) + aOb.mainSales;
                              const bCheckout = (metricsMap.abandonByVariant.get(b.id) || 0) + bOb.mainSales;
                              const aAbandono = metricsMap.abandonByVariant.get(a.id) || 0;
                              const bAbandono = metricsMap.abandonByVariant.get(b.id) || 0;

                              const cmp = (x: string | number, y: string | number) => {
                                if (typeof x === "string" && typeof y === "string") return x.localeCompare(y, "pt-BR");
                                return Number(x) - Number(y);
                              };

                              let result = 0;
                              switch (activeSort.key) {
                                case "name":
                                  result = cmp(a.name || "", b.name || "");
                                  break;
                                case "url":
                                  result = cmp(a.url || "", b.url || "");
                                  break;
                                case "weight":
                                  result = cmp(a.weight || 0, b.weight || 0);
                                  break;
                                case "views":
                                  result = cmp(aData.views, bData.views);
                                  break;
                                case "checkout":
                                  result = cmp(aCheckout, bCheckout);
                                  break;
                                case "abandono":
                                  result = cmp(aAbandono, bAbandono);
                                  break;
                                case "sales":
                                  result = cmp(aOb.mainSales, bOb.mainSales);
                                  break;
                                case "ob":
                                  result = cmp(aOb.obSales, bOb.obSales);
                                  break;
                                case "rate":
                                  result = cmp(aRate, bRate);
                                  break;
                                case "revenue":
                                  result = cmp(aData.revenue, bData.revenue);
                                  break;
                                case "is_active":
                                  result = cmp(a.is_active ? 1 : 0, b.is_active ? 1 : 0);
                                  break;
                                case "created_at":
                                default:
                                  result = cmp(new Date(a.created_at || 0).getTime(), new Date(b.created_at || 0).getTime());
                                  break;
                              }

                              if (result === 0 && activeSort.key !== "created_at") {
                                result = cmp(new Date(a.created_at || 0).getTime(), new Date(b.created_at || 0).getTime());
                              }

                              return activeSort.direction === "asc" ? result : -result;
                            });
                            let bestSalesId: string | null = null, bestSalesVal = 0;
                            let bestObId: string | null = null, bestObVal = 0;
                            let bestRateId: string | null = null, bestRateVal = 0;
                            let bestRevenueId: string | null = null, bestRevenueVal = 0;
                            sortedVariants.forEach((v: any) => {
                              const vd = metricsMap.byVariant.get(v.id) || { views: 0, sales: 0, revenue: 0 };
                              const vob = metricsMap.obByVariant.get(v.id) || { mainSales: 0, obSales: 0 };
                              const rate = vd.views > 0 ? (vd.sales / vd.views) * 100 : 0;
                              if (vob.mainSales > bestSalesVal) { bestSalesVal = vob.mainSales; bestSalesId = v.id; }
                              if (vob.obSales > bestObVal) { bestObVal = vob.obSales; bestObId = v.id; }
                              if (rate > bestRateVal) { bestRateVal = rate; bestRateId = v.id; }
                              if (vd.revenue > bestRevenueVal) { bestRevenueVal = vd.revenue; bestRevenueId = v.id; }
                            });
                            if (bestSalesVal === 0) bestSalesId = null;
                            if (bestObVal === 0) bestObId = null;
                            if (bestRateVal === 0) bestRateId = null;
                            if (bestRevenueVal === 0) bestRevenueId = null;
                            const bestOverallId = bestSalesId;

                            return sortedVariants.map((v: any) => {
                            const realViews = clicksData.filter((c: any) => c.variant_id === v.id).length;
                            const vData = metricsMap.byVariant.get(v.id) || { views: 0, sales: 0, revenue: 0 };
                            const vPrev = metricsMap.prevByVariant.get(v.id) || { views: 0, sales: 0, revenue: 0 };
                            const vOb = metricsMap.obByVariant.get(v.id) || { mainSales: 0, obSales: 0 };
                            const vRate = vData.views > 0 ? ((vData.sales / vData.views) * 100).toFixed(2) : "0.00";
                            const isEditingViews = editingViewsVariant === v.id;
                            const isBestOverall = v.id === bestOverallId;
                            const isBestSales = v.id === bestSalesId;
                            const isBestOb = v.id === bestObId;
                            const isBestRate = v.id === bestRateId;
                            const isBestRevenue = v.id === bestRevenueId;
                            return (
                              <React.Fragment key={v.id}>
                              <tr className={cn(
                                "border-b border-border/10 hover:bg-accent/10 transition-colors",
                                isBestOverall && "bg-success/5 border-l-2 border-l-success"
                              )}>
                                <td className="px-5 py-3 font-medium text-[13px]">
                                  {v.name}
                                  {isBestOverall && <span className="ml-1.5 text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full font-semibold">★ Melhor</span>}
                                </td>
                                <td className="px-4 py-3 text-[13px] truncate max-w-[200px]">
                                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:underline transition-colors">{v.url}</a>
                                </td>
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
                                    <div className="flex flex-col items-center justify-center gap-0.5 group">
                                      <div className="flex items-center justify-center gap-1">
                                        <span>{vData.views.toLocaleString("pt-BR")}</span>
                                        {canEdit && (
                                          <button
                                            onClick={() => { setEditingViewsVariant(v.id); setEditViewsValue(String(vData.views)); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                      <div className={`text-[10px] font-normal text-center ${changeColor(pctChange(vData.views, vPrev.views))}`}>{fmtPct(pctChange(vData.views, vPrev.views))}</div>
                                    </div>
                                  )}
                                </td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold text-foreground">{((metricsMap.abandonByVariant.get(v.id) || 0) + vOb.mainSales).toLocaleString("pt-BR")}</td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold text-muted-foreground">{(metricsMap.abandonByVariant.get(v.id) || 0).toLocaleString("pt-BR")}</td>
                                <td className={cn("text-center px-4 py-3 font-mono text-[13px] font-bold", isBestSales && "text-emerald-400")}>
                                  {vOb.mainSales}
                                  <div className={`text-[10px] font-normal ${changeColor(pctChange(vOb.mainSales, vPrev.sales))}`}>{fmtPct(pctChange(vOb.mainSales, vPrev.sales))}</div>
                                </td>
                                <td className={cn("text-center px-4 py-3 font-mono text-[13px] font-bold", isBestOb ? "text-emerald-400" : "text-muted-foreground")}>{vOb.obSales}</td>
                                <td className="text-center px-4 py-3 font-mono text-[13px] font-bold text-foreground">{vRate}%</td>
                                <td className={cn("text-center px-4 py-3 font-mono text-[13px] font-bold", isBestRevenue && "text-emerald-400")}>
                                  R$ {vData.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  <div className={`text-[10px] font-normal ${changeColor(pctChange(vData.revenue, vPrev.revenue))}`}>{fmtPct(pctChange(vData.revenue, vPrev.revenue))}</div>
                                </td>
                                <td className="text-center px-4 py-3">
                                  <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                      checked={v.is_active}
                                      onCheckedChange={(checked) => toggleVariant.mutate({ id: v.id, is_active: checked, smartLinkId: link.id })}
                                      className="data-[state=checked]:bg-success"
                                    />
                                    <span className={cn("text-[11px] font-medium", v.is_active ? "text-success" : "text-muted-foreground")}>
                                      {v.is_active ? "Ativa" : "Inativa"}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {/* Mini green sparkline below variant */}
                              <tr key={`${v.id}-chart`} className="border-b border-border/10">
                                <td colSpan={11} className="px-5 py-1.5">
                                  <div className="h-8 w-full max-w-xs">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={(() => {
                                        const dayMap = new Map<string, { date: string; cliques: number }>();
                                        const d2 = new Date(dateRange.from);
                                        d2.setHours(0, 0, 0, 0);
                                        const end2 = new Date(dateRange.to);
                                        end2.setHours(23, 59, 59, 999);
                                        while (d2 <= end2) {
                                          const key = d2.toISOString().slice(0, 10);
                                          dayMap.set(key, { date: key, cliques: 0 });
                                          d2.setDate(d2.getDate() + 1);
                                        }
                                        clicksData.filter((c: any) => c.variant_id === v.id).forEach((c: any) => {
                                          const key = new Date(c.created_at).toISOString().slice(0, 10);
                                          const entry = dayMap.get(key);
                                          if (entry) entry.cliques++;
                                        });
                                        return Array.from(dayMap.values());
                                      })()}>
                                        <defs>
                                          <linearGradient id={`vg-inline-${v.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                                          </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="cliques" stroke="hsl(142 71% 45%)" fill={`url(#vg-inline-${v.id})`} strokeWidth={1.5} dot={false} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </td>
                              </tr>
                              </React.Fragment>
                            );
                          });
                          })()}
                        </tbody>
                      </table>
                      </div>

                      {/* Mini sparkline charts per variant */}
                      <div className="px-5 py-4 border-t border-border/20">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wider">Desempenho diário por variante</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(link.smartlink_variants || []).filter((v: any) => v.is_active).map((v: any) => {
                            const vClicks = clicksData.filter((c: any) => c.variant_id === v.id);
                            const vConversions = conversionsData.filter((c: any) => c.variant_id === v.id);
                            // Build daily data
                            const dayMap = new Map<string, { date: string; cliques: number; vendas: number }>();
                            const d = new Date(dateRange.from);
                            d.setHours(0, 0, 0, 0);
                            const end = new Date(dateRange.to);
                            end.setHours(23, 59, 59, 999);
                            while (d <= end) {
                              const key = d.toISOString().slice(0, 10);
                              const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                              dayMap.set(key, { date: label, cliques: 0, vendas: 0 });
                              d.setDate(d.getDate() + 1);
                            }
                            vClicks.forEach((c: any) => {
                              const key = new Date(c.created_at).toISOString().slice(0, 10);
                              const entry = dayMap.get(key);
                              if (entry) entry.cliques++;
                            });
                            vConversions.forEach((c: any) => {
                              const key = new Date(c.created_at).toISOString().slice(0, 10);
                              const entry = dayMap.get(key);
                              if (entry) entry.vendas++;
                            });
                            const chartData = Array.from(dayMap.values());
                            const totalClicks = vClicks.length;
                            const totalSales = vConversions.length;
                            return (
                              <div key={v.id} className="rounded-lg border border-border/20 bg-muted/10 p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold truncate">{v.name}</span>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>{totalClicks} cliques</span>
                                    <span className="text-success">{totalSales} vendas</span>
                                  </div>
                                </div>
                                <div className="h-12">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                      <defs>
                                        <linearGradient id={`vg-${v.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <Area type="monotone" dataKey="cliques" stroke="hsl(var(--primary))" fill={`url(#vg-${v.id})`} strokeWidth={1.5} dot={false} />
                                      <Area type="monotone" dataKey="vendas" stroke="hsl(var(--success, 142 71% 45%))" fill="transparent" strokeWidth={1.5} dot={false} />
                                      <RechartsTooltip
                                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }}
                                        labelStyle={{ fontSize: 10 }}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {(() => {
                      const prods = metricsMap.productsByLink.get(link.id);
                      if (!prods || prods.size === 0) return null;
                      const linkViews = linkData.views;
                      return (
                        <div className="border-t border-border/30 px-5 py-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wider">Produtos vendidos</h4>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 uppercase tracking-wider px-3 pb-1.5 mb-1">
                            <span>Produto</span>
                            <div className="flex items-center gap-6">
                              <span className="w-16 text-center">Vendas</span>
                              <span className="w-24 text-right">Receita</span>
                              <span className="w-14 text-right">Conv.</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {Array.from(prods.entries()).sort((a, b) => b[1].receita - a[1].receita).map(([name, data]) => (
                              <div key={name} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-muted/20 border border-border/10">
                                <span className="font-medium text-foreground">{name}</span>
                                <div className="flex items-center gap-6">
                                  <span className="w-16 text-center font-mono font-semibold text-foreground">{data.vendas}</span>
                                  <span className="w-24 text-right font-mono font-semibold text-emerald-500">R$ {data.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                  <span className="w-14 text-right font-mono font-semibold text-success">{linkViews > 0 ? ((data.vendas / linkViews) * 100).toFixed(2) : "0.00"}%</span>
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

      <DailyChart
        clicks={clicksData}
        conversions={conversionsData}
        dateFrom={dateRange.from}
        dateTo={dateRange.to}
        title="Desempenho Diário — Smart Links"
      />

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
        </TabsContent>

        <TabsContent value="deeplinks">
          <DeepLinksTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
