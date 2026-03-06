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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{provider.logo}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{provider.name}</h3>
          <p className="text-xs text-slate-500">API Key para modelos {provider.name}</p>
        </div>
        {hasKey && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
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
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(key); setEditing(false); setKey(""); }} disabled={!key.trim()} className="bg-blue-600 hover:bg-blue-700">
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setKey(""); }}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {hasKey ? (
            <span className="text-sm font-mono text-slate-500">{maskedKey}</span>
          ) : (
            <span className="text-sm text-slate-400">Não configurada</span>
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
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1" /> Perfil</TabsTrigger>
          <TabsTrigger value="integrations"><Key className="h-3.5 w-3.5 mr-1" /> Integrações</TabsTrigger>
          <TabsTrigger value="plan"><CreditCard className="h-3.5 w-3.5 mr-1" /> Plano</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-3.5 w-3.5 mr-1" /> Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Perfil do Usuário</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label>Nome completo</Label>
                <Input className="mt-1" placeholder="Seu nome..." />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" disabled placeholder="email@exemplo.com" />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => toast.info("Salvar perfil em breve!")}>Salvar</Button>
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Plano Atual</h3>
            <div className="inline-block px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-lg capitalize">
              {quotas?.plan || "Free"}
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Uso de tokens</span>
                <span className="text-slate-500">{(quotas?.tokens_used || 0).toLocaleString()} / {(quotas?.tokens_limit || 100000).toLocaleString()}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(tokensPct, 100)}%` }} />
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => toast.info("Upgrade em breve!")}>Upgrade</Button>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Segurança</h3>
            <div className="space-y-3">
              <Button variant="outline" onClick={() => toast.info("Alterar senha em breve!")}>Alterar Senha</Button>
              <p className="text-sm text-slate-500">Gerenciamento de sessões e segurança avançada em breve.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
