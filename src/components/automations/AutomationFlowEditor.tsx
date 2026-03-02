import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, Save, Plus, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { NODE_TYPES, NODE_CATEGORIES, NODE_W, NODE_H, DOT_R, type FlowNode, type FlowConnection } from "./AutomationNodeTypes";
import AutomationNodeConfig from "./AutomationNodeConfig";
import type { Automation } from "@/hooks/useAutomations";

// ─── Node Component ─────────────────────────────────────────
function FlowNodeComponent({
  node, selected, onSelect, onDragStart, onDotMouseDown,
}: {
  node: FlowNode; selected: boolean;
  onSelect: () => void; onDragStart: (e: React.MouseEvent) => void;
  onDotMouseDown: (e: React.MouseEvent) => void;
}) {
  const def = NODE_TYPES[node.type];
  if (!def) return null;
  const Icon = def.icon;

  return (
    <g>
      {node.type !== "start" && (
        <circle cx={node.x} cy={node.y + NODE_H / 2} r={DOT_R} fill={def.color} stroke={def.color} strokeWidth="2" opacity="0.7" className="cursor-pointer" />
      )}
      <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx="14"
        fill={selected ? `${def.color}18` : `${def.color}0a`}
        stroke={selected ? def.color : `${def.color}60`}
        strokeWidth={selected ? "2.5" : "1.5"}
        className="cursor-grab active:cursor-grabbing transition-all"
        onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      />
      <circle cx={node.x + 28} cy={node.y + NODE_H / 2} r="14"
        fill={`${def.color}20`} stroke={`${def.color}40`} strokeWidth="1" style={{ pointerEvents: "none" }} />
      <foreignObject x={node.x + 14} y={node.y + NODE_H / 2 - 14} width="28" height="28" style={{ pointerEvents: "none" }}>
        <div className="flex items-center justify-center w-full h-full">
          <Icon className="h-3.5 w-3.5" style={{ color: def.color }} />
        </div>
      </foreignObject>
      <text x={node.x + 50} y={node.y + NODE_H / 2 + 1} fill="currentColor" fontSize="12" fontWeight="600"
        dominantBaseline="middle" className="fill-foreground" style={{ pointerEvents: "none" }}>
        {def.label}
      </text>
      <circle cx={node.x + NODE_W} cy={node.y + NODE_H / 2} r={DOT_R}
        fill={def.color} stroke="white" strokeWidth="2" className="cursor-crosshair"
        onMouseDown={(e) => { e.stopPropagation(); onDotMouseDown(e); }}
      />
    </g>
  );
}

// ─── Connection Line ────────────────────────────────────────
function ConnectionLine({ fromNode, toNode }: { fromNode: FlowNode; toNode: FlowNode }) {
  const fromDef = NODE_TYPES[fromNode.type];
  const x1 = fromNode.x + NODE_W, y1 = fromNode.y + NODE_H / 2;
  const x2 = toNode.x, y2 = toNode.y + NODE_H / 2;
  const midX = (x1 + x2) / 2;
  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  return (
    <>
      <path d={path} fill="none" stroke={fromDef?.color || "#666"} strokeWidth="2" opacity="0.4" />
      <polygon points={`${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4} ${x2},${y2}`} fill={fromDef?.color || "#666"} opacity="0.6" />
    </>
  );
}

