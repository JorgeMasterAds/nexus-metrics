import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { getBlocoDefinicao, categoryCores } from '@/data/automacoes-blocos';
import { gatilhoTypes } from '@/data/automacoes-blocos';

function AutomacaoBlocoNode({ data, selected }: NodeProps) {
  const blocoType = (data as Record<string, unknown>).blocoType as string;
  const config = (data as Record<string, unknown>).config as Record<string, unknown> | undefined;
  const def = getBlocoDefinicao(blocoType);

  if (!def) return <div className="p-3 rounded-lg bg-card border border-border text-xs">Bloco desconhecido</div>;

  const cor = categoryCores[def.categoria];
  const isGatilho = gatilhoTypes.includes(blocoType);
  const isCondition = blocoType === 'condition' || blocoType === 'check_tag' || blocoType === 'check_status';
  const Icon = def.icon;

  let summary = '';
  if (config) {
    if (blocoType === 'wait' && config.amount) {
      summary = `${config.amount} ${config.unit || 'minutos'}`;
    }
  }

  const catLabel = def.categoria === 'gatilho' ? 'Gatilho' : def.categoria === 'acao' ? 'Ação' : 'Fluxo';

  return (
    <div
      className="rounded-xl border-2 bg-card/95 backdrop-blur-sm shadow-md min-w-[180px] max-w-[220px] transition-all"
      style={{
        borderColor: selected ? cor : 'hsl(var(--border) / 0.4)',
        boxShadow: selected ? `0 0 16px ${cor}30` : undefined,
      }}
    >
      {/* Input handle — LEFT */}
      {!isGatilho && (
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card" />
      )}

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cor}20` }}>
            <Icon className="h-4 w-4" style={{ color: cor }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{def.label}</p>
            {summary && <p className="text-[10px] text-muted-foreground truncate">{summary}</p>}
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] mt-1" style={{ borderColor: `${cor}40`, color: cor }}>
          {catLabel}
        </Badge>
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
