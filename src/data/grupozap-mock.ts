// ── GrupoZap Mock Data ──

export interface GZAccount {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  status: "connected" | "disconnected" | "reconnecting";
  campaignCount: number;
}

export interface GZCampaign {
  id: string;
  name: string;
  status: "active" | "paused" | "ended";
  mode: "launch" | "list";
  link: string;
  clicks: number;
  participants: number;
  exits: number;
  accountIds: string[];
  groups: GZGroup[];
}

export interface GZGroup {
  id: string;
  name: string;
  participants: number;
  limit: number;
  status: "available" | "full" | "archived";
}

export interface GZMessage {
  id: string;
  campaignId: string;
  content: string;
  type: "text" | "image" | "audio" | "poll";
  scheduledAt?: string;
  sentAt?: string;
  status: "sent" | "scheduled" | "draft";
  accountId: string;
}

export interface GZLink {
  id: string;
  name: string;
  destinationUrl: string;
  deepLink: boolean;
  active: boolean;
  slug: string;
  clicks: number;
  clickHistory: { date: string; clicks: number }[];
}

export interface GZAction {
  id: string;
  type: string;
  scope: string;
  status: "scheduled" | "queued" | "running" | "completed" | "error";
  scheduledAt: string;
  accountId: string;
}

export interface GZWebhook {
  id: string;
  name: string;
  platform: string;
  productId: string;
  accountId: string;
  url: string;
  events: { event: string; message: string; enabled: boolean; executions: number }[];
}

export interface GZBlockedNumber {
  id: string;
  phone: string;
  reason?: string;
  addedAt: string;
}

export interface GZLead {
  id: string;
  phone: string;
  name?: string;
  score: number;
  classification: "hot" | "warm" | "cold";
  groupId: string;
}

// ── MOCK DATA ──

export const mockAccounts: GZAccount[] = [
  { id: "acc-1", name: "Sandy Principal", phone: "+55 11 99999-0001", status: "connected", campaignCount: 2 },
  { id: "acc-2", name: "Sandy Backup", phone: "+55 11 99999-0002", status: "connected", campaignCount: 1 },
  { id: "acc-3", name: "Conta Webhook", phone: "+55 11 99999-0003", status: "connected", campaignCount: 0 },
];

const launchGroups: GZGroup[] = Array.from({ length: 8 }, (_, i) => ({
  id: `grp-l-${i + 1}`,
  name: `Novo Sandy ${i + 1}`,
  participants: i < 7 ? 250 : 97,
  limit: 250,
  status: i < 7 ? "full" as const : "available" as const,
}));

const perpetuoGroups: GZGroup[] = Array.from({ length: 3 }, (_, i) => ({
  id: `grp-p-${i + 1}`,
  name: `Mentoria ${i + 1}`,
  participants: i === 0 ? 250 : i === 1 ? 200 : 70,
  limit: 250,
  status: i === 0 ? "full" as const : "available" as const,
}));

export const mockCampaigns: GZCampaign[] = [
  {
    id: "camp-1",
    name: "Lançamento Janeiro 2025",
    status: "active",
    mode: "launch",
    link: "grupozap.nexus.app/c/jan2025",
    clicks: 4230,
    participants: 1847,
    exits: 312,
    accountIds: ["acc-1", "acc-2"],
    groups: launchGroups,
  },
  {
    id: "camp-2",
    name: "Perpétuo Mentoria",
    status: "active",
    mode: "list",
    link: "grupozap.nexus.app/c/mentoria",
    clicks: 890,
    participants: 520,
    exits: 45,
    accountIds: ["acc-1"],
    groups: perpetuoGroups,
  },
];

export const mockMessages: GZMessage[] = [
  { id: "msg-1", campaignId: "camp-1", content: "🔥 Fala galera! O link da aula 1 já está disponível no fixado!", type: "text", sentAt: "2025-01-15T10:30:00", status: "sent", accountId: "acc-1" },
  { id: "msg-2", campaignId: "camp-1", content: "📢 Aula 2 amanhã às 20h! Quem vai estar presente? 🙋", type: "text", scheduledAt: "2025-01-16T19:00:00", status: "scheduled", accountId: "acc-1" },
  { id: "msg-3", campaignId: "camp-2", content: "Boas-vindas à Mentoria! 🚀", type: "text", sentAt: "2025-01-10T09:00:00", status: "sent", accountId: "acc-1" },
];

