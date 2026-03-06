import { useState } from "react";
import { useHubIntegrations, useHubQuotas } from "@/hooks/useAgentHub";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Check, X, Shield, Key, User, CreditCard } from "lucide-react";

const LLM_PROVIDERS = [
  { type: "openai", name: "OpenAI", logo: "🟢" },
  { type: "anthropic", name: "Anthropic", logo: "🟣" },
  { type: "google", name: "Google Gemini", logo: "🔵" },
  { type: "groq", name: "Groq", logo: "🟠" },
];

function ApiKeyCard({ provider, integration, onSave }: { provider: any; integration: any; onSave: (key: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const hasKey = !!integration;
  const maskedKey = integration?.credentials?.api_key ? `****...${integration.credentials.api_key.slice(-4)}` : "";

  return (
    <div className="rounded-md border border-border bg-card p-5 card-shadow">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{provider.logo}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{provider.name}</h3>
          <p className="text-xs text-muted-foreground">API Key para modelos {provider.name}</p>
        </div>
        {hasKey && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/20 text-success flex items-center gap-1">
            <Check className="h-3 w-3" /> Conectado
          </span>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="pr-10"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(key); setEditing(false); setKey(""); }} disabled={!key.trim()} className="bg-primary hover:bg-primary/90">
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setKey(""); }}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {hasKey ? (
            <span className="text-sm font-mono text-muted-foreground">{maskedKey}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Não configurada</span>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="ml-auto text-xs">
            <Key className="h-3 w-3 mr-1" /> {hasKey ? "Alterar" : "Adicionar"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function HubSettings() {
  const { integrations, save } = useHubIntegrations();
  const { data: quotas } = useHubQuotas();

  const getIntegration = (type: string) => integrations.find((i: any) => i.service_type === type);

  const handleSaveKey = (type: string, name: string, key: string) => {
    const existing = getIntegration(type);
    save.mutate({
      id: existing?.id,
      service_type: type,
      service_name: name,
      credentials: { api_key: key },
    });
  };

  const tokensPct = quotas ? Math.round((quotas.tokens_used / quotas.tokens_limit) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Configurações</h1>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1" /> Perfil</TabsTrigger>
          <TabsTrigger value="integrations"><Key className="h-3.5 w-3.5 mr-1" /> Integrações</TabsTrigger>
          <TabsTrigger value="plan"><CreditCard className="h-3.5 w-3.5 mr-1" /> Plano</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-3.5 w-3.5 mr-1" /> Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="rounded-md border border-border bg-card p-6 card-shadow">
            <h3 className="font-semibold text-foreground mb-4">Perfil do Usuário</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label>Nome completo</Label>
                <Input className="mt-1" placeholder="Seu nome..." />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" disabled placeholder="email@exemplo.com" />
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => toast.info("Salvar perfil em breve!")}>Salvar</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            {LLM_PROVIDERS.map((p) => (
              <ApiKeyCard
                key={p.type}
                provider={p}
                integration={getIntegration(p.type)}
                onSave={(key) => handleSaveKey(p.type, p.name, key)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plan">
          <div className="rounded-md border border-border bg-card p-6 space-y-4 card-shadow">
            <h3 className="font-semibold text-foreground">Plano Atual</h3>
            <div className="inline-block px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-lg capitalize">
              {quotas?.plan || "Free"}
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">Uso de tokens</span>
                <span className="text-muted-foreground">{(quotas?.tokens_used || 0).toLocaleString()} / {(quotas?.tokens_limit || 100000).toLocaleString()}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(tokensPct, 100)}%` }} />
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => toast.info("Upgrade em breve!")}>Upgrade</Button>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="rounded-md border border-border bg-card p-6 card-shadow">
            <h3 className="font-semibold text-foreground mb-4">Segurança</h3>
            <div className="space-y-3">
              <Button variant="outline" onClick={() => toast.info("Alterar senha em breve!")}>Alterar Senha</Button>
              <p className="text-sm text-muted-foreground">Gerenciamento de sessões e segurança avançada em breve.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
