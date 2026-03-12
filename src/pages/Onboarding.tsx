import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";

import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, ArrowRight, ArrowLeft, Copy, Check, ExternalLink,
  CheckCircle2, AlertTriangle, Globe, Zap, BarChart3
} from "lucide-react";

const PLATFORMS = [
  { id: "hotmart", name: "Hotmart", color: "#F04E23", events: ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_CANCELED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_BILLET_PRINTED", "PURCHASE_PROTEST"] },
  { id: "kiwify", name: "Kiwify", color: "#00C247", events: ["order_approved", "order_refunded", "order_chargedback", "waiting_payment"] },
  { id: "cakto", name: "Cakto", color: "#6366F1", events: ["Todas as transações (automático)"] },
  { id: "eduzz", name: "Eduzz", color: "#1E40AF", events: ["Compra aprovada", "Reembolso", "Chargeback"] },
  { id: "monetizze", name: "Monetizze", color: "#FF6B00", events: ["Compra finalizada", "Reembolso solicitado"] },
  { id: "guru", name: "Guru", color: "#8B5CF6", events: ["Venda aprovada", "Reembolso"] },
  { id: "perfectpay", name: "PerfectPay", color: "#10B981", events: ["Compra aprovada", "Cancelamento"] },
];

const SITE_PLATFORMS = [
  { id: "wordpress", name: "WordPress", instructions: 'Instale o plugin "Header Footer Code Manager" → Add new snippet → Header → Cole o código abaixo.' },
  { id: "elementor", name: "Elementor", instructions: "Templates → Theme Builder → Header → Custom Code → Cole no <head>." },
  { id: "webflow", name: "Webflow", instructions: "Project Settings → Custom Code → Head Code → Cole o código." },
  { id: "wix", name: "Wix", instructions: "Configurações → HTML personalizado → Head → Cole o código." },
  { id: "framer", name: "Framer", instructions: "Site Settings → Custom Code → Head → Cole o código." },
  { id: "html", name: "HTML puro", instructions: "Cole o código antes do </head> em todas as páginas do seu site." },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { activeAccountId } = useAccount();
  const { projectId } = useActiveProject();
  const [step, setStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [scriptVerified, setScriptVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [domainUrl, setDomainUrl] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [configuredItems, setConfiguredItems] = useState<string[]>([]);

  const totalSteps = 5;

  // Get webhook token from the first webhook or account
  const webhookBaseUrl = `https://fnpmuffrqrlofjvqytof.supabase.co/functions/v1/webhook`;

  const getWebhookUrl = (platform: string) => {
    if (!activeAccountId) return webhookBaseUrl;
    // The webhook URL uses account-specific token from webhooks table
    return `${webhookBaseUrl}/${platform}/${activeAccountId}`;
  };

  const nexusToken = activeAccountId || "SEU_TOKEN";

  const scriptCode = `<script>
  window.NEXUS_TOKEN = '${nexusToken}';
</script>
<script src="https://metricsnexus.lovable.app/nexus.js" async defer></script>`;

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleVerifyScript = useCallback(async () => {
    if (!domainUrl) {
      toast({ title: "Digite a URL do seu site", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-dns", {
        body: { url: domainUrl, checkScript: true },
      });
      if (error) throw error;
      setScriptVerified(data?.scriptFound ?? false);
    } catch {
      setScriptVerified(false);
    } finally {
      setVerifying(false);
    }
  }, [domainUrl]);

  const handleConnectMeta = useCallback(async () => {
    if (!metaPixelId || !metaToken || !activeAccountId) return;
    try {
      await (supabase as any).from("integrations").insert({
        account_id: activeAccountId,
        platform: "meta_ads",
        credentials: { pixel_id: metaPixelId, access_token: metaToken },
        status: "active",
      });
      setConfiguredItems((prev) => [...prev, "Meta Ads"]);
      toast({ title: "Meta Ads conectado!" });
    } catch {
      toast({ title: "Erro ao conectar Meta Ads", variant: "destructive" });
    }
  }, [metaPixelId, metaToken, activeAccountId]);

  const handleComplete = useCallback(async () => {
    if (activeAccountId) {
      await (supabase as any)
        .from("accounts")
        .update({ onboarding_completed: true })
        .eq("id", activeAccountId);
    }
    navigate("/dashboard", { replace: true });
  }, [activeAccountId, navigate]);

  const progressPercent = ((step + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <span className="text-xs text-muted-foreground font-medium">
            Passo {step + 1} de {totalSteps}
          </span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-16">
        {/* STEP 0 — Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-6xl">🚀</div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Bem-vindo ao Nexus Metrics!
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Vamos configurar tudo em menos de 5 minutos para você rastrear cada venda com precisão.
            </p>
            <Button size="lg" onClick={() => setStep(1)} className="gap-2">
              Começar configuração <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 1 — Connect platform */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <Zap className="h-10 w-10 mx-auto text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                Conecte sua plataforma de vendas
              </h2>
              <p className="text-muted-foreground">
                Selecione a plataforma onde você vende seus produtos digitais.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PLATFORMS.map((p) => (
                <Card
                  key={p.id}
                  className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedPlatform === p.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlatform(p.id)}
                >
                  <div className="text-center space-y-2">
                    <div
                      className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name[0]}
                    </div>
                    <p className="font-medium text-sm text-foreground">{p.name}</p>
                  </div>
                </Card>
              ))}
            </div>

            {selectedPlatform && (() => {
              const platform = PLATFORMS.find((p) => p.id === selectedPlatform)!;
              const webhookUrl = getWebhookUrl(platform.id);
              return (
                <Card className="p-5 space-y-4 border-primary/30 bg-primary/5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Configurar webhook — {platform.name}
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-sm">URL do Webhook (copie e cole na plataforma):</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted p-3 rounded-lg text-xs break-all font-mono text-foreground">
                        {webhookUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(webhookUrl, "webhook")}
                      >
                        {copied === "webhook" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Eventos para selecionar:</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {platform.events.map((e) => (
                        <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>1. Acesse o painel da {platform.name} → Configurações → Webhooks</p>
                    <p>2. Adicione um novo webhook com a URL acima</p>
                    <p>3. Selecione os eventos listados</p>
                    <p>4. Salve e ative o webhook</p>
                  </div>
                </Card>
              );
            })()}

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button
                onClick={() => {
                  if (selectedPlatform) {
                    setConfiguredItems((prev) => [...prev, PLATFORMS.find(p => p.id === selectedPlatform)!.name]);
                  }
                  setStep(2);
                }}
              >
                {selectedPlatform ? "Já configurei, próximo passo" : "Pular por agora"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — Install tracking script */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <BarChart3 className="h-10 w-10 mx-auto text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                Instale o script de rastreamento no seu site
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                As plataformas de venda (Hotmart, Kiwify, etc.) <strong>NÃO enviam</strong> os dados de UTM no webhook.
                Para rastrear de onde veio cada venda, instale este script em todas as páginas do seu site.
              </p>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm">Código do script:</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(scriptCode, "script")}
                  className="gap-1.5"
                >
                  {copied === "script" ? (
                    <><Check className="h-3.5 w-3.5 text-green-500" /> Copiado!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copiar código</>
                  )}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono text-foreground whitespace-pre-wrap">
                {scriptCode}
              </pre>
            </Card>

            <Tabs defaultValue="wordpress">
              <TabsList className="w-full flex-wrap h-auto gap-1">
                {SITE_PLATFORMS.map((sp) => (
                  <TabsTrigger key={sp.id} value={sp.id} className="text-xs">
                    {sp.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {SITE_PLATFORMS.map((sp) => (
                <TabsContent key={sp.id} value={sp.id}>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">{sp.instructions}</p>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            <Card className="p-4 space-y-3">
              <Label className="font-semibold text-sm">Verificar instalação:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://seusite.com.br"
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                />
                <Button onClick={handleVerifyScript} disabled={verifying}>
                  {verifying ? "Verificando..." : "Verificar"}
                </Button>
              </div>
              {scriptVerified === true && (
                <p className="text-sm text-green-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Script detectado com sucesso!
                </p>
              )}
              {scriptVerified === false && (
                <p className="text-sm text-yellow-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Script não detectado. Verifique a instalação ou pule por agora.
                </p>
              )}
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button onClick={() => {
                if (scriptVerified) setConfiguredItems((prev) => [...prev, "Script de rastreamento"]);
                setStep(3);
              }}>
                {scriptVerified ? "Próximo passo" : "Pular por agora"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Connect Meta Ads (optional) */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="text-4xl">📊</div>
              <h2 className="text-2xl font-bold text-foreground">
                Conecte seu Meta Ads
              </h2>
              <Badge variant="secondary">Opcional</Badge>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                O Nexus Metrics pode enviar eventos de compra para a API de Conversões do Meta
                com o valor correto e o click_id do Facebook (fbclid).
              </p>
            </div>

            <Card className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Pixel ID</Label>
                <Input
                  placeholder="Ex: 123456789012345"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Token de Acesso</Label>
                <Input
                  placeholder="Ex: EAAGm0PX4ZCps..."
                  type="password"
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                />
              </div>
              <Button onClick={handleConnectMeta} disabled={!metaPixelId || !metaToken}>
                Conectar Meta Ads
              </Button>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button onClick={() => setStep(4)}>
                {metaPixelId ? "Próximo passo" : "Pular por agora"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Complete */}
        {step === 4 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold text-foreground">
              Tudo configurado!
            </h2>
            <p className="text-muted-foreground">
              Seu Nexus Metrics está pronto para rastrear suas vendas.
            </p>

            {configuredItems.length > 0 && (
              <Card className="p-5 max-w-sm mx-auto text-left space-y-2">
                <p className="font-semibold text-sm text-foreground">Resumo:</p>
                {configuredItems.map((item) => (
                  <p key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> {item}
                  </p>
                ))}
              </Card>
            )}

            <div className="space-y-3">
              <Button size="lg" onClick={handleComplete} className="gap-2">
                <Rocket className="h-4 w-4" /> Ir para o Dashboard
              </Button>
              <p className="text-xs text-muted-foreground">
                <a href="https://docs.nexusmetrics.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground inline-flex items-center gap-1">
                  Ver tutorial em vídeo <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
