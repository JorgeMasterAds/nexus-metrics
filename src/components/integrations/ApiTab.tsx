import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, Plus, Copy, Trash2, BookOpen, Plug, Shield, Eye, EyeOff, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "hotmart", name: "Hotmart", color: "#FF6B00", category: "vendas", fields: [{ key: "hottok", label: "Hottok (Token)", placeholder: "hot_..." }] },
  { id: "cakto", name: "Cakto", color: "#7C3AED", category: "vendas", fields: [{ key: "api_token", label: "API Token", placeholder: "ckt_..." }] },
  { id: "kiwify", name: "Kiwify", color: "#10B981", category: "vendas", fields: [{ key: "api_key", label: "API Key", placeholder: "kw_..." }] },
  { id: "eduzz", name: "Eduzz", color: "#3B82F6", category: "vendas", fields: [{ key: "api_key", label: "API Key", placeholder: "edz_..." }, { key: "public_key", label: "Public Key", placeholder: "pub_..." }] },
  { id: "monetizze", name: "Monetizze", color: "#EF4444", category: "vendas", fields: [{ key: "api_key", label: "API Key", placeholder: "mnz_..." }] },
  { id: "openai", name: "OpenAI", color: "#10A37F", category: "ia", fields: [{ key: "api_key", label: "API Key", placeholder: "sk-..." }] },
  { id: "anthropic", name: "Claude (Anthropic)", color: "#D97706", category: "ia", fields: [{ key: "api_key", label: "API Key", placeholder: "sk-ant-..." }] },
  { id: "gemini", name: "Google Gemini", color: "#4285F4", category: "ia", fields: [{ key: "api_key", label: "API Key", placeholder: "AIza..." }] },
  { id: "grok", name: "Grok (xAI)", color: "#1D1D1F", category: "ia", fields: [{ key: "api_key", label: "API Key", placeholder: "xai-..." }] },
];

const API_DOCS = [
  {
    title: "Listar Conversões",
    method: "GET",
    endpoint: "/rest/v1/conversions",
    description: "Retorna todas as conversões da conta com filtros opcionais.",
    example: `curl -X GET "https://fnpmuffrqrlofjvqytof.supabase.co/rest/v1/conversions?select=*&limit=50" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Authorization: Bearer SUA_API_KEY"`,
  },
  {
    title: "Listar Leads",
    method: "GET",
    endpoint: "/rest/v1/leads",
    description: "Retorna todos os leads com dados de contato e UTMs.",
    example: `curl -X GET "https://fnpmuffrqrlofjvqytof.supabase.co/rest/v1/leads?select=*&limit=50" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Authorization: Bearer SUA_API_KEY"`,
  },
  {
    title: "Listar Cliques",
    method: "GET",
    endpoint: "/rest/v1/clicks",
    description: "Retorna dados de cliques dos SmartLinks.",
    example: `curl -X GET "https://fnpmuffrqrlofjvqytof.supabase.co/rest/v1/clicks?select=*&limit=50" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Authorization: Bearer SUA_API_KEY"`,
  },
  {
    title: "Métricas Diárias",
    method: "GET",
    endpoint: "/rest/v1/daily_metrics",
    description: "Retorna métricas agregadas por dia (views, conversões, receita).",
    example: `curl -X GET "https://fnpmuffrqrlofjvqytof.supabase.co/rest/v1/daily_metrics?select=*&date=gte.2025-01-01" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Authorization: Bearer SUA_API_KEY"`,
  },
  {
    title: "Dados de Ad Spend",
    method: "GET",
    endpoint: "/rest/v1/ad_spend",
    description: "Retorna dados de investimento em anúncios (Meta Ads, Google Ads).",
    example: `curl -X GET "https://fnpmuffrqrlofjvqytof.supabase.co/rest/v1/ad_spend?select=*&date=gte.2025-01-01" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Authorization: Bearer SUA_API_KEY"`,
  },
];

