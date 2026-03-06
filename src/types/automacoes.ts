export type StatusAutomacao = 'ativa' | 'pausada' | 'rascunho';
export type CategoriaBloco = 'gatilho' | 'acao' | 'fluxo';
export type StatusExecucao = 'concluida' | 'erro' | 'andamento' | 'pausada' | 'aguardando';

export interface Automacao {
  id: string;
  nome: string;
  descricao?: string;
  status: StatusAutomacao;
  gatilho: string;
  execucoes: number;
  taxaSucesso: number;
  ultimaExecucao: string;
  nodes: BlocoNode[];
  edges: Aresta[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface BlocoNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
  label?: string;
}

export interface Aresta {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface DefinicaoBloco {
  type: string;
  label: string;
  categoria: CategoriaBloco;
  icone: string;
  descricao: string;
  cor: string;
}

export interface ExecucaoHistorico {
  id: string;
  lead: string;
  email: string;
  automacao: string;
  status: StatusExecucao;
  inicio: string;
  duracao: string;
  ultimoBloco: string;
  erro?: string;
  timeline?: TimelineItem[];
}

export interface TimelineItem {
  bloco: string;
  tipo: string;
  timestamp: string;
  status: 'sucesso' | 'erro' | 'aguardando';
  duracao?: string;
  erro?: string;
}

export interface TemplateAutomacao {
  id: string;
  nome: string;
  descricao: string;
  tags: string[];
  nodes: BlocoNode[];
  edges: Aresta[];
}
