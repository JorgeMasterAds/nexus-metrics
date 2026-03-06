import { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow, MiniMap, Controls, Background, BackgroundVariant,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type Node, type Edge, type Connection, type NodeChange, type EdgeChange,
  type NodeTypes, type OnDrop, type OnDragOver,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Play, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { automacoesMock, templatesMock } from '@/data/automacoes-mock';
import { blocos, categoryCores, getBlocoDefinicao, gatilhoTypes } from '@/data/automacoes-blocos';
import type { CategoriaBloco } from '@/types/automacoes';
import AutomacaoBlocoNode from '@/components/automacoes/editor/AutomacaoBlocoNode';
import AutomacaoPainelConfig from '@/components/automacoes/editor/AutomacaoPainelConfig';
import { useIsMobile } from '@/hooks/use-mobile';

const nodeTypes: NodeTypes = {
  automacaoBloco: AutomacaoBlocoNode,
};

export default function AutomacoesEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Find automacao from mocks
  const initialData = useMemo(() => {
    if (id?.startsWith('template-')) {
      const tId = id.replace('template-', '');
      const template = templatesMock.find(t => t.id === tId);
      if (template) {
        return {
          nome: template.nome,
          status: 'rascunho' as const,
          nodes: template.nodes.map(n => ({
            id: n.id,
            type: 'automacaoBloco' as const,
            position: n.position,
            data: { blocoType: n.type, config: n.config || {} },
          })),
          edges: template.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            animated: true,
            style: { stroke: 'hsl(var(--border))' },
          })),
        };
      }
    }
    const auto = automacoesMock.find(a => a.id === id);
    if (auto) {
      return {
        nome: auto.nome,
        status: auto.status,
        nodes: auto.nodes.map(n => ({
          id: n.id,
          type: 'automacaoBloco' as const,
          position: n.position,
          data: { blocoType: n.type, config: n.config || {} },
        })),
        edges: auto.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          animated: true,
          style: { stroke: 'hsl(var(--border))' },
        })),
      };
    }
    return { nome: 'Nova Automação', status: 'rascunho' as const, nodes: [], edges: [] };
  }, [id]);

  const [nome, setNome] = useState(initialData.nome);
  const [status, setStatus] = useState(initialData.status);
  const [nodes, setNodes] = useState<Node[]>(initialData.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialData.edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [blockSearch, setBlockSearch] = useState('');
  const [showTest, setShowTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params: Connection) => {
    // Don't allow connections to trigger nodes
    const targetNode = nodes.find(n => n.id === params.target);
    if (targetNode) {
      const blocoType = (targetNode.data as Record<string, unknown>).blocoType as string;
      if (gatilhoTypes.includes(blocoType)) {
        toast.error('Gatilhos não aceitam conexões de entrada');
        return;
      }
    }
    setEdges(eds => addEdge({
      ...params,
      animated: true,
      style: { stroke: 'hsl(var(--border))' },
    }, eds));
  }, [nodes]);

  const onDragOver: OnDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop: OnDrop = useCallback((event) => {
    event.preventDefault();
    const blocoType = event.dataTransfer.getData('application/automacao-bloco');
    if (!blocoType) return;

    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;

    const bounds = wrapper.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left - 100,
      y: event.clientY - bounds.top - 40,
    };

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'automacaoBloco',
      position,
      data: { blocoType, config: {} },
    };

    setNodes(nds => [...nds, newNode]);
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, []);

  const handleUpdateNodeConfig = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, config } } : n));
  }, []);

  const handleSave = () => {
    toast.success('Automação salva com sucesso!');
  };

  const handleToggleActive = () => {
    const newStatus = status === 'ativa' ? 'pausada' : 'ativa';
    setStatus(newStatus as 'ativa' | 'pausada' | 'rascunho');
    toast.success(newStatus === 'ativa' ? 'Automação ativada' : 'Automação pausada');
  };

  const handleTest = () => {
    if (!testEmail.trim()) return;
    toast.success(`Teste enviado para ${testEmail}`);
    setShowTest(false);
    setTestEmail('');
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const categorias: { key: CategoriaBloco; label: string; emoji: string }[] = [
    { key: 'gatilho', label: 'Gatilhos', emoji: '🚀' },
    { key: 'acao', label: 'Ações', emoji: '⚡' },
    { key: 'fluxo', label: 'Fluxo', emoji: '🔀' },
  ];

  const filteredBlocos = blockSearch
    ? blocos.filter(b => b.label.toLowerCase().includes(blockSearch.toLowerCase()))
    : blocos;

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Play className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Editor de Automações</h2>
        <p className="text-sm text-muted-foreground">O editor visual funciona melhor em telas maiores. Use um desktop para montar seus fluxos.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/automacoes')}>Voltar para lista</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-14 border-b border-border/30 flex items-center gap-3 px-4 bg-card/50 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/automacoes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {editingName ? (
          <Input
            value={nome}
            onChange={e => setNome(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            className="h-8 w-64 text-sm font-semibold"
            autoFocus
          />
        ) : (
          <button onClick={() => setEditingName(true)} className="text-sm font-semibold hover:text-primary transition-colors">
            {nome}
          </button>
        )}

        <Badge variant={status === 'ativa' ? 'default' : status === 'pausada' ? 'secondary' : 'outline'}
          className={status === 'ativa' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : status === 'pausada' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}>
          {status === 'ativa' ? 'Ativa' : status === 'pausada' ? 'Pausada' : 'Rascunho'}
        </Badge>

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowTest(true)}>
          <Play className="h-3 w-3" /> Testar
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleSave}>
          <Save className="h-3 w-3" /> Salvar
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <Label className="text-xs text-muted-foreground">Ativar</Label>
          <Switch checked={status === 'ativa'} onCheckedChange={handleToggleActive} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar blocks */}
        <div className="w-60 border-r border-border/30 bg-card/30 overflow-y-auto shrink-0">
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-2">Blocos</h3>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-xs" placeholder="Buscar bloco..." value={blockSearch} onChange={e => setBlockSearch(e.target.value)} />
            </div>

            {categorias.map(cat => {
              const catBlocos = filteredBlocos.filter(b => b.categoria === cat.key);
              if (catBlocos.length === 0) return null;
              const isCollapsed = collapsedCats[cat.key];
              return (
                <div key={cat.key} className="mb-3">
                  <button
                    onClick={() => setCollapsedCats(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                    className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 w-full text-left"
                    style={{ color: categoryCores[cat.key] }}
                  >
                    <span>{cat.emoji}</span> {cat.label}
                    <span className="text-[10px] text-muted-foreground ml-auto">{isCollapsed ? '▸' : '▾'}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-1">
                      {catBlocos.map(b => (
                        <div
                          key={b.type}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('application/automacao-bloco', b.type);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/20 bg-card/50 cursor-grab hover:border-primary/30 transition-all text-xs"
                        >
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
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            className="bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
            <Controls className="!bg-card !border-border/30 !shadow-lg [&>button]:!bg-card [&>button]:!border-border/30 [&>button]:!text-foreground" />
            <MiniMap
              className="!bg-card !border-border/30"
              nodeColor={() => 'hsl(var(--primary))'}
              maskColor="hsl(var(--background) / 0.8)"
            />
          </ReactFlow>
        </div>

        {/* Config Panel */}
        {selectedNodeData && (
          <div className="w-80 border-l border-border/30 bg-card/30 overflow-y-auto shrink-0">
            <AutomacaoPainelConfig
              nodeId={selectedNode!}
              blocoType={(selectedNodeData.data as Record<string, unknown>).blocoType as string}
              config={(selectedNodeData.data as Record<string, unknown>).config as Record<string, unknown>}
              onUpdateConfig={(config) => handleUpdateNodeConfig(selectedNode!, config)}
              onDelete={() => handleDeleteNode(selectedNode!)}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>

      {/* Test Modal */}
      <Dialog open={showTest} onOpenChange={setShowTest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Testar Automação</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Email do lead de teste</Label>
              <Input className="mt-1" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="teste@email.com" />
            </div>
            <Button className="w-full gap-1.5" onClick={handleTest} disabled={!testEmail.trim()}>
              <Play className="h-4 w-4" /> Executar teste
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
