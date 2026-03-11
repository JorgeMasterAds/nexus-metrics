import { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow, MiniMap, Controls, Background, BackgroundVariant,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type Node, type Edge, type Connection, type NodeChange, type EdgeChange,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Play, Search, X, Users, Mail, MessageCircle, Smartphone, LogOut, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { automacoesMock, templatesMock } from '@/data/automacoes-mock';
import { blocos, categoryCores, getBlocoDefinicao, gatilhoTypes } from '@/data/automacoes-blocos';
import type { CategoriaBloco, AutomacaoStats } from '@/types/automacoes';
import AutomacaoBlocoNode from '@/components/automacoes/editor/AutomacaoBlocoNode';
import AutomacaoPainelConfig from '@/components/automacoes/editor/AutomacaoPainelConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  automacaoBloco: AutomacaoBlocoNode,
};

const defaultStats: AutomacaoStats = {
  emailsPerMin: 0, whatsappPerMin: 0, smsPerMin: 0, leadsNaSequencia: 0, leadsSairam: 0,
};

export default function AutomacoesEditor() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const initialData = useMemo(() => {
    if (id?.startsWith('template-')) {
      const tId = id.replace('template-', '');
      const template = templatesMock.find(t => t.id === tId);
      if (template) {
        return {
          nome: template.nome,
          status: 'rascunho' as const,
          stats: defaultStats,
          nodes: template.nodes.map(n => ({
            id: n.id, type: 'automacaoBloco' as const, position: n.position,
            data: { blocoType: n.type, config: n.config || {}, stats: n.stats, automacaoStatus: 'rascunho' },
          })),
          edges: template.edges.map(e => ({
            id: e.id, source: e.source, target: e.target,
            sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
            animated: false, style: { stroke: '#6B7280', strokeWidth: 2, strokeDasharray: '6 3' },
          })),
        };
      }
    }
    const auto = automacoesMock.find(a => a.id === id);
    if (auto) {
      const isActive = auto.status === 'ativa';
      return {
        nome: auto.nome, status: auto.status, stats: auto.stats,
        nodes: auto.nodes.map(n => ({
          id: n.id, type: 'automacaoBloco' as const, position: n.position,
          data: { blocoType: n.type, config: n.config || {}, stats: n.stats, automacaoStatus: auto.status },
        })),
        edges: auto.edges.map(e => ({
          id: e.id, source: e.source, target: e.target,
          sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
          animated: isActive,
          style: {
            stroke: isActive ? 'hsl(var(--primary))' : '#6B7280',
            strokeWidth: 2,
            ...(isActive ? {} : { strokeDasharray: '6 3' }),
          },
        })),
      };
    }
    return { nome: t("new_automation_name"), status: 'rascunho' as const, stats: defaultStats, nodes: [], edges: [] };
  }, [id, t]);

  const [nome, setNome] = useState(initialData.nome);
  const [status, setStatus] = useState(initialData.status);
  const [automacaoStats] = useState<AutomacaoStats>(initialData.stats);
  const [nodes, setNodes] = useState<Node[]>(initialData.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialData.edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [blockSearch, setBlockSearch] = useState('');
  const [showTest, setShowTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  const isActive = status === 'ativa';
  const isPaused = status === 'pausada' || status === 'rascunho';

  // Update edge styles when status changes
  const updateEdgeStyles = useCallback((newStatus: string) => {
    const active = newStatus === 'ativa';
    setEdges(eds => eds.map(e => ({
      ...e,
      animated: active,
      style: {
        stroke: active ? 'hsl(var(--primary))' : '#6B7280',
        strokeWidth: 2,
        ...(active ? {} : { strokeDasharray: '6 3' }),
      },
    })));
  }, []);

  // Update node automacaoStatus when status changes
  const updateNodeStatus = useCallback((newStatus: string) => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, automacaoStatus: newStatus },
    })));
  }, []);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);
  const onConnect = useCallback((params: Connection) => {
    const targetNode = nodes.find(n => n.id === params.target);
    if (targetNode) {
      const blocoType = (targetNode.data as Record<string, unknown>).blocoType as string;
      if (gatilhoTypes.includes(blocoType)) {
        toast.error(t("triggers_no_input"));
        return;
      }
    }
    setEdges(eds => addEdge({
      ...params,
      animated: isActive,
      style: {
        stroke: isActive ? 'hsl(var(--primary))' : '#6B7280',
        strokeWidth: 2,
        ...(isActive ? {} : { strokeDasharray: '6 3' }),
      },
    }, eds));
  }, [nodes, t, isActive]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const blocoType = event.dataTransfer.getData('application/automacao-bloco');
    if (!blocoType) return;
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;
    const bounds = wrapper.getBoundingClientRect();
    const position = { x: event.clientX - bounds.left - 100, y: event.clientY - bounds.top - 40 };
    const newNode: Node = {
      id: `node-${Date.now()}`, type: 'automacaoBloco', position,
      data: { blocoType, config: {}, stats: { sucesso: 0, aguardando: 0, falha: 0 }, automacaoStatus: status },
    };
    setNodes(nds => [...nds, newNode]);
  }, [status]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => { setSelectedNode(node.id); }, []);
  const onPaneClick = useCallback(() => { setSelectedNode(null); }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, []);

  const handleUpdateNodeConfig = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, config } } : n));
  }, []);

  const handleSave = () => { toast.success(t("automation_saved")); };
  const handleToggleActive = () => {
    const newStatus = status === 'ativa' ? 'pausada' : 'ativa';
    setStatus(newStatus as 'ativa' | 'pausada' | 'rascunho');
    updateEdgeStyles(newStatus);
    updateNodeStatus(newStatus);
    toast.success(newStatus === 'ativa' ? t("automation_activated") : t("automation_paused"));
  };
  const handleTest = () => {
    if (!testEmail.trim()) return;
    toast.success(`${t("test_sent")} ${testEmail}`);
    setShowTest(false);
    setTestEmail('');
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const categorias: { key: CategoriaBloco; label: string; emoji: string }[] = [
    { key: 'gatilho', label: t("triggers"), emoji: '🚀' },
    { key: 'acao', label: t("actions"), emoji: '⚡' },
    { key: 'fluxo', label: t("flow"), emoji: '🔀' },
  ];

  const filteredBlocos = blockSearch ? blocos.filter(b => b.label.toLowerCase().includes(blockSearch.toLowerCase())) : blocos;

  // Status bar items
  const statusBarItems = [
    { icon: Mail, value: automacaoStats.emailsPerMin, label: 'e-mails/min', color: 'text-blue-400', tooltip: 'Emails enviados por minuto' },
    { icon: MessageCircle, value: automacaoStats.whatsappPerMin, label: 'msg WhatsApp/min', color: 'text-emerald-400', tooltip: 'Mensagens WhatsApp por minuto' },
    { icon: Smartphone, value: automacaoStats.smsPerMin, label: 'SMS/min', color: 'text-amber-400', tooltip: 'SMS enviados por minuto' },
    { icon: Users, value: automacaoStats.leadsNaSequencia, label: 'leads na sequência', color: 'text-primary', tooltip: 'Total de leads ativos nesta automação' },
    { icon: LogOut, value: automacaoStats.leadsSairam, label: 'leads saíram', color: 'text-muted-foreground', tooltip: 'Leads que saíram da automação' },
  ];

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Play className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{t("automation_editor")}</h2>
        <p className="text-sm text-muted-foreground">{t("editor_mobile_msg")}</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/automacoes')}>{t("back_to_list")}</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border/30 flex items-center gap-3 px-4 bg-card/50 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/automacoes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {editingName ? (
          <Input value={nome} onChange={e => setNome(e.target.value)} onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)} className="h-8 w-64 text-sm font-semibold" autoFocus />
        ) : (
          <button onClick={() => setEditingName(true)} className="text-sm font-semibold hover:text-primary transition-colors">{nome}</button>
        )}
        <Badge variant={isActive ? 'default' : status === 'pausada' ? 'secondary' : 'outline'}
          className={isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : status === 'pausada' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}>
          {isActive ? t("active") : status === 'pausada' ? t("paused") : t("draft")}
        </Badge>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowTest(true)}>
          <Play className="h-3 w-3" /> {t("test")}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleSave}>
          <Save className="h-3 w-3" /> {t("save")}
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <Label className="text-xs text-muted-foreground">{t("activate")}</Label>
          <Switch checked={isActive} onCheckedChange={handleToggleActive} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-60 border-r border-border/30 bg-card/30 overflow-y-auto shrink-0">
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-2">{t("blocks")}</h3>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-xs" placeholder={t("search_block")} value={blockSearch} onChange={e => setBlockSearch(e.target.value)} />
            </div>

            {/* Leads counter card */}
            <div className="mb-3 p-2.5 rounded-lg bg-primary/5 border border-primary/15">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-bold text-primary">{automacaoStats.leadsNaSequencia}</p>
                  <p className="text-[10px] text-muted-foreground">leads ativos nesta automação</p>
                </div>
              </div>
            </div>

            {categorias.map(cat => {
              const catBlocos = filteredBlocos.filter(b => b.categoria === cat.key);
              if (catBlocos.length === 0) return null;
              const isCollapsed = collapsedCats[cat.key];
              return (
                <div key={cat.key} className="mb-3">
                  <button onClick={() => setCollapsedCats(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                    className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 w-full text-left"
                    style={{ color: categoryCores[cat.key] }}>
                    <span>{cat.emoji}</span> {cat.label}
                    <span className="text-[10px] text-muted-foreground ml-auto">{isCollapsed ? '▸' : '▾'}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-1">
                      {catBlocos.map(b => (
                        <div key={b.type} draggable
                          onDragStart={e => { e.dataTransfer.setData('application/automacao-bloco', b.type); e.dataTransfer.effectAllowed = 'move'; }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/20 bg-card/50 cursor-grab hover:border-primary/30 transition-all text-xs">
                          <b.icon className="h-3.5 w-3.5 shrink-0" style={{ color: categoryCores[cat.key] }} />
                          <span className="truncate">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative flex flex-col">
          {/* Paused/Draft overlay badge */}
          {isPaused && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <Badge className={cn(
                "gap-1.5 px-4 py-1.5 text-sm shadow-lg",
                status === 'pausada'
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-muted text-muted-foreground border border-border/30"
              )}>
                <Pause className="h-3.5 w-3.5" />
                {status === 'pausada' ? 'PAUSADA' : 'RASCUNHO'}
              </Badge>
            </div>
          )}

          {/* Empty canvas message for paused/draft with no nodes */}
          {isPaused && nodes.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center pointer-events-auto">
                <Pause className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-lg font-medium text-muted-foreground">
                  {status === 'pausada' ? 'Automação pausada' : 'Automação em rascunho'}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                  Ative a automação para retomar o processamento de leads
                </p>
                <Button onClick={handleToggleActive} size="sm" className="gap-1.5">
                  <Play className="h-3.5 w-3.5" /> Ativar Agora
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1">
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver} onNodeClick={onNodeClick}
              onPaneClick={onPaneClick} nodeTypes={nodeTypes} fitView deleteKeyCode="Delete" className="bg-background">
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
              <Controls className="!bg-card !border-border/30 !shadow-lg [&>button]:!bg-card [&>button]:!border-border/30 [&>button]:!text-foreground !bottom-14" />
              <MiniMap className="!bg-card !border-border/30 !bottom-14" nodeColor={() => 'hsl(var(--primary))'} maskColor="hsl(var(--background) / 0.8)" />
            </ReactFlow>
          </div>

          {/* Status bar */}
          <div className="h-10 border-t border-border/30 bg-background/80 backdrop-blur-sm flex items-center px-4 gap-0 shrink-0">
            <TooltipProvider delayDuration={200}>
              {statusBarItems.map((item, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 text-xs",
                      i > 0 && "border-l border-border/30"
                    )}>
                      <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                      <span className="font-semibold">{item.value}</span>
                      <span className="text-muted-foreground hidden sm:inline">{item.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{item.tooltip}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Config panel */}
        {selectedNodeData && (
          <div className="w-80 border-l border-border/30 bg-card/30 overflow-y-auto shrink-0">
            <AutomacaoPainelConfig nodeId={selectedNode!}
              blocoType={(selectedNodeData.data as Record<string, unknown>).blocoType as string}
              config={(selectedNodeData.data as Record<string, unknown>).config as Record<string, unknown>}
              onUpdateConfig={(config) => handleUpdateNodeConfig(selectedNode!, config)}
              onDelete={() => handleDeleteNode(selectedNode!)}
              onClose={() => setSelectedNode(null)} />
          </div>
        )}
      </div>

      <Dialog open={showTest} onOpenChange={setShowTest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("test_automation")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">{t("test_email_label")}</Label>
              <Input className="mt-1" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="teste@email.com" />
            </div>
            <Button className="w-full gap-1.5" onClick={handleTest} disabled={!testEmail.trim()}>
              <Play className="h-4 w-4" /> {t("run_test")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
