import type {
  NexusForm, FormBlock, FormResponse, FormTemplate,
  WelcomeCardBlock, EndingCardBlock, OpenTextBlock,
  MultipleChoiceSingleBlock, RatingBlock, NpsBlock,
  MultipleChoiceMultiBlock, ContactInfoBlock,
} from "@/types/forms";

const uid = () => crypto.randomUUID();

// ── Default styling ──
const defaultStyling = {
  brandColor: "hsl(0 84% 60%)",
  accentColor: "hsl(0 84% 50%)",
  backgroundColor: "hsl(240 5% 6%)",
  cardColor: "hsl(240 4% 10%)",
  textColor: "hsl(0 0% 98%)",
  fontFamily: "'Space Grotesk', sans-serif",
  borderRadius: 12,
  cardArrangement: "straight" as const,
  backgroundType: "color" as const,
};

const defaultSettings = {
  allowMultipleResponses: false,
  requireEmail: false,
  isPublic: true,
  progressBar: true,
  backButton: true,
};

// ── Templates ──
export const formTemplates: FormTemplate[] = [
  {
    id: "t-csat", name: "Pesquisa de Satisfação (CSAT)", description: "Meça a satisfação dos seus clientes com perguntas rápidas e diretas.", category: "Pesquisa", icon: "Star",
    blocks: [
      { id: uid(), type: "welcome_card", headline: "Queremos ouvir você!", subheader: "Leva apenas 1 minuto.", required: false, buttonLabel: "Começar" } as WelcomeCardBlock,
      { id: uid(), type: "rating", headline: "Qual sua satisfação geral com nosso produto?", required: true, scale: 5, style: "star", lowLabel: "Muito insatisfeito", highLabel: "Muito satisfeito" } as RatingBlock,
      { id: uid(), type: "open_text", headline: "O que podemos melhorar?", required: false, inputType: "text", longAnswer: true, placeholder: "Conte-nos..." } as OpenTextBlock,
      { id: uid(), type: "ending_card", headline: "Obrigado pelo seu feedback!", subheader: "Sua opinião é muito importante.", required: false, buttonLabel: "Fechar" } as EndingCardBlock,
    ],
  },
  {
    id: "t-nps", name: "Net Promoter Score (NPS)", description: "Descubra quantos dos seus clientes são promotores da sua marca.", category: "Pesquisa", icon: "TrendingUp",
    blocks: [
      { id: uid(), type: "welcome_card", headline: "Uma pergunta rápida", subheader: "Leva 30 segundos.", required: false, buttonLabel: "Responder" } as WelcomeCardBlock,
      { id: uid(), type: "nps", headline: "De 0 a 10, qual a chance de recomendar nosso produto?", required: true, lowLabel: "Nada provável", highLabel: "Extremamente provável" } as NpsBlock,
      { id: uid(), type: "open_text", headline: "O que motivou sua nota?", required: false, inputType: "text", longAnswer: true } as OpenTextBlock,
      { id: uid(), type: "ending_card", headline: "Agradecemos sua resposta!", required: false } as EndingCardBlock,
    ],
  },
  {
    id: "t-feedback", name: "Feedback de Produto", description: "Colete opiniões detalhadas sobre funcionalidades específicas do produto.", category: "Feedback", icon: "MessageSquare",
    blocks: [
      { id: uid(), type: "welcome_card", headline: "Feedback de Produto", subheader: "Ajude-nos a melhorar.", required: false, buttonLabel: "Iniciar" } as WelcomeCardBlock,
      { id: uid(), type: "multiple_choice_single", headline: "Qual funcionalidade você mais utiliza?", required: true, options: [{ id: uid(), label: "Dashboard" }, { id: uid(), label: "Relatórios" }, { id: uid(), label: "CRM" }, { id: uid(), label: "Smart Links" }], allowOther: true, shuffleOptions: false, displayAs: "list" } as MultipleChoiceSingleBlock,
      { id: uid(), type: "rating", headline: "Como avalia a facilidade de uso?", required: true, scale: 5, style: "star" } as RatingBlock,
      { id: uid(), type: "open_text", headline: "Sugestões de melhoria?", required: false, inputType: "text", longAnswer: true } as OpenTextBlock,
      { id: uid(), type: "ending_card", headline: "Feedback enviado!", required: false } as EndingCardBlock,
    ],
  },
  {
    id: "t-quiz", name: "Quiz de Conhecimento", description: "Teste conhecimentos com pontuação automática e feedback por resposta.", category: "Quiz", icon: "Brain",
    blocks: [
      { id: uid(), type: "welcome_card", headline: "Quiz: Teste seus conhecimentos!", subheader: "5 perguntas rápidas.", required: false, buttonLabel: "Começar Quiz" } as WelcomeCardBlock,
      { id: uid(), type: "multiple_choice_single", headline: "Qual a capital do Brasil?", required: true, options: [{ id: uid(), label: "São Paulo" }, { id: uid(), label: "Brasília" }, { id: uid(), label: "Rio de Janeiro" }], allowOther: false, shuffleOptions: true, displayAs: "list" } as MultipleChoiceSingleBlock,
      { id: uid(), type: "ending_card", headline: "Quiz finalizado!", subheader: "Confira seu resultado.", required: false } as EndingCardBlock,
    ],
  },
  {
    id: "t-lead", name: "Formulário de Cadastro / Lead", description: "Capture informações de contato de potenciais clientes.", category: "Lead", icon: "UserPlus",
    blocks: [
      { id: uid(), type: "welcome_card", headline: "Cadastre-se", subheader: "Preencha seus dados para entrar em contato.", required: false, buttonLabel: "Continuar" } as WelcomeCardBlock,
      { id: uid(), type: "contact_info", headline: "Seus dados", required: true, fields: [{ key: "firstName", enabled: true, required: true }, { key: "lastName", enabled: true, required: false }, { key: "email", enabled: true, required: true }, { key: "phone", enabled: true, required: false }, { key: "company", enabled: true, required: false }] } as ContactInfoBlock,
      { id: uid(), type: "ending_card", headline: "Cadastro realizado!", subheader: "Entraremos em contato em breve.", required: false } as EndingCardBlock,
    ],
  },
  {
    id: "t-exit", name: "Pesquisa de Saída", description: "Entenda por que os usuários estão deixando seu produto.", category: "Pesquisa", icon: "LogOut",
    blocks: [
      { id: uid(), type: "welcome_card", headline: "Sentiremos sua falta!", subheader: "Antes de ir, nos ajude a melhorar.", required: false, buttonLabel: "Responder" } as WelcomeCardBlock,
      { id: uid(), type: "multiple_choice_single", headline: "Qual o principal motivo de saída?", required: true, options: [{ id: uid(), label: "Preço" }, { id: uid(), label: "Falta de funcionalidades" }, { id: uid(), label: "Suporte" }, { id: uid(), label: "Encontrei alternativa melhor" }], allowOther: true, shuffleOptions: false, displayAs: "list" } as MultipleChoiceSingleBlock,
      { id: uid(), type: "open_text", headline: "Algum comentário adicional?", required: false, inputType: "text", longAnswer: true } as OpenTextBlock,
      { id: uid(), type: "ending_card", headline: "Obrigado pela sua honestidade.", required: false } as EndingCardBlock,
    ],
  },
  {
    id: "t-blank", name: "Formulário em Branco", description: "Comece do zero e crie seu formulário personalizado.", category: "Geral", icon: "FileText",
    blocks: [
      { id: uid(), type: "welcome_card", headline: "Bem-vindo!", subheader: "Comece a responder.", required: false, buttonLabel: "Iniciar" } as WelcomeCardBlock,
      { id: uid(), type: "ending_card", headline: "Obrigado!", required: false } as EndingCardBlock,
    ],
  },
];

