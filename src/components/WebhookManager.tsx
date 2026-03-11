import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useToast } from "@/hooks/use-toast";
import { useUsageLimits } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, Link2, Pencil, Tag, Search, X, ChevronDown, ChevronUp, BookOpen, ExternalLink } from "lucide-react";
import HotmartTrackingTutorial from "@/components/HotmartTrackingTutorial";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PLATFORMS = [
  { value: "hotmart", label: "Hotmart" },
  { value: "kiwify", label: "Kiwify" },
  { value: "eduzz", label: "Eduzz" },
  { value: "monetizze", label: "Monetizze" },
  { value: "cakto", label: "Cakto" },
  { value: "other", label: "Outra" },
];

// Smart Tag Selector with search + create
function SmartTagSelector({
  allTags,
  selected,
  onToggle,
  accountId,
  projectId,
  onTagCreated,
}: {
  allTags: any[];
  selected: string[];
  onToggle: (id: string) => void;
  accountId: string;
  projectId: string | null;
  onTagCreated: () => void;
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const filtered = allTags.filter(
    (t: any) => t.name.toLowerCase().includes(search.toLowerCase())
  );
  const showCreate = search.trim() && !allTags.some((t: any) => t.name.toLowerCase() === search.trim().toLowerCase());

  const createTag = async () => {
    if (!search.trim() || !accountId) return;
    setCreating(true);
    try {
      const { error } = await (supabase as any).from("lead_tags").insert({
        account_id: accountId,
        project_id: projectId || null,
        name: search.trim(),
        color: "#8b5cf6",
      });
      if (error) throw error;
      toast({ title: "Tag criada!" });
      setSearch("");
      onTagCreated();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2 w-72">
      <div className="flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Tags automáticas</span>
      </div>
      <p className="text-[10px] text-muted-foreground">Leads que chegarem por este webhook receberão estas tags.</p>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar ou criar tag..."
          className="pl-7 h-7 text-xs"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {filtered.slice(0, 20).map((tag: any) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={`w-full text-left px-2.5 py-1.5 text-[11px] rounded-md transition-colors flex items-center gap-1.5 ${
              selected.includes(tag.id)
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: tag.color || "#8b5cf6" }} />
            {tag.name}
          </button>
        ))}
        {filtered.length > 20 && (
          <p className="text-[10px] text-muted-foreground px-2 py-1">+{filtered.length - 20} mais. Pesquise para encontrar.</p>
        )}
        {filtered.length === 0 && !showCreate && (
          <p className="text-[10px] text-muted-foreground px-2 py-2">Nenhuma tag encontrada.</p>
        )}
      </div>
      {showCreate && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs gap-1"
          onClick={createTag}
          disabled={creating}
        >
          <Plus className="h-3 w-3" /> Criar "{search.trim()}"
        </Button>
      )}
    </div>
  );
}

function PlatformTutorial({ name, steps, tip, blogSlug }: { name: string; steps: string[]; tip: string; blogSlug?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-accent/50 transition-colors"
      >
        <span>{name}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-border/20 pt-2.5">
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="text-[11px] text-muted-foreground flex gap-2">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-muted-foreground/80 bg-muted/30 rounded px-2.5 py-1.5 mt-1.5">
            💡 {tip}
          </p>
          {blogSlug && (
            <a href={`/blog/tutorial/${blogSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1">
              <ExternalLink className="h-3 w-3" /> Ver tutorial completo
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function WebhookManager() {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const { toast } = useToast();
  const { maxWebhooks } = useUsageLimits();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("hotmart");
  const [platformName, setPlatformName] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit modal state (name + platform only)
  const [editOpen, setEditOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editPlatform, setEditPlatform] = useState("hotmart");
  const [editPlatformName, setEditPlatformName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Tags query - filtered by project
  const { data: allTags = [], refetch: refetchTags } = useQuery({
    queryKey: ["crm-tags", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("lead_tags")
        .select("*")
        .eq("account_id", activeAccountId)
        .order("name");
      // Filter by project: show tags with matching project_id OR null project_id
      if (activeProjectId) {
        q = q.or(`project_id.eq.${activeProjectId},project_id.is.null`);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["webhooks", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("webhooks")
        .select("*, webhook_products(product_id, products:product_id(id, name, external_id)), webhook_tags(tag_id, lead_tags:tag_id(id, name, color))")
        .eq("account_id", activeAccountId)
        .neq("platform", "form")
        .order("created_at", { ascending: false });
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  const atLimit = webhooks.length >= maxWebhooks;
  const canSave = name.trim() && (platform !== "other" || platformName.trim());
  const canEditSave = editName.trim() && (editPlatform !== "other" || editPlatformName.trim());

  const createWebhook = async () => {
    if (atLimit) {
      toast({ title: "Limite atingido", description: `Você atingiu o limite de ${maxWebhooks} webhooks.`, variant: "destructive" });
      return;
    }
    if (!canSave || !activeAccountId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("webhooks").insert({
        account_id: activeAccountId,
        project_id: activeProjectId || null,
        name: name.trim(),
        platform,
        platform_name: platform === "other" ? platformName.trim() : null,
      });
      if (error) throw error;
      toast({ title: "Webhook criado!" });
      setName("");
      setPlatform("hotmart");
      setPlatformName("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (wh: any) => {
    setEditingWh(wh);
    setEditName(wh.name);
    setEditPlatform(wh.platform || "hotmart");
    setEditPlatformName(wh.platform_name || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!canEditSave || !editingWh) return;
    setEditSaving(true);
    try {
      const { error } = await (supabase as any).from("webhooks").update({
        name: editName.trim(),
        platform: editPlatform,
        platform_name: editPlatform === "other" ? editPlatformName.trim() : null,
      }).eq("id", editingWh.id);
      if (error) throw error;
      toast({ title: "Webhook atualizado!" });
      setEditOpen(false);
      setEditingWh(null);
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  const toggleWebhookTag = async (webhookId: string, tagId: string, currentTags: string[]) => {
    try {
      if (currentTags.includes(tagId)) {
        await (supabase as any).from("webhook_tags").delete().eq("webhook_id", webhookId).eq("tag_id", tagId);
      } else {
        await (supabase as any).from("webhook_tags").insert({ webhook_id: webhookId, tag_id: tagId });
      }
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    await (supabase as any).from("webhooks").update({ is_active: !isActive }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("Excluir este webhook? Essa ação é irreversível.")) return;
    await (supabase as any).from("webhooks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
    toast({ title: "Webhook excluído" });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const PLATFORM_WEBHOOK_DOMAIN = "webhook.nexusmetrics.jmads.com.br";
  const getWebhookUrl = (token: string) =>
    `https://${PLATFORM_WEBHOOK_DOMAIN}/${token}`;

  const getPlatformLabel = (wh: any) => {
    if (wh.platform === "other" && wh.platform_name) return wh.platform_name;
    return PLATFORMS.find(p => p.value === wh.platform)?.label || wh.platform;
  };

  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Webhooks</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie webhooks exclusivos para cada integração. Cada webhook possui uma URL única.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowTutorial(!showTutorial)}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tutorial</span>
            {showTutorial ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-bg border-0 text-primary-foreground hover:opacity-90 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Criar Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Hotmart - Produto X" />
              </div>
              <div className="space-y-1.5">
                <Label>Plataforma</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        platform === p.value
                          ? "gradient-bg text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {platform === "other" && (
                <div className="space-y-1.5">
                  <Label>Nome da plataforma *</Label>
                  <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} placeholder="Digite o nome da plataforma" required />
                </div>
              )}
              <Button onClick={createWebhook} disabled={saving || !canSave} className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
                {saving ? "Criando..." : "Criar Webhook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tutorial Section */}
      {showTutorial && (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Como configurar seu webhook</h3>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Após criar seu webhook aqui no Nexus, você receberá uma <strong>URL única</strong>. 
            Essa URL deve ser cadastrada na plataforma de vendas para que ela envie os eventos de compra automaticamente.
          </p>

          {/* Passo a passo geral */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passo a passo geral</h4>
            <div className="space-y-2.5">
              {[
                { step: 1, title: 'Crie um webhook aqui no Nexus', desc: 'Clique em "Criar Webhook", dê um nome descritivo e selecione a plataforma.' },
                { step: 2, title: 'Copie a URL gerada', desc: 'Após criar, uma URL única será gerada. Copie-a clicando no ícone de cópia.' },
                { step: 3, title: 'Acesse sua plataforma de vendas', desc: 'Vá até as configurações de webhook/notificações da sua plataforma.' },
                { step: 4, title: 'Cole a URL do Nexus', desc: 'Cadastre a URL copiada como endpoint de webhook na plataforma.' },
                { step: 5, title: 'Ative os eventos de compra', desc: 'Selecione os eventos que deseja receber (compra aprovada, reembolso, etc.).' },
                { step: 6, title: 'Teste o webhook', desc: 'Faça uma compra de teste e verifique se os dados aparecem no Nexus.' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tutoriais por plataforma */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuração por plataforma</h4>

            {/* Hotmart */}
            <PlatformTutorial
              name="Hotmart"
              blogSlug="hotmart"
              steps={[
                'Acesse sua conta Hotmart e vá em Ferramentas → Webhooks (Notificações)',
                'Clique em "Configurar" ou "Adicionar URL"',
                'Cole a URL do webhook do Nexus no campo de URL',
                'Em "Selecionar eventos", marque: PURCHASE_APPROVED, PURCHASE_COMPLETE, PURCHASE_CANCELED, PURCHASE_REFUNDED, PURCHASE_CHARGEBACK e PURCHASE_DELAYED',
                'Clique em "Salvar" para ativar',
              ]}
              tip='Se você usa o Hottok (token de segurança), ele já está configurado automaticamente no Nexus. Apenas cole a URL e salve.'
            />

            {/* Kiwify */}
            <PlatformTutorial
              name="Kiwify"
              steps={[
                'Acesse sua conta Kiwify e vá em Configurações → Webhooks',
                'Clique em "Adicionar webhook"',
                'Cole a URL do webhook do Nexus',
                'Selecione os eventos: Compra aprovada, Reembolso, Chargeback',
                'Salve a configuração',
              ]}
              tip="A Kiwify envia os dados no formato JSON padrão. Nenhuma configuração extra é necessária."
            />

            {/* Eduzz */}
            <PlatformTutorial
              name="Eduzz"
              steps={[
                'Acesse Eduzz → Minha conta → Configurações avançadas → Webhooks',
                'Clique em "Adicionar URL de postback"',
                'Cole a URL do Nexus e selecione o conteúdo/produto',
                'Marque os eventos desejados (venda confirmada, reembolso, etc.)',
                'Salve',
              ]}
              tip="Na Eduzz, cada produto pode ter seu próprio webhook. Recomendamos criar um webhook separado no Nexus para cada produto."
            />

            {/* Monetizze */}
            <PlatformTutorial
              name="Monetizze"
              steps={[
                'Acesse Monetizze → Meus Produtos → Selecione o produto',
                'Vá na aba "Configurações" → "Postbacks"',
                'Cole a URL do webhook do Nexus',
                'Selecione os status de notificação desejados',
                'Salve as alterações',
              ]}
              tip="A Monetizze envia postbacks por GET e POST. O Nexus suporta ambos os formatos automaticamente."
            />

            {/* Cakto */}
            <PlatformTutorial
              name="Cakto"
              steps={[
                'Acesse a Cakto e vá em Configurações → Integrações → Webhooks',
                'Adicione uma nova URL de webhook',
                'Cole a URL do Nexus e ative os eventos desejados',
                'Salve a configuração',
              ]}
              tip='A Cakto pode enviar o campo "data" como array ou objeto. O Nexus já trata ambos os formatos automaticamente.'
            />
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">💡 Dica importante:</strong> Após configurar o webhook na plataforma, faça uma compra de teste para garantir que os eventos estão sendo recebidos corretamente. Você pode acompanhar os eventos na aba <strong>"Webhook Logs"</strong>.
            </p>
          </div>

          {/* Hotmart UTM Tracking Tutorial */}
          <div className="pt-4 border-t border-border/30">
            <HotmartTrackingTutorial compact />
          </div>
        </div>
      )}

      {/* Edit Modal - Name + Platform only */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ex: Hotmart - Produto X" />
            </div>
            <div className="space-y-1.5">
              <Label>Plataforma</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setEditPlatform(p.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      editPlatform === p.value
                        ? "gradient-bg text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {editPlatform === "other" && (
              <div className="space-y-1.5">
                <Label>Nome da plataforma *</Label>
                <Input value={editPlatformName} onChange={(e) => setEditPlatformName(e.target.value)} placeholder="Digite o nome da plataforma" required />
              </div>
            )}
            <Button onClick={saveEdit} disabled={editSaving || !canEditSave} className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
              {editSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center">
          <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum webhook criado ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Crie um webhook para começar a receber vendas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh: any) => {
            const whTagIds = (wh.webhook_tags || []).map((wt: any) => wt.tag_id);
            return (
              <div key={wh.id} className="rounded-xl bg-card border border-border/50 card-shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate flex items-center gap-1.5">
                        {wh.name}
                        <button
                          onClick={() => openEditModal(wh)}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent transition-colors"
                          title="Editar nome e plataforma"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </h3>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {getPlatformLabel(wh)}
                      </Badge>
                      <Badge
                        variant={wh.is_active ? "default" : "secondary"}
                        className={`text-[10px] ${wh.is_active ? "bg-success/20 text-success border-success/30" : ""}`}
                      >
                        {wh.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Input readOnly value={getWebhookUrl(wh.token)} className="font-mono text-[11px] h-8 bg-muted/30" />
                      <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => copy(getWebhookUrl(wh.token))}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {wh.webhook_products && wh.webhook_products.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] text-muted-foreground mr-1">Produtos:</span>
                        {wh.webhook_products.map((wp: any) => (
                          <Badge key={wp.product_id} variant="outline" className="text-[10px]">
                            {wp.products?.name || wp.product_id}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {wh.webhook_tags && wh.webhook_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] text-muted-foreground mr-1">Tags:</span>
                        {wh.webhook_tags.map((wt: any) => (
                          <Badge key={wt.tag_id} variant="outline" className="text-[10px]" style={{ borderColor: wt.lead_tags?.color || undefined, color: wt.lead_tags?.color || undefined }}>
                            <Tag className="h-2.5 w-2.5 mr-0.5" />
                            {wt.lead_tags?.name || wt.tag_id}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Criado em {new Date(wh.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Tags popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground relative"
                          title="Gerenciar tags"
                        >
                          <Tag className="h-4 w-4" />
                          {whTagIds.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-bold">
                              {whTagIds.length}
                            </span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="p-3 w-auto">
                        <SmartTagSelector
                          allTags={allTags}
                          selected={whTagIds}
                          onToggle={(tagId) => toggleWebhookTag(wh.id, tagId, whTagIds)}
                          accountId={activeAccountId}
                          projectId={activeProjectId}
                          onTagCreated={() => refetchTags()}
                        />
                      </PopoverContent>
                    </Popover>
                    <Switch checked={wh.is_active} onCheckedChange={() => toggleWebhook(wh.id, wh.is_active)} />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteWebhook(wh.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
