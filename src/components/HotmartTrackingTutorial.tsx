import { useState } from "react";
import { Copy, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, BookOpen, Code2, Webhook, MousePointerClick, Database, ArrowRight, AlertTriangle, ShieldAlert, Zap, Eye, Link2 } from "lucide-react";
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
  &utm_term=120244530953430237
  &utm_content=Criativo10_IMAGEM
  &utm_conjunto=Publico_Quente`;

const EXAMPLE_FINAL_URL = `https://pay.hotmart.com/ABCDE
  ?utm_source=ig
  &utm_medium=Instagram_Feed
  &utm_campaign=Funil8V4_VendaTodoDia
  &utm_term=120244530953430237
  &utm_content=Criativo10_IMAGEM
  &utm_conjunto=Publico_Quente
  &xcod=d4931d63c67444af97ec7d91f18ec496
  &src=dXRtX3NvdXJjZTppZ3x1dG1fbWVkaXVtOkluc3RhZ3JhbV9GZWVk...`;

const SRC_DECODED = `utm_source:ig|utm_medium:Instagram_Feed|utm_campaign:Funil8V4_VendaTodoDia|utm_term:120244530953430237|utm_content:Criativo10_IMAGEM|utm_conjunto:Publico_Quente|click_id:d4931d63c67444af97ec7d91f18ec496`;

const WEBHOOK_RESPONSE = `{
  "data": {
    "purchase": {
      "tracking": {
        "external_code": "d4931d63c67444af97ec7d91f18ec496",
        "source_sck": "dXRtX3NvdXJjZTppZ3x1dG1fbWVkaXVtOk..."
      }
    }
  }
}`;

const DECODE_EXAMPLE = `// Backend decodifica assim:
const decoded = atob(source_sck);
// Resultado: "utm_source:ig|utm_medium:Instagram_Feed|..."

const utms = {};
decoded.split('|').forEach(pair => {
  const [key, value] = pair.split(':');
  utms[key] = value;
});
// utms = {
//   utm_source: "ig",
//   utm_medium: "Instagram_Feed",
//   utm_campaign: "Funil8V4_VendaTodoDia",
//   utm_term: "120244530953430237",
//   utm_content: "Criativo10_IMAGEM",
//   utm_conjunto: "Publico_Quente",
//   click_id: "d4931d63c67444af97ec7d91f18ec496"
// }`;

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