export const mockLinks: GZLink[] = [
  { id: "lnk-1", name: "Aula 1 - Abertura", destinationUrl: "https://youtube.com/watch?v=abc123", deepLink: true, active: true, slug: "aula-1", clicks: 1823, clickHistory: Array.from({ length: 28 }, (_, i) => ({ date: `2025-01-${String(i + 1).padStart(2, "0")}`, clicks: Math.floor(Math.random() * 120 + 10) })) },
  { id: "lnk-2", name: "Aula 2 - Conteúdo", destinationUrl: "https://youtube.com/watch?v=def456", deepLink: true, active: true, slug: "aula-2", clicks: 1205, clickHistory: Array.from({ length: 28 }, (_, i) => ({ date: `2025-01-${String(i + 1).padStart(2, "0")}`, clicks: Math.floor(Math.random() * 80 + 5) })) },
  { id: "lnk-3", name: "Página de Vendas", destinationUrl: "https://minhapagina.com/oferta", deepLink: false, active: true, slug: "oferta", clicks: 3450, clickHistory: Array.from({ length: 28 }, (_, i) => ({ date: `2025-01-${String(i + 1).padStart(2, "0")}`, clicks: Math.floor(Math.random() * 200 + 20) })) },
  { id: "lnk-4", name: "WhatsApp Suporte", destinationUrl: "https://wa.me/5511999990001", deepLink: true, active: true, slug: "suporte-wpp", clicks: 567, clickHistory: Array.from({ length: 28 }, (_, i) => ({ date: `2025-01-${String(i + 1).padStart(2, "0")}`, clicks: Math.floor(Math.random() * 30 + 2) })) },
  { id: "lnk-5", name: "Pesquisa Pós-Evento", destinationUrl: "https://forms.google.com/xyz", deepLink: false, active: false, slug: "pesquisa", clicks: 234, clickHistory: Array.from({ length: 28 }, (_, i) => ({ date: `2025-01-${String(i + 1).padStart(2, "0")}`, clicks: Math.floor(Math.random() * 15) })) },
];

export const mockActions: GZAction[] = [
  { id: "act-1", type: "Enviar Mensagem", scope: "Lançamento Janeiro 2025 → Todos", status: "completed", scheduledAt: "2025-01-15T10:30:00", accountId: "acc-1" },
  { id: "act-2", type: "Trocar Nome do Grupo", scope: "Perpétuo Mentoria → Mentoria 1", status: "running", scheduledAt: "2025-01-16T08:00:00", accountId: "acc-1" },
  { id: "act-3", type: "Enviar Mensagem", scope: "Lançamento Janeiro 2025 → Grupo 8", status: "scheduled", scheduledAt: "2025-01-17T20:00:00", accountId: "acc-2" },
];

export const mockWebhooks: GZWebhook[] = [
  {
    id: "wh-1", name: "Hotmart - Curso Principal", platform: "Hotmart", productId: "12345", accountId: "acc-3",
    url: "https://api.nexus.app/wh/hotmart/abc123",
    events: [
      { event: "Compra Aprovada", message: "Parabéns {nome}! 🎉 Sua compra do {produto} foi aprovada!", enabled: true, executions: 47 },
      { event: "Boleto Impresso", message: "Oi {nome}, seu boleto de {valor} está disponível!", enabled: true, executions: 12 },
      { event: "Compra Cancelada", message: "Oi {nome}, vimos que cancelou. Podemos ajudar?", enabled: false, executions: 0 },
    ],
  },
  {
    id: "wh-2", name: "Kiwify - Mentoria", platform: "Kiwify", productId: "67890", accountId: "acc-3",
    url: "https://api.nexus.app/wh/kiwify/def456",
    events: [
      { event: "Compra Aprovada", message: "Bem-vindo à Mentoria, {nome}! 🚀", enabled: true, executions: 23 },
      { event: "Abandono de Carrinho", message: "{nome}, sua vaga está reservada! Últimas horas 🔥", enabled: true, executions: 8 },
    ],
  },
];

export const mockBlockedNumbers: GZBlockedNumber[] = [
  { id: "bl-1", phone: "+55 11 98765-4321", reason: "Spam repetido", addedAt: "2025-01-10" },
  { id: "bl-2", phone: "+55 21 91234-5678", reason: "Concorrente", addedAt: "2025-01-12" },
];

const names = ["Ana Silva", "Carlos Souza", "Maria Oliveira", "João Santos", "Fernanda Lima", "Pedro Costa", "Juliana Almeida", "Rafael Mendes", "Camila Ribeiro", "Lucas Ferreira", "Patrícia Nunes", "Bruno Gomes", "Amanda Torres", "Diego Rocha", "Isabela Martins", "Thiago Pereira", "Larissa Barbosa", "Gustavo Cardoso", "Natália Freitas", "Vinícius Duarte", "Beatriz Correia", "Mateus Lopes"];

export const mockLeads: GZLead[] = names.map((name, i) => {
  const score = Math.floor(Math.random() * 100);
  return {
    id: `lead-${i + 1}`,
    phone: `+55 ${10 + Math.floor(Math.random() * 80)} 9${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    name,
    score,
    classification: score >= 70 ? "hot" : score >= 30 ? "warm" : "cold",
    groupId: i < 12 ? `grp-l-${(i % 8) + 1}` : `grp-p-${(i % 3) + 1}`,
  };
});
