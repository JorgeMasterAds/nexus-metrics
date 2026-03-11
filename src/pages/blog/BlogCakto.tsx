import BlogLayout from "@/components/blog/BlogLayout";
import { Badge } from "@/components/ui/badge";

export default function BlogCakto() {
  return (
    <BlogLayout
      title="Configurando Webhook da Cakto no Nexus Metrics"
      subtitle="Como configurar o webhook da Cakto, incluindo particularidades do formato de payload que o Nexus já trata automaticamente."
      readTime="5 min de leitura"
      date="Março 2025"
    >
      <h2>Introdução</h2>
      <p>
        A Cakto é uma plataforma de vendas que tem uma particularidade técnica importante: 
        o campo <code>data</code> no payload do webhook pode ser enviado tanto como <strong>array</strong> quanto como <strong>objeto</strong>. 
        O Nexus Metrics já trata ambos os formatos automaticamente.
      </p>

      <h2>Passo 1: Crie um Webhook no Nexus Metrics</h2>
      <ol>
        <li>Vá em <strong>Integrações → Webhooks</strong></li>
        <li>Clique em <strong>"Criar Webhook"</strong></li>
        <li>Nome: ex. "Cakto - Produto Z"</li>
        <li>Plataforma: <strong>Cakto</strong></li>
        <li><strong>Copie a URL gerada</strong></li>
      </ol>

      <h2>Passo 2: Configure o Webhook na Cakto</h2>
      <ol>
        <li>Acesse a Cakto → <strong>Configurações → Integrações → Webhooks</strong></li>
        <li>Adicione uma nova URL de webhook</li>
        <li>Cole a <strong>URL do webhook do Nexus</strong></li>
        <li>Ative os eventos desejados:
          <div className="not-prose flex flex-wrap gap-1 my-2">
            {["Venda aprovada", "Reembolso", "Cancelamento"].map((ev) => (
              <Badge key={ev} variant="outline" className="text-[9px]">{ev}</Badge>
            ))}
          </div>
        </li>
        <li>Salve a configuração</li>
      </ol>

      <h2>Particularidade Técnica: Array vs Objeto</h2>
      <p>
        A Cakto pode enviar o campo <code>data</code> de duas formas:
      </p>
      <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 text-xs overflow-x-auto">
        <code className="text-foreground/90">{`// Formato 1: Objeto (padrão)
{ "data": { "transaction": "...", "amount": 97 } }

// Formato 2: Array (algumas versões)
{ "data": [{ "transaction": "...", "amount": 97 }] }`}</code>
      </pre>
      <p>
        O <strong>Nexus Metrics detecta automaticamente</strong> o formato e extrai os dados corretamente em ambos os casos. 
        Você não precisa se preocupar com essa diferença.
      </p>

      <h2>Rastreamento de UTMs</h2>
      <p>
        A Cakto envia UTMs no payload quando disponíveis. O Nexus extrai automaticamente os campos padrão. 
        Se você usa SmartLinks, o <code>click_id</code> também é capturado automaticamente.
      </p>

      <h2>Passo 3: Teste</h2>
      <ol>
        <li>Faça uma compra de teste na Cakto</li>
        <li>Verifique em <strong>Integrações → Webhook Logs</strong></li>
        <li>Confirme que os dados foram recebidos corretamente</li>
      </ol>

      <div className="not-prose my-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">✅ Pronto!</strong> Sua integração com a Cakto está configurada. 
          O Nexus trata automaticamente as particularidades do payload.
        </p>
      </div>
    </BlogLayout>
  );
}