function CodeBlock({ code }: { code: string }) {
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

function InfoBox({ icon: Icon, title, children, variant = "info" }: {
  icon: any;
  title: string;
  children: React.ReactNode;
  variant?: "info" | "warning" | "danger";
}) {
  const styles = {
    info: "border-primary/20 bg-primary/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    danger: "border-destructive/20 bg-destructive/5",
  };
  const iconStyles = {
    info: "text-primary",
    warning: "text-yellow-500",
    danger: "text-destructive",
  };
  return (
    <div className={cn("rounded-lg border p-3 space-y-1", styles[variant])}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", iconStyles[variant])} />
        <p className="text-[11px] font-semibold text-foreground">{title}</p>
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed pl-5.5">{children}</div>
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
          <h2 className="text-base font-bold">Tutorial Completo: Rastreamento de UTMs na Hotmart</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Guia passo a passo para configurar o rastreamento completo de UTMs e click_id, desde a captura no site até a atribuição automática da venda no Nexus Metrics.
        </p>
      </div>

      {/* CRITICAL: Why Hotmart doesn't send UTMs */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <h3 className="text-sm font-bold text-foreground">Por que a Hotmart NÃO envia UTMs no webhook?</h3>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            Diferente de outras plataformas, a <strong>Hotmart não retorna os parâmetros UTM</strong> (<code>utm_source</code>, <code>utm_medium</code>, etc.) diretamente no webhook.
            Mesmo que você coloque UTMs na URL do checkout, eles <strong>não aparecem</strong> no payload do webhook.
          </p>
          <p>A Hotmart retorna <strong>apenas dois campos</strong> de rastreamento no webhook:</p>
        </div>
        <div className="rounded-lg overflow-hidden border border-border/30">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border/30">
                <th className="text-left px-3 py-2 font-semibold text-foreground">Parâmetro no Checkout</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Campo no Webhook</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">O que usamos para</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="px-3 py-2"><code className="bg-muted px-1 rounded font-mono">xcod</code></td>
                <td className="px-3 py-2"><code className="bg-muted px-1 rounded font-mono">tracking.external_code</code></td>
                <td className="px-3 py-2 text-muted-foreground">Enviar o <strong>click_id</strong> para vincular ao SmartLink</td>
              </tr>
              <tr className="border-b border-border/20">
                <td className="px-3 py-2"><code className="bg-muted px-1 rounded font-mono">src</code></td>
                <td className="px-3 py-2"><code className="bg-muted px-1 rounded font-mono">tracking.source_sck</code></td>
                <td className="px-3 py-2 text-muted-foreground">Enviar <strong>todos os UTMs codificados</strong> em Base64</td>
              </tr>
            </tbody>
          </table>
        </div>
        <InfoBox icon={AlertTriangle} title="Parâmetros que NÃO funcionam na Hotmart" variant="warning">
          <p>
            Os parâmetros <code>sck</code>, <code>sub1</code>, <code>sub2</code>, <code>sub3</code>, <code>sub4</code>, <code>sub5</code> <strong>não são retornados</strong> pela Hotmart no webhook.
            Nunca use esses campos para rastrear UTMs na Hotmart — eles serão ignorados.
          </p>
        </InfoBox>
      </div>

      {/* Solution overview */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Nossa solução: Script + Codificação Base64
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Usamos um script JavaScript que captura os UTMs do visitante e os embute na URL do checkout da Hotmart usando os <strong>únicos dois campos que ela retorna</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {[
            { icon: MousePointerClick, label: "Visitante clica no anúncio", sub: "UTMs na URL" },
            { icon: Eye, label: "Script captura UTMs", sub: "Salva no navegador" },
            { icon: Link2, label: "Injeta no checkout", sub: "xcod + src (Base64)" },
            { icon: Webhook, label: "Webhook recebe venda", sub: "Nexus decodifica" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-card border border-border/30">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold">{item.label}</span>
              <span className="text-[9px] text-muted-foreground">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">

        {/* Step 1: Install Script */}
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
            <InfoBox icon={Zap} title="O que o script faz automaticamente:">
              <ul className="space-y-0.5 list-disc list-inside mt-1">
                <li>Captura <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, <code>utm_term</code>, <code>utm_content</code>, <code>utm_conjunto</code> e <code>click_id</code> da URL</li>
                <li>Persiste os dados no <code>localStorage</code> (chave: <code>hotmart_tracking</code>)</li>
                <li>Quando o visitante clica em qualquer link <code>pay.hotmart.com</code>, modifica a URL automaticamente</li>
                <li>Usa <code>MutationObserver</code> para detectar botões adicionados dinamicamente (popups, modais)</li>
                <li>Sanitiza os valores removendo caracteres problemáticos</li>
              </ul>
            </InfoBox>
          </div>
        </StepCard>

        {/* Step 2: UTMs in ads */}
        <StepCard step={2} title="Configure seus anúncios com UTMs e click_id" icon={MousePointerClick}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Nos seus anúncios (Meta Ads, Google Ads, etc.), configure a URL de destino para incluir os parâmetros UTM.
              Se estiver usando <strong>SmartLinks do Nexus</strong>, o <code className="text-foreground bg-muted px-1 rounded">click_id</code> é gerado automaticamente pelo sistema de teste A/B.
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-foreground">Exemplo de URL de entrada no site:</p>
              <CodeBlock code={EXAMPLE_ENTRY_URL} />
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-2">
              <p className="text-[11px] font-medium text-foreground">Parâmetros capturados pelo script:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { param: "utm_source", desc: "Fonte do tráfego (ig, google, facebook...)" },
                  { param: "utm_medium", desc: "Tipo de mídia (Instagram_Feed, cpc...)" },
                  { param: "utm_campaign", desc: "Nome da campanha" },
                  { param: "utm_term", desc: "ID do conjunto de anúncios" },
                  { param: "utm_content", desc: "Identificação do criativo" },
                  { param: "utm_conjunto", desc: "Público-alvo (parâmetro customizado)" },
                  { param: "click_id", desc: "ID único do clique (gerado pelo SmartLink)" },
                ].map((p) => (
                  <div key={p.param} className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] font-mono">{p.param}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <InfoBox icon={AlertTriangle} title="Fallback: sck → click_id" variant="warning">
              <p>Se <code>click_id</code> não existir na URL mas <code>sck</code> existir, o script usa <code>sck</code> como fallback para o click_id.</p>
            </InfoBox>
          </div>
        </StepCard>

        {/* Step 3: How the checkout URL is built */}
        <StepCard step={3} title="Como o script monta a URL do checkout" icon={Link2}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Quando o visitante clicar no botão de compra, o script intercepta o link e adiciona 3 tipos de dados:
            </p>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-foreground">a) UTMs individuais (para analytics client-side)</h4>
              <p className="text-[11px] text-muted-foreground">
                Os parâmetros <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, etc. são adicionados diretamente na URL.
                Embora a Hotmart <strong>não os retorne no webhook</strong>, eles ficam visíveis no Google Analytics e ferramentas client-side.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-foreground">b) Parâmetro <code className="bg-primary/10 text-primary px-1 rounded">xcod</code> = click_id</h4>
              <p className="text-[11px] text-muted-foreground">
                O <code>click_id</code> é enviado como <code>xcod</code> na URL do checkout.
                A Hotmart retorna esse valor no webhook como <code>data.purchase.tracking.external_code</code>.
                O Nexus usa esse ID para vincular a venda ao SmartLink correto.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-foreground">c) Parâmetro <code className="bg-primary/10 text-primary px-1 rounded">src</code> = UTMs em Base64</h4>
              <p className="text-[11px] text-muted-foreground">
                Todos os UTMs + click_id são serializados no formato <code>chave:valor</code> separados por <code>|</code>, e depois codificados em Base64.
                A Hotmart retorna no webhook como <code>data.purchase.tracking.source_sck</code>.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-foreground">URL final gerada pelo script:</p>
              <CodeBlock code={EXAMPLE_FINAL_URL} />
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-foreground">Valor do <code>src</code> decodificado (antes do Base64):</p>
              <CodeBlock code={SRC_DECODED} />
            </div>

            <InfoBox icon={ShieldAlert} title="Regras de segurança do script">
              <ul className="space-y-0.5 list-disc list-inside mt-1">
                <li>Nunca sobrescreve parâmetros que já existam na URL original do link</li>
                <li>Sanitiza valores: remove <code>[</code>, <code>]</code>, <code>#</code>; substitui espaços por <code>_</code></li>
                <li>Omite do <code>src</code> qualquer campo vazio ou nulo</li>
                <li>Usa <code>try/catch</code> em todo lugar para nunca quebrar o site</li>
              </ul>
            </InfoBox>
          </div>
        </StepCard>

        {/* Step 4: Configure Hotmart webhook */}
        <StepCard step={4} title="Configure o Webhook na Hotmart" icon={Webhook}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Para que o Nexus Metrics receba as vendas, você precisa cadastrar a URL do webhook na Hotmart.
            </p>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground">Passo a passo na Hotmart:</p>
              <ol className="text-[11px] text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse o painel da Hotmart → <strong>Ferramentas → Webhooks (Notificações)</strong></li>
                <li>Clique em <strong>"Configurar"</strong> ou <strong>"Adicionar URL"</strong></li>
                <li>Cole a <strong>URL do webhook</strong> que você encontra na aba <strong>"Webhooks"</strong> na página de Integrações do Nexus</li>
                <li>Em <strong>"Selecionar eventos"</strong>, marque:
                  <div className="flex flex-wrap gap-1 mt-1 ml-4">
                    {["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_CANCELED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_DELAYED"].map((ev) => (
                      <Badge key={ev} variant="outline" className="text-[9px] font-mono">{ev}</Badge>
                    ))}
                  </div>
                </li>
                <li>Clique em <strong>"Salvar"</strong></li>
                <li>Faça uma <strong>compra de teste</strong> e verifique nos Webhook Logs se os dados chegaram</li>
              </ol>
            </div>
          </div>
        </StepCard>

        {/* Step 5: What the webhook returns */}
        <StepCard step={5} title="O que o webhook da Hotmart retorna" icon={Database}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Quando uma venda acontece, a Hotmart envia um POST para o Nexus. O payload contém os campos de rastreamento:
            </p>
            <CodeBlock code={WEBHOOK_RESPONSE} />

            <div className="rounded-lg overflow-hidden border border-border/30">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/30">
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Campo do Webhook</th>
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Origem</th>
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Conteúdo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/20">
                    <td className="px-3 py-2"><code className="bg-muted px-1 rounded font-mono text-[10px]">external_code</code></td>
                    <td className="px-3 py-2 text-muted-foreground">Parâmetro <code>xcod</code> do checkout</td>
                    <td className="px-3 py-2 text-muted-foreground">O <code>click_id</code> original</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="px-3 py-2"><code className="bg-muted px-1 rounded font-mono text-[10px]">source_sck</code></td>
                    <td className="px-3 py-2 text-muted-foreground">Parâmetro <code>src</code> do checkout</td>
                    <td className="px-3 py-2 text-muted-foreground">Base64 com todos os UTMs + click_id</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </StepCard>

        {/* Step 6: How Nexus decodes */}
        <StepCard step={6} title="Como o Nexus Metrics decodifica os dados" icon={Code2}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              O backend do Nexus Metrics processa o webhook com a seguinte lógica de prioridade (sem duplicação):
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-[11px] font-semibold text-foreground">Extração de UTMs — Cadeia de prioridade:</h4>
                <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
                  <li><strong>1º</strong> — <code>tracking.source_sck</code> (Base64): decodifica e extrai <strong>todos</strong> os UTMs de uma vez. Se encontrar, <strong>para aqui</strong>.</li>
                  <li><strong>2º</strong> — <code>origin.src</code> / <code>origin.sck</code> (legado): mapeia <code>src → utm_source</code>, <code>sck → utm_campaign</code>.</li>
                  <li><strong>3º</strong> — Campos diretos (<code>utm_source</code>, <code>utm_medium</code>...): fallback para outras plataformas.</li>
                </ol>
              </div>

              <div className="space-y-1">
                <h4 className="text-[11px] font-semibold text-foreground">Extração do click_id — Cadeia de prioridade:</h4>
                <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
                  <li><strong>1º</strong> — <code>tracking.external_code</code> (valor do <code>xcod</code>)</li>
                  <li><strong>2º</strong> — <code>origin.xcod</code> (legado)</li>
                  <li><strong>3º</strong> — <code>click_id</code> dentro do Base64 (<code>source_sck</code>)</li>
                  <li><strong>4º</strong> — Campo <code>click_id</code> direto no payload</li>
                </ol>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-foreground">Exemplo de decodificação do <code>source_sck</code>:</p>
              <CodeBlock code={DECODE_EXAMPLE} />
            </div>

            <InfoBox icon={CheckCircle2} title="Sem duplicação">
              <p>Cada etapa da cadeia só executa <strong>se a anterior não encontrou dados</strong>. O primeiro match válido vence, garantindo zero duplicação.</p>
            </InfoBox>
          </div>
        </StepCard>

        {/* Step 7: Verify */}
        <StepCard step={7} title="Verifique e teste o rastreamento" icon={Eye}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Após configurar tudo, siga estes passos para validar que o rastreamento está funcionando:
            </p>
            <ol className="text-[11px] text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Acesse sua página de vendas com UTMs na URL (ex: <code>?utm_source=teste&utm_medium=manual&click_id=teste123</code>)</li>
              <li>Abra o console do navegador (F12) e digite: <code>localStorage.getItem('hotmart_tracking')</code> — deve mostrar os dados capturados</li>
              <li>Passe o mouse sobre o botão de compra (link da Hotmart) — a URL deve conter <code>xcod=</code>, <code>src=</code> e os UTMs</li>
              <li>Faça uma compra de teste na Hotmart</li>
              <li>No Nexus Metrics, vá em <strong>Integrações → Webhook Logs</strong> e verifique se a venda apareceu com os UTMs e click_id preenchidos</li>
              <li>No <strong>Dashboard</strong>, confirme que a venda foi atribuída à campanha correta</li>
            </ol>

            <InfoBox icon={AlertTriangle} title="Dica de depuração" variant="warning">
              <p>Se os UTMs não aparecerem no webhook log, verifique: (1) o script está instalado na página? (2) o link do botão aponta para <code>pay.hotmart.com</code>? (3) o webhook está configurado na Hotmart com a URL correta?</p>
            </InfoBox>
          </div>
        </StepCard>
      </div>

      {/* Summary table */}
      <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" /> Resumo: Mapeamento completo de campos
        </h3>
        <div className="rounded-lg overflow-hidden border border-border/30">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border/30">
                <th className="text-left px-3 py-2 font-semibold text-foreground">Dado</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">URL de Entrada</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Checkout Hotmart</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Webhook</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Nexus BD</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="px-3 py-1.5 font-medium">click_id</td>
                <td className="px-3 py-1.5 text-muted-foreground"><code>click_id=</code></td>
                <td className="px-3 py-1.5 text-muted-foreground"><code>xcod=</code></td>
                <td className="px-3 py-1.5 text-muted-foreground"><code>external_code</code></td>
                <td className="px-3 py-1.5 text-muted-foreground"><code>click_id</code></td>
              </tr>
              {["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].map((utm) => (
                <tr key={utm} className="border-b border-border/20">
                  <td className="px-3 py-1.5 font-medium">{utm}</td>
                  <td className="px-3 py-1.5 text-muted-foreground"><code>{utm}=</code></td>
                  <td className="px-3 py-1.5 text-muted-foreground">Dentro do <code>src</code> (Base64)</td>
                  <td className="px-3 py-1.5 text-muted-foreground">Dentro do <code>source_sck</code></td>
                  <td className="px-3 py-1.5 text-muted-foreground"><code>{utm}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
