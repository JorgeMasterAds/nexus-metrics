import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, Globe, Settings, Users, Webhook, Sliders, UserPlus, Trash2, CreditCard, Package, Megaphone, Plus, Edit2, Check, X, ImagePlus, Search, ChevronDown, ChevronRight, Save, ShoppingCart, Trophy, AlertTriangle, Crown, Medal, Award, Star, KeyRound, MailCheck, Loader2, Activity, Zap, RefreshCw, Server, HelpCircle, Info, Bot } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import MotivationalMessagesManager from "@/components/admin/MotivationalMessagesManager";
import SystemWarnings from "@/components/admin/SystemWarnings";
import GlobalAlertsManager from "@/components/admin/GlobalAlertsManager";
import ProductTour, { TOURS } from "@/components/ProductTour";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MetricCard from "@/components/MetricCard";


const logLevelExplanations: Record<string, string> = {
  info: "Evento informativo — operação executada com sucesso.",
  warn: "Aviso — algo não saiu como esperado mas o sistema está tratando automaticamente.",
  error: "Erro — operação falhou após tentativas automáticas. Pode requerer verificação.",
};

function HealthHelpTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

function SystemHealthTab() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["admin-health-metrics"],
    refetchInterval: 120_000,
    queryFn: async () => {
      const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [clicksRes, webhookRes, conversionsRes] = await Promise.all([
        (supabase as any).from("clicks").select("id", { count: "exact", head: true }).gte("created_at", h24),
        (supabase as any).from("webhook_logs").select("status").gte("created_at", h24),
        (supabase as any).from("conversions").select("id", { count: "exact", head: true }).gte("created_at", h24),
      ]);
      const totalClicks = clicksRes.count || 0;
      const webhooks = webhookRes.data || [];
      const webhookErrors = webhooks.filter((w: any) => w.status === "error").length;
      const webhookIgnored = webhooks.filter((w: any) => w.status === "ignored").length;
      const totalRequests = totalClicks + webhooks.length;
      const errorRate = totalRequests > 0 ? ((webhookErrors / totalRequests) * 100).toFixed(2) : "0.00";
      return { totalClicks, totalConversions: conversionsRes.count || 0, webhookErrors, webhookIgnored, totalRequests, errorRate, webhookTotal: webhooks.length };
    },
  });

  const { data: edgeFnHealth } = useQuery({
    queryKey: ["admin-health-edge"],
    refetchInterval: 300_000,
    queryFn: async () => {
      try {
        const start = performance.now();
        const { error } = await supabase.functions.invoke("health", { method: "GET" });
        return { operational: !error, latency: Math.round(performance.now() - start) };
      } catch { return { operational: false, latency: 0 }; }
    },
  });

  const { data: realLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["admin-health-logs"],
    refetchInterval: 120_000,
    queryFn: async () => {
      const { data } = await (supabase as any).from("webhook_logs")
        .select("id, platform, status, event_type, ignore_reason, created_at")
        .order("created_at", { ascending: false }).limit(15);
      return (data || []).map((wh: any) => {
        const time = new Date(wh.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        if (wh.status === "error") return { time, level: "error", message: `Webhook falhou: ${wh.platform} — ${wh.event_type || "?"}` };
        if (wh.status === "ignored") return { time, level: "warn", message: `Webhook ignorado: ${wh.platform} — ${wh.ignore_reason || "formato desconhecido"}` };
        return { time, level: "info", message: `${wh.platform}: ${wh.event_type || wh.status} processado` };
      });
    },
  });

  const webhookHasErrors = metrics && metrics.webhookErrors > 0;
  const edgeOk = edgeFnHealth?.operational !== false;

  const healthMetricsData = [
    { label: "Latência Edge", value: edgeFnHealth?.latency ? `${edgeFnHealth.latency}ms` : "—", icon: Zap, change: "Ping /health", changeType: "neutral" as const, help: "Tempo de resposta da Edge Function de saúde." },
    { label: "Taxa de Erro", value: metrics ? `${metrics.errorRate}%` : "—", icon: AlertTriangle, change: metrics ? `${metrics.webhookErrors} erros em ${metrics.totalRequests} req` : "...", changeType: (metrics?.webhookErrors === 0 ? "positive" : "negative") as any, help: "Porcentagem de webhooks com erro nas últimas 24h." },
    { label: "Webhooks Falha", value: metrics ? String(metrics.webhookErrors) : "—", icon: RefreshCw, change: metrics?.webhookErrors === 0 ? "Nenhuma falha" : "Requer atenção", changeType: (metrics?.webhookErrors === 0 ? "positive" : "negative") as any, help: "Webhooks não processados nas últimas 24h." },
    { label: "Ignorados", value: metrics ? String(metrics.webhookIgnored) : "—", icon: Server, change: "Formato não reconhecido", changeType: "neutral" as const, help: "Webhooks ignorados por formato desconhecido." },
  ];

  const healthServicesData = [
    { name: "Motor de Redirect", status: edgeOk ? "operational" : "degraded", desc: "Recebe cliques nos Smart Links e redireciona para a URL de destino." },
    { name: "Rastreamento", status: "operational", desc: "Captura dados de cada clique: país, dispositivo, UTMs, referrer." },
    { name: "Analytics", status: "operational", desc: "Agrega métricas diárias (views, conversões, receita)." },
    { name: "Worker Assíncrono", status: "operational", desc: "Tarefas em segundo plano: e-mails, conversões, automações." },
    { name: "API Webhooks", status: webhookHasErrors ? "degraded" : "operational", desc: "Recebe webhooks de plataformas externas e processa conversões.", degradedReason: webhookHasErrors ? `${metrics!.webhookErrors} erro(s) nas últimas 24h.` : undefined },
    { name: "Edge Functions", status: edgeOk ? "operational" : "degraded", desc: "Funções serverless que processam redirects e integrações.", degradedReason: !edgeOk ? "Health check não respondeu." : undefined },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/80 leading-relaxed space-y-1">
          <p className="font-medium text-sm text-foreground">Monitoramento em Tempo Real</p>
          <p>Dados atualizados automaticamente a cada 30 segundos. <strong>Operacional</strong> = normal &nbsp;•&nbsp; <strong>Degradado</strong> = falhas parciais.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetricsData.map((m) => (
          <div key={m.label} className="relative">
            <MetricCard {...m} />
            <div className="absolute top-3 right-3"><HealthHelpTip text={m.help} /></div>
          </div>
        ))}
      </div>

      {metrics && (
        <div className="rounded-xl bg-card border border-border/50 p-5 card-shadow glass">
          <h3 className="text-sm font-semibold mb-3">Resumo 24h</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><span className="text-muted-foreground block">Cliques</span><span className="text-lg font-bold">{metrics.totalClicks.toLocaleString("pt-BR")}</span></div>
            <div><span className="text-muted-foreground block">Conversões</span><span className="text-lg font-bold">{metrics.totalConversions.toLocaleString("pt-BR")}</span></div>
            <div><span className="text-muted-foreground block">Webhooks</span><span className="text-lg font-bold">{metrics.webhookTotal}</span></div>
            <div><span className="text-muted-foreground block">Taxa de Sucesso</span><span className="text-lg font-bold text-success">{metrics.webhookTotal > 0 ? (((metrics.webhookTotal - metrics.webhookErrors) / metrics.webhookTotal) * 100).toFixed(0) : "100"}%</span></div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-card border border-border/50 p-5 card-shadow glass">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold">Status dos Serviços</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {healthServicesData.map((service) => (
            <div key={service.name} className={cn("p-3 rounded-lg border", service.status === "operational" ? "bg-secondary/30 border-border/20" : "bg-warning/5 border-warning/30")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", service.status === "operational" ? "bg-success" : "bg-warning animate-pulse")} />
                  <span className={cn("text-xs font-medium", service.status === "operational" ? "text-success" : "text-warning")}>
                    {service.status === "operational" ? "Operacional" : "Degradado"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{service.desc}</p>
              {service.status === "degraded" && (service as any).degradedReason && (
                <div className="mt-2 rounded-md bg-warning/10 border border-warning/20 px-2.5 py-1.5">
                  <p className="text-[11px] text-warning leading-relaxed"><strong>Motivo:</strong> {(service as any).degradedReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/50 card-shadow glass overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Logs Recentes (Webhook)</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" /> OK</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Ignorado</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Erro</span>
          </div>
        </div>
        {logsLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">Carregando...</div>
        ) : realLogs.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-muted-foreground">Nenhum webhook recente.</div>
        ) : (
          <div className="divide-y divide-border/10">
            {realLogs.map((log: any, i: number) => (
              <div key={i} className="px-5 py-2.5 flex items-start gap-3 text-xs font-mono hover:bg-accent/20 transition-colors">
                <span className="text-muted-foreground shrink-0 w-16">{log.time}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("shrink-0 w-12 uppercase font-semibold cursor-help",
                      log.level === "info" && "text-info", log.level === "warn" && "text-warning", log.level === "error" && "text-destructive",
                    )}>{log.level}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] text-xs">{logLevelExplanations[log.level]}</TooltipContent>
                </Tooltip>
                <span className="text-secondary-foreground">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "health";
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);

  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  const { data: isSuperAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-super-admin-check"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", userData.user.id).maybeSingle();
      return !!data;
    },
  });

  const { data: plans = [], refetch: refetchPlans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("plans").select("*").order("price");
      return data || [];
    },
    enabled: !!isSuperAdmin,
  });

  const { data: superAdmins = [], refetch: refetchAdmins } = useQuery({
    queryKey: ["super-admins-list"],
    queryFn: async () => {
      const { data: saList } = await (supabase as any).from("super_admins").select("id, user_id, created_at");
      if (!saList || saList.length === 0) return [];
      const userIds = saList.map((sa: any) => sa.user_id);
      // Fetch names
      const { data: profiles } = await (supabase as any).from("profiles").select("id, full_name").in("id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
      // Fetch emails via RPC
      const { data: emails } = await (supabase as any).rpc("get_user_emails_by_ids", { _user_ids: userIds });
      const emailMap = new Map((emails || []).map((e: any) => [e.user_id, e.email]));
      return saList.map((sa: any) => ({
        ...sa,
        name: profileMap.get(sa.user_id) || "Sem nome",
        email: emailMap.get(sa.user_id) || "",
      }));
    },
    enabled: !!isSuperAdmin,
  });

  const { data: globalLimits } = useQuery({
    queryKey: ["admin-global-limits"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("platform_settings").select("*").maybeSingle();
      return data;
    },
    enabled: !!isSuperAdmin,
  });

  const [limits, setLimits] = useState({
    max_accounts: 1000,
    max_free_users: 100,
    log_retention_days: 90,
  });

  useEffect(() => {
    if (globalLimits) {
      setLimits({
        max_accounts: globalLimits.max_accounts ?? 1000,
        max_free_users: globalLimits.max_free_users ?? 100,
        log_retention_days: globalLimits.log_retention_days ?? 90,
      });
    }
  }, [globalLimits]);

  const [motivationalMsg, setMotivationalMsg] = useState("");
  // Legacy — kept for backward compat but no longer used in platform tab

  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ max_projects: 0, max_smartlinks: 0, max_webhooks: 0, max_users: 0, max_agents: 0, max_leads: 0, max_devices: 0, max_surveys: 0, max_variants: 5 });

  const saveLimits = async () => {
    const { error } = await (supabase as any)
      .from("platform_settings")
      .upsert({ id: "global", ...limits, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Limites globais salvos!" });
    qc.invalidateQueries({ queryKey: ["admin-global-limits"] });
  };

  const savePlanLimits = async () => {
    if (!editingPlan) return;
    const { error } = await (supabase as any).from("plans").update({
      max_projects: planForm.max_projects,
      max_smartlinks: planForm.max_smartlinks,
      max_webhooks: planForm.max_webhooks,
      max_users: planForm.max_users,
      max_agents: planForm.max_agents,
      max_leads: planForm.max_leads,
      max_devices: planForm.max_devices,
      max_surveys: planForm.max_surveys,
      max_variants: planForm.max_variants,
    }).eq("id", editingPlan.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Limites do plano ${editingPlan.name} atualizados!` });
    setEditingPlan(null);
    refetchPlans();
  };

  const promoteToSuperAdmin = async () => {
    if (!promoteEmail.trim()) return;
    setPromoting(true);
    try {
      const { data: userId, error: findErr } = await (supabase as any).rpc("find_user_id_by_email", { _email: promoteEmail.trim() });
      if (findErr || !userId) throw new Error("Usuário não encontrado com este email.");
      const { error } = await (supabase as any).from("super_admins").insert({ user_id: userId });
      if (error) throw error;
      toast({ title: "Super Admin promovido!" });
      setPromoteEmail("");
      refetchAdmins();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setPromoting(false); }
  };

  const [removingSuperAdminId, setRemovingSuperAdminId] = useState<string | null>(null);

  const confirmRemoveSuperAdmin = async () => {
    if (!removingSuperAdminId) return;
    const { error } = await (supabase as any).from("super_admins").delete().eq("id", removingSuperAdminId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Super Admin removido" });
    setRemovingSuperAdminId(null);
    refetchAdmins();
  };

  const removeSuperAdmin = async (id: string) => {
    setRemovingSuperAdminId(id);
  };

  const [loginBgUrl, setLoginBgUrl] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementVersion, setAnnouncementVersion] = useState("");
  const [announcementCoverFile, setAnnouncementCoverFile] = useState<File | null>(null);
  const [publishingAnnouncement, setPublishingAnnouncement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [editAnnouncementTitle, setEditAnnouncementTitle] = useState("");
  const [editAnnouncementBody, setEditAnnouncementBody] = useState("");
  const [editAnnouncementVersion, setEditAnnouncementVersion] = useState("");
  const [editAnnouncementCoverFile, setEditAnnouncementCoverFile] = useState<File | null>(null);

  const { data: announcements = [], refetch: refetchAnnouncements } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("system_announcements").select("*").order("published_at", { ascending: false });
      return data || [];
    },
    enabled: !!isSuperAdmin,
  });

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("announcement-covers").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); return null; }
    const { data: urlData } = supabase.storage.from("announcement-covers").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const publishAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    setPublishingAnnouncement(true);
    try {
      let coverUrl: string | null = null;
      if (announcementCoverFile) {
        coverUrl = await uploadCoverImage(announcementCoverFile);
      }
      const { error } = await (supabase as any).from("system_announcements").insert({
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        version: announcementVersion.trim() || null,
        cover_image_url: coverUrl,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "Novidade publicada!" });
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setAnnouncementVersion("");
      setAnnouncementCoverFile(null);
      refetchAnnouncements();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setPublishingAnnouncement(false); }
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    let coverUrl = editingAnnouncement.cover_image_url;
    if (editAnnouncementCoverFile) {
      const uploaded = await uploadCoverImage(editAnnouncementCoverFile);
      if (uploaded) coverUrl = uploaded;
    }
    const { error } = await (supabase as any).from("system_announcements").update({
      title: editAnnouncementTitle.trim(),
      body: editAnnouncementBody.trim(),
      version: editAnnouncementVersion.trim() || null,
      cover_image_url: coverUrl,
    }).eq("id", editingAnnouncement.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Novidade atualizada!" });
    setEditingAnnouncement(null);
    setEditAnnouncementCoverFile(null);
    refetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Excluir esta novidade?")) return;
    const { error } = await (supabase as any).from("system_announcements").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Novidade excluída" });
    refetchAnnouncements();
  };

  if (checkingAdmin) {
    return (
      <DashboardLayout title="Administração" subtitle="Configurações administrativas">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout title="Administração" subtitle="Acesso restrito">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-2">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">Acesso restrito a administradores do sistema.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { key: "health", label: "Saúde do Sistema", icon: Activity },
    { key: "users", label: "Usuários", icon: Users },
    { key: "sales", label: "Vendas", icon: ShoppingCart },
    { key: "alerts", label: "Alertas", icon: AlertTriangle },
    { key: "novidades", label: "Novidades", icon: Megaphone },
    { key: "chatbot", label: "Chatbot Suporte", icon: Bot },
    { key: "platform", label: "Plataforma", icon: Globe },
    { key: "plans", label: "Planos", icon: Package },
    { key: "limits", label: "Limites Globais", icon: Sliders },
    { key: "superadmins", label: "Super Admins", icon: Shield },
  ];

  const fmtNum = (n: number) => n.toLocaleString("pt-BR");

  return (
    <DashboardLayout title="Administração" subtitle="Configurações do sistema (Super Admin)" actions={<ProductTour {...TOURS.adminSettings} />}>
      <div className="w-full flex items-center mb-6 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 sm:flex-initial px-2 sm:px-4 py-3 sm:py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap",
              activeTab === tab.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            title={tab.label}
          >
            <tab.icon className="h-5 w-5 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "sales" && <SalesTab isSuperAdmin={!!isSuperAdmin} />}

      {activeTab === "alerts" && (
        <div className="space-y-6">
          <GlobalAlertsManager />
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <SystemWarnings />
          </div>
        </div>
      )}

      {activeTab === "health" && <SystemHealthTab />}

      {activeTab === "novidades" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />Publicar Novidade
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Título</Label>
                  <Input value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} placeholder="Título da novidade" className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Versão (opcional)</Label>
                  <Input value={announcementVersion} onChange={e => setAnnouncementVersion(e.target.value)} placeholder="Ex: v2.1.0" className="text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Corpo</Label>
                <Textarea value={announcementBody} onChange={e => setAnnouncementBody(e.target.value)} placeholder="Descreva a novidade..." className="text-xs min-h-[100px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Imagem de capa (opcional)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/50 cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                    <ImagePlus className="h-4 w-4" />
                    {announcementCoverFile ? announcementCoverFile.name : "Selecionar imagem"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setAnnouncementCoverFile(e.target.files?.[0] || null)} />
                  </label>
                  {announcementCoverFile && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setAnnouncementCoverFile(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <Button size="sm" className="gradient-bg border-0 text-primary-foreground text-xs" onClick={publishAnnouncement} disabled={publishingAnnouncement || !announcementTitle.trim() || !announcementBody.trim()}>
                {publishingAnnouncement ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />Novidades Publicadas
            </h2>
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div key={a.id} className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                  {editingAnnouncement?.id === a.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input value={editAnnouncementTitle} onChange={e => setEditAnnouncementTitle(e.target.value)} className="text-xs" placeholder="Título" />
                        <Input value={editAnnouncementVersion} onChange={e => setEditAnnouncementVersion(e.target.value)} className="text-xs" placeholder="Versão (opcional)" />
                      </div>
                      <Textarea value={editAnnouncementBody} onChange={e => setEditAnnouncementBody(e.target.value)} className="text-xs min-h-[80px]" />
                      <div className="space-y-1.5">
                        <Label className="text-xs">Imagem de capa</Label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/50 cursor-pointer hover:border-primary/50 transition-colors text-xs text-muted-foreground">
                            <ImagePlus className="h-4 w-4" />
                            {editAnnouncementCoverFile ? editAnnouncementCoverFile.name : (editingAnnouncement.cover_image_url ? "Trocar imagem" : "Selecionar imagem")}
                            <input type="file" accept="image/*" className="hidden" onChange={e => setEditAnnouncementCoverFile(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                        {editingAnnouncement.cover_image_url && !editAnnouncementCoverFile && (
                          <img src={editingAnnouncement.cover_image_url} alt="" className="h-16 rounded-lg object-cover mt-1" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="gradient-bg border-0 text-primary-foreground text-xs gap-1" onClick={updateAnnouncement}>
                          <Check className="h-3 w-3" /> Salvar
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { setEditingAnnouncement(null); setEditAnnouncementCoverFile(null); }}>
                          <X className="h-3 w-3" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {a.cover_image_url && (
                        <img src={a.cover_image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {a.title}
                            {a.version && <Badge variant="outline" className="text-[10px]">{a.version}</Badge>}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{new Date(a.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => {
                            setEditingAnnouncement(a);
                            setEditAnnouncementTitle(a.title);
                            setEditAnnouncementBody(a.body);
                            setEditAnnouncementVersion(a.version || "");
                            setEditAnnouncementCoverFile(null);
                          }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAnnouncement(a.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{a.body}</p>
                    </>
                  )}
                </div>
              ))}
              {announcements.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma novidade publicada.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && <AdminUsersTab />}

      {activeTab === "chatbot" && (
        <ChatbotSupportConfig />
      )}

      {activeTab === "platform" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />Configurações da Plataforma
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Imagem de fundo da tela de login</Label>
                <p className="text-[10px] text-muted-foreground">Insira a URL da imagem que aparecerá no lado direito da tela de login.</p>
                <Input value={loginBgUrl} onChange={(e) => setLoginBgUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" className="text-xs" />
              </div>
              <Button size="sm" className="gradient-bg border-0 text-primary-foreground hover:opacity-90 text-xs" onClick={async () => {
                const { error } = await (supabase as any).from("platform_settings").upsert({ id: "global", login_bg_url: loginBgUrl, updated_at: new Date().toISOString() }, { onConflict: "id" });
                if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
                toast({ title: "Imagem de fundo atualizada!" });
              }}>Salvar imagem de fundo</Button>
            </div>
          </div>
          <MotivationalMessagesManager />
        </div>
      )}

      {activeTab === "plans" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />Limites por Plano
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Edite os limites de cada plano. Alterações aqui afetam novas assinaturas e upgrades.</p>
            <div className="space-y-3">
              {plans.map((plan: any) => (
                <div key={plan.id} className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PlanBadge planName={plan.name} size="md" />
                      <p className="text-[10px] text-muted-foreground">
                        R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                      </p>
                    </div>
                    {editingPlan?.id === plan.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingPlan(null)}>Cancelar</Button>
                        <Button size="sm" className="gradient-bg border-0 text-primary-foreground text-xs" onClick={savePlanLimits}>Salvar</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                        setEditingPlan(plan);
                        setPlanForm({ max_projects: plan.max_projects, max_smartlinks: plan.max_smartlinks, max_webhooks: plan.max_webhooks, max_users: plan.max_users, max_agents: plan.max_agents ?? 0, max_leads: plan.max_leads ?? 0, max_devices: plan.max_devices ?? 0, max_surveys: plan.max_surveys ?? 0, max_variants: plan.max_variants ?? 5 });
                      }}>Editar limites</Button>
                    )}
                  </div>
                  {editingPlan?.id === plan.id ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1"><Label className="text-[10px]">Projetos</Label><Input type="number" value={planForm.max_projects} onChange={e => setPlanForm({ ...planForm, max_projects: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Smart Links</Label><Input type="number" value={planForm.max_smartlinks} onChange={e => setPlanForm({ ...planForm, max_smartlinks: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Webhooks</Label><Input type="number" value={planForm.max_webhooks} onChange={e => setPlanForm({ ...planForm, max_webhooks: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Usuários</Label><Input type="number" value={planForm.max_users} onChange={e => setPlanForm({ ...planForm, max_users: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Agentes IA</Label><Input type="number" value={planForm.max_agents} onChange={e => setPlanForm({ ...planForm, max_agents: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Leads</Label><Input type="number" value={planForm.max_leads} onChange={e => setPlanForm({ ...planForm, max_leads: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Dispositivos</Label><Input type="number" value={planForm.max_devices} onChange={e => setPlanForm({ ...planForm, max_devices: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Pesquisas & Quiz</Label><Input type="number" value={planForm.max_surveys} onChange={e => setPlanForm({ ...planForm, max_surveys: Number(e.target.value) })} className="text-xs h-8" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Variantes / Link</Label><Input type="number" value={planForm.max_variants} onChange={e => setPlanForm({ ...planForm, max_variants: Number(e.target.value) })} className="text-xs h-8" /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-9 gap-3 text-center">
                      <div><p className="text-[10px] text-muted-foreground">Projetos</p><p className="text-sm font-bold">{fmtNum(plan.max_projects)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Smart Links</p><p className="text-sm font-bold">{fmtNum(plan.max_smartlinks)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Webhooks</p><p className="text-sm font-bold">{fmtNum(plan.max_webhooks)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Usuários</p><p className="text-sm font-bold">{fmtNum(plan.max_users)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Agentes IA</p><p className="text-sm font-bold">{fmtNum(plan.max_agents ?? 0)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Leads</p><p className="text-sm font-bold">{fmtNum(plan.max_leads ?? 0)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Dispositivos</p><p className="text-sm font-bold">{fmtNum(plan.max_devices ?? 0)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Pesquisas</p><p className="text-sm font-bold">{fmtNum(plan.max_surveys ?? 0)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Variantes</p><p className="text-sm font-bold">{fmtNum(plan.max_variants ?? 5)}</p></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "limits" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />Limites Globais da Plataforma
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Configurações gerais que se aplicam a toda a plataforma, independente do plano.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label className="text-xs">Máx. contas na plataforma</Label><Input type="number" value={limits.max_accounts} onChange={e => setLimits({ ...limits, max_accounts: Number(e.target.value) })} className="text-xs" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Máx. usuários free permitidos</Label><Input type="number" value={limits.max_free_users} onChange={e => setLimits({ ...limits, max_free_users: Number(e.target.value) })} className="text-xs" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Retenção de logs (dias)</Label><Input type="number" value={limits.log_retention_days} onChange={e => setLimits({ ...limits, log_retention_days: Number(e.target.value) })} className="text-xs" /></div>
            </div>
            <Button onClick={saveLimits} size="sm" className="gradient-bg border-0 text-primary-foreground hover:opacity-90 text-xs mt-4">Salvar limites globais</Button>
          </div>
        </div>
      )}

      {activeTab === "superadmins" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />Promover Super Admin
            </h2>
            <div className="flex gap-2">
              <Input value={promoteEmail} onChange={(e) => setPromoteEmail(e.target.value)} placeholder="email@usuario.com" className="text-xs" />
              <Button size="sm" onClick={promoteToSuperAdmin} disabled={promoting || !promoteEmail.trim()} className="gradient-bg border-0 text-primary-foreground text-xs whitespace-nowrap">
                {promoting ? "Promovendo..." : "Promover"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />Super Administradores
            </h2>
            <div className="space-y-2">
              {superAdmins.map((sa: any) => (
                <div key={sa.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30">
                  <div>
                    <p className="text-sm font-medium">{sa.name}</p>
                    <p className="text-[10px] text-muted-foreground">{sa.email}</p>
                    <p className="text-[10px] text-muted-foreground">Desde {new Date(sa.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Super Admin</Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeSuperAdmin(sa.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {superAdmins.length === 0 && <p className="text-xs text-muted-foreground">Nenhum super admin encontrado.</p>}
            </div>
          </div>
        </div>
      )}


      {/* Super Admin removal modal */}
      <AlertDialog open={!!removingSuperAdminId} onOpenChange={(o) => !o && setRemovingSuperAdminId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Super Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá revogar os privilégios de super administrador deste usuário. Ele voltará aos limites do plano original.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveSuperAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

/* ─── Plan Badge Component ─── */
function PlanBadge({ planName, size = "sm" }: { planName: string; size?: "sm" | "md" }) {
  const name = (planName || "free").toLowerCase();
  const config: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string; label: string }> = {
    free: { icon: <Star className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />, bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border/30", label: "Free" },
    bronze: { icon: <Medal className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />, bg: "bg-amber-900/20", text: "text-amber-600", border: "border-amber-700/30", label: "Bronze" },
    prata: { icon: <Award className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />, bg: "bg-slate-400/10", text: "text-slate-300", border: "border-slate-400/30", label: "Prata" },
    ouro: { icon: <Crown className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />, bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30", label: "Ouro" },
  };
  const c = config[name] || config.free;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-semibold",
      c.bg, c.text, c.border,
      size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
    )}>
      {c.icon}
      {c.label}
    </span>
  );
}

/* ─── Admin Users Tab ─── */
function AdminUsersTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans-for-users"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("plans").select("id, name, price").order("price");
      return data || [];
    },
  });

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = !search || 
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.account_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || (u.plan_name || "free").toLowerCase() === planFilter.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const uniquePlans = [...new Set(users.map((u: any) => u.plan_name || "free"))];

  const startEdit = (u: any) => {
    setEditingUser(u.user_id);
    setEditName(u.full_name || "");
    setEditPhone(u.phone || "");
    setEditPlan(u.plan_name || "free");
  };

  const saveEdit = async (userId: string) => {
    setSaving(true);
    try {
      // Update name/phone
      const { error } = await supabase.rpc("admin_update_user", {
        _user_id: userId,
        _full_name: editName || null,
        _phone: editPhone || null,
      });
      if (error) throw error;

      // Update plan if changed
      const user = users.find((u: any) => u.user_id === userId);
      if (user && editPlan && editPlan.toLowerCase() !== (user.plan_name || "free").toLowerCase()) {
        const { error: planErr } = await supabase.rpc("admin_update_user_plan", {
          _user_id: userId,
          _plan_name: editPlan,
        });
        if (planErr) throw planErr;
      }

      toast({ title: "Usuário atualizado!" });
      setEditingUser(null);
      qc.invalidateQueries({ queryKey: ["admin-all-users"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Buscar</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, email ou conta..." className="pl-8 h-8 text-xs" />
            </div>
          </div>
          <div className="min-w-[140px]">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Plano</Label>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniquePlans.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="h-8 text-xs">{filteredUsers.length} usuário(s)</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center text-muted-foreground text-sm">Nenhum usuário encontrado.</div>
      ) : (
        <div className="rounded-xl bg-card border border-border/50 card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="w-8" />
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Conta</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Cadastro</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Último login</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u: any) => {
                  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                  const fmtDateTime = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";
                  const isExpanded = expandedUser === u.user_id;
                  const isEditing = editingUser === u.user_id;
                  const isFree = (u.plan_name || "free").toLowerCase() === "free";

                  return (
                    <React.Fragment key={u.user_id}>
                      <tr className="border-b border-border/20 hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}>
                        <td className="px-2 py-3 text-center">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                              {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" /> : (u.full_name?.charAt(0)?.toUpperCase() || "?")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{u.full_name || "Sem nome"}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[120px]">{u.account_name || "—"}</td>
                        <td className="px-4 py-3"><PlanBadge planName={u.plan_name || "free"} /></td>
                        <td className="px-4 py-3">
                          {isFree ? (
                            <Badge variant="secondary" className="text-[10px]">Cadastrado</Badge>
                          ) : (
                            <Badge variant={u.subscription_status === "active" ? "default" : "secondary"} className={cn("text-[10px] capitalize", u.subscription_status === "active" && "bg-success/20 text-success border-success/30")}>
                              {u.subscription_status === "active" ? "Ativo" : u.subscription_status || "—"}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{fmtDate(u.created_at)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{fmtDate(u.last_sign_in_at)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-border/10">
                          <td colSpan={7} className="px-4 py-4 bg-muted/30">
                            {isEditing ? (
                              <div className="space-y-3 max-w-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome</Label>
                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</Label>
                                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Plano</Label>
                                    <Select value={editPlan} onValueChange={setEditPlan}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {plans.map((p: any) => (
                                          <SelectItem key={p.id} value={p.name} className="capitalize">{p.name} — R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="h-7 text-xs gradient-bg border-0 text-primary-foreground hover:opacity-90 gap-1" disabled={saving} onClick={() => saveEdit(u.user_id)}>
                                    <Save className="h-3 w-3" />{saving ? "Salvando..." : "Salvar"}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingUser(null)}>Cancelar</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  <div><span className="text-muted-foreground block">Email</span><span className="font-medium break-all">{u.email}</span></div>
                                  <div><span className="text-muted-foreground block">Telefone</span><span className="font-medium">{u.phone || "—"}</span></div>
                                  <div><span className="text-muted-foreground block">Plano</span><PlanBadge planName={u.plan_name || "free"} size="md" /></div>
                                  <div><span className="text-muted-foreground block">Status</span><span className="font-medium capitalize">{isFree ? "Cadastrado" : (u.subscription_status || "—")}</span></div>
                                  <div><span className="text-muted-foreground block">Data de Cadastro</span><span className="font-medium font-mono">{fmtDateTime(u.created_at)}</span></div>
                                  <div><span className="text-muted-foreground block">Último Login</span><span className="font-medium font-mono">{fmtDateTime(u.last_sign_in_at)}</span></div>
                                  <div><span className="text-muted-foreground block">Conta (Org)</span><span className="font-medium">{u.account_name || "—"}</span></div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); startEdit(u); }}>
                                    <Edit2 className="h-3 w-3" /> Editar
                                  </Button>
                                  <ResendEmailButton email={u.email} action="reset_password" label="Reenviar redefinição de senha" icon={<KeyRound className="h-3 w-3" />} />
                                  <ResendEmailButton email={u.email} action="resend_confirmation" label="Reenviar confirmação de conta" icon={<MailCheck className="h-3 w-3" />} />
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SalesTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["admin-sales-report"],
    queryFn: async () => {
      // Get all subscriptions with plan info and user info
      const { data: subs } = await (supabase as any)
        .from("subscriptions")
        .select("account_id, plan_type, plan_id, status, provider, hotmart_transaction_id, created_at, current_period_start, current_period_end")
        .eq("provider", "hotmart")
        .order("created_at", { ascending: false });

      const { data: plans } = await (supabase as any)
        .from("plans")
        .select("id, name, price");

      const { data: hotmartEvents } = await (supabase as any)
        .from("hotmart_webhook_events")
        .select("event_type, customer_email, transaction_id, hotmart_product_id, created_at, status")
        .in("event_type", ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"])
        .eq("status", "processed")
        .order("created_at", { ascending: false })
        .limit(200);

      // Get account → user mapping
      const accountIds = (subs || []).map((s: any) => s.account_id);
      const { data: accountUsers } = await (supabase as any)
        .from("account_users")
        .select("account_id, user_id")
        .in("account_id", accountIds.length > 0 ? accountIds : ["none"]);

      const userIds = (accountUsers || []).map((au: any) => au.user_id);
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds.length > 0 ? userIds : ["none"]);

      const { data: emails } = userIds.length > 0
        ? await (supabase as any).rpc("get_user_emails_by_ids", { _user_ids: userIds })
        : { data: [] };

      return { subs: subs || [], plans: plans || [], hotmartEvents: hotmartEvents || [], accountUsers: accountUsers || [], profiles: profiles || [], emails: emails || [] };
    },
    enabled: isSuperAdmin,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
  }

  const { subs = [], plans = [], hotmartEvents = [], accountUsers = [], profiles = [], emails = [] } = salesData || {};

  const planMap: Record<string, any> = {};
  plans.forEach((p: any) => { planMap[p.id] = p; });
  const auMap: Record<string, string> = {};
  accountUsers.forEach((au: any) => { auMap[au.account_id] = au.user_id; });
  const profileMap: Record<string, string> = {};
  profiles.forEach((p: any) => { profileMap[p.id] = p.full_name; });
  const emailMap: Record<string, string> = {};
  emails.forEach((e: any) => { emailMap[e.user_id] = e.email; });

  // Summary by plan (exclude free)
  const planSummary = new Map<string, { name: string; price: number; active: number; canceled: number; pastDue: number; total: number }>();
  for (const sub of subs) {
    const plan = planMap[sub.plan_id];
    const planName = plan?.name || sub.plan_type || "free";
    const planPrice = plan?.price || 0;
    if (planName === "free" || planPrice === 0) continue; // skip free
    if (!planSummary.has(planName)) {
      planSummary.set(planName, { name: planName, price: planPrice, active: 0, canceled: 0, pastDue: 0, total: 0 });
    }
    const s = planSummary.get(planName)!;
    s.total++;
    if (sub.status === "active") s.active++;
    else if (sub.status === "canceled") s.canceled++;
    else if (sub.status === "past_due") s.pastDue++;
  }

  const summaryArr = [...planSummary.values()].sort((a, b) => b.price - a.price);
  const totalActive = summaryArr.reduce((s, p) => s + p.active, 0);
  const totalMRR = summaryArr.reduce((s, p) => s + p.active * p.price, 0);

  // Paid subs only (non-free)
  const paidSubs = subs.filter((s: any) => s.plan_type !== "free");
  const paidActiveSubs = paidSubs.filter((s: any) => s.status === "active");

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtMoney = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="w-full space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-4 text-center">
          <p className="text-2xl font-bold text-success">{paidActiveSubs.length}</p>
          <p className="text-xs text-muted-foreground">Assinantes Pagos Ativos</p>
        </div>
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-4 text-center">
          <p className="text-2xl font-bold text-primary">{fmtMoney(totalMRR)}</p>
          <p className="text-xs text-muted-foreground">MRR Estimado</p>
        </div>
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-4 text-center">
          <p className="text-2xl font-bold">{paidSubs.length}</p>
          <p className="text-xs text-muted-foreground">Total Assinaturas Pagas</p>
        </div>
      </div>

      {/* Summary by Plan */}
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Distribuição por Plano</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Plano</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Preço</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ativos</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cancelados</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Inadimplentes</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Receita Mensal</th>
              </tr>
            </thead>
            <tbody>
              {summaryArr.map((p) => (
                <tr key={p.name} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium capitalize">{p.name}</td>
                  <td className="py-2.5 px-3 text-right">{fmtMoney(p.price)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-success">{p.active}</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{p.canceled}</td>
                  <td className="py-2.5 px-3 text-right text-warning">{p.pastDue}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{p.total}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-primary">{fmtMoney(p.active * p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Hotmart Events */}
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" />Últimas Vendas (Hotmart)</h2>
        {hotmartEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma venda registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Evento</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Transação</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Produto ID</th>
                </tr>
              </thead>
              <tbody>
                {hotmartEvents.map((e: any) => (
                  <tr key={e.transaction_id + e.created_at} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fmtDate(e.created_at)}</td>
                    <td className="py-2.5 px-3 truncate max-w-[180px]">{e.customer_email || "—"}</td>
                    <td className="py-2.5 px-3">{e.event_type}</td>
                    <td className="py-2.5 px-3 font-mono truncate max-w-[120px]">{e.transaction_id || "—"}</td>
                    <td className="py-2.5 px-3 font-mono">{e.hotmart_product_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paid Active Subscribers */}
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Assinantes Pagos Ativos ({paidActiveSubs.length})</h2>
        {paidActiveSubs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum assinante pago ativo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Plano</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Desde</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Próx. Cobrança</th>
                </tr>
              </thead>
              <tbody>
                {paidActiveSubs.map((sub: any) => {
                  const userId = auMap[sub.account_id];
                  const name = userId ? profileMap[userId] || "—" : "—";
                  const email = userId ? emailMap[userId] || "—" : "—";
                  const plan = planMap[sub.plan_id];
                  return (
                    <tr key={sub.account_id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{name}</td>
                      <td className="py-2.5 px-3 truncate max-w-[180px]">{email}</td>
                      <td className="py-2.5 px-3 capitalize">{plan?.name || sub.plan_type}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fmtDate(sub.created_at)}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fmtDate(sub.current_period_end)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Resend Email Button ─── */
function ResendEmailButton({ email, action, label, icon }: { email: string; action: string; label: string; icon: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-resend-email", {
        body: { action, email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: data?.message || "Email enviado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={loading} onClick={handleClick}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : icon}
      {label}
    </Button>
  );
}

function ChatbotSupportConfig() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [model, setModel] = useState("gpt-5-mini");
  const [systemPrompt, setSystemPrompt] = useState("Você é o assistente de suporte do Nexus Metrics. Responda de forma clara, educada e objetiva em português. Ajude o usuário com dúvidas sobre a plataforma, funcionalidades, integrações e configurações. Se não souber a resposta, oriente o usuário a aguardar um atendente humano.");
  const [greetingMessage, setGreetingMessage] = useState("Olá! 👋 Sou o assistente virtual do Nexus. Como posso ajudar?");
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperature, setTemperature] = useState(0.7);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [subTab, setSubTab] = useState<"config" | "tickets">("config");

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-chatbot-config"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("support_chatbot_config")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch all tickets for admin view
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("support_tickets")
        .select("id, subject, status, priority, category, created_at, updated_at, user_id, body")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  // Fetch user emails for the tickets
  const userIds = [...new Set(tickets.map((t: any) => t.user_id))];
  const { data: userEmails = [] } = useQuery({
    queryKey: ["admin-ticket-user-emails", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await (supabase as any).rpc("get_user_emails_by_ids", { _user_ids: userIds });
      return data || [];
    },
    enabled: userIds.length > 0,
  });
  const emailMap = new Map((userEmails as any[]).map((u: any) => [u.user_id, u.email]));

  useEffect(() => {
    if (config) {
      setIsEnabled(config.is_enabled);
      setModel(config.model || "gpt-5-mini");
      setSystemPrompt(config.system_prompt || "");
      setGreetingMessage(config.greeting_message || "");
      setMaxTokens(config.max_tokens || 1000);
      setTemperature(Number(config.temperature) || 0.7);
      setApiKey(config.openai_api_key || "");
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: firstAccount } = await (supabase as any)
        .from("account_users")
        .select("account_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      const payload = {
        account_id: firstAccount?.account_id,
        is_enabled: isEnabled,
        model,
        system_prompt: systemPrompt,
        greeting_message: greetingMessage,
        max_tokens: maxTokens,
        temperature,
      };

      if (config?.id) {
        const { error } = await (supabase as any).from("support_chatbot_config").update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("support_chatbot_config").insert(payload);
        if (error) throw error;
      }
      toast({ title: "Configurações do chatbot salvas!" });
      qc.invalidateQueries({ queryKey: ["admin-chatbot-config"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "closed") updates.closed_at = new Date().toISOString();
    const { error } = await (supabase as any).from("support_tickets").update(updates).eq("id", ticketId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Ticket ${newStatus === "closed" ? "fechado" : "atualizado"}!` });
    qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>;

  const openTickets = tickets.filter((t: any) => t.status !== "closed");
  const closedTickets = tickets.filter((t: any) => t.status === "closed");

  const statusColors: Record<string, string> = {
    open: "bg-warning/20 text-warning",
    in_progress: "bg-info/20 text-info",
    waiting: "bg-primary/20 text-primary",
    closed: "bg-muted text-muted-foreground",
  };
  const statusLabels: Record<string, string> = {
    open: "Aberto",
    in_progress: "Em atendimento",
    waiting: "Aguardando",
    closed: "Fechado",
  };
  const priorityColors: Record<string, string> = {
    low: "text-muted-foreground",
    medium: "text-warning",
    high: "text-destructive",
    urgent: "text-destructive font-bold",
  };

  return (
    <div className="w-full space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border/30 pb-0">
        <button
          onClick={() => setSubTab("config")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            subTab === "config" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-3.5 w-3.5 inline mr-1.5" /> Configurações
        </button>
        <button
          onClick={() => setSubTab("tickets")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            subTab === "tickets" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-3.5 w-3.5 inline mr-1.5" /> Atendimentos
          {openTickets.length > 0 && (
            <span className="ml-1.5 bg-destructive/20 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {openTickets.length}
            </span>
          )}
        </button>
      </div>

      {subTab === "config" && (
        <>
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" /> Chatbot de Pré-Atendimento
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Assistente IA que faz o pré-atendimento automático no suporte da plataforma.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{isEnabled ? "Ativo" : "Inativo"}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            </div>

            <div className="rounded-lg bg-info/10 border border-info/20 p-3 text-xs text-muted-foreground">
              <strong className="text-info">🔒 Uso interno:</strong> Este chatbot é gerenciado exclusivamente pela equipe do Nexus Metrics. A chave da OpenAI é armazenada como secret do Supabase.
            </div>

            {isEnabled && (
              <div className="space-y-5 pt-2 border-t border-border/30">
                <div className="space-y-1.5">
                  <Label className="text-xs">Modelo OpenAI</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 bg-popover border border-border shadow-lg">
                      <SelectItem value="gpt-5-mini">GPT-5 Mini (recomendado)</SelectItem>
                      <SelectItem value="gpt-5">GPT-5 (máxima qualidade)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (econômico)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                      <SelectItem value="o4-mini">o4-mini (raciocínio)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Prompt do Sistema</Label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={6}
                    className="text-xs font-mono"
                    placeholder="Defina a personalidade e comportamento do chatbot..."
                  />
                  <p className="text-[10px] text-muted-foreground">{systemPrompt.length} caracteres</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Mensagem de Boas-vindas</Label>
                  <Input
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    placeholder="Primeira mensagem que o bot envia ao usuário"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Tokens: {maxTokens}</Label>
                    <input type="range" min={100} max={4000} step={100} value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} className="w-full accent-primary" />
                    <p className="text-[10px] text-muted-foreground">Limite de tokens por resposta</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Temperatura: {temperature.toFixed(1)}</Label>
                    <input type="range" min={0} max={100} step={5} value={temperature * 100} onChange={e => setTemperature(Number(e.target.value) / 100)} className="w-full accent-primary" />
                    <p className="text-[10px] text-muted-foreground">0 = preciso, 1 = criativo</p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border/30 p-3 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground">🔑 API Key</p>
                  <p className="text-[10px] text-muted-foreground">
                    A chave da OpenAI (<code className="bg-muted px-1 rounded">OPENAI_API_KEY</code>) está configurada como secret do Supabase. Para alterar, acesse as configurações de secrets do projeto no painel do Supabase.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="gradient-bg border-0 text-primary-foreground hover:opacity-90 gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </>
      )}

      {subTab === "tickets" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Abertos" value={String(tickets.filter((t: any) => t.status === "open").length)} icon={AlertTriangle} />
            <MetricCard label="Em Atendimento" value={String(tickets.filter((t: any) => t.status === "in_progress").length)} icon={Users} />
            <MetricCard label="Aguardando" value={String(tickets.filter((t: any) => t.status === "waiting").length)} icon={Loader2} />
            <MetricCard label="Fechados" value={String(closedTickets.length)} icon={Check} />
          </div>

          {/* Open tickets */}
          <div className="rounded-xl bg-card border border-border/50 card-shadow overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Tickets em Atendimento
              </h3>
              <span className="text-xs text-muted-foreground">{openTickets.length} ativo{openTickets.length !== 1 ? "s" : ""}</span>
            </div>

            {ticketsLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando tickets...</div>
            ) : openTickets.length === 0 ? (
              <div className="p-8 text-center">
                <Check className="h-10 w-10 text-success/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum ticket aberto no momento 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {openTickets.map((ticket: any) => (
                  <div key={ticket.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[ticket.status] || statusColors.open)}>
                            {statusLabels[ticket.status] || ticket.status}
                          </span>
                          <span className={cn("text-[10px]", priorityColors[ticket.priority] || "text-muted-foreground")}>
                            {ticket.priority === "urgent" ? "🔴" : ticket.priority === "high" ? "🟠" : ticket.priority === "medium" ? "🟡" : "⚪"} {ticket.priority}
                          </span>
                          <span className="text-[10px] text-muted-foreground">#{ticket.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.body?.slice(0, 100)}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            👤 {emailMap.get(ticket.user_id) || ticket.user_id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            🕐 {new Date(ticket.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">📂 {ticket.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ticket.status === "open" && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleUpdateTicketStatus(ticket.id, "in_progress")}>
                            <Zap className="h-3 w-3" /> Atender
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleUpdateTicketStatus(ticket.id, "closed")}>
                          <X className="h-3 w-3" /> Fechar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently closed */}
          {closedTickets.length > 0 && (
            <div className="rounded-xl bg-card border border-border/50 card-shadow overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground">Tickets Fechados Recentes</h3>
              </div>
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {closedTickets.slice(0, 20).map((ticket: any) => (
                  <div key={ticket.id} className="px-5 py-2.5 flex items-center justify-between gap-3 opacity-60">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">{ticket.subject}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {emailMap.get(ticket.user_id) || ticket.user_id.slice(0, 8)} · {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Fechado</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
