import BlogLayout from "@/components/blog/BlogLayout";
import { Badge } from "@/components/ui/badge";

export default function BlogMonetizze() {
  return (
    <BlogLayout
      title="Configurando Webhook da Monetizze no Nexus Metrics"
      subtitle="Integre a Monetizze com o Nexus Metrics para rastrear vendas e atribuir campanhas via postback."
      readTime="5 min de leitura"
      date="Março 2025"
    >
      <h2>Introdução</h2>
      <p>
        A Monetizze utiliza <strong>postbacks</strong> para enviar notificações de vendas. 
        O Nexus Metrics suporta automaticamente os formatos GET e POST da Monetizze.
      </p>

      <h2>Passo 1: Crie um Webhook no Nexus Metrics</h2>
      <ol>
        <li>Vá em <strong>Integrações → Webhooks</strong></li>
        <li>Clique em <strong>"Criar Webhook"</strong></li>
        <li>Nome: ex. "Monetizze - Produto Y"</li>
        <li>Plataforma: <strong>Monetizze</strong></li>
        <li><strong>Copie a URL gerada</strong></li>
      </ol>

      <h2>Passo 2: Configure o Postback na Monetizze</h2>
      <ol>
        <li>Acesse Monetizze → <strong>Meus Produtos → Selecione o produto</strong></li>
        <li>Vá na aba <strong>"Configurações" → "Postbacks"</strong></li>
        <li>Cole a <strong>URL do webhook do Nexus</strong></li>
        <li>Selecione os status de notificação:
          <div className="not-prose flex flex-wrap gap-1 my-2">
            {["Venda confirmada", "Reembolso", "Chargeback", "Cancelamento"].map((ev) => (
              <Badge key={ev} variant="outline" className="text-[9px]">{ev}</Badge>
            ))}
          </div>
        </li>
        <li>Salve as alterações</li>
      </ol>

      <div className="not-prose my-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">💡 Dica:</strong> A Monetizze envia postbacks tanto por GET quanto por POST. 
          O Nexus suporta ambos os formatos automaticamente — nenhuma configuração extra é necessária.
        </p>
      </div>

      <h2>Rastreamento de UTMs</h2>
      <p>
        A Monetizze inclui os UTMs no payload quando o comprador chega via URL parametrizada. 
        O Nexus extrai automaticamente <code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code> e demais campos.
      </p>

      <h2>Passo 3: Teste</h2>
      <ol>
        <li>Faça uma compra de teste</li>
        <li>Verifique em <strong>Integrações → Webhook Logs</strong></li>
      </ol>

      <div className="not-prose my-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">✅ Pronto!</strong> Sua integração com a Monetizze está configurada.
        </p>
      </div>
    </BlogLayout>
  );
}
