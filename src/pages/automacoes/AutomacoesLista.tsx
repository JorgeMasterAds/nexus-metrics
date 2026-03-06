import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, Search, Copy, Trash2, Play, Pause, MoreVertical } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { automacoesMock } from '@/data/automacoes-mock';
import { getBlocoDefinicao } from '@/data/automacoes-blocos';
import type { Automacao, StatusAutomacao } from '@/types/automacoes';
import { useI18n } from '@/lib/i18n';

const gatilhoIconMap: Record<string, string> = {
  'Novo Lead Criado': '⚡',
  'Tag Adicionada': '🏷️',
  'Compra Realizada': '🛒',
  'Formulário Enviado': '📝',
  'Webhook Recebido': '🔗',
  'Agendamento': '📅',
};

export default function AutomacoesLista() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [automacoes, setAutomacoes] = useState<Automacao[]>(automacoesMock);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [filterGatilho, setFilterGatilho] = useState('todos');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGatilho, setNewGatilho] = useState('new_lead');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const statusBadge: Record<StatusAutomacao, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    ativa: { label: t("active"), variant: 'default' },
    pausada: { label: t("paused"), variant: 'secondary' },
    rascunho: { label: t("draft"), variant: 'outline' },
  };

  const filtered = useMemo(() => {
    return automacoes.filter(a => {
      if (search && !a.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'todas' && a.status !== filterStatus) return false;
      if (filterGatilho !== 'todos' && a.gatilho !== filterGatilho) return false;
      return true;
    });
  }, [automacoes, search, filterStatus, filterGatilho]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const def = getBlocoDefinicao(newGatilho);
    const newAuto: Automacao = {
      id: `auto-${Date.now()}`,
      nome: newName,
      descricao: newDesc || undefined,
      status: 'rascunho',
      gatilho: def?.label || 'Novo Lead Criado',
      execucoes: 0,
      taxaSucesso: 0,
      ultimaExecucao: '—',
      nodes: [{ id: 'n1', type: newGatilho, position: { x: 400, y: 50 } }],
      edges: [],
    };
    setAutomacoes(prev => [...prev, newAuto]);
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
    navigate(`/automacoes/editor/${newAuto.id}`);
    toast.success(t("automation_created"));
  };

  const handleToggle = (id: string) => {
    setAutomacoes(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'ativa' ? 'pausada' : 'ativa' as StatusAutomacao } : a));
    toast.success(t("status_updated"));
  };

  const handleDuplicate = (a: Automacao) => {
    const dup: Automacao = { ...a, id: `dup-${Date.now()}`, nome: `${t("copy_of")} ${a.nome}`, status: 'rascunho' };
    setAutomacoes(prev => [...prev, dup]);
    toast.success(`"${dup.nome}" ${t("create").toLowerCase()}`);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const a = automacoes.find(x => x.id === deleteId);
    if (a && deleteConfirm !== a.nome) return;
    setAutomacoes(prev => prev.filter(x => x.id !== deleteId));
    setDeleteId(null);
    setDeleteConfirm('');
    toast.success(t("automation_deleted"));
  };

  const deleteAutomacao = automacoes.find(a => a.id === deleteId);

  return (
    <div className="space-y-6 animate-fade-in"

    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{t("automations_title")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("automations_subtitle")}</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> {t("new_automation")}
        </Button>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("search_automation")} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">{t("all_statuses")}</SelectItem>
            <SelectItem value="ativa">{t("active_plural")}</SelectItem>
            <SelectItem value="pausada">{t("paused_plural")}</SelectItem>
            <SelectItem value="rascunho">{t("draft")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGatilho} onValueChange={setFilterGatilho}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{t("all_triggers")}</SelectItem>
            <SelectItem value="Novo Lead Criado">{t("trigger_new_lead")}</SelectItem>
            <SelectItem value="Formulário Enviado">{t("trigger_form")}</SelectItem>
            <SelectItem value="Tag Adicionada">{t("trigger_tag")}</SelectItem>
            <SelectItem value="Compra Realizada">{t("trigger_purchase")}</SelectItem>
            <SelectItem value="Webhook Recebido">{t("trigger_webhook")}</SelectItem>
            <SelectItem value="Agendamento">{t("trigger_schedule")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && automacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t("no_automations_title")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">{t("no_automations_desc")}</p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 mb-8">
            <Plus className="h-4 w-4" /> {t("create_first")}
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full">
            {[t("welcome"), t("recovery"), t("post_purchase")].map(name => (
              <button key={name} onClick={() => navigate('/automacoes/modelos')}
                className="p-4 rounded-xl border border-border/40 bg-card/50 text-left hover:border-primary/40 transition-all">
                <Zap className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("use_template_hint")}</p>
              </button>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("no_filter_results")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const sb = statusBadge[a.status];
            const gi = gatilhoIconMap[a.gatilho] || '⚡';
            return (
              <div key={a.id}
                className="glass rounded-xl p-5 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/automacoes/editor/${a.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold truncate">{a.nome}</h3>
                      <Badge variant={sb.variant} className={a.status === 'ativa' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : a.status === 'pausada' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}>
                        {sb.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        {gi} {a.gatilho}
                      </Badge>
                    </div>
                    {a.descricao && <p className="text-xs text-muted-foreground mb-2">{a.descricao}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{a.execucoes} {t("executions")}</span>
                      <span>·</span>
                      <span>{a.taxaSucesso}% {t("success_rate")}</span>
                      <span>·</span>
                      <span>{t("last_exec")}: {a.ultimaExecucao}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => navigate(`/automacoes/editor/${a.id}`)}>
                      <Play className="h-3 w-3" /> {t("edit")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggle(a.id)}>
                          {a.status === 'ativa' ? <Pause className="h-3.5 w-3.5 mr-2" /> : <Play className="h-3.5 w-3.5 mr-2" />}
                          {a.status === 'ativa' ? t("pause") : t("activate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(a)}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> {t("duplicate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {a.nodes.slice(0, 8).map((n, i) => {
                    const def = getBlocoDefinicao(n.type);
                    if (!def) return null;
                    const Icon = def.icon;
                    const cor = def.categoria === 'gatilho' ? 'hsl(217,91%,60%)' : def.categoria === 'acao' ? 'hsl(142,71%,45%)' : 'hsl(38,92%,50%)';
                    return (
                      <div key={i} className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${cor}15` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: cor }} />
                      </div>
                    );
                  })}
                  {a.nodes.length > 8 && <span className="text-[10px] text-muted-foreground self-center">+{a.nodes.length - 8}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("new_automation")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">{t("automation_name")} *</Label>
              <Input className="mt-1" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("automation_name_placeholder")} />
            </div>
            <div>
              <Label className="text-xs">{t("description_optional")}</Label>
              <Textarea className="mt-1" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={t("describe_objective")} rows={3} />
            </div>
            <div>
              <Label className="text-xs">{t("initial_trigger")}</Label>
              <Select value={newGatilho} onValueChange={setNewGatilho}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">{t("trigger_new_lead_created")}</SelectItem>
                  <SelectItem value="form_submitted">{t("trigger_form_submitted")}</SelectItem>
                  <SelectItem value="tag_added">{t("trigger_tag_added")}</SelectItem>
                  <SelectItem value="purchase">{t("trigger_purchase_made")}</SelectItem>
                  <SelectItem value="webhook">{t("trigger_webhook_received")}</SelectItem>
                  <SelectItem value="schedule">{t("trigger_schedule_timer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!newName.trim()}>
              {t("create_open_editor")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteId} onOpenChange={o => { if (!o) { setDeleteId(null); setDeleteConfirm(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("delete_automation")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("type_to_confirm").replace("{name}", "")} <span className="font-semibold text-foreground">{deleteAutomacao?.nome}</span>
            </p>
            <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={t("automation_name")} />
            <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={deleteConfirm !== deleteAutomacao?.nome}>
              {t("delete_permanently")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
