import {
  Play, Webhook, MousePointerClick, Tag, Link2, ClipboardList,
  MoveRight, Trash2, Send, StickyNote, GitBranch, Clock, Filter,
  Mail, MessageSquare, Smartphone, Zap,
} from "lucide-react";

export interface FlowNode {
  id: string;
  type: string;
  x: number;
  y: number;
  config: Record<string, any>;
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

export interface NodeTypeDef {
  label: string;
  icon: any;
  color: string;
  category: string;
  description: string;
  comingSoon?: boolean;
}

export const NODE_TYPES: Record<string, NodeTypeDef> = {
  // ─── Triggers ───
  start: { label: "Início", icon: Play, color: "#6b7280", category: "trigger", description: "Ponto de partida do fluxo" },
  trigger_webhook: { label: "Webhook / Venda", icon: Webhook, color: "#3b82f6", category: "trigger", description: "Evento de plataforma externa (Hotmart, Kiwify, etc.)" },
  trigger_form: { label: "Formulário", icon: MousePointerClick, color: "#3b82f6", category: "trigger", description: "Quando um formulário é enviado" },
  trigger_tag_added: { label: "Tag Adicionada", icon: Tag, color: "#3b82f6", category: "trigger", description: "Quando uma tag é atribuída ao lead" },
  trigger_smartlink_click: { label: "Clique em SmartLink", icon: Link2, color: "#3b82f6", category: "trigger", description: "Quando o lead clica em um SmartLink" },
  trigger_survey_response: { label: "Resposta de Pesquisa", icon: ClipboardList, color: "#3b82f6", category: "trigger", description: "Quando o lead responde pesquisa ou quiz" },

  // ─── Actions ───
  crm_move: { label: "Mover no CRM", icon: MoveRight, color: "#10b981", category: "action", description: "Move lead para etapa do Kanban" },
  add_tag: { label: "Adicionar Tag", icon: Tag, color: "#10b981", category: "action", description: "Adiciona tag ao lead" },
  remove_tag: { label: "Remover Tag", icon: Trash2, color: "#10b981", category: "action", description: "Remove tag do lead" },
  webhook_send: { label: "Enviar Webhook", icon: Send, color: "#10b981", category: "action", description: "Envia webhook para URL externa" },
  update_lead: { label: "Atualizar Lead", icon: MoveRight, color: "#10b981", category: "action", description: "Atualiza dados do lead" },
  add_note: { label: "Registrar Nota", icon: StickyNote, color: "#10b981", category: "action", description: "Adiciona nota ao lead" },

  // ─── Logic ───
  condition_tag: { label: "Condição por Tag", icon: Filter, color: "#f59e0b", category: "logic", description: "Verifica se lead tem/não tem tag" },
  condition_utm: { label: "Condição por UTM", icon: Filter, color: "#f59e0b", category: "logic", description: "Verifica parâmetro UTM do lead" },
  condition_source: { label: "Condição por Fonte", icon: Filter, color: "#f59e0b", category: "logic", description: "Verifica a fonte do lead" },
  timer: { label: "Aguardar", icon: Clock, color: "#f59e0b", category: "logic", description: "Aguarda tempo antes de continuar" },
  router: { label: "Roteador", icon: GitBranch, color: "#f59e0b", category: "logic", description: "Redireciona fluxo por condições" },

  // ─── Coming Soon ───
  send_email: { label: "Disparar E-mail", icon: Mail, color: "#9ca3af", category: "coming_soon", description: "Envia e-mail ao lead", comingSoon: true },
  send_whatsapp: { label: "Disparar WhatsApp", icon: MessageSquare, color: "#9ca3af", category: "coming_soon", description: "Envia mensagem via WhatsApp", comingSoon: true },
  send_sms: { label: "Disparar SMS", icon: Smartphone, color: "#9ca3af", category: "coming_soon", description: "Envia SMS ao lead", comingSoon: true },
};

export const NODE_CATEGORIES = [
  { key: "trigger", label: "Gatilhos", items: ["trigger_webhook", "trigger_form", "trigger_tag_added", "trigger_smartlink_click", "trigger_survey_response"] },
  { key: "action", label: "Ações", items: ["crm_move", "add_tag", "remove_tag", "webhook_send", "update_lead", "add_note"] },
  { key: "logic", label: "Lógica / Decisão", items: ["condition_tag", "condition_utm", "condition_source", "timer", "router"] },
  { key: "coming_soon", label: "Disparos (Em Breve)", items: ["send_email", "send_whatsapp", "send_sms"] },
];

export const NODE_W = 180;
export const NODE_H = 64;
export const DOT_R = 7;
