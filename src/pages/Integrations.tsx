import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import WebhookManager from "@/components/WebhookManager";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { Webhook, ScrollText, Filter, Download, ChevronDown, ChevronRight, ChevronLeft, FileCode, Plus, Copy, Trash2, ExternalLink, User, Mail, Phone, Check, Pencil, RotateCcw, Megaphone, Unplug, Loader2, Code, Plug2, Eye, EyeOff, RefreshCw } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DateFilter, { DateRange, getDefaultDateRange } from "@/components/DateFilter";
import { exportToCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ProductTour, { TOURS } from "@/components/ProductTour";

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get("tab") || "integracoes";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [newIntegrationOpen, setNewIntegrationOpen] = useState(false);
  const [newIntegrationCategory, setNewIntegrationCategory] = useState<"webhook" | "platform" | "form" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);

  // Handle Meta/Google OAuth callback results
  useEffect(() => {
    const metaResult = searchParams.get("meta");
    if (metaResult === "success") {
      toast.success("Meta Ads conectado com sucesso!");
    } else if (metaResult === "error") {
      toast.error("Erro ao conectar Meta Ads. Tente novamente.");
    }
    const googleResult = searchParams.get("google");
    if (googleResult === "success") {
      toast.success("Google conectado com sucesso!");
    } else if (googleResult === "error") {
      toast.error("Erro ao conectar Google. Tente novamente.");
    }
  }, [searchParams]);

  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();

  const tabs = [
    { key: "integracoes", label: "Integrações", icon: Plug2 },
    { key: "logs", label: "Logs", icon: ScrollText },
  ];

  return (
    <DashboardLayout title="Integrações" subtitle="Conecte seu funil com as principais plataformas do mercado digital" actions={
      <ProductTour {...TOURS.integrations} />
    }>
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center border-b border-border/50">
            {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(`/integracoes?tab=${tab.key}`)}
              className={cn(
                "px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5",
                activeTab === tab.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
          </div>
          <Button className="gap-1.5 text-xs" onClick={() => setNewIntegrationOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nova Integração
          </Button>
        </div>

        {activeTab === "integracoes" && (
          <UnifiedIntegrationsView
            accountId={activeAccountId}
            projectId={activeProjectId}
            onNewIntegration={() => setNewIntegrationOpen(true)}
          />
        )}
        {activeTab === "logs" && <WebhookLogsTab accountId={activeAccountId} />}
      </div>

      {/* Nova Integração Modal */}
      <Dialog open={newIntegrationOpen} onOpenChange={(v) => { if (!v) { setNewIntegrationOpen(false); setNewIntegrationCategory(null); setSearchQuery(""); } else setNewIntegrationOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{newIntegrationCategory ? (
              newIntegrationCategory === "webhook" ? "Criar Webhook" :
              newIntegrationCategory === "platform" ? "Selecionar Plataforma" :
              "Criar Formulário"
            ) : "Nova Integração"}</DialogTitle>
          </DialogHeader>

          {!newIntegrationCategory ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => setNewIntegrationCategory("webhook")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Webhook className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Webhook</p>
                  <p className="text-[10px] text-muted-foreground mt-1">URL única para receber eventos de qualquer plataforma</p>
                </div>
              </button>
              <button
                onClick={() => setNewIntegrationCategory("platform")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plug2 className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Plataforma</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Hotmart, Kiwify, Eduzz, Braip, Cakto, Meta Ads, Google</p>
                </div>
              </button>
              <button
                onClick={() => setNewIntegrationCategory("form")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileCode className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Formulário</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Formulário HTML para capturar leads em suas páginas</p>
                </div>
              </button>
            </div>
          ) : newIntegrationCategory === "platform" ? (
            <div className="space-y-3 pt-2">
              <Button variant="ghost" size="sm" className="text-xs gap-1 -ml-2" onClick={() => setNewIntegrationCategory(null)}>
                <ChevronLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <div className="relative">
                <Input
                  placeholder="Buscar plataforma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <PlatformSelectionGrid
                searchQuery={searchQuery}
                accountId={activeAccountId}
                projectId={activeProjectId}
                onClose={() => { setNewIntegrationOpen(false); setNewIntegrationCategory(null); setSearchQuery(""); }}
              />
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Button variant="ghost" size="sm" className="text-xs gap-1 -ml-2" onClick={() => setNewIntegrationCategory(null)}>
                <ChevronLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              {newIntegrationCategory === "webhook" ? (
                <InlineWebhookCreator accountId={activeAccountId} projectId={activeProjectId} onClose={() => { setNewIntegrationOpen(false); setNewIntegrationCategory(null); }} />
              ) : (
                <InlineFormCreator accountId={activeAccountId} projectId={activeProjectId} onClose={() => { setNewIntegrationOpen(false); setNewIntegrationCategory(null); }} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

/* ─── Unified Integrations View ─── */
function UnifiedIntegrationsView({ accountId, projectId, onNewIntegration }: { accountId?: string; projectId?: string; onNewIntegration: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<any | null>(null);
  const qc = useQueryClient();

  // Fetch all integration types
  const { data: webhooks = [] } = useQuery({
    queryKey: ["all-webhooks", accountId, projectId],
    queryFn: async () => {
      let q = (supabase as any).from("webhooks").select("*").eq("account_id", accountId).neq("platform", "form").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!accountId,
  });

  const { data: platformIntegrations = [] } = useQuery({
    queryKey: ["platform-integrations", accountId, projectId],
    queryFn: async () => {
      let q = (supabase as any).from("platform_integrations").select("*").eq("account_id", accountId);
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!accountId,
  });

  const { data: forms = [] } = useQuery({
    queryKey: ["webhook-forms", accountId, projectId],
    queryFn: async () => {
      let q = (supabase as any).from("webhook_forms").select("*").eq("account_id", accountId).order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!accountId,
  });

  const { data: metaIntegration } = useQuery({
    queryKey: ["meta-integration", accountId, projectId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("integrations_safe").select("*").eq("account_id", accountId).eq("provider", "meta_ads").eq("project_id", projectId).maybeSingle();
      return data;
    },
    enabled: !!accountId && !!projectId,
  });

  const { data: googleIntegration } = useQuery({
    queryKey: ["google-integration", accountId, projectId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("integrations_safe").select("*").eq("account_id", accountId).eq("provider", "google").eq("project_id", projectId).maybeSingle();
      return data;
    },
    enabled: !!accountId && !!projectId,
  });

  // Build unified list
  type IntegrationCard = { id: string; name: string; type: string; icon: React.ReactNode; status: "active" | "inactive"; details?: string; platform?: string; rawData?: any };
  const allIntegrations: IntegrationCard[] = [];

  // Webhooks
  webhooks.forEach((wh: any) => {
    allIntegrations.push({
      id: `wh-${wh.id}`,
      name: wh.name,
      type: "Webhook",
      icon: <Webhook className="h-5 w-5 text-primary" />,
      status: wh.is_active ? "active" : "inactive",
      platform: wh.platform,
      details: `Webhook · ${wh.platform || "webhook"}`,
      rawData: wh,
    });
  });

  // Platform integrations
  platformIntegrations.filter((pi: any) => pi.is_active).forEach((pi: any) => {
    const config = PLATFORMS_CONFIG.find(p => p.key === pi.platform);
    allIntegrations.push({
      id: `pi-${pi.id}`,
      name: config?.label || pi.platform,
      type: "Plataforma",
      icon: config ? <img src={config.logo} alt={config.label} className="h-5 w-5 object-contain rounded" /> : <Plug2 className="h-5 w-5 text-primary" />,
      status: "active",
      platform: pi.platform,
    });
  });

  // Forms
  forms.forEach((form: any) => {
    allIntegrations.push({
      id: `form-${form.id}`,
      name: form.name,
      type: "Formulário",
      icon: <FileCode className="h-5 w-5 text-primary" />,
      status: "active",
    });
  });

  // Meta Ads
  if (metaIntegration) {
    allIntegrations.push({
      id: `meta-${metaIntegration.id}`,
      name: "Meta Ads",
      type: "Plataforma",
      icon: <img src={logoMeta} alt="Meta" className="h-5 w-5 object-contain rounded" />,
      status: "active",
    });
  }

  // Google
  if (googleIntegration) {
    allIntegrations.push({
      id: `google-${googleIntegration.id}`,
      name: "Google",
      type: "Plataforma",
      icon: <img src={logoGoogleAds} alt="Google" className="h-5 w-5 object-contain rounded" />,
      status: "active",
    });
  }

  const filtered = allIntegrations.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePlatformConfig = PLATFORMS_CONFIG.find(p => p.key === selectedPlatform);
  const getIntegration = (platform: string) => platformIntegrations.find((i: any) => i.platform === platform);

  return (
    <div className="space-y-4">
      {/* Search + Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Buscar integração..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} integração(ões)</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center">
          <Plug2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma integração encontrada.</p>
          <Button className="mt-4 gap-1.5 text-xs" onClick={onNewIntegration}>
            <Plus className="h-3.5 w-3.5" /> Criar primeira integração
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              onClick={() => {
                if (item.platform && PLATFORMS_CONFIG.find(p => p.key === item.platform)) {
                  setSelectedPlatform(item.platform);
                }
              }}
            >
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.type}{item.details ? ` · ${item.details}` : ""}</p>
              </div>
              {item.status === "active" && (
                <Badge variant="outline" className="text-[9px] shrink-0 border-emerald-500/30 text-emerald-500">Ativo</Badge>
              )}
            </button>
          ))}
        </div>
      )}


      {/* Platform Config Dialog */}
      <PlatformDialog open={!!selectedPlatform} onOpenChange={(open) => !open && setSelectedPlatform(null)}>
        <PlatformDialogContent className="max-w-md w-[95vw]">
          {activePlatformConfig && (
            <PlatformConfigDialog
              platform={activePlatformConfig}
              integration={getIntegration(activePlatformConfig.key)}
              accountId={accountId}
              onUpdate={() => qc.invalidateQueries({ queryKey: ['platform-integrations'] })}
              onClose={() => setSelectedPlatform(null)}
            />
          )}
        </PlatformDialogContent>
      </PlatformDialog>
    </div>
  );
}

/* ─── Platform Selection Grid (for Nova Integração modal) ─── */
function PlatformSelectionGrid({ searchQuery, accountId, projectId, onClose }: { searchQuery: string; accountId?: string; projectId?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { data: integrations = [] } = useQuery({
    queryKey: ['platform-integrations', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await (supabase as any).from('platform_integrations').select('*').eq('account_id', accountId);
      return data || [];
    },
    enabled: !!accountId,
  });

  const getIntegration = (platform: string) => integrations.find((i: any) => i.platform === platform);
  const activePlatformConfig = PLATFORMS_CONFIG.find(p => p.key === selectedPlatform);

  const filteredPlatforms = PLATFORMS_CONFIG.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedPlatform && activePlatformConfig) {
    return (
      <div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 -ml-2 mb-3" onClick={() => setSelectedPlatform(null)}>
          <ChevronLeft className="h-3.5 w-3.5" /> Plataformas
        </Button>
        <PlatformConfigDialog
          platform={activePlatformConfig}
          integration={getIntegration(activePlatformConfig.key)}
          accountId={accountId}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['platform-integrations'] })}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {filteredPlatforms.map((platform) => {
        const integration = getIntegration(platform.key);
        const isActive = integration?.is_active ?? false;

        return (
          <button
            key={platform.key}
            onClick={() => setSelectedPlatform(platform.key)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md",
              isActive ? "border-primary/30 bg-primary/5" : "border-border/30 bg-card hover:border-border/60"
            )}
          >
            <img src={platform.logo} alt={platform.label} className="h-8 w-8 object-contain rounded-lg" />
            <span className="text-sm font-medium">{platform.label}</span>
            {isActive && <Badge variant="default" className="text-[9px] ml-auto">Ativo</Badge>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Inline Webhook Creator ─── */
function InlineWebhookCreator({ accountId, projectId, onClose }: { accountId?: string; projectId?: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("hotmart");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const create = async () => {
    if (!name.trim() || !accountId) return;
    setSaving(true);
    try {
      const token = crypto.randomUUID().replace(/-/g, "");
      await (supabase as any).from("webhooks").insert({
        account_id: accountId,
        project_id: projectId || null,
        name: name.trim(),
        token,
        platform,
        is_active: true,
      });
      toast.success("Webhook criado!");
      qc.invalidateQueries({ queryKey: ["all-webhooks"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Nome do Webhook</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vendas Day - Hotmart" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Plataforma</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hotmart">Hotmart</SelectItem>
            <SelectItem value="kiwify">Kiwify</SelectItem>
            <SelectItem value="eduzz">Eduzz</SelectItem>
            <SelectItem value="braip">Braip</SelectItem>
            <SelectItem value="cakto">Cakto</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={create} disabled={saving || !name.trim()}>
        {saving ? "Criando..." : "Criar Webhook"}
      </Button>
    </div>
  );
}

/* ─── Inline Form Creator ─── */
function InlineFormCreator({ accountId, projectId, onClose }: { accountId?: string; projectId?: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isCheckout, setIsCheckout] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const create = async () => {
    if (!name.trim() || !accountId) return;
    setSaving(true);
    try {
      const whToken = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      const { data: whData, error: whError } = await (supabase as any).from("webhooks").insert({
        account_id: accountId,
        project_id: projectId || null,
        name: `Formulário: ${name.trim()}`,
        token: whToken,
        platform: "form",
        is_active: true,
      }).select("id").single();
      if (whError) throw whError;

      await (supabase as any).from("webhook_forms").insert({
        account_id: accountId,
        project_id: projectId || null,
        webhook_id: whData.id,
        name: name.trim(),
        redirect_type: isCheckout ? "checkout" : "url",
        redirect_url: redirectUrl.trim() || null,
      });
      toast.success("Formulário criado!");
      qc.invalidateQueries({ queryKey: ["webhook-forms"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Nome do Formulário</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Captura Landing Page" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">URL de Redirecionamento</Label>
        <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox checked={isCheckout} onCheckedChange={(v) => setIsCheckout(!!v)} />
        <span className="text-xs">É um checkout (adicionar UTMs automaticamente)</span>
      </div>
      <Button className="w-full" onClick={create} disabled={saving || !name.trim()}>
        {saving ? "Criando..." : "Criar Formulário"}
      </Button>
    </div>
  );
}

/* ─── Plataformas Tab ─── */

import logoHotmart from "@/assets/logo-hotmart-icon.png";
import logoCakto from "@/assets/logo-cakto.png";
import logoKiwify from "@/assets/logo-kiwify.png";
import logoEduzz from "@/assets/logo-eduzz.png";
import logoBraip from "@/assets/logo-braip.png";
import logoMeta from "@/assets/logo-meta.png";
import logoGoogleAds from "@/assets/logo-google-ads-new.png";
import {
  Dialog as PlatformDialog, DialogContent as PlatformDialogContent, DialogHeader as PlatformDialogHeader, DialogTitle as PlatformDialogTitle,
} from "@/components/ui/dialog";

const WEBHOOK_DOMAIN = 'webhook.nexusmetrics.jmads.com.br';

const PLATFORMS_CONFIG = [
  {
    key: 'hotmart',
    label: 'Hotmart',
    color: '#f04e23',
    logo: logoHotmart,
    description: 'Receba vendas, reembolsos e chargebacks em tempo real.',
    fields: [
      { name: 'client_id', label: 'Client ID', placeholder: 'Produtos → Ferramentas → Credenciais' },
      { name: 'client_secret', label: 'Client Secret', placeholder: 'Client Secret da Hotmart' },
      { name: 'basic_token', label: 'Basic Token', placeholder: 'Token Base64' },
    ],
    docs: 'https://developers.hotmart.com/docs/pt-BR/',
  },
  {
    key: 'cakto',
    label: 'Cakto',
    color: '#6366f1',
    logo: logoCakto,
    description: 'Sincronize compras aprovadas, recusadas e reembolsos.',
    fields: [
      { name: 'bearer_token', label: 'Bearer Token', placeholder: 'Configurações → API na Cakto' },
    ],
    docs: 'https://docs.cakto.com.br/',
  },
  {
    key: 'kiwify',
    label: 'Kiwify',
    color: '#22c55e',
    logo: logoKiwify,
    description: 'Rastreie compras, boletos, PIX e assinaturas.',
    fields: [
      { name: 'bearer_token', label: 'Bearer Token', placeholder: 'Apps → API na Kiwify' },
      { name: 'account_id', label: 'Account ID', placeholder: 'x-kiwify-account-id' },
    ],
    docs: 'https://docs.kiwify.com.br/',
  },
  {
    key: 'eduzz',
    label: 'Eduzz',
    color: '#3b82f6',
    logo: logoEduzz,
    description: 'Integre vendas, cancelamentos e chargebacks.',
    fields: [
      { name: 'api_key', label: 'API Key', placeholder: 'Painel da Eduzz' },
    ],
    docs: 'https://docs.eduzz.com/',
  },
  {
    key: 'braip',
    label: 'Braip',
    color: '#f59e0b',
    logo: logoBraip,
    description: 'Receba eventos de vendas e reembolsos via webhook.',
    fields: [],
    docs: 'https://ev.braip.com/webhook',
  },
] as const;

function PlatformasTab({ accountId }: { accountId?: string }) {
  const qc = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['platform-integrations', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await (supabase as any)
        .from('platform_integrations')
        .select('*')
        .eq('account_id', accountId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
  });

  const getIntegration = (platform: string) =>
    integrations.find((i: any) => i.platform === platform);

  const activePlatform = PLATFORMS_CONFIG.find(p => p.key === selectedPlatform);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Plug2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Plataformas de Vendas</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Clique em uma plataforma para configurar credenciais e webhook.
      </p>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {PLATFORMS_CONFIG.map((platform) => {
            const integration = getIntegration(platform.key);
            const isActive = integration?.is_active ?? false;
            const hasCreds = integration?.credentials && Object.keys(integration.credentials).length > 0;

            return (
              <button
                key={platform.key}
                onClick={() => setSelectedPlatform(platform.key)}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group",
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                    : "border-border/30 bg-card hover:border-border/60"
                )}
              >
                {/* Status indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                )}

                <img
                  src={platform.logo}
                  alt={platform.label}
                  className="w-14 h-14 object-contain rounded-lg"
                />
                <span className="text-sm font-semibold">{platform.label}</span>
                {hasCreds ? (
                  <Badge variant="default" className="text-[9px] gap-0.5 h-5">
                    <Check className="h-2.5 w-2.5" /> Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] h-5">Configurar</Badge>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Config Dialog */}
      <PlatformDialog open={!!selectedPlatform} onOpenChange={(open) => !open && setSelectedPlatform(null)}>
        <PlatformDialogContent className="max-w-md w-[95vw]">
          {activePlatform && (
            <PlatformConfigDialog
              platform={activePlatform}
              integration={getIntegration(activePlatform.key)}
              accountId={accountId}
              onUpdate={() => qc.invalidateQueries({ queryKey: ['platform-integrations'] })}
              onClose={() => setSelectedPlatform(null)}
            />
          )}
        </PlatformDialogContent>
      </PlatformDialog>
    </div>
  );
}

function PlatformConfigDialog({
  platform,
  integration,
  accountId,
  onUpdate,
  onClose,
}: {
  platform: typeof PLATFORMS_CONFIG[number];
  integration: any;
  accountId?: string;
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    // Populate from saved credentials
    if (integration?.credentials && typeof integration.credentials === 'object') {
      const saved: Record<string, string> = {};
      for (const f of platform.fields) {
        if (integration.credentials[f.name]) {
          saved[f.name] = integration.credentials[f.name];
        }
      }
      return saved;
    }
    return {};
  });
  const [webhookSecret, setWebhookSecret] = useState(() => {
    // Auto-generate a unique token if none exists
    if (integration?.webhook_secret) return integration.webhook_secret;
    return crypto.randomUUID().replace(/-/g, '');
  });

  const isActive = integration?.is_active ?? false;
  const hasCreds = integration?.credentials && Object.keys(integration.credentials).length > 0;
  const webhookUrl = `https://${WEBHOOK_DOMAIN}/webhook/${platform.key}/${webhookSecret}`;

  const handleToggle = async (active: boolean) => {
    if (!accountId) return;
    setSaving(true);
    try {
      if (integration) {
        await (supabase as any)
          .from('platform_integrations')
          .update({ is_active: active, updated_at: new Date().toISOString() })
          .eq('id', integration.id);
      } else {
        await (supabase as any)
          .from('platform_integrations')
          .insert({ account_id: accountId, platform: platform.key, is_active: active });
      }
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!accountId) return;
    setSaving(true);
    try {
      const payload = {
        account_id: accountId,
        platform: platform.key,
        credentials: fields,
        webhook_secret: webhookSecret,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (integration) {
        await (supabase as any)
          .from('platform_integrations')
          .update(payload)
          .eq('id', integration.id);
      } else {
        await (supabase as any)
          .from('platform_integrations')
          .insert(payload);
      }
      onUpdate();
      toast.success(`${platform.label} configurado com sucesso!`);
      onClose();
    } catch (err) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL do webhook copiada!');
  };

  return (
    <>
      <PlatformDialogHeader>
        <div className="flex items-center gap-3">
          <img src={platform.logo} alt={platform.label} className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <PlatformDialogTitle className="text-lg">{platform.label}</PlatformDialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
          </div>
        </div>
      </PlatformDialogHeader>

      <div className="space-y-4 mt-2">
        {/* Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
          <div>
            <p className="text-sm font-medium">Integração ativa</p>
            <p className="text-xs text-muted-foreground">Receber eventos desta plataforma</p>
          </div>
          <Switch checked={isActive} onCheckedChange={handleToggle} disabled={saving} />
        </div>

        {/* Webhook URL */}
        <div>
          <Label className="text-xs font-medium">URL do Webhook</Label>
          <p className="text-[10px] text-muted-foreground mb-1">Cole esta URL no painel da {platform.label}</p>
          <div className="flex items-center gap-2">
            <code className="text-[10px] bg-muted/50 px-3 py-2 rounded-lg flex-1 overflow-hidden text-ellipsis whitespace-nowrap block min-w-0 border border-border/30">
              {webhookUrl}
            </code>
            <Button size="sm" variant="outline" className="h-8 shrink-0 gap-1" onClick={copyWebhookUrl}>
              <Copy className="h-3 w-3" /> Copiar
            </Button>
          </div>
        </div>

        {/* Status */}
        {hasCreds && (
          <div className="flex items-center gap-2 text-xs">
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span className="text-muted-foreground">Credenciais configuradas</span>
            {integration?.last_sync_at && (
              <span className="text-muted-foreground ml-auto">
                Última sync: {new Date(integration.last_sync_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        )}

        {/* Credential fields */}
        {platform.fields.length > 0 && (
          <div className="space-y-3 border-t border-border/30 pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Credenciais de API</Label>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={() => setShowCreds(!showCreds)}>
                {showCreds ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showCreds ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            {platform.fields.map((field) => (
              <div key={field.name}>
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                <Input
                  type={showCreds ? 'text' : 'password'}
                  placeholder={field.placeholder}
                  value={fields[field.name] || ''}
                  onChange={(e) => setFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                  className="h-9 text-sm mt-1"
                />
              </div>
            ))}
          </div>
        )}

        {/* Webhook Secret */}
        {/* Token info */}
        <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20">
          <p className="text-[10px] text-muted-foreground">
            🔑 Token único gerado automaticamente para identificar sua conta. Já está incluído na URL acima.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar Configuração
          </Button>
          <Button variant="outline" asChild>
            <a href={platform.docs} target="_blank" rel="noopener noreferrer" className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Docs
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── Forms Tab ─── */

function FormsTab({ accountId, projectId }: { accountId?: string; projectId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState({ name: true, email: true, phone: true });
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isCheckout, setIsCheckout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEmbed, setShowEmbed] = useState<string | null>(null);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["webhook-forms", accountId, projectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("webhook_forms")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!accountId,
  });

  const resetWizard = () => {
    setStep(1);
    setFormName("");
    setFields({ name: true, email: true, phone: true });
    setRedirectUrl("");
    setIsCheckout(false);
  };

  const createForm = async () => {
    if (!formName.trim() || !accountId) return;
    setSaving(true);
    try {
      // Create internal webhook for this form
      const whToken = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      const { data: whData, error: whError } = await (supabase as any).from("webhooks").insert({
        account_id: accountId,
        project_id: projectId || null,
        name: `Formulário: ${formName.trim()}`,
        token: whToken,
        platform: "form",
        is_active: true,
      }).select("id").single();
      if (whError) throw whError;

      const { error } = await (supabase as any).from("webhook_forms").insert({
        account_id: accountId,
        project_id: projectId || null,
        webhook_id: whData.id,
        name: formName.trim(),
        redirect_type: isCheckout ? "checkout" : "url",
        redirect_url: redirectUrl.trim() || null,
      });
      if (error) throw error;
      toast.success("Formulário criado!");
      resetWizard();
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["webhook-forms"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async () => {
    if (!deleteFormId) return;
    const form = forms.find((f: any) => f.id === deleteFormId);
    if (form?.webhook_id) {
      await (supabase as any).from("webhooks").delete().eq("id", form.webhook_id);
    }
    await (supabase as any).from("webhook_forms").delete().eq("id", deleteFormId);
    qc.invalidateQueries({ queryKey: ["webhook-forms"] });
    toast.success("Formulário excluído");
    setDeleteFormId(null);
  };

  const saveEditForm = async () => {
    if (!editingFormId || !formName.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("webhook_forms").update({
        name: formName.trim(),
        redirect_type: isCheckout ? "checkout" : "url",
        redirect_url: redirectUrl.trim() || null,
      }).eq("id", editingFormId);
      if (error) throw error;
      toast.success("Formulário atualizado!");
      setEditFormOpen(false);
      setEditingFormId(null);
      resetWizard();
      qc.invalidateQueries({ queryKey: ["webhook-forms"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getFormEndpoint = (formId: string) => {
    const form = forms.find((f: any) => f.id === formId);
    // We need the webhook token - query it
    return `https://nexusmetrics.jmads.com.br/api/form-submit`;
  };

  const generateEmbedCode = (form: any) => {
    const endpoint = `https://nexusmetrics.jmads.com.br/api/form-submit`;
    const redirect = form.redirect_url
      ? (isCheckout
        ? `\n      const url = new URL("${form.redirect_url}");\n      url.searchParams.set("name", body.name || "");\n      url.searchParams.set("email", body.email || "");\n      url.searchParams.set("phone", body.phone || "");\n      window.location.href = url.toString();`
        : `\n      window.location.href = "${form.redirect_url}";`)
      : `\n      alert("Enviado com sucesso!");`;

    return `<!-- Formulário ${form.name} - Nexus Metrics -->
<form id="nexus-form-${form.id.slice(0, 8)}" style="max-width:400px;font-family:system-ui,sans-serif;">
${fields.name ? `  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;margin-bottom:4px;font-weight:500;">Nome</label>
    <input type="text" name="name" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />
  </div>` : ""}
${fields.email ? `  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;margin-bottom:4px;font-weight:500;">E-mail</label>
    <input type="email" name="email" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />
  </div>` : ""}
${fields.phone ? `  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;margin-bottom:4px;font-weight:500;">Telefone</label>
    <input type="tel" name="phone" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />
  </div>` : ""}
  <button type="submit" style="width:100%;padding:12px;background:#6366f1;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
    Enviar
  </button>
</form>
<script>
  document.getElementById("nexus-form-${form.id.slice(0, 8)}").addEventListener("submit", async function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.form_id = "${form.id}";
    body.webhook_id = "${form.webhook_id}";
    try {
      const res = await fetch("${endpoint}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {${redirect}
      } else {
        alert("Erro ao enviar. Tente novamente.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  });
</script>`;
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Formulários de captura</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie formulários HTML para capturar leads diretamente em suas páginas.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetWizard(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Novo formulário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm">Configuração de formulário</DialogTitle>
            </DialogHeader>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-0 py-2">
              <StepIndicator step={1} current={step} label="Campos do formulário" />
              <div className="w-16 h-px bg-border" />
              <StepIndicator step={2} current={step} label="URL de redirecionamento" />
              <div className="w-16 h-px bg-border" />
              <StepIndicator step={3} current={step} label="Código" />
            </div>

            <div className="space-y-4 pt-2">
              {step === 1 && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome do formulário</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Captura Landing Page" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ative os interruptores abaixo de acordo com os campos que deseja em seu formulário.
                  </p>
                  <div className="space-y-2">
                    {[
                      { key: "name" as const, label: "Campo do nome", desc: "Captura o nome completo do usuário", icon: User, required: true },
                      { key: "email" as const, label: "Campo E-mail", desc: "Captura o endereço de e-mail", icon: Mail },
                      { key: "phone" as const, label: "Campo número", desc: "Captura o número de telefone", icon: Phone },
                    ].map((f) => (
                      <div key={f.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <f.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{f.label}</p>
                            <p className="text-xs text-muted-foreground">{f.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={fields[f.key]}
                          disabled={f.required}
                          onCheckedChange={(v) => setFields(prev => ({ ...prev, [f.key]: !!v }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)} disabled={!formName.trim()} className="text-xs">
                      Avançar
                    </Button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Insira o URL para que o lead será redirecionado após preencher o formulário.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">URL de redirecionamento</Label>
                    <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <p className="text-xs font-medium">O link informado como destino é um checkout?</p>
                    <p className="text-[10px] text-muted-foreground">
                      Se marcado como "Sim", o sistema irá adicionar automaticamente parâmetros GET (UTM name, email, phone) ao URL de redirecionamento para pré-preencher informações no checkout.
                    </p>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox checked={isCheckout} onCheckedChange={() => setIsCheckout(true)} /> Sim
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox checked={!isCheckout} onCheckedChange={() => setIsCheckout(false)} /> Não
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)} className="text-xs">Voltar</Button>
                    <Button onClick={createForm} disabled={saving} className="text-xs">
                      {saving ? "Criando..." : "Ver HTML gerado"}
                    </Button>
                  </div>
                </>
              )}
              {step === 3 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Formulário criado! Veja o código na lista abaixo.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center">
          <FileCode className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum formulário criado neste projeto.</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Novo formulário" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form: any) => (
            <div key={form.id} className="rounded-xl bg-card border border-border/50 card-shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{form.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {form.redirect_type === "checkout" ? "→ Checkout" : form.redirect_url ? "→ URL" : "Sem redirecionamento"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setFormName(form.name);
                      setRedirectUrl(form.redirect_url || "");
                      setIsCheckout(form.redirect_type === "checkout");
                      setEditingFormId(form.id);
                      setEditFormOpen(true);
                    }}
                    title="Editar formulário"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                    onClick={() => setShowEmbed(showEmbed === form.id ? null : form.id)}>
                    <ExternalLink className="h-3 w-3" /> {showEmbed === form.id ? "Fechar" : "Código"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteFormId(form.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {showEmbed === form.id && (
                <div className="mt-3 space-y-2">
                  <div className="relative">
                    <Textarea
                      readOnly
                      value={generateEmbedCode(form)}
                      className="font-mono text-[10px] h-40 bg-background"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 h-6 text-[10px] gap-1"
                      onClick={() => copy(generateEmbedCode(form))}
                    >
                      <Copy className="h-3 w-3" /> Copiar HTML
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Cole este código em qualquer página HTML para capturar leads automaticamente.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Form Dialog */}
      <Dialog open={editFormOpen} onOpenChange={(v) => { if (!v) { setEditFormOpen(false); setEditingFormId(null); resetWizard(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-sm">Editar formulário</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do formulário</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL de redirecionamento</Label>
              <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={isCheckout} onCheckedChange={(v) => setIsCheckout(!!v)} />
              <span className="text-xs">Link é um checkout (adicionar UTMs automaticamente)</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditFormOpen(false); resetWizard(); }}>Cancelar</Button>
              <Button size="sm" onClick={saveEditForm} disabled={saving || !formName.trim()}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteFormId} onOpenChange={(v) => !v && setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível. O webhook interno também será removido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StepIndicator({ step, current, label }: { step: number; current: number; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
        done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {done ? <Check className="h-3 w-3" /> : step}
      </div>
      <span className={cn("text-[10px] font-medium hidden sm:inline", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

/* ─── Webhook Logs Tab ─── */

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-success/20 text-success",
  ignored: "bg-muted text-muted-foreground",
  duplicate: "bg-yellow-500/20 text-yellow-400",
  error: "bg-destructive/20 text-destructive",
  received: "bg-blue-500/20 text-blue-400",
  refunded: "bg-orange-500/20 text-orange-400",
  chargedback: "bg-destructive/20 text-destructive",
  canceled: "bg-muted text-muted-foreground",
};

const WH_PAGE_SIZE = 50;

function WebhookLogsTab({ accountId }: { accountId?: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [webhookFilter, setWebhookFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const since = dateRange.from.toISOString();
  const until = dateRange.to.toISOString();

  const { data: projects = [] } = useQuery({
    queryKey: ["wh-int-projects", accountId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("projects").select("id, name").eq("account_id", accountId).order("name");
      return data || [];
    },
    enabled: !!accountId,
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["wh-int-webhooks", accountId, projectFilter],
    queryFn: async () => {
      let q = (supabase as any).from("webhooks").select("id, name").eq("account_id", accountId).order("name");
      if (projectFilter !== "all") q = q.eq("project_id", projectFilter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!accountId,
  });

  const projectMap = new Map<string, string>(projects.map((p: any) => [p.id, p.name]));
  const webhookMap = new Map<string, string>(webhooks.map((w: any) => [w.id, w.name]));

  const { data, isLoading } = useQuery({
    queryKey: ["wh-int-logs", accountId, projectFilter, since, until, page, statusFilter, webhookFilter],
    queryFn: async () => {
      const from = page * WH_PAGE_SIZE;
      const to = from + WH_PAGE_SIZE - 1;
      let q = (supabase as any)
        .from("webhook_logs")
        .select("*", { count: "exact" })
        .eq("account_id", accountId)
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (projectFilter !== "all") q = q.eq("project_id", projectFilter);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (webhookFilter !== "all") q = q.eq("webhook_id", webhookFilter);
      const { data, error, count } = await q;
      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    },
    staleTime: 10 * 60_000,
    enabled: !!accountId,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / WH_PAGE_SIZE);
  const queryClient = useQueryClient();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const RETRYABLE = new Set(["error", "ignored", "duplicate", "canceled", "chargedback"]);

  const retryMutation = useMutation({
    mutationFn: async (log: any) => {
      setRetryingId(log.id);
      // Pre-check: block reprocessing if transaction already approved
      if (log.transaction_id) {
        const { data: existing } = await (supabase as any)
          .from("conversions")
          .select("id, status")
          .eq("transaction_id", log.transaction_id)
          .eq("status", "approved")
          .maybeSingle();
        if (existing) {
          throw new Error("Este evento já foi contabilizado como venda aprovada. Reprocessamento bloqueado para evitar duplicidade.");
        }
      }
      const { data: wh } = await (supabase as any).from("webhooks").select("token").eq("id", log.webhook_id).single();
      if (!wh?.token) throw new Error("Webhook não encontrado");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/webhook/${wh.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-reprocess-log-id": log.id },
        body: JSON.stringify(log.raw_payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Webhook reprocessado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["wh-int-logs"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao reprocessar: " + err.message);
    },
    onSettled: () => setRetryingId(null),
  });

  const copyJson = (log: any) => {
    navigator.clipboard.writeText(JSON.stringify(log.raw_payload, null, 2));
    toast.success("JSON copiado!");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card border border-border/50 p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground tracking-wider">Filtros</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-[10px] tracking-wider text-muted-foreground">Período</Label>
            <div className="mt-1"><DateFilter value={dateRange} onChange={(v) => { setDateRange(v); setPage(0); }} /></div>
          </div>
          <div className="min-w-[150px]">
            <Label className="text-[10px] tracking-wider text-muted-foreground">Projeto</Label>
            <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setWebhookFilter("all"); setPage(0); }}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[150px]">
            <Label className="text-[10px] tracking-wider text-muted-foreground">Webhook</Label>
            <Select value={webhookFilter} onValueChange={(v) => { setWebhookFilter(v); setPage(0); }}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {webhooks.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[130px]">
            <Label className="text-[10px] tracking-wider text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{total} registro(s)</span>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={() => exportToCsv(logs.map((l: any) => ({
              data: new Date(l.created_at).toLocaleString("pt-BR"),
              projeto: projectMap.get(l.project_id) || "—",
              webhook: webhookMap.get(l.webhook_id) || "—",
              plataforma: l.platform,
              evento: l.event_type,
              transaction_id: l.transaction_id,
              status: l.status,
            })), "webhook-logs")}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center text-muted-foreground text-sm">Nenhum webhook recebido no período.</div>
      ) : (
        <div className="rounded-xl bg-card border border-border/50 card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/30">
                <th className="w-8" />
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Projeto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Webhook</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Plataforma</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Evento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Smartlink</th>
              </tr></thead>
              <tbody>
                {logs.map((log: any) => (
                  <React.Fragment key={log.id}>
                    <tr className="border-b border-border/20 hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <td className="px-2 py-3 text-center">{expanded === log.id ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{new Date(log.created_at).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 text-xs font-medium truncate max-w-[120px]">{projectMap.get(log.project_id) || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[140px]">{webhookMap.get(log.webhook_id) || "—"}</td>
                      <td className="px-4 py-3"><span className="text-xs capitalize font-medium">{log.platform}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.event_type || "—"}</td>
                      <td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLOR[log.status] || "bg-muted text-muted-foreground")}>{log.status}</span></td>
                      <td className="px-4 py-3">{log.is_attributed ? <span className="text-xs text-success">✓ Atribuído</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    </tr>
                    {expanded === log.id && (
                      <tr className="border-b border-border/10">
                        <td colSpan={8} className="px-4 py-3 bg-muted/30">
                          {log.ignore_reason && <div className="text-xs mb-2"><span className="text-muted-foreground">Motivo: </span><span className="text-foreground">{log.ignore_reason}</span></div>}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-medium">Payload completo:</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={(e) => { e.stopPropagation(); copyJson(log); }}>
                              <Copy className="h-3 w-3" /> Copiar JSON
                            </Button>
                            {RETRYABLE.has(log.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 text-primary"
                                disabled={retryingId === log.id}
                                onClick={(e) => { e.stopPropagation(); retryMutation.mutate(log); }}
                              >
                                <RotateCcw className={cn("h-3 w-3", retryingId === log.id && "animate-spin")} /> Reprocessar
                              </Button>
                            )}
                          </div>
                          <pre className="text-xs bg-background/50 rounded p-3 overflow-x-auto max-h-[300px] whitespace-pre-wrap break-all">{JSON.stringify(log.raw_payload, null, 2)}</pre>
                          {log.attributed_click_id && <div className="mt-2 text-xs"><span className="text-muted-foreground">Click ID: </span><span className="font-mono text-primary">{log.attributed_click_id}</span></div>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs gap-1"><ChevronLeft className="h-3.5 w-3.5" /> Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-xs gap-1">Próxima <ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Meta Ads Tab ─── */

function MetaAdsTab({ accountId, projectId }: { accountId?: string; projectId?: string }) {
  const qc = useQueryClient();
  const [disconnecting, setDisconnecting] = useState(false);

  const { data: integration, isLoading } = useQuery({
    queryKey: ["meta-integration", accountId, projectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("integrations_safe")
        .select("id, provider, external_account_id, config, expires_at, created_at, updated_at, has_refresh_token, project_id")
        .eq("account_id", accountId)
        .eq("provider", "meta_ads")
        .eq("project_id", projectId)
        .maybeSingle();
      return data;
    },
    enabled: !!accountId && !!projectId,
  });

  const { data: adAccounts = [] } = useQuery({
    queryKey: ["meta-ad-accounts", accountId, integration?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ad_accounts")
        .select("id, external_account_id, name, platform, created_at")
        .eq("account_id", accountId)
        .eq("platform", "meta")
        .order("name");
      return data || [];
    },
    enabled: !!accountId && !!integration,
  });

  const connectMeta = async () => {
    const META_APP_ID = "680676927992498";
    const REDIRECT_URI = encodeURIComponent("https://dev.nexusmetrics.jmads.com.br/auth/meta/callback");
    const SCOPES = encodeURIComponent("ads_read,ads_management,read_insights,business_management");

    // Get JWT for state parameter - include project_id
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("Faça login antes de conectar.");
      return;
    }
    // Encode project_id in state along with JWT
    const statePayload = JSON.stringify({ token: session.access_token, project_id: projectId });
    const state = encodeURIComponent(btoa(statePayload));

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&state=${state}&response_type=code`;
    window.location.href = authUrl;
  };

  const disconnectMeta = async () => {
    if (!integration?.id || !accountId) return;
    setDisconnecting(true);
    try {
      // Delete ad accounts
      await (supabase as any)
        .from("ad_accounts")
        .delete()
        .eq("integration_id", integration.id)
        .eq("account_id", accountId);

      // Delete integration
      await (supabase as any)
        .from("integrations")
        .delete()
        .eq("id", integration.id);

      toast.success("Meta Ads desconectado com sucesso.");
      qc.invalidateQueries({ queryKey: ["meta-integration"] });
      qc.invalidateQueries({ queryKey: ["meta-ad-accounts"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao desconectar.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const metaUserName = integration?.config?.meta_user_name;
  const metaHasRefresh = integration?.has_refresh_token;
  const isExpired = integration?.expires_at && new Date(integration.expires_at) < new Date() && !metaHasRefresh;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Meta Ads</h2>
              <p className="text-xs text-muted-foreground">Conecte sua conta Meta para importar dados de campanhas.</p>
            </div>
          </div>
          {integration ? (
            <Badge variant={isExpired ? "destructive" : "default"} className="text-[10px]">
              {isExpired ? "Token Expirado" : "Conectado"}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Desconectado</Badge>
          )}
        </div>

        {integration ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Usuário Meta</span>
                <span className="text-foreground font-medium">{metaUserName || integration.external_account_id}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Meta User ID</span>
                <span className="text-foreground font-mono text-[11px]">{integration.external_account_id}</span>
              </div>
              {integration.expires_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Token expira em</span>
                  <span className={cn("font-medium", isExpired ? "text-destructive" : "text-foreground")}>
                    {new Date(integration.expires_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Conectado em</span>
                <span className="text-foreground">{new Date(integration.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {isExpired && (
                <Button size="sm" className="text-xs gap-1.5" onClick={connectMeta}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reconectar
                </Button>
              )}
              <Button size="sm" variant="destructive" className="text-xs gap-1.5" onClick={disconnectMeta} disabled={disconnecting}>
                <Unplug className="h-3.5 w-3.5" /> {disconnecting ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" className="text-xs gap-1.5" onClick={connectMeta}>
            <ExternalLink className="h-3.5 w-3.5" /> Conectar com Meta
          </Button>
        )}
      </div>

      {/* Ad Accounts */}
      {integration && adAccounts.length > 0 && (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
          <h3 className="text-sm font-semibold mb-3">Contas de Anúncios Conectadas</h3>
          <div className="space-y-2">
            {adAccounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                <div>
                  <p className="text-sm font-medium">{acc.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">ID: {acc.external_account_id}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">Meta Ads</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {integration && adAccounts.length === 0 && (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 text-center">
          <p className="text-xs text-muted-foreground">Nenhuma conta de anúncios encontrada. Verifique as permissões na sua conta Meta.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Google Tab ─── */

function GoogleTab({ accountId, projectId }: { accountId?: string; projectId?: string }) {
  const qc = useQueryClient();
  const [disconnecting, setDisconnecting] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [ga4Properties, setGa4Properties] = useState<any[]>([]);
  const [adsAccounts, setAdsAccounts] = useState<any[]>([]);
  const [ga4Confirmed, setGa4Confirmed] = useState(false);
  const [adsConfirmed, setAdsConfirmed] = useState(false);

  const GOOGLE_CLIENT_ID = "798905293268-bltioaj9h7tfdriveav5mc8upar7c0pq.apps.googleusercontent.com";

  const { data: integration, isLoading } = useQuery({
    queryKey: ["google-integration", accountId, projectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("integrations_safe")
        .select("id, provider, external_account_id, config, expires_at, created_at, updated_at, has_refresh_token, project_id")
        .eq("account_id", accountId)
        .eq("provider", "google")
        .eq("project_id", projectId)
        .maybeSingle();
      return data;
    },
    enabled: !!accountId && !!projectId,
  });

  // Selected accounts/properties
  const { data: selectedAccounts = [] } = useQuery({
    queryKey: ["google-selected", accountId, integration?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("google_selected_accounts")
        .select("*")
        .eq("account_id", accountId)
        .eq("integration_id", integration.id);
      return data || [];
    },
    enabled: !!accountId && !!integration?.id,
  });

  const selectedGA4Ids = new Set(selectedAccounts.filter((s: any) => s.type === "ga4").map((s: any) => s.external_id));
  const selectedAdsIds = new Set(selectedAccounts.filter((s: any) => s.type === "google_ads").map((s: any) => s.external_id));

  // Auto-confirm if already has selections
  useEffect(() => {
    if (selectedGA4Ids.size > 0) setGa4Confirmed(true);
    if (selectedAdsIds.size > 0) setAdsConfirmed(true);
  }, [selectedAccounts.length]);

  const connectGoogle = async () => {
    // Store project_id in localStorage so the callback page can send it
    if (projectId) localStorage.setItem("google_oauth_project_id", projectId);
    const REDIRECT_URI = encodeURIComponent(window.location.origin + "/auth/google/callback");
    const SCOPES = encodeURIComponent([
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/adwords",
    ].join(" "));
    const STATE = encodeURIComponent(crypto.randomUUID());

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPES}&access_type=offline&prompt=consent&state=${STATE}&include_granted_scopes=true`;
    window.location.href = authUrl;
  };

  const disconnectGoogle = async () => {
    if (!integration?.id || !accountId) return;
    setDisconnecting(true);
    try {
      await (supabase as any).from("google_selected_accounts").delete().eq("integration_id", integration.id);
      await (supabase as any).from("integrations").delete().eq("id", integration.id);
      toast.success("Google desconectado com sucesso.");
      qc.invalidateQueries({ queryKey: ["google-integration"] });
      qc.invalidateQueries({ queryKey: ["google-selected"] });
      setGa4Properties([]);
      setAdsAccounts([]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao desconectar.");
    } finally {
      setDisconnecting(false);
    }
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-list-accounts", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      setGa4Properties(data?.ga4_properties || []);
      setAdsAccounts(data?.ads_accounts || []);
    } catch (err: any) {
      toast.error("Erro ao buscar contas: " + (err.message || ""));
    } finally {
      setLoadingAccounts(false);
    }
  };

  const toggleSelection = async (type: "google_ads" | "ga4", externalId: string, name: string) => {
    if (!accountId || !integration?.id) return;
    const isSelected = type === "ga4" ? selectedGA4Ids.has(externalId) : selectedAdsIds.has(externalId);

    try {
      if (isSelected) {
        await (supabase as any).from("google_selected_accounts")
          .delete()
          .eq("account_id", accountId)
          .eq("integration_id", integration.id)
          .eq("type", type)
          .eq("external_id", externalId);
        toast.success("Conta removida.");
      } else {
        await (supabase as any).from("google_selected_accounts").insert({
          account_id: accountId,
          integration_id: integration.id,
          type,
          external_id: externalId,
          name,
        });
        toast.success("Conta selecionada!");
      }
      qc.invalidateQueries({ queryKey: ["google-selected"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("google-sync", {
        body: { account_id: accountId, project_id: projectId },
      });
      if (error) throw error;
      toast.success("Sincronização concluída!");
      qc.invalidateQueries({ queryKey: ["ad-spend-rows"] });
      qc.invalidateQueries({ queryKey: ["ga4-metrics"] });
    } catch (err: any) {
      toast.error("Erro na sincronização: " + (err.message || ""));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (integration) fetchAccounts();
  }, [integration?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const googleEmail = integration?.config?.google_email;
  const googleName = integration?.config?.google_name;
  const hasRefreshToken = integration?.has_refresh_token;
  const isExpired = integration?.expires_at && new Date(integration.expires_at) < new Date() && !hasRefreshToken;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Google</h2>
              <p className="text-xs text-muted-foreground">Conecte sua conta Google para importar dados do Google Ads e GA4.</p>
            </div>
          </div>
          {integration ? (
            <Badge variant={isExpired ? "destructive" : "default"} className="text-[10px]">
              {isExpired ? "Token Expirado" : "Conectado"}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Desconectado</Badge>
          )}
        </div>

        {integration ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              {googleName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="text-foreground font-medium">{googleName}</span>
                </div>
              )}
              {googleEmail && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Email Google</span>
                  <span className="text-foreground font-medium">{googleEmail}</span>
                </div>
              )}
              {hasRefreshToken ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Token</span>
                  <span className="text-success font-medium">Auto-renovável ✓</span>
                </div>
              ) : integration.expires_at ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Token expira em</span>
                  <span className={cn("font-medium", isExpired ? "text-destructive" : "text-foreground")}>
                    {new Date(integration.expires_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Conectado em</span>
                <span className="text-foreground">{new Date(integration.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {isExpired && (
                <Button size="sm" className="text-xs gap-1.5" onClick={connectGoogle}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reconectar
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={triggerSync} disabled={syncing}>
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Sincronizar agora
              </Button>
              <Button size="sm" variant="destructive" className="text-xs gap-1.5" onClick={disconnectGoogle} disabled={disconnecting}>
                <Unplug className="h-3.5 w-3.5" /> {disconnecting ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" className="text-xs gap-1.5" onClick={connectGoogle}>
            <ExternalLink className="h-3.5 w-3.5" /> Conectar com Google
          </Button>
        )}
      </div>

      {/* Google Ads Accounts */}
      {integration && (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Contas Google Ads</h3>
              <p className="text-[10px] text-muted-foreground">Selecione as contas para sincronizar dados de campanhas.</p>
            </div>
            {adsConfirmed && selectedAdsIds.size > 0 && (
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setAdsConfirmed(false)}>
                <Pencil className="h-3 w-3" /> Alterar
              </Button>
            )}
          </div>
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : adsAccounts.length > 0 ? (
            <div className="space-y-2">
              {adsAccounts
                .filter((acc: any) => !adsConfirmed || selectedAdsIds.has(acc.customer_id))
                .map((acc: any, i: number) => {
                const isSelected = selectedAdsIds.has(acc.customer_id);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      adsConfirmed ? "bg-primary/10 border-primary/30" : "cursor-pointer",
                      !adsConfirmed && isSelected ? "bg-primary/10 border-primary/30" : !adsConfirmed ? "bg-muted/20 border-border/30 hover:bg-muted/40" : ""
                    )}
                    onClick={() => !adsConfirmed && toggleSelection("google_ads", acc.customer_id, `Google Ads ${acc.customer_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-5 w-5 rounded border flex items-center justify-center text-xs",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <p className="text-sm font-medium font-mono">{acc.customer_id}</p>
                    </div>
                    <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">Google Ads</Badge>
                  </div>
                );
              })}
              {!adsConfirmed && selectedAdsIds.size > 0 && (
                <div className="flex justify-end pt-2">
                  <Button size="sm" className="gap-1.5" onClick={() => setAdsConfirmed(true)}>
                    <Check className="h-3.5 w-3.5" /> OK
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conta Google Ads encontrada. Pode ser necessário um Developer Token.</p>
          )}
        </div>
      )}

      {/* GA4 Properties */}
      {integration && (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Propriedades GA4</h3>
              <p className="text-[10px] text-muted-foreground">Selecione as propriedades para sincronizar dados.</p>
            </div>
            <div className="flex items-center gap-2">
              {ga4Confirmed && selectedGA4Ids.size > 0 && (
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setGa4Confirmed(false)}>
                  <Pencil className="h-3 w-3" /> Alterar
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => { setGa4Confirmed(false); fetchAccounts(); }} disabled={loadingAccounts}>
                {loadingAccounts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Atualizar
              </Button>
            </div>
          </div>
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ga4Properties.length > 0 ? (
            <div className="space-y-2">
              {ga4Properties
                .filter((prop: any) => !ga4Confirmed || selectedGA4Ids.has(prop.property_id))
                .map((prop: any, i: number) => {
                const isSelected = selectedGA4Ids.has(prop.property_id);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      ga4Confirmed ? "bg-primary/10 border-primary/30" : "cursor-pointer",
                      !ga4Confirmed && isSelected ? "bg-primary/10 border-primary/30" : !ga4Confirmed ? "bg-muted/20 border-border/30 hover:bg-muted/40" : ""
                    )}
                    onClick={() => !ga4Confirmed && toggleSelection("ga4", prop.property_id, prop.property_name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-5 w-5 rounded border flex items-center justify-center text-xs",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{prop.property_name}</p>
                        <p className="text-xs text-muted-foreground">{prop.account_name} · <span className="font-mono">{prop.property_id}</span></p>
                      </div>
                    </div>
                    <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">GA4</Badge>
                  </div>
                );
              })}
              {!ga4Confirmed && selectedGA4Ids.size > 0 && (
                <div className="flex justify-end pt-2">
                  <Button size="sm" className="gap-1.5" onClick={() => setGa4Confirmed(true)}>
                    <Check className="h-3.5 w-3.5" /> OK
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma propriedade GA4 encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Script Tab ─── */
function ScriptTab({ accountId }: { accountId?: string }) {
  const token = accountId || "SEU_TOKEN";
  const code = `<script>\n  window.NEXUS_TOKEN = '${token}';\n</script>\n<script src="https://nexusmetrics.jmads.com.br/nexus.js" async defer></script>`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" /> Script de Rastreamento
        </h2>
        <p className="text-xs text-muted-foreground">
          Instale este script em <strong>todas as páginas</strong> do seu site para capturar UTMs e rastrear a origem de cada venda.
          As plataformas (Hotmart, Kiwify, etc.) <strong>não enviam UTMs</strong> no webhook — este script resolve isso.
        </p>
        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto text-foreground whitespace-pre-wrap border border-border/30">{code}</pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 gap-1.5 text-xs"
            onClick={() => copy(code)}
          >
            <Copy className="h-3.5 w-3.5" /> Copiar
          </Button>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Como instalar:</p>
          <p>• <strong>WordPress:</strong> Plugin "Header Footer Code Manager" → Header → Cole o código</p>
          <p>• <strong>Elementor:</strong> Templates → Theme Builder → Header → Custom Code</p>
          <p>• <strong>Webflow:</strong> Project Settings → Custom Code → Head Code</p>
          <p>• <strong>Wix:</strong> Configurações → HTML personalizado → Head</p>
          <p>• <strong>Framer:</strong> Site Settings → Custom Code → Head</p>
          <p>• <strong>HTML puro:</strong> Cole antes do {"</head>"} em todas as páginas</p>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 space-y-3">
        <h3 className="text-sm font-semibold">Seu Token</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono text-foreground border border-border/30">{token}</code>
          <Button size="sm" variant="outline" onClick={() => copy(token)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Este token identifica sua conta nos webhooks e no script de rastreamento.</p>
      </div>
    </div>
  );
}