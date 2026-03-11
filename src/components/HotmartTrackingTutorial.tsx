import { useState } from "react";
import { Copy, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, BookOpen, Code2, Webhook, MousePointerClick, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SCRIPT_CODE = `<script src="https://metricsnexus.lovable.app/scripts/hotmart-utm-tracker.js"></script>`;

const EXAMPLE_ENTRY_URL = `https://seusite.com.br/pagina
  ?click_id=d4931d63c67444af97ec7d91f18ec496
  &utm_source=ig
  &utm_medium=Instagram_Feed
  &utm_campaign=Funil8V4_VendaTodoDia
  &utm_content=Criativo10_IMAGEM
  &utm_conjunto=Publico_Quente`;

const EXAMPLE_FINAL_URL = `https://pay.hotmart.com/ABCDE
  ?utm_source=ig
  &utm_medium=Instagram_Feed
  &utm_campaign=Funil8V4_VendaTodoDia
  &utm_content=Criativo10_IMAGEM
  &utm_conjunto=Publico_Quente
  &xcod=d4931d63c67444af97ec7d91f18ec496
  &src=dXRtX3NvdXJjZTppZ3x1dG1fbWVk...`;

const WEBHOOK_RESPONSE = `{
  "data": {
    "purchase": {
      "tracking": {
        "external_code": "d4931d63c67444af97ec7d91f18ec496",
        "source_sck": "dXRtX3NvdXJjZTppZ3x1dG1fbWVk..."
      }
    }
  }
}`;

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
      {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {label || "Copiar"}
    </Button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
      <pre className="bg-muted/50 border border-border/50 rounded-lg p-4 text-xs overflow-x-auto">
        <code className="text-foreground/90 whitespace-pre-wrap break-all">{code}</code>
      </pre>
    </div>
  );
}

function StepCard({ step, title, icon: Icon, children, defaultOpen = false }: {
  step: number;
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary text-sm font-bold shrink-0">
          {step}
        </div>
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold flex-1">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/30">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function HotmartTrackingTutorial({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("space-y-4", compact ? "" : "max-w-3xl")}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold">Tutorial: Rastreamento de UTMs na Hotmart</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Aprenda a configurar o rastreamento completo de UTMs e click_id para que cada venda na Hotmart seja atribuída corretamente à sua campanha de origem.
        </p>
      </div>

      {/* How it works summary */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" /> Como funciona
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-card border border-border/30">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium">1. Visitante clica no anúncio com UTMs</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-card border border-border/30">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium">2. Script captura e injeta no checkout</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-card border border-border/30">
            <Webhook className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium">3. Webhook retorna UTMs na venda</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <StepCard step={1} title="Instale o script na sua página de vendas" icon={Code2} defaultOpen>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Copie o código abaixo e cole no HTML da sua página de vendas (antes do <code className="text-foreground bg-muted px-1 rounded">&lt;/body&gt;</code> ou no <code className="text-foreground bg-muted px-1 rounded">&lt;head&gt;</code>).
              Funciona em qualquer plataforma: WordPress, Webflow, página estática, etc.
            </p>
            <CodeBlock code={SCRIPT_CODE} />
            <div className="flex items-center gap-2">
              <CopyButton text={SCRIPT_CODE} label="Copiar script" />
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-1">
              <p className="text-[11px] font-medium text-foreground">💡 O que o script faz automaticamente:</p>
              <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>Captura UTMs e click_id da URL de entrada</li>
                <li>Salva os dados no navegador do visitante (localStorage)</li>
                <li>Quando o visitante clica em um link <code>pay.hotmart.com</code>, injeta os UTMs + click_id</li>
                <li>Detecta links adicionados dinamicamente (popups, modais, botões de compra)</li>
              </ul>
            </div>
          </div>
        </StepCard>

        <StepCard step={2} title="Configure seus anúncios com UTMs" icon={MousePointerClick}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Nos seus anúncios (Meta Ads, Google Ads, etc.), configure a URL de destino para incluir os parâmetros UTM.
              Se estiver usando SmartLinks do Nexus, o <code className="text-foreground bg-muted px-1 rounded">click_id</code> é gerado automaticamente.
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-foreground">Exemplo de URL de entrada:</p>
              <CodeBlock code={EXAMPLE_ENTRY_URL} />
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
              <p className="text-[11px] font-medium text-foreground">Parâmetros suportados:</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_conjunto", "click_id"].map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
                ))}
              </div>
            </div>
          </div>
        </StepCard>

        <StepCard step={3} title="Entenda a URL final do checkout" icon={ExternalLink}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Quando o visitante clicar no botão de compra, o script modifica automaticamente o link da Hotmart para incluir:
            </p>
            <CodeBlock code={EXAMPLE_FINAL_URL} />
            <div className="space-y-2">
              <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">xcod</Badge>
                  <p className="text-[11px] text-muted-foreground">
                    Recebe o <code>click_id</code>. A Hotmart retorna no webhook como <code>tracking.external_code</code>.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">src</Badge>
                  <p className="text-[11px] text-muted-foreground">
                    Todos os UTMs + click_id codificados em Base64. A Hotmart retorna no webhook como <code>tracking.source_sck</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </StepCard>

        <StepCard step={4} title="Configure o Webhook na Hotmart" icon={Webhook}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Na Hotmart, vá em <strong>Ferramentas → Webhooks</strong> e configure o webhook apontando para a URL do seu projeto no Nexus Metrics.
            </p>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground">Passo a passo:</p>
              <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Acesse o painel da Hotmart e vá em <strong>Ferramentas → Webhooks</strong></li>
                <li>Clique em <strong>"Configurar novo webhook"</strong></li>
                <li>Cole a <strong>URL do webhook</strong> que você encontra na aba "Webhooks" aqui na página de Integrações</li>
                <li>Selecione os eventos: <code>PURCHASE_APPROVED</code>, <code>PURCHASE_REFUNDED</code>, <code>PURCHASE_CHARGEBACK</code></li>
                <li>Salve e faça um teste usando o botão "Enviar teste" da Hotmart</li>
              </ol>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-1">
              <p className="text-[11px] font-medium text-foreground">⚠️ Importante:</p>
              <p className="text-[11px] text-muted-foreground">
                A Hotmart retorna apenas <code>tracking.source_sck</code> (parâmetro <code>src</code>) e <code>tracking.external_code</code> (parâmetro <code>xcod</code>) no webhook.
                Os parâmetros <code>sck</code>, <code>sub1</code>–<code>sub5</code> <strong>não são retornados</strong> pela Hotmart.
              </p>
            </div>
          </div>
        </StepCard>

        <StepCard step={5} title="Verifique nos Webhook Logs" icon={Database}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Após uma venda real ou teste, verifique os dados na aba <strong>"Webhook Logs"</strong> das Integrações. Os campos UTM e click_id devem aparecer preenchidos.
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-foreground">Dados retornados pelo webhook:</p>
              <CodeBlock code={WEBHOOK_RESPONSE} />
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-1">
              <p className="text-[11px] font-medium text-foreground">🔍 O Nexus Metrics decodifica automaticamente:</p>
              <p className="text-[11px] text-muted-foreground">
                O <code>source_sck</code> é decodificado de Base64 para extrair <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, <code>utm_content</code>, <code>utm_term</code> e <code>click_id</code>.
                O <code>external_code</code> é mapeado diretamente para o <code>click_id</code>.
              </p>
            </div>
          </div>
        </StepCard>
      </div>
    </div>
  );
}