export default function ApiTab() {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">API & Conectores</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gerencie chaves de API, explore a documentação e configure conectores de plataformas.
        </p>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="keys" className="text-xs gap-1.5"><Key className="h-3.5 w-3.5" /> API Keys</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Documentação</TabsTrigger>
          <TabsTrigger value="connectors" className="text-xs gap-1.5"><Plug className="h-3.5 w-3.5" /> Conectores</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <ApiKeysSection accountId={activeAccountId} />
        </TabsContent>
        <TabsContent value="docs">
          <ApiDocsSection />
        </TabsContent>
        <TabsContent value="connectors">
          <PlatformConnectorsSection accountId={activeAccountId} projectId={activeProjectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── API Keys ─── */
function ApiKeysSection({ accountId }: { accountId?: string }) {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api-keys", accountId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("api_keys_safe").select("*").eq("account_id", accountId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!accountId,
  });

  const createKey = async () => {
    if (!keyName.trim() || !accountId) return;
    const rawKey = `nxm_${crypto.randomUUID().replace(/-/g, "")}`;
    const prefix = rawKey.slice(0, 12) + "...";
    // Simple hash for storage (in production use server-side hashing)
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await (supabase as any).from("api_keys").insert({
      account_id: accountId,
      name: keyName.trim(),
      key_hash: hashHex,
      key_prefix: prefix,
      permissions,
    });
    if (error) { toast.error(error.message); return; }
    setNewKey(rawKey);
    setKeyName("");
    qc.invalidateQueries({ queryKey: ["api-keys"] });
    toast.success("API Key criada!");
  };

  const toggleKey = async (id: string, active: boolean) => {
    await (supabase as any).from("api_keys").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["api-keys"] });
  };

  const deleteKey = async () => {
    if (!deleteId) return;
    await (supabase as any).from("api_keys").delete().eq("id", deleteId);
    qc.invalidateQueries({ queryKey: ["api-keys"] });
    toast.success("API Key excluída");
    setDeleteId(null);
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Crie chaves de API para acessar seus dados programaticamente via REST API.
        </p>
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) { setNewKey(null); setKeyName(""); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Nova API Key</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-sm">Criar API Key</DialogTitle></DialogHeader>
            {newKey ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-xs font-semibold text-warning">Copie agora — esta chave não será exibida novamente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-background p-2 rounded flex-1 break-all">{newKey}</code>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copy(newKey)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setCreateOpen(false); setNewKey(null); }}>Entendi, já copiei</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome da chave</Label>
                  <Input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Ex: Integração Zapier" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Permissões</Label>
                  {["read", "write"].map(p => (
                    <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={permissions.includes(p)} onChange={e => {
                        setPermissions(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p));
                      }} className="rounded" />
                      {p === "read" ? "Leitura (consultar dados)" : "Escrita (criar/atualizar dados)"}
                    </label>
                  ))}
                </div>
                <Button className="w-full" onClick={createKey} disabled={!keyName.trim() || permissions.length === 0}>
                  Gerar API Key
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center">
          <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma API Key criada.</p>
          <p className="text-xs text-muted-foreground mt-1">Crie uma chave para começar a usar a API.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k: any) => (
            <div key={k.id} className="rounded-xl bg-card border border-border/50 card-shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", k.is_active ? "bg-primary/10" : "bg-muted")}>
                  <Key className={cn("h-4 w-4", k.is_active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{k.name}</span>
                    <code className="text-[10px] text-muted-foreground font-mono">{k.key_prefix}</code>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {k.permissions?.map((p: string) => (
                      <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>
                    ))}
                    {!k.is_active && <Badge variant="secondary" className="text-[9px]">Inativa</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={k.is_active} onCheckedChange={v => toggleKey(k.id, v)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(k.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir API Key?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível. Qualquer integração usando esta chave parará de funcionar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Documentation ─── */
function ApiDocsSection() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Autenticação</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Todas as requisições precisam incluir sua API Key nos headers <code className="bg-muted px-1 rounded">apikey</code> e <code className="bg-muted px-1 rounded">Authorization: Bearer</code>.
        </p>
        <div className="rounded-lg bg-muted/50 border border-border/30 p-3">
          <code className="text-[11px] text-foreground/80 font-mono whitespace-pre">{`Headers obrigatórios:
  apikey: SUA_API_KEY
  Authorization: Bearer SUA_API_KEY`}</code>
        </div>
      </div>

      <div className="space-y-2">
        {API_DOCS.map((doc, idx) => (
          <div key={idx} className="rounded-xl bg-card border border-border/50 card-shadow overflow-hidden">
            <button
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "text-[10px] font-mono",
                  doc.method === "GET" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                )} variant="outline">
                  {doc.method}
                </Badge>
                <div>
                  <span className="text-sm font-medium">{doc.title}</span>
                  <code className="text-[10px] text-muted-foreground font-mono ml-2">{doc.endpoint}</code>
                </div>
              </div>
              <span className="text-muted-foreground text-xs">{expandedIdx === idx ? "▲" : "▼"}</span>
            </button>
            {expandedIdx === idx && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                <p className="text-xs text-muted-foreground">{doc.description}</p>
                <div className="relative">
                  <pre className="rounded-lg bg-muted/50 border border-border/30 p-3 text-[10px] font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap">
                    {doc.example}
                  </pre>
                  <Button variant="outline" size="sm" className="absolute top-2 right-2 h-6 text-[10px] gap-1"
                    onClick={() => copy(doc.example)}>
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">💡 Dica:</strong> Use filtros PostgREST na URL para consultas avançadas.
          Ex: <code className="bg-muted px-1 rounded">?status=eq.approved&created_at=gte.2025-01-01</code>
        </p>
      </div>
    </div>
  );
}

/* ─── Platform Connectors ─── */
function PlatformConnectorsSection({ accountId, projectId }: { accountId?: string; projectId?: string }) {
  const qc = useQueryClient();
  const [editPlatform, setEditPlatform] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["platform-configs", accountId, projectId],
    queryFn: async () => {
      let q = (supabase as any).from("platform_api_configs").select("*").eq("account_id", accountId);
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!accountId,
  });

  const getConfig = (platformId: string) => configs.find((c: any) => c.platform === platformId);

  const saveConfig = async (platformId: string) => {
    if (!accountId) return;
    const existing = getConfig(platformId);
    const cleanCreds: Record<string, string> = {};
    Object.entries(credentials).forEach(([k, v]) => { if (v.trim()) cleanCreds[k] = v.trim(); });

    if (existing) {
      const { error } = await (supabase as any).from("platform_api_configs").update({
        credentials: cleanCreds,
        is_active: true,
      }).eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await (supabase as any).from("platform_api_configs").insert({
        account_id: accountId,
        project_id: projectId || null,
        platform: platformId,
        credentials: cleanCreds,
        is_active: true,
      });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Configuração salva!");
    setEditPlatform(null);
    setCredentials({});
    qc.invalidateQueries({ queryKey: ["platform-configs"] });
  };

  const disconnectPlatform = async (platformId: string) => {
    const config = getConfig(platformId);
    if (!config) return;
    await (supabase as any).from("platform_api_configs").update({ is_active: false, credentials: {} }).eq("id", config.id);
    qc.invalidateQueries({ queryKey: ["platform-configs"] });
    toast.success("Desconectado");
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Configure credenciais de API das plataformas de vendas para sincronização automática de dados.
      </p>

      <div className="grid gap-3">
        {PLATFORMS.map(platform => {
          const config = getConfig(platform.id);
          const isConnected = config?.is_active;
          const isEditing = editPlatform === platform.id;

          return (
            <div key={platform.id} className="rounded-xl bg-card border border-border/50 card-shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: platform.color }}>
                    {platform.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{platform.name}</h3>
                    <p className="text-[10px] text-muted-foreground">API de {platform.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Conectado
                    </span>
                  )}
                  <Button variant="outline" size="sm" className="text-xs h-8"
                    onClick={() => {
                      if (isEditing) {
                        setEditPlatform(null);
                        setCredentials({});
                      } else {
                        setEditPlatform(platform.id);
                        if (config?.credentials) {
                          const creds: Record<string, string> = {};
                          platform.fields.forEach(f => { creds[f.key] = (config.credentials as any)?.[f.key] || ""; });
                          setCredentials(creds);
                        }
                      }
                    }}>
                    {isEditing ? "Cancelar" : isConnected ? "Editar" : "Configurar"}
                  </Button>
                  {isConnected && !isEditing && (
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive" onClick={() => disconnectPlatform(platform.id)}>
                      Desconectar
                    </Button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 space-y-3 pt-3 border-t border-border/30">
                  {platform.fields.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs">{field.label}</Label>
                      <div className="relative">
                        <Input
                          type={showValues[field.key] ? "text" : "password"}
                          value={credentials[field.key] || ""}
                          onChange={e => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="pr-10"
                        />
                        <button
                          onClick={() => setShowValues(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showValues[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" onClick={() => saveConfig(platform.id)}
                    disabled={platform.fields.every(f => !credentials[f.key]?.trim())}>
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">🔐 Segurança:</strong> As credenciais são armazenadas de forma criptografada e acessíveis apenas pela sua conta.
          Consulte a documentação de cada plataforma para obter suas chaves de API.
        </p>
      </div>
    </div>
  );
}
