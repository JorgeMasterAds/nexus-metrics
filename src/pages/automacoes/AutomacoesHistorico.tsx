import { useState } from 'react';
import { Search, Eye, RotateCcw, StopCircle, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { historicoMock, automacoesMock } from '@/data/automacoes-mock';
import { getBlocoDefinicao } from '@/data/automacoes-blocos';
import type { ExecucaoHistorico, StatusExecucao } from '@/types/automacoes';

const statusConfig: Record<StatusExecucao, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  concluida: { label: 'Concluída', icon: CheckCircle, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  erro: { label: 'Com erro', icon: AlertCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  andamento: { label: 'Em andamento', icon: Loader2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' },
  pausada: { label: 'Pausada', icon: Clock, className: 'bg-muted text-muted-foreground' },
  aguardando: { label: 'Aguardando', icon: Clock, className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

export default function AutomacoesHistorico() {
  const [historico] = useState<ExecucaoHistorico[]>(historicoMock);
  const [search, setSearch] = useState('');
  const [filterAutomacao, setFilterAutomacao] = useState('todas');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [detailId, setDetailId] = useState<string | null>(null);

  const detailExec = historico.find(h => h.id === detailId);

  const filtered = historico.filter(h => {
    if (search && !h.lead.toLowerCase().includes(search.toLowerCase()) && !h.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAutomacao !== 'todas' && h.automacao !== filterAutomacao) return false;
    if (filterStatus !== 'todas' && h.status !== filterStatus) return false;
    return true;
  });

  return (
    <DashboardLayout title="Histórico de Execuções" subtitle="Acompanhe todas as execuções das suas automações">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por lead..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAutomacao} onValueChange={setFilterAutomacao}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as automações</SelectItem>
            {automacoesMock.map(a => <SelectItem key={a.id} value={a.nome}>{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            <SelectItem value="concluida">Concluídas</SelectItem>
            <SelectItem value="erro">Com erro</SelectItem>
            <SelectItem value="andamento">Em andamento</SelectItem>
            <SelectItem value="pausada">Pausadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl border border-border/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Automação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Último bloco</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(h => {
              const sc = statusConfig[h.status];
              const Icon = sc.icon;
              return (
                <TableRow key={h.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{h.lead}</p>
                      <p className="text-xs text-muted-foreground">{h.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{h.automacao}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`gap-1 ${sc.className}`}>
                      <Icon className="h-3 w-3" /> {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.inicio}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.duracao}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.ultimoBloco}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setDetailId(h.id)}>
                        <Eye className="h-3 w-3" /> Ver
                      </Button>
                      {h.status === 'erro' && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => toast.success('Execução re-enfileirada')}>
                          <RotateCcw className="h-3 w-3" /> Retentar
                        </Button>
                      )}
                      {h.status === 'andamento' && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-destructive" onClick={() => toast.success('Execução interrompida')}>
                          <StopCircle className="h-3 w-3" /> Parar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailId} onOpenChange={o => { if (!o) setDetailId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da execução</DialogTitle>
          </DialogHeader>
          {detailExec && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium">{detailExec.lead}</p>
                  <p className="text-xs text-muted-foreground">{detailExec.email}</p>
                </div>
                <Badge variant="outline" className={statusConfig[detailExec.status].className}>
                  {statusConfig[detailExec.status].label}
                </Badge>
              </div>

              {/* Timeline */}
              {detailExec.timeline && detailExec.timeline.length > 0 ? (
                <div className="space-y-0 relative">
                  <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />
                  {detailExec.timeline.map((item, i) => {
                    const def = getBlocoDefinicao(item.tipo);
                    const Icon = def?.icon;
                    const isError = item.status === 'erro';
                    const isWaiting = item.status === 'aguardando';
                    return (
                      <div key={i} className="flex items-start gap-3 relative pl-8 py-2">
                        <div className={`absolute left-2 top-3 h-[10px] w-[10px] rounded-full border-2 ${isError ? 'border-red-500 bg-red-500/30' : isWaiting ? 'border-amber-500 bg-amber-500/30' : 'border-emerald-500 bg-emerald-500/30'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                            <span className="text-sm font-medium">{item.bloco}</span>
                            <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                            {item.duracao && <span className="text-xs text-muted-foreground">· {item.duracao}</span>}
                          </div>
                          {isError && item.erro && (
                            <p className="text-xs text-red-400 mt-1 bg-red-500/10 rounded px-2 py-1">{item.erro}</p>
                          )}
                          {isWaiting && <p className="text-xs text-amber-400 mt-1">Aguardando...</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum detalhe de timeline disponível.</p>
              )}

              <div className="flex gap-2 pt-2">
                {detailExec.status === 'erro' && (
                  <Button size="sm" className="gap-1.5" onClick={() => { toast.success('Execução re-enfileirada'); setDetailId(null); }}>
                    <RotateCcw className="h-3.5 w-3.5" /> Retentar execução
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setDetailId(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
