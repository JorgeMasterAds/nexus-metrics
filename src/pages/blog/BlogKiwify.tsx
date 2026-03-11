import BlogLayout from "@/components/blog/BlogLayout";
import { Badge } from "@/components/ui/badge";

export default function BlogKiwify() {
  return (
    <BlogLayout
      title="Configurando Webhook da Kiwify no Nexus Metrics"
      subtitle="Passo a passo completo para integrar a Kiwify com o Nexus Metrics e rastrear todas as suas vendas com UTMs automaticamente."
      readTime="5 min de leitura"
      date="Março 2025"
    >
      <h2>Introdução</h2>
      <p>
        A Kiwify é uma das plataformas de vendas mais populares no mercado digital brasileiro. 
        Diferente da Hotmart, a <strong>Kiwify envia os UTMs diretamente no payload do webhook</strong>, 
        o que simplifica bastante a integração.
      </p>

      <h2>Passo 1: Crie um Webhook no Nexus Metrics</h2>
      <ol>
        <li>No Nexus Metrics, vá em <strong>Integrações → Webhooks</strong></li>
        <li>Clique em <strong>"Criar Webhook"</strong></li>
        <li>Dê um nome descritivo (ex: "Kiwify - Curso X")</li>
        <li>Selecione a plataforma <strong>Kiwify</strong></li>
        <li>Clique em <strong>"Criar Webhook"</strong></li>
        <li><strong>Copie a URL gerada</strong> — você vai precisar dela no próximo passo</li>
      </ol>

      <h2>Passo 2: Configure o Webhook na Kiwify</h2>
      <ol>
        <li>Acesse sua conta Kiwify e vá em <strong>Configurações → Webhooks</strong></li>
        <li>Clique em <strong>"Adicionar webhook"</strong></li>
        <li>Cole a <strong>URL do webhook do Nexus</strong> que você copiou</li>
        <li>Selecione os eventos:
          <div className="not-prose flex flex-wrap gap-1 my-2">
            {["Compra aprovada", "Reembolso", "Chargeback", "Assinatura cancelada"].map((ev) => (
              <Badge key={ev} variant="outline" className="text-[9px]">{ev}</Badge>
            ))}
          </div>
        </li>
        <li>Salve a configuração</li>
      </ol>

      <h2>Rastreamento de UTMs na Kiwify</h2>
      <p>
        A Kiwify já <strong>envia os UTMs automaticamente</strong> no payload do webhook quando o comprador chega ao checkout 
        com parâmetros UTM na URL. Não é necessário nenhum script adicional na página de vendas.
      </p>
      <p>
        Se você usa <strong>SmartLinks do Nexus</strong>, o <code>click_id</code> é passado automaticamente via <code>sck</code> 
        e o Nexus faz a vinculação correta.
      </p>

      <h3>Campos que a Kiwify envia:</h3>
      <ul>
        <li><code>utm_source</code> — Fonte do tráfego</li>
        <li><code>utm_medium</code> — Tipo de mídia</li>
        <li><code>utm_campaign</code> — Nome da campanha</li>
        <li><code>utm_content</code> — Identificação do criativo</li>
        <li><code>utm_term</code> — Termo/palavra-chave</li>
      </ul>

      <h2>Passo 3: Teste a Integração</h2>
      <ol>
        <li>Faça uma compra de teste na Kiwify</li>
        <li>No Nexus Metrics, vá em <strong>Integrações → Webhook Logs</strong></li>
        <li>Verifique se a venda apareceu com status <strong>"approved"</strong></li>
        <li>Confirme que os campos UTM estão preenchidos</li>
      </ol>

      <div className="not-prose my-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">✅ Pronto!</strong> A Kiwify é a plataforma mais simples de integrar, 
          pois envia os UTMs diretamente. Nenhuma configuração extra é necessária.
        </p>
      </div>
    </BlogLayout>
  );
}
