import { useState } from "react";
import { Plus, Zap, MoreVertical, Trash2, Power, PowerOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ChartLoader from "@/components/ChartLoader";
import AutomationFlowEditor from "@/components/automations/AutomationFlowEditor";
import { useAutomations, type Automation } from "@/hooks/useAutomations";
import { NODE_TYPES } from "@/components/automations/AutomationNodeTypes";

export default function Automations() {
  const { automations, isLoading, createAutomation, updateAutomation, deleteAutomation, toggleActive } = useAutomations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const editingAutomation = automations.find((a) => a.id === editingId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createAutomation.mutateAsync({ name: newName, description: newDesc }).then((a) => {
      setEditingId(a.id);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    });
  };

  if (editingAutomation) {
    return (
      <AutomationFlowEditor
        automation={editingAutomation}
        onSave={(data) => updateAutomation.mutate(data as any)}
        onBack={() => setEditingId(null)}
      />
    );
  }

  return (
    <DashboardLayout title="Automações" subtitle="Configure a jornada do lead com fluxos visuais"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> Nova Automação
        </Button>
      }>
      {isLoading ? (
        <ChartLoader text="Carregando automações..." />
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Crie fluxos visuais para automatizar a jornada dos seus leads com tags, webhooks, CRM e mais.
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar primeira automação
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((a) => {
            const nodeCount = (a.flow_nodes as any[])?.length || 0;
            const connCount = (a.flow_connections as any[])?.length || 0;
            return (
              <div key={a.id} className="glass rounded-xl p-4 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setEditingId(a.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{a.name}</h4>
                      {a.description && <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{a.description}</p>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleActive.mutate({ id: a.id, is_active: !a.is_active }); }}>
                        {a.is_active ? <PowerOff className="h-3.5 w-3.5 mr-2" /> : <Power className="h-3.5 w-3.5 mr-2" />}
                        {a.is_active ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteAutomation.mutate(a.id); }}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <Badge variant={a.is_active ? "default" : "secondary"} className="text-[9px]">
                    {a.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  <span>{nodeCount} nodes</span>
                  <span>{connCount} conexões</span>
                </div>
                {/* Mini preview of node types */}
                <div className="flex gap-1 mt-3 flex-wrap">
                  {(a.flow_nodes as any[])?.slice(0, 6).map((n: any, i: number) => {
                    const def = NODE_TYPES[n.type];
                    if (!def) return null;
                    const Icon = def.icon;
                    return (
                      <div key={i} className="h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${def.color}15` }}>
                        <Icon className="h-3 w-3" style={{ color: def.color }} />
                      </div>
                    );
                  })}
                  {nodeCount > 6 && <span className="text-[9px] text-muted-foreground self-center">+{nodeCount - 6}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input className="mt-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Fluxo de boas-vindas" />
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea className="mt-1" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descreva o objetivo desta automação" rows={3} />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!newName.trim() || createAutomation.isPending}>
              Criar automação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
