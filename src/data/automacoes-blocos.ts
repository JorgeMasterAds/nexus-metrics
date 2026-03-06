import {
  UserPlus, FileText, Tag, ShoppingCart, Webhook, MessageCircle, ArrowRight, Clock,
  Mail, Smartphone, Phone, X, MoveRight, Edit, CheckSquare, Send, Globe, Sparkles,
  Timer, GitBranch, CheckCircle, Shuffle, Activity, Square,
} from 'lucide-react';
import type { CategoriaBloco } from '@/types/automacoes';

export interface BlocoDefinicao {
  type: string;
  label: string;
  categoria: CategoriaBloco;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  descricao: string;
}

const categoryCores: Record<CategoriaBloco, string> = {
  gatilho: 'hsl(217, 91%, 60%)',
  acao: 'hsl(142, 71%, 45%)',
  fluxo: 'hsl(38, 92%, 50%)',
};

export { categoryCores };

export const blocos: BlocoDefinicao[] = [
  // GATILHOS
  { type: 'new_lead', label: 'Novo Lead Criado', categoria: 'gatilho', icon: UserPlus, descricao: 'Dispara quando um novo lead é criado' },
  { type: 'form_submitted', label: 'Formulário Enviado', categoria: 'gatilho', icon: FileText, descricao: 'Dispara quando um formulário é preenchido' },
  { type: 'tag_added', label: 'Tag Adicionada', categoria: 'gatilho', icon: Tag, descricao: 'Dispara quando uma tag é adicionada ao lead' },
  { type: 'purchase', label: 'Compra Realizada', categoria: 'gatilho', icon: ShoppingCart, descricao: 'Dispara quando uma compra é confirmada' },
  { type: 'webhook', label: 'Webhook Recebido', categoria: 'gatilho', icon: Webhook, descricao: 'Dispara quando um webhook externo é recebido' },
  { type: 'whatsapp_message', label: 'Mensagem no WhatsApp', categoria: 'gatilho', icon: MessageCircle, descricao: 'Dispara quando o lead envia mensagem' },
  { type: 'lead_moved', label: 'Lead Movido de Etapa', categoria: 'gatilho', icon: ArrowRight, descricao: 'Dispara quando o lead muda de etapa no funil' },
  { type: 'schedule', label: 'Agendamento / Timer', categoria: 'gatilho', icon: Clock, descricao: 'Dispara em horário programado' },

  // AÇÕES
  { type: 'send_email', label: 'Enviar Email', categoria: 'acao', icon: Mail, descricao: 'Envia um email para o lead' },
  { type: 'send_whatsapp', label: 'Enviar WhatsApp', categoria: 'acao', icon: MessageCircle, descricao: 'Envia mensagem via WhatsApp' },
  { type: 'send_sms', label: 'Enviar SMS', categoria: 'acao', icon: Smartphone, descricao: 'Envia SMS para o lead' },
  { type: 'make_call', label: 'Fazer Ligação', categoria: 'acao', icon: Phone, descricao: 'Inicia uma ligação automática' },
  { type: 'add_tag', label: 'Adicionar Tag', categoria: 'acao', icon: Tag, descricao: 'Adiciona tags ao lead' },
  { type: 'remove_tag', label: 'Remover Tag', categoria: 'acao', icon: X, descricao: 'Remove tags do lead' },
  { type: 'move_pipeline', label: 'Mover no Funil', categoria: 'acao', icon: MoveRight, descricao: 'Move o lead para outra etapa do funil' },
  { type: 'update_lead', label: 'Atualizar Lead', categoria: 'acao', icon: Edit, descricao: 'Atualiza dados do lead' },
  { type: 'create_task', label: 'Criar Tarefa', categoria: 'acao', icon: CheckSquare, descricao: 'Cria uma tarefa no CRM' },
  { type: 'send_webhook', label: 'Enviar para Webhook', categoria: 'acao', icon: Send, descricao: 'Envia dados para um webhook externo' },
  { type: 'call_api', label: 'Chamar API Externa', categoria: 'acao', icon: Globe, descricao: 'Faz requisição para API externa' },
  { type: 'run_ai_agent', label: 'Executar Agente IA', categoria: 'acao', icon: Sparkles, descricao: 'Executa agente IA com instrução customizada' },

  // FLUXO
  { type: 'wait', label: 'Aguardar', categoria: 'fluxo', icon: Timer, descricao: 'Pausa o fluxo por um período' },
  { type: 'condition', label: 'Condição SE / SENÃO', categoria: 'fluxo', icon: GitBranch, descricao: 'Divide o fluxo com base em condição' },
  { type: 'check_tag', label: 'Verificar Tag', categoria: 'fluxo', icon: CheckCircle, descricao: 'Verifica se o lead tem determinada tag' },
  { type: 'split_path', label: 'Dividir Caminhos', categoria: 'fluxo', icon: Shuffle, descricao: 'Divide em múltiplos caminhos paralelos' },
  { type: 'check_status', label: 'Verificar Status', categoria: 'fluxo', icon: Activity, descricao: 'Verifica status atual do lead' },
  { type: 'end', label: 'Fim da Automação', categoria: 'fluxo', icon: Square, descricao: 'Encerra o fluxo da automação' },
];

export const gatilhoTypes = blocos.filter(b => b.categoria === 'gatilho').map(b => b.type);

export function getBlocoDefinicao(type: string): BlocoDefinicao | undefined {
  return blocos.find(b => b.type === type);
}
