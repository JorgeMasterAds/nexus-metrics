import { useState } from 'react';
import { Search, Eye, RotateCcw, StopCircle, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

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
import { useI18n } from '@/lib/i18n';

export default function AutomacoesHistorico() {
  const { t } = useI18n();
  const [historico] = useState<ExecucaoHistorico[]>(historicoMock);
  const [search, setSearch] = useState('');
  const [filterAutomacao, setFilterAutomacao] = useState('todas');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [detailId, setDetailId] = useState<string | null>(null);

  const statusConfig: Record<StatusExecucao, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
    concluida: { label: t("exec_completed"), icon: CheckCircle, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    erro: { label: t("exec_error"), icon: AlertCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    andamento: { label: t("exec_in_progress"), icon: Loader2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' },
    pausada: { label: t("exec_paused"), icon: Clock, className: 'bg-muted text-muted-foreground' },
    aguardando: { label: t("exec_waiting"), icon: Clock, className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  };

  const detailExec = historico.find(h => h.id === detailId);

  const filtered = historico.filter(h => {
    if (search && !h.lead.toLowerCase().includes(search.toLowerCase()) && !h.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAutomacao !== 'todas' && h.automacao !== filterAutomacao) return false;
    if (filterStatus !== 'todas' && h.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">{t("execution_history")}</h1>
        <p className="text-xs text-muted-foreground mt-1">{t("history_subtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("search_lead")} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAutomacao} onValueChange={setFilterAutomacao}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">{t("all_automations")}</SelectItem>
            {automacoesMock.map(a => <SelectItem key={a.id} value={a.nome}>{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">{t("all_statuses_filter")}</SelectItem>
            <SelectItem value="concluida">{t("status_completed")}</SelectItem>
            <SelectItem value="erro">{t("status_error")}</SelectItem>
            <SelectItem value="andamento">{t("status_in_progress")}</SelectItem>
            <SelectItem value="pausada">{t("status_paused")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-xl border border-border/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("lead")}</TableHead>
              <TableHead>{t("automation")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("start")}</TableHead>
              <TableHead>{t("duration")}</TableHead>
              <TableHead>{t("last_block")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
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
                        <Eye className="h-3 w-3" /> {t("see")}
                      </Button>
                      {h.status === 'erro' && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => toast.success(t("execution_retried"))}>
                          <RotateCcw className="h-3 w-3" /> {t("retry")}
                        </Button>
                      )}
                      {h.status === 'andamento' && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-destructive" onClick={() => toast.success(t("execution_stopped"))}>
                          <StopCircle className="h-3 w-3" /> {t("stop")}
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

      <Dialog open={!!detailId} onOpenChange={o => { if (!o) setDetailId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("execution_details")}</DialogTitle>
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
                          {isWaiting && <p className="text-xs text-amber-400 mt-1">{t("waiting")}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_timeline")}</p>
              )}

              <div className="flex gap-2 pt-2">
                {detailExec.status === 'erro' && (
                  <Button size="sm" className="gap-1.5" onClick={() => { toast.success(t("execution_retried")); setDetailId(null); }}>
                    <RotateCcw className="h-3.5 w-3.5" /> {t("retry_execution")}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setDetailId(null)}>{t("close")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
