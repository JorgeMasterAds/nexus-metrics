import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Bot, MoreHorizontal, Play, Edit2, Trash2, Power, Send } from "lucide-react";
import { useHubAgents } from "@/hooks/useAgentHub";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<string, string> = { chat: "Chat", agent: "Agente", workflow: "Workflow" };

function QuickTestChat({ agentId, open, onClose }: { agentId: string; open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-execute", {
        body: { agent_id: agentId, trigger_data: { message: userMsg, history: messages } }
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: "assistant", content: data?.output || data?.reply || data?.ai_response || "Sem resposta" }]);
    } catch (e: any) {
      toast.error(e.message);
      setMessages(prev => [...prev, { role: "assistant", content: "Erro ao processar." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col">
        <SheetHeader><SheetTitle>Testar Agente</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Envie uma mensagem para testar</p>}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-xl px-4 py-2.5 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-secondary rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Pensando...</div></div>}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Digite..." />
          <Button onClick={send} disabled={loading} size="icon"><Send className="h-4 w-4" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function HubAgents() {
  const { agents, isLoading, remove, update } = useHubAgents();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [testAgentId, setTestAgentId] = useState<string | null>(null);

  const filtered = agents.filter((a: any) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (modeFilter !== "all" && a.mode !== modeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Meus Agentes</h1>
        <Button onClick={() => navigate("/ai-agents/agents/new")} className="gap-1.5">
          <Plus className="h-4 w-4" /> Criar Agente
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos modos</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="agent">Agente</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-border bg-card p-6 animate-pulse">
              <div className="h-12 w-12 rounded-md bg-muted mb-4" />
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-48 bg-muted/50 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-md border border-border bg-card">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {agents.length === 0 ? "Crie seu primeiro agente de IA" : "Nenhum resultado encontrado"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Agentes automatizam conversas e tarefas com inteligência artificial</p>
          <Button onClick={() => navigate("/ai-agents/agents/new")} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar Agente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent: any) => (
            <div key={agent.id} className="rounded-md border border-border bg-card p-6 card-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-2xl">
                  {agent.avatar_emoji}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => update.mutate({ id: agent.id, status: agent.status === "active" ? "inactive" : "active" })}>
                      <Power className="h-3.5 w-3.5 mr-2" /> {agent.status === "active" ? "Desativar" : "Ativar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(agent)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-semibold text-foreground mb-1 truncate">{agent.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{agent.description || "Sem descrição"}</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-info/15 text-info">{MODE_LABELS[agent.mode] || agent.mode}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${agent.status === "active" ? "bg-success/20 text-success" : agent.status === "draft" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
                  {agent.status === "active" ? "Ativo" : agent.status === "draft" ? "Rascunho" : "Inativo"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/ai-agents/agents/${agent.id}`)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button size="sm" className="flex-1 text-xs" onClick={() => setTestAgentId(agent.id)}>
                  <Play className="h-3 w-3 mr-1" /> Testar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {testAgentId && <QuickTestChat agentId={testAgentId} open={!!testAgentId} onClose={() => setTestAgentId(null)} />}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir agente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={() => { remove.mutate(deleteTarget.id); setDeleteTarget(null); }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