// ── Mock Forms ──
function generateResponses(formId: string, count: number): FormResponse[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `resp-${formId}-${i}`,
    formId,
    data: { q1: ["Boa", "Ruim", "Excelente", "Normal"][i % 4], q2: Math.floor(Math.random() * 10) + 1 },
    finished: Math.random() > 0.15,
    startedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    completedAt: Math.random() > 0.15 ? new Date(Date.now() - Math.random() * 29 * 86400000).toISOString() : undefined,
    userAgent: "Mozilla/5.0",
  }));
}

export const mockForms: NexusForm[] = [
  {
    id: "form-1", name: "Pesquisa de Satisfação Q1 2026", status: "active", type: "link",
    blocks: formTemplates[0].blocks, variables: [], styling: defaultStyling, settings: defaultSettings,
    responseCount: 87, completionRate: 78, avgResponseTime: 45,
    createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-03-01T14:30:00Z",
  },
  {
    id: "form-2", name: "NPS Mensal — Março", status: "active", type: "link",
    blocks: formTemplates[1].blocks, variables: [], styling: defaultStyling, settings: defaultSettings,
    responseCount: 134, completionRate: 85, avgResponseTime: 30,
    createdAt: "2026-03-01T08:00:00Z", updatedAt: "2026-03-05T16:00:00Z",
  },
  {
    id: "form-3", name: "Feedback Nova Feature", status: "draft", type: "link",
    blocks: formTemplates[2].blocks, variables: [], styling: defaultStyling, settings: defaultSettings,
    responseCount: 0, completionRate: 0, avgResponseTime: 0,
    createdAt: "2026-03-04T09:00:00Z", updatedAt: "2026-03-04T09:00:00Z",
  },
  {
    id: "form-4", name: "Quiz Onboarding", status: "completed", type: "quiz",
    blocks: formTemplates[3].blocks, variables: [], styling: defaultStyling, settings: { ...defaultSettings, responseLimit: 100 },
    responseCount: 100, completionRate: 62, avgResponseTime: 120,
    createdAt: "2025-12-01T08:00:00Z", updatedAt: "2026-02-28T23:59:00Z",
  },
  {
    id: "form-5", name: "Exit Survey — Churned Users", status: "paused", type: "app",
    blocks: formTemplates[5].blocks, variables: [], styling: defaultStyling, settings: defaultSettings,
    responseCount: 23, completionRate: 41, avgResponseTime: 60,
    createdAt: "2026-02-10T12:00:00Z", updatedAt: "2026-02-25T10:00:00Z",
  },
];

export const mockResponses: Record<string, FormResponse[]> = {
  "form-1": generateResponses("form-1", 87),
  "form-2": generateResponses("form-2", 134),
  "form-4": generateResponses("form-4", 100),
  "form-5": generateResponses("form-5", 23),
};
