import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  title: string;
  content: string;
  target?: string;
}

interface Props {
  tourId: string;
  steps: TourStep[];
  triggerLabel?: string;
}

const STORAGE_KEY_PREFIX = "tour_completed_";

// Persist tour completion in the database so it's truly once-per-user
async function checkTourCompleted(tourId: string): Promise<boolean> {
  // First check localStorage as a fast cache
  const localKey = `${STORAGE_KEY_PREFIX}${tourId}`;
  if (localStorage.getItem(localKey)) return true;
  // Then check DB
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await (supabase as any)
      .from("user_tour_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("tour_id", tourId)
      .maybeSingle();
    if (data) {
      localStorage.setItem(localKey, "true");
      return true;
    }
  } catch { /* table may not exist yet, fall back to localStorage */ }
  return false;
}

async function markTourCompleted(tourId: string) {
  const localKey = `${STORAGE_KEY_PREFIX}${tourId}`;
  localStorage.setItem(localKey, "true");
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any)
      .from("user_tour_completions")
      .upsert({ user_id: user.id, tour_id: tourId }, { onConflict: "user_id,tour_id" });
  } catch { /* silent */ }
}

export default function ProductTour({ tourId, steps, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const storageKey = `${STORAGE_KEY_PREFIX}${tourId}`;

  useEffect(() => {
    let cancelled = false;
    checkTourCompleted(tourId).then((completed) => {
      if (!cancelled && !completed) {
        const timer = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    });
    return () => { cancelled = true; };
  }, [tourId]);

  const computeRect = useCallback(() => {
    if (!open) return;
    const step = steps[currentStep];
    if (!step.target) { setTargetRect(null); return; }
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
      } else {
        setTargetRect(rect);
      }
    } else { setTargetRect(null); }
  }, [open, currentStep, steps]);

  useEffect(() => { computeRect(); }, [computeRect]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const step = steps[currentStep];
      if (!step.target) { setTargetRect(null); return; }
      const el = document.querySelector(step.target);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [open, currentStep, steps]);

  const finish = useCallback(() => {
    setOpen(false); setCurrentStep(0);
    markTourCompleted(tourId);
  }, [tourId]);

  const next = () => { if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1); else finish(); };
  const prev = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const step = steps[currentStep];

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const pad = 16; const tooltipW = Math.min(420, window.innerWidth - 32); const tooltipH = 280;
    let top = targetRect.bottom + pad;
    let left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
    if (top + tooltipH > window.innerHeight - 16) top = targetRect.top - pad - tooltipH;
    if (top < 16) { top = Math.max(16, targetRect.top); left = targetRect.right + pad; if (left + tooltipW > window.innerWidth - 16) left = targetRect.left - pad - tooltipW; }
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));
    return { position: "fixed", top, left, width: tooltipW };
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setCurrentStep(0); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Tutorial">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        {triggerLabel && <span>{triggerLabel}</span>}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
          <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <defs><mask id={`tour-mask-${tourId}`}><rect x="0" y="0" width="100%" height="100%" fill="white" />{targetRect && <rect x={targetRect.left - 8} y={targetRect.top - 8} width={targetRect.width + 16} height={targetRect.height + 16} rx="10" fill="black" />}</mask></defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask={`url(#tour-mask-${tourId})`} />
          </svg>
          {targetRect && <div className="fixed border-2 border-primary rounded-xl pointer-events-none" style={{ top: targetRect.top - 8, left: targetRect.left - 8, width: targetRect.width + 16, height: targetRect.height + 16, boxShadow: "0 0 0 4px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.15)", transition: "all 0.3s ease" }} />}
          <div className="fixed inset-0" style={{ pointerEvents: "auto" }} onClick={finish} />
          <div ref={tooltipRef} className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ ...getTooltipStyle(), pointerEvents: "auto", zIndex: 10000, maxHeight: "calc(100vh - 32px)", maxWidth: "calc(100vw - 32px)", minWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3"><span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{currentStep + 1}/{steps.length}</span><h3 className="text-base font-semibold">{step.title}</h3></div>
              <button onClick={finish} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4"><p className="text-base text-foreground/85 leading-relaxed whitespace-pre-line">{step.content}</p></div>
            <div className="flex justify-center gap-2 px-5 py-2 shrink-0">
              {steps.map((_, i) => <button key={i} onClick={() => setCurrentStep(i)} className={`h-2 rounded-full transition-all ${i === currentStep ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} />)}
            </div>
            <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0">
              <Button variant="ghost" size="default" onClick={prev} disabled={currentStep === 0} className="gap-1"><ChevronLeft className="h-4 w-4" />Voltar</Button>
              <Button size="default" onClick={next} className="gap-1 gradient-bg border-0 text-primary-foreground hover:opacity-90 px-6">{currentStep === steps.length - 1 ? "Concluir" : "Próximo"}{currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export const TOURS = {
  dashboard: {
    tourId: "dashboard-v2",
    steps: [
      { title: "Bem-vindo ao Dashboard", content: "Aqui você acompanha todas as métricas dos seus Smart Links: Views, Vendas, Taxa de Conversão, Faturamento, Ticket Médio, ROI e ROAS para o período selecionado." },
      { title: "Filtros de período", content: "Use os botões de período (7 dias, 30 dias, etc.) ou o filtro personalizado com calendário para alterar o intervalo de análise dos dados." },
      { title: "Gráficos de performance", content: "Os gráficos mostram a evolução diária de Views, Vendas e Receita. Passe o mouse sobre os pontos para ver detalhes. Os gráficos podem ser reordenados arrastando as seções." },
      { title: "Meta de faturamento", content: "Defina sua meta de faturamento personalizada clicando no ícone de edição. A barra de progresso mostra seu avanço em relação à meta definida." },
      { title: "Tabela de Smart Links", content: "Na parte inferior, veja a performance individual de cada Smart Link: views, vendas, receita, taxa de conversão e ticket médio." },
      { title: "Personalizar e Exportar", content: "Use o botão 'Personalizar' para ocultar/exibir KPIs e seções (Meta Ads, Google Ads, GA4, UTM). Use 'Reordenar' para reordenar. Exporte relatórios em CSV, Excel ou PDF." },
    ],
  },
  smartLinks: {
    tourId: "smart-links-v2",
    steps: [
      { title: "O que é um Smart Link?", content: "Um Smart Link é uma URL inteligente que distribui tráfego entre múltiplas variantes (páginas de destino) com pesos configuráveis. Isso permite testar diferentes páginas e otimizar conversões." },
      { title: "Variantes e pesos", content: "Cada Smart Link pode ter várias variantes, cada uma com URL de destino e peso (%). Os pesos devem somar 100%. O tráfego é distribuído proporcionalmente ao peso de cada variante ativa." },
      { title: "Click ID e atribuição", content: "A cada redirecionamento, um click_id único é gerado e passado via parâmetros (utm_term, click_id, sck) para a página de destino. Esse ID permite atribuir vendas ao Smart Link e variante corretos." },
      { title: "Destaque de métricas", content: "Na tabela de variantes, a métrica com melhor desempenho em cada coluna (vendas, OB, conversão, receita) é destacada em verde para identificação rápida da melhor variante." },
      { title: "Permissões", content: "Visualizadores podem apenas ver os Smart Links. Membros podem criar e editar, mas a exclusão requer aprovação de um administrador do projeto." },
    ],
  },
  utmReport: {
    tourId: "utm-report-v2",
    steps: [
      { title: "Relatório UTM", content: "O relatório UTM agrupa dados de cliques e vendas por parâmetros UTM: Campaign, Medium, Content e Source." },
      { title: "Como interpretar", content: "Campaign identifica a campanha; Medium o canal (ex: facebook, google); Content diferencia criativos; Source a origem do tráfego. Use esses dados para identificar quais campanhas geram mais vendas." },
      { title: "Gerador de UTMs", content: "Use o Gerador de UTMs integrado para criar URLs com parâmetros UTM padronizados para suas campanhas." },
      { title: "Exportação", content: "Exporte os dados do relatório UTM em CSV ou Excel para análises externas usando o menu de exportação no topo da página." },
    ],
  },
  webhookLogs: {
    tourId: "webhook-logs-v2",
    steps: [
      { title: "Como funciona", content: "Quando uma venda é realizada na sua plataforma de vendas, ela envia um webhook para a URL configurada. O sistema processa o webhook, identifica a plataforma e tenta atribuir a venda a um click_id." },
      { title: "Status dos webhooks", content: "• approved: venda confirmada e atribuída\n• duplicate: transação já processada\n• ignored: evento não relevante\n• error: falha no processamento\n• refunded/chargedback/canceled: estornos" },
      { title: "Atribuição", content: "Quando o webhook contém um click_id válido, a venda é atribuída ao Smart Link e variante correspondentes. Vendas sem click_id ficam como 'Não atribuído'." },
      { title: "Retenção", content: "Logs de webhook são mantidos por 90 dias e depois excluídos automaticamente para manter a performance do sistema." },
    ],
  },
  settings: {
    tourId: "settings-v2",
    steps: [
      { title: "Configurações", content: "Aqui você gerencia seus dados pessoais, projetos, equipe, assinatura e indicações. Navegue pelas abas no menu." },
      { title: "Projetos", content: "Crie e gerencie múltiplos projetos. Cada projeto tem seus próprios Smart Links, webhooks e relatórios isolados. Reordene projetos arrastando-os." },
      { title: "Equipe e Papéis", content: "Convide membros para seus projetos com diferentes papéis:\n\n• Visualizador: apenas visualização\n• Membro: pode criar e editar\n• Administrador: controle total incluindo exclusões\n• Owner: proprietário com acesso completo" },
      { title: "Organização", content: "Configure dados da empresa: razão social, CNPJ, telefone, endereço e email administrativo. Esses dados são protegidos e visíveis apenas para owners e admins." },
      { title: "Assinatura", content: "Gerencie seu plano, veja limites de uso e faça upgrade para desbloquear mais Smart Links, projetos e webhooks." },
    ],
  },
  resources: {
    tourId: "resources-v2",
    steps: [
      { title: "Domínio Personalizado", content: "Configure seu próprio domínio para que os Smart Links usem URLs profissionais em vez da URL técnica." },
      { title: "Configuração DNS", content: "Crie um registro CNAME no seu provedor DNS apontando para o servidor indicado. Após a propagação (até 72h), clique em 'Verificar DNS' para ativar." },
      { title: "Verificação", content: "Após verificar o DNS, seus Smart Links passarão a usar automaticamente o domínio personalizado." },
    ],
  },
  integrations: {
    tourId: "integrations-v2",
    steps: [
      { title: "Webhooks", content: "Configure webhooks para receber dados de vendas das suas plataformas (Hotmart, Cakto, Kiwify, etc.). Cada webhook tem uma URL única e pode ser associado a produtos específicos." },
      { title: "Meta Ads", content: "Conecte sua conta Meta Ads para importar dados de campanhas (investimento, cliques, impressões) automaticamente no Dashboard." },
      { title: "Google Ads", content: "Integre com Google Ads para visualizar métricas de investimento, cliques, CTR e CPC diretamente no dashboard." },
      { title: "Google Analytics 4", content: "Conecte o GA4 para visualizar sessões, usuários, engajamento, dispositivos e origens de tráfego." },
    ],
  },
  crm: {
    tourId: "crm-v1",
    steps: [
      { title: "O que é o CRM?", content: "O CRM organiza seus leads em pipelines visuais estilo Kanban. Leads são criados automaticamente via webhooks de vendas ou manualmente." },
      { title: "Pipelines e Etapas", content: "Crie múltiplos pipelines com etapas personalizáveis (ex: Novo Lead → Qualificado → Negociação → Compra). Arraste leads entre etapas para atualizar o status." },
      { title: "Leads automáticos", content: "Quando uma venda chega via webhook, o sistema cria ou atualiza o lead automaticamente, aplicando tags de produto, status, origem e método de pagamento." },
      { title: "Tags e Filtros", content: "Use tags coloridas para categorizar leads. Filtre por nome, email, telefone ou tag para encontrar leads rapidamente." },
      { title: "Vinculação de Produtos", content: "Vincule produtos a pipelines para que leads de compras específicas sejam automaticamente direcionados ao pipeline correto." },
    ],
  },
  surveys: {
    tourId: "surveys-v1",
    steps: [
      { title: "Pesquisas & Quiz", content: "Crie pesquisas com múltiplos tipos de pergunta: texto, múltipla escolha, escala, avaliação e sim/não. Quizzes incluem respostas corretas e pontuação." },
      { title: "Compartilhar", content: "Cada pesquisa possui um link público que pode ser compartilhado. Também é possível incorporar via iframe em seu site usando o código de embed." },
      { title: "Respostas", content: "Acompanhe todas as respostas em tempo real com visualização detalhada por respondente. Exporte os dados para análise." },
    ],
  },
  devices: {
    tourId: "devices-v1",
    steps: [
      { title: "Dispositivos WhatsApp", content: "Conecte seu WhatsApp através da API Oficial da Meta para enviar e receber mensagens automaticamente integradas ao seu funil." },
      { title: "Modos de conexão", content: "Escolha entre o modo Oficial (API exclusiva, recomendado para empresas) ou Coexistência (API + app pessoal simultaneamente)." },
      { title: "Configuração", content: "Informe o nome da instância, URL da API e chave de acesso. Os dados são armazenados de forma criptografada." },
    ],
  },
  systemHealth: {
    tourId: "system-health-v1",
    steps: [
      { title: "System Health", content: "Monitore a saúde do sistema em tempo real: latência, taxa de erro, webhooks e filas de processamento." },
      { title: "Status dos Serviços", content: "Veja o status de cada serviço: Redirect Engine, Tracking, Analytics, Worker, API e Webhook Dispatcher." },
      { title: "Logs Recentes", content: "Acompanhe os logs em tempo real com níveis info, warn e error para diagnosticar problemas rapidamente." },
    ],
  },
  reportTemplates: {
    tourId: "report-templates-v1",
    steps: [
      { title: "Planejamento", content: "Acesse modelos prontos de relatórios para análise e planejamento do seu negócio." },
      { title: "Templates", content: "Escolha entre diferentes templates otimizados para low ticket, high ticket e lançamentos." },
    ],
  },
  analytics: {
    tourId: "analytics-v1",
    steps: [
      { title: "Analytics Detalhado", content: "Análise aprofundada de um Smart Link específico: cliques, conversões, taxa e faturamento." },
      { title: "Performance por Variante", content: "Compare o desempenho de cada variante para identificar a melhor página de destino." },
      { title: "Gráficos Temporais", content: "Visualize a evolução de cliques e conversões ao longo do tempo no período selecionado." },
    ],
  },
  adminSettings: {
    tourId: "admin-settings-v1",
    steps: [
      { title: "Administração", content: "Painel exclusivo para Super Admins com controle total sobre planos, usuários, produtos e configurações do sistema." },
      { title: "Gestão de Usuários", content: "Gerencie contas, planos e permissões de todos os usuários da plataforma." },
    ],
  },
  aiAgents: {
    tourId: "ai-agents-v1",
    steps: [
      { title: "Agentes de IA", content: "Crie agentes inteligentes que automatizam tarefas como responder mensagens, qualificar leads e executar ações no CRM." },
      { title: "Editor Visual", content: "Use o editor de fluxos para configurar gatilhos, prompts de IA e ações de forma visual e intuitiva." },
      { title: "Gatilhos", content: "Configure gatilhos como WhatsApp, Webhook, Formulário ou Manual para iniciar a execução do agente." },
    ],
  },
  novidades: {
    tourId: "novidades-v1",
    steps: [
      { title: "Novidades", content: "Acompanhe todas as atualizações, melhorias e novos recursos da plataforma." },
    ],
  },
  metaAdsReport: {
    tourId: "meta-ads-report-v1",
    steps: [
      { title: "Meta Ads Report", content: "Relatório completo de performance dos seus anúncios no Facebook e Instagram Ads." },
      { title: "KPIs", content: "Acompanhe investimento, CPC, CPM, CTR, leads e custo por lead em um só lugar." },
      { title: "Gráficos", content: "Visualize tendências de investimento, cliques e impressões ao longo do tempo." },
    ],
  },
  ga4Report: {
    tourId: "ga4-report-v1",
    steps: [
      { title: "Google Analytics 4", content: "Relatório de acessos e comportamento dos visitantes baseado nos dados do GA4." },
      { title: "Métricas", content: "Sessões, usuários, novos usuários, engajamento, dispositivos e origens de tráfego." },
    ],
  },
  automations: {
    tourId: "automations-v1",
    steps: [
      { title: "Automações", content: "Configure fluxos automatizados que executam ações baseadas em gatilhos como novas vendas, novos leads ou mudanças de etapa no CRM." },
      { title: "Editor Visual", content: "Use o editor visual de fluxos para criar automações arrastando e conectando nós: gatilhos, condições e ações." },
      { title: "Ações disponíveis", content: "Envie mensagens WhatsApp, mova leads entre etapas, aplique tags, envie webhooks externos e mais — tudo automaticamente." },
    ],
  },
};
