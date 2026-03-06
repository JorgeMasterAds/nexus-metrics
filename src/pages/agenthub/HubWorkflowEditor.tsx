import { useCallback, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, type Connection, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useHubAgent } from "@/hooks/useAgentHub";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const NODE_PALETTE = [
  { type: "start", label: "Start", icon: "🟢", color: "#166534" },
  { type: "llm", label: "LLM", icon: "🔵", color: "#1D4ED8" },
  { type: "knowledge", label: "Knowledge", icon: "📚", color: "#7C3AED" },
  { type: "tool", label: "Tool", icon: "🔧", color: "#C2410C" },
  { type: "http", label: "HTTP", icon: "🌐", color: "#C2410C" },
  { type: "condition", label: "Condition", icon: "❓", color: "#B45309" },
  { type: "template", label: "Template", icon: "📝", color: "#374151" },
  { type: "answer", label: "Answer", icon: "💬", color: "#15803D" },
];

const nodeColor = (type: string) => NODE_PALETTE.find((n) => n.type === type)?.color || "#374151";

function CustomNode({ data, type }: { data: any; type?: string }) {
  const palette = NODE_PALETTE.find((n) => n.type === type);
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card shadow-md min-w-[140px] text-center" style={{ borderColor: palette?.color || "hsl(var(--border))" }}>
      <span className="text-lg">{palette?.icon || "⚡"}</span>
      <p className="text-xs font-semibold mt-1" style={{ color: palette?.color }}>{data.label || palette?.label || type}</p>
    </div>
  );
}

const nodeTypes = Object.fromEntries(NODE_PALETTE.map((n) => [n.type, CustomNode]));

export default function HubWorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: agent } = useHubAgent(id);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (agent && !loaded) {
      const wf = Array.isArray(agent.hub_agent_workflows) ? agent.hub_agent_workflows[0] : agent.hub_agent_workflows;
      const graph = wf?.graph || { nodes: [], edges: [] };
      setNodes(graph.nodes || []);
      setEdges(graph.edges || []);
      setLoaded(true);
    }
  }, [agent, loaded]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 100 },
      data: { label: NODE_PALETTE.find((n) => n.type === type)?.label || type },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      const wf = Array.isArray(agent.hub_agent_workflows) ? agent.hub_agent_workflows[0] : agent.hub_agent_workflows;
      if (wf?.id) {
        await (supabase as any).from("hub_agent_workflows").update({ graph: { nodes, edges } }).eq("id", wf.id);
        toast.success("Workflow salvo!");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/ai-agents/agents/${id}`)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar ao agente
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node palette */}
        <div className="w-48 bg-secondary border-r border-border p-3 space-y-1.5 overflow-y-auto shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nós</p>
          {NODE_PALETTE.map((n) => (
            <button
              key={n.type}
              onClick={() => addNode(n.type)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-card hover:shadow-sm transition-all text-left"
            >
              <span className="text-sm">{n.icon}</span>
              <span className="text-xs font-medium text-foreground">{n.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-secondary"
          >
            <Background gap={16} size={1} color="hsl(var(--border))" />
            <Controls />
            <MiniMap nodeColor={(n) => nodeColor(n.type || "")} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
