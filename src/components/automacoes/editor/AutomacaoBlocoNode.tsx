import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { getBlocoDefinicao, categoryCores } from '@/data/automacoes-blocos';
import { gatilhoTypes } from '@/data/automacoes-blocos';
import { cn } from '@/lib/utils';
import type { NodeStats } from '@/types/automacoes';

const categoryBorderColors: Record<string, string> = {
  gatilho: '#3B82F6',
  acao: '#10B981',
  fluxo: '#F59E0B',
};

function AutomacaoBlocoNode({ data, selected }: NodeProps) {
  const blocoType = (data as Record<string, unknown>).blocoType as string;
  const config = (data as Record<string, unknown>).config as Record<string, unknown> | undefined;
  const stats = (data as Record<string, unknown>).stats as NodeStats | undefined;
  const automacaoStatus = (data as Record<string, unknown>).automacaoStatus as string | undefined;
  const def = getBlocoDefinicao(blocoType);

  if (!def) return <div className="p-3 rounded-lg bg-card border border-border text-xs">Bloco desconhecido</div>;

  const cor = categoryCores[def.categoria];
  const borderColor = categoryBorderColors[def.categoria] || cor;
  const isGatilho = gatilhoTypes.includes(blocoType);
  const isCondition = blocoType === 'condition' || blocoType === 'check_tag' || blocoType === 'check_status';
  const Icon = def.icon;
  const isDraft = automacaoStatus === 'rascunho';
  const isPaused = automacaoStatus === 'pausada' || isDraft;

  let summary = '';
  if (config) {
    if (blocoType === 'wait' && config.amount) {
      summary = `${config.amount} ${config.unit || 'minutos'}`;
    }
  }

  const catLabel = def.categoria === 'gatilho' ? 'Gatilho' : def.categoria === 'acao' ? 'Ação' : 'Fluxo';

  // Status dot logic
  let statusDotColor = 'bg-muted-foreground/50'; // grey default
  if (!isPaused && stats) {
    if (stats.falha > 0) statusDotColor = 'bg-red-500';
    else if (stats.aguardando > 0) statusDotColor = 'bg-emerald-500 animate-pulse';
    else statusDotColor = 'bg-amber-500';
  }

  const total = stats ? stats.sucesso + stats.aguardando + stats.falha : 0;
  const taxaSucesso = total > 0 ? ((stats!.sucesso / total) * 100).toFixed(1) : '0';

  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-card/95 backdrop-blur-sm shadow-md min-w-[200px] max-w-[260px] transition-all",
        isPaused && "opacity-60"
      )}
      style={{
        borderColor: selected ? borderColor : `${borderColor}40`,
        boxShadow: selected ? `0 0 16px ${borderColor}30` : `0 2px 8px ${borderColor}08`,
      }}
    >
      {/* Input handle — LEFT */}
      {!isGatilho && (
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card" />
      )}

      <div className="p-3 relative">
        {/* Status dot */}
        <div className={cn("absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full", statusDotColor)} />

        <div className="flex items-center gap-2.5 mb-1.5 pr-4">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${borderColor}15` }}>
            <Icon className="h-[18px] w-[18px]" style={{ color: borderColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{def.label}</p>
            {summary && <p className="text-[10px] text-muted-foreground truncate">{summary}</p>}
          </div>
        </div>
        <Badge variant="outline" className="text-[9px]" style={{ borderColor: `${borderColor}40`, color: borderColor }}>
          {catLabel}
        </Badge>
      </div>

      {/* Lead stats footer */}
      <div className="border-t border-border/20 px-3 py-1.5 flex items-center gap-2">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <CheckCircle className="h-2.5 w-2.5" />
                {isDraft ? '—' : (stats?.sucesso ?? 0)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{stats?.sucesso ?? 0} leads com sucesso</p>
              <p className="text-muted-foreground">Taxa de sucesso: {taxaSucesso}%</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25",
                !isDraft && stats && stats.aguardando > 0 && "animate-pulse"
              )}>
                <Clock className="h-2.5 w-2.5" />
                {isDraft ? '—' : (stats?.aguardando ?? 0)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{stats?.aguardando ?? 0} leads aguardando</p>
              <p className="text-muted-foreground">Leads aguardando processamento</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25",
                !isDraft && stats && stats.falha > 0 && "font-bold"
              )}>
                <XCircle className="h-2.5 w-2.5" />
                {isDraft ? '—' : (stats?.falha ?? 0)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{stats?.falha ?? 0} leads com falha</p>
              <p className="text-muted-foreground">Leads que falharam neste bloco</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Output handles — RIGHT */}
      {isCondition ? (
        <>
          <Handle type="source" position={Position.Right} id="yes" className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-card" style={{ top: '35%' }} />
          <Handle type="source" position={Position.Right} id="no" className="!w-3 !h-3 !bg-red-500 !border-2 !border-card" style={{ top: '65%' }} />
          <div className="absolute right-[-40px] top-[25%] flex flex-col gap-1">
            <span className="text-[8px] text-emerald-400">Sim ✓</span>
            <span className="text-[8px] text-red-400">Não ✗</span>
          </div>
        </>
      ) : blocoType !== 'end' ? (
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card" />
      ) : null}
    </div>
  );
}

export default memo(AutomacaoBlocoNode);
