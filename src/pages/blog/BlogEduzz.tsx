import BlogLayout from "@/components/blog/BlogLayout";
import { Badge } from "@/components/ui/badge";

export default function BlogEduzz() {
  return (
    <BlogLayout
      title="Configurando Webhook da Eduzz no Nexus Metrics"
      subtitle="Como configurar postbacks da Eduzz para receber vendas no Nexus Metrics com atribuição completa de UTMs."
      readTime="5 min de leitura"
      date="Março 2025"
    >
      <h2>Introdução</h2>
      <p>
        A Eduzz utiliza um sistema de <strong>postbacks</strong> para notificar sobre vendas. 
        Cada produto pode ter seu próprio webhook, o que permite um rastreamento bem segmentado.
      </p>

      <h2>Passo 1: Crie um Webhook no Nexus Metrics</h2>
      <ol>
        <li>No Nexus Metrics, vá em <strong>Integrações → Webhooks</strong></li>
        <li>Clique em <strong>"Criar Webhook"</strong></li>
        <li>Dê um nome descritivo (ex: "Eduzz - E-book Marketing")</li>
        <li>Selecione a plataforma <strong>Eduzz</strong></li>
        <li>Clique em <strong>"Criar Webhook"</strong></li>
        <li><strong>Copie a URL gerada</strong></li>
      </ol>

      <div className="not-prose my-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">💡 Dica:</strong> Na Eduzz, cada produto pode ter seu próprio webhook. 
          Recomendamos criar um webhook separado no Nexus para cada produto para facilitar a organização.
        </p>
      </div>

      <h2>Passo 2: Configure o Postback na Eduzz</h2>
      <ol>
        <li>Acesse a Eduzz → <strong>Minha conta → Configurações avançadas → Webhooks</strong></li>
        <li>Clique em <strong>"Adicionar URL de postback"</strong></li>
        <li>Cole a <strong>URL do webhook do Nexus</strong></li>
        <li>Selecione o <strong>conteúdo/produto</strong> que deseja monitorar</li>
        <li>Marque os eventos desejados:
          <div className="not-prose flex flex-wrap gap-1 my-2">
            {["Venda confirmada", "Reembolso", "Chargeback", "Assinatura cancelada"].map((ev) => (
              <Badge key={ev} variant="outline" className="text-[9px]">{ev}</Badge>
            ))}
          </div>
        </li>
        <li>Salve a configuração</li>
      </ol>

      <h2>Rastreamento de UTMs na Eduzz</h2>
      <p>
        A Eduzz envia os UTMs no payload do webhook quando configurados corretamente na URL de checkout. 
        O Nexus Metrics extrai automaticamente os campos padrão de UTM do payload.
      </p>

      <h2>Passo 3: Teste a Integração</h2>
      <ol>
        <li>Faça uma compra de teste ou use o simulador da Eduzz</li>
        <li>Verifique os dados em <strong>Integrações → Webhook Logs</strong></li>
        <li>Confirme que a venda apareceu com os UTMs preenchidos</li>
      </ol>

      <div className="not-prose my-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">✅ Pronto!</strong> Sua integração com a Eduzz está configurada.
        </p>
      </div>
    </BlogLayout>
  );
}
