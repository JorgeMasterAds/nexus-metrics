import BlogLayout from "@/components/blog/BlogLayout";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const SCRIPT_CODE = `<script src="https://metricsnexus.lovable.app/scripts/hotmart-utm-tracker.js"></script>`;

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { navigator.clipboard.writeText(text); setOk(true); toast.success("Copiado!"); setTimeout(() => setOk(false), 2000); }}>
      {ok ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />} Copiar
    </Button>
  );
}

export default function BlogHotmart() {
  return (
    <BlogLayout
      title="Como rastrear UTMs e click_id na Hotmart — Guia Completo"
      subtitle="Entenda por que a Hotmart NÃO envia UTMs no webhook, e como resolver usando xcod, src (Base64), external_code e source_sck para atribuir cada venda à campanha correta."
      readTime="12 min de leitura"
      date="Março 2025"
    >
      <h2>O Problema: A Hotmart não retorna UTMs no webhook</h2>
      <p>
        Se você já tentou rastrear suas vendas na Hotmart usando parâmetros UTM, provavelmente descobriu algo frustrante: 
        <strong> a Hotmart não retorna os parâmetros utm_source, utm_medium, utm_campaign, etc. no webhook</strong>.
      </p>
      <p>
        Mesmo que você coloque todos os UTMs na URL do checkout (<code>pay.hotmart.com/ABCDE?utm_source=ig&utm_medium=cpc</code>), 
        quando a venda acontece e o webhook é disparado, esses dados simplesmente <strong>não aparecem</strong> no payload.
      </p>
      <p>
        Diferente de plataformas como Kiwify ou Eduzz que enviam os UTMs diretamente, a Hotmart tem um sistema próprio de rastreamento 
        que retorna <strong>apenas dois campos</strong>:
      </p>

      <div className="not-prose my-6 rounded-xl overflow-hidden border border-border/50">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 border-b border-border/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Parâmetro no Checkout</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Campo no Webhook</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Descrição</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/20">
              <td className="px-4 py-3"><code>xcod</code></td>
              <td className="px-4 py-3"><code>data.purchase.tracking.external_code</code></td>
              <td className="px-4 py-3 text-muted-foreground">Código externo — usamos para enviar o <strong>click_id</strong></td>
            </tr>
            <tr className="border-b border-border/20">
              <td className="px-4 py-3"><code>src</code></td>
              <td className="px-4 py-3"><code>data.purchase.tracking.source_sck</code></td>
              <td className="px-4 py-3 text-muted-foreground">Fonte de rastreamento — usamos para enviar <strong>todos os UTMs codificados em Base64</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="not-prose my-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">⚠️ Parâmetros que NÃO funcionam na Hotmart:</p>
        <p className="text-xs text-muted-foreground">
          Os parâmetros <code className="text-primary bg-muted px-1 rounded">sck</code>, <code className="text-primary bg-muted px-1 rounded">sub1</code>, <code className="text-primary bg-muted px-1 rounded">sub2</code>, <code className="text-primary bg-muted px-1 rounded">sub3</code>, <code className="text-primary bg-muted px-1 rounded">sub4</code>, <code className="text-primary bg-muted px-1 rounded">sub5</code> <strong>não existem na Hotmart</strong> e não são retornados no webhook. 
          Se você usa algum desses, seus dados estão sendo perdidos.
        </p>
      </div>

      <hr />

      <h2>A Solução: Script de Rastreamento + Codificação Base64</h2>
      <p>
        A solução que desenvolvemos no Nexus Metrics usa um <strong>script JavaScript leve</strong> que você instala na sua página de vendas. 
        Ele captura automaticamente os UTMs da URL de entrada e, quando o visitante clica no link de checkout da Hotmart, 
        injeta os dados nos <strong>únicos dois campos que a Hotmart retorna</strong>.
      </p>

      <h3>Fluxo completo do rastreamento:</h3>
      <div className="not-prose my-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { n: "1", t: "Visitante clica no anúncio", d: "URL contém utm_source, utm_medium, click_id, etc." },
          { n: "2", t: "Script captura os dados", d: "Salva no localStorage do navegador do visitante" },
          { n: "3", t: "Visitante clica no botão de compra", d: "Script injeta xcod + src (Base64) no link da Hotmart" },
          { n: "4", t: "Venda acontece, webhook dispara", d: "Nexus decodifica external_code e source_sck" },
        ].map((s) => (
          <div key={s.n} className="rounded-lg border border-border/30 bg-card p-3 space-y-1.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{s.n}</div>
            <p className="text-xs font-semibold text-foreground">{s.t}</p>
            <p className="text-[11px] text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>

      <hr />

      <h2>Passo 1: Instale o Script na Sua Página</h2>
      <p>
        Copie o código abaixo e cole no HTML da sua página de vendas, antes do <code>&lt;/body&gt;</code> ou dentro do <code>&lt;head&gt;</code>. 
        Funciona em <strong>qualquer plataforma</strong>: WordPress, Webflow, Wix, página estática, etc.
      </p>
      <div className="not-prose my-4 space-y-2">
        <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 text-xs overflow-x-auto">
          <code className="text-foreground/90">{SCRIPT_CODE}</code>
        </pre>
        <CopyBtn text={SCRIPT_CODE} />
      </div>

      <h3>O que o script faz automaticamente:</h3>
      <ul>
        <li>Captura <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, <code>utm_term</code>, <code>utm_content</code>, <code>utm_conjunto</code> e <code>click_id</code> da URL</li>
        <li>Persiste os dados no <code>localStorage</code> (chave: <code>hotmart_tracking</code>) — sobrevive a navegações internas</li>
        <li>Monitora cliques em qualquer link que aponte para <code>pay.hotmart.com</code></li>
        <li>Usa <code>MutationObserver</code> para detectar botões/links adicionados dinamicamente (popups, modais, SPAs)</li>
        <li>Sanitiza valores removendo caracteres problemáticos (<code>[ ] # &</code>)</li>
        <li>Usa <code>try/catch</code> em todo lugar para nunca quebrar o restante do site</li>
      </ul>

      <hr />

      <h2>Passo 2: Configure seus Anúncios com UTMs</h2>
      <p>
        Nos seus anúncios (Meta Ads, Google Ads, TikTok, etc.), configure a URL de destino para incluir os parâmetros UTM. 
        Se você usa <strong>SmartLinks do Nexus Metrics</strong>, o <code>click_id</code> é gerado automaticamente pelo sistema.
      </p>

      <h3>Exemplo de URL de entrada no site:</h3>
      <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 text-xs overflow-x-auto">
        <code className="text-foreground/90">{`https://seusite.com.br/pagina
  ?click_id=d4931d63c67444af97ec7d91f18ec496
  &utm_source=ig
  &utm_medium=Instagram_Feed
  &utm_campaign=Funil8V4_VendaTodoDia
  &utm_term=120244530953430237
  &utm_content=Criativo10_IMAGEM
  &utm_conjunto=Publico_Quente`}</code>
      </pre>

      <div className="not-prose my-4">
        <p className="text-xs font-medium text-foreground mb-2">Parâmetros capturados pelo script:</p>
        <div className="flex flex-wrap gap-1.5">
          {["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_conjunto", "click_id"].map((p) => (
            <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
          ))}
        </div>
      </div>

      <p>
        <strong>Fallback:</strong> Se <code>click_id</code> não existir na URL mas <code>sck</code> existir, o script usa <code>sck</code> como fallback para o click_id.
      </p>

      <hr />

      <h2>Passo 3: Entenda como o Script monta a URL do Checkout</h2>
      <p>
        Quando o visitante clica no botão de compra, o script intercepta o link da Hotmart e adiciona <strong>três tipos de dados</strong>:
      </p>

      <h3>a) UTMs individuais (para analytics client-side)</h3>
      <p>
        Os parâmetros <code>utm_source</code>, <code>utm_medium</code>, etc. são adicionados diretamente na URL. 
        Embora a Hotmart <strong>não os retorne no webhook</strong>, eles ficam visíveis no Google Analytics e outras ferramentas client-side.
      </p>

      <h3>b) Parâmetro <code>xcod</code> = click_id</h3>
      <p>
        O <code>click_id</code> é enviado como <code>xcod</code> na URL do checkout. 
        A Hotmart retorna esse valor no webhook como <code>data.purchase.tracking.external_code</code>. 
        O Nexus Metrics usa esse ID para vincular a venda ao SmartLink correto e ao clique original.
      </p>

      <h3>c) Parâmetro <code>src</code> = UTMs em Base64</h3>
      <p>
        Todos os UTMs + click_id são serializados no formato <code>chave:valor</code> separados por <code>|</code>, e depois codificados em Base64. 
        A Hotmart retorna esse valor no webhook como <code>data.purchase.tracking.source_sck</code>.
      </p>

      <h3>URL final gerada pelo script:</h3>
      <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 text-xs overflow-x-auto">
        <code className="text-foreground/90">{`https://pay.hotmart.com/ABCDE
  ?utm_source=ig
  &utm_medium=Instagram_Feed
  &utm_campaign=Funil8V4_VendaTodoDia
  &utm_term=120244530953430237
  &utm_content=Criativo10_IMAGEM
  &utm_conjunto=Publico_Quente
  &xcod=d4931d63c67444af97ec7d91f18ec496
  &src=dXRtX3NvdXJjZTppZ3x1dG1fbWVkaXVtOk...`}</code>
      </pre>

      <h3>Valor do <code>src</code> decodificado (antes do Base64):</h3>
      <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 text-xs overflow-x-auto">
        <code className="text-foreground/90">{`utm_source:ig|utm_medium:Instagram_Feed|utm_campaign:Funil8V4_VendaTodoDia|utm_term:120244530953430237|utm_content:Criativo10_IMAGEM|utm_conjunto:Publico_Quente|click_id:d4931d63c67444af97ec7d91f18ec496`}</code>
      </pre>

      <hr />

      <h2>Passo 4: Configure o Webhook na Hotmart</h2>
      <ol>
        <li>Acesse o painel da Hotmart → <strong>Ferramentas → Webhooks (Notificações)</strong></li>
        <li>Clique em <strong>"Configurar"</strong> ou <strong>"Adicionar URL"</strong></li>
        <li>Cole a <strong>URL do webhook</strong> que você encontra em <strong>Integrações → Webhooks</strong> no Nexus Metrics</li>
        <li>Selecione os eventos:
          <div className="not-prose flex flex-wrap gap-1 my-2">
            {["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_CANCELED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_DELAYED"].map((ev) => (
              <Badge key={ev} variant="outline" className="text-[9px] font-mono">{ev}</Badge>
            ))}
          </div>
        </li>
        <li>Clique em <strong>"Salvar"</strong></li>
      </ol>

      <hr />

      <h2>Passo 5: O que o Webhook da Hotmart Retorna</h2>
      <p>Quando uma venda acontece, a Hotmart envia um POST para o Nexus. O payload contém:</p>

      <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 text-xs overflow-x-auto">
        <code className="text-foreground/90">{`{
  "data": {
    "purchase": {
      "tracking": {
        "external_code": "d4931d63c67444af97ec7d91f18ec496",
        "source_sck": "dXRtX3NvdXJjZTppZ3x1dG1fbWVkaXVtOk..."
      }
    }
  }
}`}</code>
      </pre>

      <div className="not-prose my-6 rounded-xl overflow-hidden border border-border/50">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 border-b border-border/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Campo do Webhook</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Origem</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Conteúdo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/20">
              <td className="px-4 py-3"><code>external_code</code></td>
              <td className="px-4 py-3 text-muted-foreground">Parâmetro <code>xcod</code></td>
              <td className="px-4 py-3 text-muted-foreground">O click_id original</td>
            </tr>
            <tr className="border-b border-border/20">
              <td className="px-4 py-3"><code>source_sck</code></td>
              <td className="px-4 py-3 text-muted-foreground">Parâmetro <code>src</code></td>
              <td className="px-4 py-3 text-muted-foreground">Base64 com todos os UTMs + click_id</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2>Passo 6: Como o Nexus Metrics Decodifica</h2>
      <p>O backend do Nexus processa o webhook com uma <strong>cadeia de prioridade sem duplicação</strong>:</p>

      <h3>Extração de UTMs:</h3>
      <ol>
        <li><strong>1º</strong> — <code>tracking.source_sck</code> (Base64): decodifica e extrai todos os UTMs. Se encontrar, <strong>para aqui</strong>.</li>
        <li><strong>2º</strong> — <code>origin.src</code> / <code>origin.sck</code> (legado): mapeia <code>src → utm_source</code>, <code>sck → utm_campaign</code>.</li>
        <li><strong>3º</strong> — Campos diretos (<code>utm_source</code>, <code>utm_medium</code>...): fallback para outras plataformas.</li>
      </ol>

      <h3>Extração do click_id:</h3>
      <ol>
        <li><strong>1º</strong> — <code>tracking.external_code</code> (valor do <code>xcod</code>)</li>
        <li><strong>2º</strong> — <code>origin.xcod</code> (legado)</li>
        <li><strong>3º</strong> — <code>click_id</code> dentro do Base64 (<code>source_sck</code>)</li>
        <li><strong>4º</strong> — Campo <code>click_id</code> direto no payload</li>
      </ol>

      <h3>Exemplo de decodificação:</h3>
      <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 text-xs overflow-x-auto">
        <code className="text-foreground/90">{`// Backend decodifica:
const decoded = atob(source_sck);
// "utm_source:ig|utm_medium:Instagram_Feed|click_id:abc123..."

const utms = {};
decoded.split('|').forEach(pair => {
  const [key, value] = pair.split(':');
  utms[key] = value;
});`}</code>
      </pre>

      <hr />

      <h2>Passo 7: Teste e Verifique</h2>
      <ol>
        <li>Acesse sua página com UTMs na URL: <code>?utm_source=teste&click_id=teste123</code></li>
        <li>Abra o console (F12) e digite: <code>localStorage.getItem('hotmart_tracking')</code></li>
        <li>Passe o mouse sobre o botão de compra — a URL deve conter <code>xcod=</code> e <code>src=</code></li>
        <li>Faça uma compra de teste na Hotmart</li>
        <li>No Nexus, vá em <strong>Integrações → Webhook Logs</strong> e confirme que UTMs e click_id aparecem</li>
      </ol>

      <hr />

      <h2>Mapeamento Completo de Campos</h2>
      <div className="not-prose my-6 rounded-xl overflow-hidden border border-border/50">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 border-b border-border/30">
              <th className="text-left px-3 py-2 font-semibold text-foreground">Dado</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">URL Entrada</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Checkout</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Webhook</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Nexus BD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/20">
              <td className="px-3 py-2 font-medium">click_id</td>
              <td className="px-3 py-2 text-muted-foreground"><code>click_id=</code></td>
              <td className="px-3 py-2 text-muted-foreground"><code>xcod=</code></td>
              <td className="px-3 py-2 text-muted-foreground"><code>external_code</code></td>
              <td className="px-3 py-2 text-muted-foreground"><code>click_id</code></td>
            </tr>
            {["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].map((u) => (
              <tr key={u} className="border-b border-border/20">
                <td className="px-3 py-2 font-medium">{u}</td>
                <td className="px-3 py-2 text-muted-foreground"><code>{u}=</code></td>
                <td className="px-3 py-2 text-muted-foreground">Dentro do <code>src</code></td>
                <td className="px-3 py-2 text-muted-foreground">Dentro do <code>source_sck</code></td>
                <td className="px-3 py-2 text-muted-foreground"><code>{u}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="not-prose my-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">🎉 Pronto!</strong> Com essa configuração, cada venda na Hotmart será automaticamente atribuída 
          à campanha, criativo e público corretos no Nexus Metrics, permitindo que você saiba exatamente qual anúncio gerou cada venda.
        </p>
      </div>
    </BlogLayout>
  );
}
