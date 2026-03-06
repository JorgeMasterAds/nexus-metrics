import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Bot, MoreHorizontal, Play, Edit2, Copy, Trash2, Power } from "lucide-react";
import { useHubAgents } from "@/hooks/useAgentHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MODE_LABELS: Record<string, string> = { chat: "Chat", agent: "Agente", workflow: "Workflow" };
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  inactive: "bg-red-100 text-red-700",
};

export default function HubAgents() {
  const { agents, isLoading, remove, update } = useHubAgents();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const filtered = agents.filter((a: any) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (modeFilter !== "all" && a.mode !== modeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Meus Agentes</h1>
        <Button onClick={() => navigate("/ai-agents/agents/new")} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="h-4 w-4" /> Criar Agente
        </Button>
      </div>

      {/* Filters */}
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-slate-100 mb-4" />
              <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-48 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Bot className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {agents.length === 0 ? "Você ainda não criou nenhum agente" : "Nenhum resultado encontrado"}
          </h3>
          <p className="text-sm text-slate-500 mb-4">Crie agentes de IA para automatizar conversas e tarefas</p>
          <Button onClick={() => navigate("/ai-agents/agents/new")} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Plus className="h-4 w-4" /> Criar Agente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent: any) => (
            <div key={agent.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
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
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(agent)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 truncate">{agent.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[2rem]">{agent.description || "Sem descrição"}</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{MODE_LABELS[agent.mode] || agent.mode}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[agent.status] || STATUS_COLORS.draft}`}>
                  {agent.status === "active" ? "Ativo" : agent.status === "draft" ? "Rascunho" : "Inativo"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/ai-agents/agents/${agent.id}`)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button size="sm" className="flex-1 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/ai-agents/agents/${agent.id}`)}>
                  <Play className="h-3 w-3 mr-1" /> Testar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir agente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={() => { remove.mutate(deleteTarget.id); setDeleteTarget(null); }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
