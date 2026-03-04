import { X, HelpCircle } from "lucide-react";
import { useState } from "react";

interface TutorialSection {
  title: string;
  content: string;
}

interface Props {
  title: string;
  sections: TutorialSection[];
  triggerLabel?: string;
  triggerSize?: "sm" | "icon";
}

export default function TutorialModal({ title, sections, triggerLabel, triggerSize = "icon" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        title="Tutorial"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        {triggerLabel && <span>{triggerLabel}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-lg bg-card border border-border/50 rounded-xl card-shadow overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{title}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              {sections.map((s, i) => (
                <div key={i}>
                  <h3 className="text-xs font-semibold text-foreground mb-1.5">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-border/50 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 text-xs rounded-lg gradient-bg text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Pre-built tutorials for each page
export const TUTORIALS = {
  dashboard: {
    title: "Tutorial — Dashboard",
    sections: [
      { title: "Métricas principais", content: "O dashboard exibe Views (total de cliques), Vendas (conversões aprovadas), Taxa de Conversão, Investimento, Faturamento, ROAS e Ticket Médio para o período selecionado." },
      { title: "Meta de faturamento", content: "Defina sua meta de faturamento personalizada. A barra de progresso mostra seu avanço. Clique no ícone de edição para alterar a meta." },
      { title: "Filtros de período", content: "Use os botões de período (7d, 15d, 30d, Hoje, Mês) ou o filtro personalizado para alterar o intervalo dos dados." },
      { title: "Seções reordenáveis", content: "Ative 'Reordenar' para arrastar e reordenar as seções do dashboard conforme sua preferência." },
      { title: "Personalizar", content: "Use o botão 'Personalizar' para ocultar ou exibir KPIs e seções específicas, incluindo Meta Ads, Google Ads, GA4 e tabelas UTM detalhadas." },
      { title: "Comparação de período", content: "Cada métrica exibe a variação percentual em relação ao período anterior de mesmo tamanho, permitindo análise de tendências." },
      { title: "Tabela de Smart Links", content: "A tabela inferior mostra a performance individual de cada Smart Link incluindo views, vendas, receita, taxa de conversão e ticket médio." },
      { title: "Exportar e Compartilhar", content: "Use 'Exportar' para baixar relatórios em CSV, Excel ou PDF. Use 'Compartilhar' para gerar links públicos de visualização." },
    ],
  },
  smartLinks: {
    title: "Tutorial — Smart Links",
    sections: [
      { title: "O que é um Smart Link?", content: "Um Smart Link é uma URL inteligente que distribui tráfego entre múltiplas variantes com pesos configuráveis, permitindo testes A/B de páginas de destino." },
      { title: "Variantes e pesos", content: "Cada Smart Link pode ter várias variantes com URL de destino e peso (%). Os pesos devem somar 100%. Variantes podem ser ativadas/desativadas individualmente." },
      { title: "Click ID e Atribuição", content: "A cada redirecionamento, um click_id único é gerado e passado via parâmetros UTM para a página de destino, permitindo atribuição de vendas ao Smart Link e variante específicos." },
      { title: "Slug personalizado", content: "Cada Smart Link possui um slug editável que compõe a URL de redirecionamento. Clique no ícone de edição ao lado do slug para alterá-lo." },
      { title: "Destaque de métricas", content: "Na tabela de variantes, a métrica com melhor desempenho em cada coluna (vendas, OB, conversão, receita) é destacada em verde para identificação rápida." },
      { title: "Permissões", content: "• Visualizadores: apenas visualizam\n• Membros: podem criar e editar, exclusão requer aprovação de admin\n• Administradores: controle total" },
    ],
  },
  utmReport: {
    title: "Tutorial — Relatório UTM",
    sections: [
      { title: "Origem dos dados", content: "O relatório UTM agrupa dados de cliques e vendas por parâmetros UTM: Campaign, Medium, Content, Source e Term." },
      { title: "Como interpretar", content: "Campaign identifica a campanha; Medium o canal (cpc, social, email); Content diferencia criativos; Source a origem do tráfego (facebook, google)." },
      { title: "Gerador de UTMs", content: "Use o Gerador de UTMs integrado para criar URLs com parâmetros UTM padronizados para suas campanhas." },
      { title: "Exportação", content: "Exporte os dados em CSV ou Excel para análises externas." },
    ],
  },
  webhookLogs: {
    title: "Tutorial — Webhook Logs",
    sections: [
      { title: "Como funciona", content: "Quando uma venda é realizada, sua plataforma (Hotmart, Cakto, etc.) envia um webhook para a URL configurada. O sistema processa e tenta atribuir a venda a um click_id." },
      { title: "Status", content: "• approved: venda confirmada\n• duplicate: já processada\n• ignored: evento não relevante\n• error: falha no processamento\n• refunded/chargedback/canceled: estornos" },
      { title: "Atribuição", content: "Vendas com click_id válido são atribuídas ao Smart Link correspondente. Vendas sem click_id ficam como 'Não atribuído'." },
      { title: "Retenção", content: "Logs de webhook são mantidos por 90 dias e depois excluídos automaticamente." },
    ],
  },
  settings: {
    title: "Tutorial — Configurações",
    sections: [
      { title: "Dados Pessoais", content: "Atualize seu nome, email, foto de perfil e senha. A foto é armazenada de forma segura no storage da plataforma." },
      { title: "Projetos", content: "Crie e gerencie múltiplos projetos. Cada projeto possui Smart Links, webhooks e relatórios independentes. Reordene projetos arrastando-os. Desative projetos que não usa mais." },
      { title: "Equipe e Papéis", content: "Convide membros com papéis diferenciados:\n• Visualizador: apenas visualização\n• Membro: criar e editar (exclusão requer aprovação)\n• Administrador: controle total\n• Owner: proprietário" },
      { title: "URL do Webhook", content: "Copie a URL do webhook e cole na configuração da sua plataforma de vendas. Cada projeto tem uma URL única." },
      { title: "Organização", content: "Configure dados da empresa: razão social, CNPJ, telefone, endereço e email administrativo. Esses dados ficam protegidos e acessíveis apenas a owners e admins." },
      { title: "Assinatura", content: "Visualize seu plano atual e seus limites de uso. Faça upgrade para desbloquear mais Smart Links, projetos, membros e funcionalidades avançadas." },
    ],
  },
  crm: {
    title: "Tutorial — CRM",
    sections: [
      { title: "O que é o CRM?", content: "O CRM organiza seus leads em pipelines visuais estilo Kanban. Leads são criados automaticamente via webhooks de vendas ou manualmente." },
      { title: "Pipelines e Etapas", content: "Crie múltiplos pipelines com etapas personalizáveis (ex: Novo Lead → Qualificado → Negociação → Compra). Arraste leads entre etapas." },
      { title: "Leads automáticos", content: "Quando uma venda chega via webhook, o sistema cria ou atualiza o lead automaticamente, aplicando tags de produto, status, origem e método de pagamento." },
      { title: "Tags e Filtros", content: "Use tags coloridas para categorizar leads. Filtre por nome, email, telefone ou tag para encontrar leads rapidamente." },
      { title: "Histórico", content: "Cada lead possui histórico completo de ações: criação, compras, alterações de etapa e notas manuais." },
      { title: "Vinculação de Produtos", content: "Vincule produtos a pipelines para que leads de compras específicas sejam automaticamente direcionados ao pipeline correto." },
    ],
  },
  integrations: {
    title: "Tutorial — Integrações",
    sections: [
      { title: "Meta Ads", content: "Conecte sua conta Meta Ads para importar dados de campanhas (investimento, cliques, impressões) automaticamente. Os dados aparecem no Dashboard nas seções Meta Ads." },
      { title: "Google Ads", content: "Integre com Google Ads para visualizar métricas de investimento, cliques, CTR e CPC diretamente no dashboard." },
      { title: "Google Analytics 4", content: "Conecte o GA4 para visualizar sessões, usuários, engajamento, dispositivos e origens de tráfego." },
      { title: "Webhooks", content: "Configure webhooks para receber dados de vendas de plataformas como Hotmart, Cakto, Kiwify e outras. Cada projeto possui uma URL de webhook única." },
    ],
  },
  surveys: {
    title: "Tutorial — Pesquisas & Quiz",
    sections: [
      { title: "Criar pesquisa", content: "Crie pesquisas com múltiplos tipos de pergunta: texto, múltipla escolha, escala, avaliação e sim/não." },
      { title: "Compartilhar", content: "Cada pesquisa possui um link público que pode ser compartilhado. Também é possível incorporar via iframe em seu site." },
      { title: "Respostas", content: "Acompanhe todas as respostas em tempo real com visualização detalhada por respondente." },
      { title: "Limites", content: "O número de pesquisas ativas é limitado pelo seu plano. Faça upgrade para criar mais pesquisas." },
    ],
  },
  devices: {
    title: "Tutorial — Dispositivos",
    sections: [
      { title: "Rastreamento", content: "Visualize dados agregados de dispositivos que acessaram seus Smart Links: tipo de dispositivo (mobile, desktop, tablet), navegador e sistema operacional." },
      { title: "Privacidade", content: "IPs são anonimizados via hash SHA-256 para conformidade com a LGPD. Dados brutos de IP nunca são armazenados." },
    ],
  },
};