function DraggingLine({ fromNode, mouseX, mouseY }: { fromNode: FlowNode; mouseX: number; mouseY: number }) {
  const x1 = fromNode.x + NODE_W, y1 = fromNode.y + NODE_H / 2;
  const midX = (x1 + mouseX) / 2;
  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${mouseY}, ${mouseX} ${mouseY}`;
  return <path d={path} fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.5" strokeDasharray="6 4" />;
}

// ─── Main Editor ────────────────────────────────────────────
interface Props {
  automation: Automation;
  onSave: (data: Partial<Automation>) => void;
  onBack: () => void;
}

export default function AutomationFlowEditor({ automation, onSave, onBack }: Props) {
  const [nodes, setNodes] = useState<FlowNode[]>((automation.flow_nodes as FlowNode[]) || []);
  const [connections, setConnections] = useState<FlowConnection[]>((automation.flow_connections as FlowConnection[]) || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [name, setName] = useState(automation.name);
  const [isActive, setIsActive] = useState(automation.is_active);
  const [showPicker, setShowPicker] = useState(false);
  const [draggingFrom, setDraggingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 700 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [dirty, setDirty] = useState(false);

  const getSvgPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: viewBox.x + (e.clientX - rect.left) / rect.width * viewBox.w,
      y: viewBox.y + (e.clientY - rect.top) / rect.height * viewBox.h,
    };
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pt = getSvgPoint(e);
    setMousePos(pt);
    if (dragInfo) {
      setNodes((prev) => prev.map((n) =>
        n.id === dragInfo.nodeId ? { ...n, x: pt.x - dragInfo.offsetX, y: pt.y - dragInfo.offsetY } : n
      ));
      setDirty(true);
    }
  }, [dragInfo, getSvgPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggingFrom) {
      const pt = getSvgPoint(e);
      const target = nodes.find((n) =>
        n.id !== draggingFrom && pt.x >= n.x && pt.x <= n.x + NODE_W && pt.y >= n.y && pt.y <= n.y + NODE_H
      );
      if (target && !connections.find((c) => c.from === draggingFrom && c.to === target.id)) {
        setConnections((prev) => [...prev, { from: draggingFrom, to: target.id }]);
        setDirty(true);
      }
    }
    setDraggingFrom(null);
    setDragInfo(null);
  }, [draggingFrom, nodes, connections, getSvgPoint]);

  const addNode = (type: string) => {
    const def = NODE_TYPES[type];
    if (def?.comingSoon) {
      toast({ title: "Em breve", description: `${def.label} estará disponível em breve.` });
      return;
    }
    const id = `${type}-${Date.now()}`;
    const maxX = nodes.reduce((max, n) => Math.max(max, n.x + NODE_W + 60), 100);
    const newNode: FlowNode = { id, type, x: maxX, y: 200, config: {} };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setShowPicker(false);
    setDirty(true);
  };

  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
    setSelectedNodeId(null);
    setDirty(true);
  };

  const handleSave = () => {
    onSave({ id: automation.id, name, is_active: isActive, flow_nodes: nodes as any, flow_connections: connections as any });
    setDirty(false);
    toast({ title: "Automação salva" });
  };

  // Scroll/zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((v) => ({
        x: v.x, y: v.y,
        w: Math.max(400, Math.min(4000, v.w * factor)),
        h: Math.max(300, Math.min(3000, v.h * factor)),
      }));
    } else {
      setViewBox((v) => ({ ...v, x: v.x + e.deltaX * 0.5, y: v.y + e.deltaY * 0.5 }));
    }
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }}
          className="max-w-xs h-8 text-sm font-semibold bg-transparent border-none focus-visible:ring-0 px-0" />
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5">
            <Switch checked={isActive} onCheckedChange={(v) => { setIsActive(v); setDirty(true); }} />
            <span className="text-xs text-muted-foreground">{isActive ? "Ativo" : "Inativo"}</span>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowPicker(true)}>
            <Plus className="h-3.5 w-3.5" /> Adicionar Node
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={!dirty}>
            <Save className="h-3.5 w-3.5" /> Salvar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SVG Canvas */}
        <div className="flex-1 relative bg-background/50">
          <svg ref={svgRef} className="w-full h-full"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onClick={() => setSelectedNodeId(null)}
          >
            {/* Grid */}
            <defs>
              <pattern id="auto-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="0.5" fill="currentColor" className="fill-muted-foreground/20" />
              </pattern>
            </defs>
            <rect x={viewBox.x - 1000} y={viewBox.y - 1000} width={viewBox.w + 2000} height={viewBox.h + 2000} fill="url(#auto-grid)" />

            {/* Connections */}
            {connections.map((c, i) => {
              const fromNode = nodes.find((n) => n.id === c.from);
              const toNode = nodes.find((n) => n.id === c.to);
              if (!fromNode || !toNode) return null;
              return <ConnectionLine key={i} fromNode={fromNode} toNode={toNode} />;
            })}

            {/* Dragging line */}
            {draggingFrom && (() => {
              const fromNode = nodes.find((n) => n.id === draggingFrom);
              return fromNode ? <DraggingLine fromNode={fromNode} mouseX={mousePos.x} mouseY={mousePos.y} /> : null;
            })()}

            {/* Nodes */}
            {nodes.map((node) => (
              <FlowNodeComponent
                key={node.id}
                node={node}
                selected={selectedNodeId === node.id}
                onSelect={() => setSelectedNodeId(node.id)}
                onDragStart={(e) => {
                  const pt = getSvgPoint(e);
                  setDragInfo({ nodeId: node.id, offsetX: pt.x - node.x, offsetY: pt.y - node.y });
                }}
                onDotMouseDown={() => setDraggingFrom(node.id)}
              />
            ))}
          </svg>

          {/* Mini info */}
          <div className="absolute bottom-3 left-3 text-[10px] text-muted-foreground/60">
            {nodes.length} nodes · {connections.length} conexões · Scroll para navegar · Ctrl+Scroll para zoom
          </div>
        </div>

        {/* Config panel */}
        {selectedNode && (
          <AutomationNodeConfig
            node={selectedNode}
            onUpdate={(config) => {
              setNodes((prev) => prev.map((n) => n.id === selectedNode.id ? { ...n, config } : n));
              setDirty(true);
            }}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Node Picker Dialog */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowPicker(false)}>
          <div className="bg-card border border-border rounded-xl w-[480px] max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold">Adicionar Node</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPicker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="max-h-[55vh]">
              <div className="p-4 space-y-4">
                {NODE_CATEGORIES.map((cat) => (
                  <div key={cat.key}>
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">{cat.label}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.items.map((type) => {
                        const def = NODE_TYPES[type];
                        if (!def) return null;
                        const Icon = def.icon;
                        return (
                          <button key={type} onClick={() => addNode(type)}
                            className={cn(
                              "flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all",
                              def.comingSoon
                                ? "border-border/50 opacity-50 cursor-not-allowed"
                                : "border-border hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
                            )}>
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${def.color}15` }}>
                              <Icon className="h-3.5 w-3.5" style={{ color: def.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium truncate">{def.label}</p>
                                {def.comingSoon && (
                                  <Badge variant="secondary" className="text-[8px] px-1 py-0">Em breve</Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{def.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
