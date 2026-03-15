import { useState } from 'react';
import { X, Trash2, Copy, Info, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { getBlocoDefinicao, categoryCores } from '@/data/automacoes-blocos';
import { variaveisDinamicas } from '@/data/automacoes-mock';
import { cn } from '@/lib/utils';

interface PainelConfigProps {
  nodeId: string;
  blocoType: string;
  config: Record<string, unknown>;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function AutomacaoPainelConfig({ nodeId, blocoType, config, onUpdateConfig, onDelete, onClose }: PainelConfigProps) {
  const def = getBlocoDefinicao(blocoType);
  if (!def) return null;

  const cor = categoryCores[def.categoria];
  const Icon = def.icon;
  const catLabel = def.categoria === 'gatilho' ? 'Gatilho' : def.categoria === 'acao' ? 'Ação' : 'Fluxo';

  const update = (key: string, value: unknown) => {
    onUpdateConfig({ ...config, [key]: value });
  };

  const VariableChips = ({ onInsert }: { onInsert?: (v: string) => void }) => (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground">Variáveis disponíveis</p>
      {variaveisDinamicas.map(g => (
        <div key={g.grupo}>
          <p className="text-[9px] text-muted-foreground mb-1">{g.grupo}</p>
          <div className="flex flex-wrap gap-1">
            {g.vars.map(v => (
              <button key={v.key} onClick={() => { onInsert?.(v.key); navigator.clipboard.writeText(v.key); toast.success(`${v.key} copiado`); }}
                className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {v.key}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Spam score indicator
  const SpamScore = ({ score }: { score: number }) => {
    const color = score <= 3 ? "text-emerald-400" : score <= 6 ? "text-amber-400" : "text-red-400";
    const label = score <= 3 ? "Excelente" : score <= 6 ? "Bom" : "Ruim";
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/20">
        <Gauge className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Score de Entregabilidade</span>
            <span className={cn("text-xs font-bold", color)}>{score}/10 · {label}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", score <= 3 ? "bg-emerald-500" : score <= 6 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${score * 10}%` }} />
          </div>
        </div>
      </div>
    );
  };

  const renderConfig = () => {
    switch (blocoType) {
      case 'new_lead':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Origem do lead</Label>
              <Select value={(config.origin as string) || 'any'} onValueChange={v => update('origin', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="form">Formulário</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pipeline</Label>
              <Select value={(config.pipeline as string) || 'any'} onValueChange={v => update('pipeline', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'tag_added':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tags que disparam</Label>
              <Input className="mt-1" placeholder="Ex: cliente-vip, lead-quente" value={(config.tags as string) || ''} onChange={e => update('tags', e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">Separe múltiplas tags por vírgula</p>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Frequência</Label>
              <Select value={(config.frequency as string) || 'once'} onValueChange={v => update('frequency', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Uma vez</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data e hora</Label>
              <Input type="datetime-local" className="mt-1" value={(config.datetime as string) || ''} onChange={e => update('datetime', e.target.value)} />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">URL do Webhook</Label>
              <div className="flex gap-2 mt-1">
                <Input readOnly value={`https://app.nexusmetrics.com/wh/${nodeId.slice(0, 8)}`} className="text-xs" />
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`https://app.nexusmetrics.com/wh/${nodeId.slice(0, 8)}`); toast.success('URL copiada'); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Template de email</Label>
              <Select value={(config.template as string) || ''} onValueChange={v => update('template', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar template" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Boas-vindas</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="upsell">Upsell</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Assunto</Label>
              <Input className="mt-1" placeholder="Ex: Olá {{lead.first_name}}!" value={(config.subject as string) || ''} onChange={e => update('subject', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Remetente</Label>
              <Select value={(config.sender as string) || ''} onValueChange={v => update('sender', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contato@empresa.com">contato@empresa.com</SelectItem>
                  <SelectItem value="marketing@empresa.com">marketing@empresa.com</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(config.template as string) === 'custom' && (
              <div>
                <Label className="text-xs">Corpo do email</Label>
                <Textarea className="mt-1" rows={6} placeholder="Olá {{lead.first_name}}, ..."
                  value={(config.body as string) || ''} onChange={e => update('body', e.target.value)} />
              </div>
            )}
            {/* Spam score */}
            <SpamScore score={
              (config.subject as string)?.length > 5 && (config.sender as string) ? 3 :
              (config.subject as string)?.length > 0 ? 5 : 8
            } />
            <VariableChips />
          </div>
        );

      case 'send_whatsapp':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea className="mt-1" rows={4} placeholder="Olá {{lead.first_name}}, tudo bem?" value={(config.message as string) || ''} onChange={e => update('message', e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">{((config.message as string) || '').length}/1000 caracteres</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={(config.useVars as boolean) || false} onCheckedChange={v => update('useVars', v)} />
              <Label className="text-xs">Usar variáveis dinâmicas</Label>
            </div>
            {(config.message as string) && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Preview</p>
                <p className="text-xs">{(config.message as string).replace(/\{\{[^}]+\}\}/g, '[valor]')}</p>
              </div>
            )}
            {/* Rate limit info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-300">Limite: 2 mensagens/min por sessão aberta do WhatsApp</p>
            </div>
            <VariableChips />
          </div>
        );

      case 'send_webhook':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">URL de Destino</Label>
              <Input className="mt-1" placeholder="https://n8n.exemplo.com/webhook/123" value={(config.url as string) || ''} onChange={e => update('url', e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">O payload JSON do lead será enviado via POST</p>
            </div>
            <div>
              <Label className="text-xs">Headers personalizados (JSON)</Label>
              <Textarea className="mt-1 font-mono text-xs" rows={3} placeholder='{"Authorization": "Bearer ..."}'
                value={(config.headers as string) || ''} onChange={e => update('headers', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={(config.includeUtms as boolean) ?? true} onCheckedChange={v => update('includeUtms', v)} />
              <Label className="text-xs">Incluir UTMs no payload</Label>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Payload de exemplo</p>
              <pre className="text-[9px] text-muted-foreground overflow-x-auto">{JSON.stringify({ lead: { name: "{{lead.name}}", email: "{{lead.email}}", phone: "{{lead.phone}}" } }, null, 2)}</pre>
            </div>
          </div>
        );

      case 'add_tag':
      case 'remove_tag':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tags</Label>
              <Input className="mt-1" placeholder="Ex: cliente-vip, comprador" value={(config.tags as string) || ''} onChange={e => update('tags', e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">Separe múltiplas tags por vírgula</p>
            </div>
          </div>
        );

      case 'move_pipeline':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Pipeline</Label>
              <Select value={(config.pipeline as string) || ''} onValueChange={v => update('pipeline', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar pipeline" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Etapa destino</Label>
              <Select value={(config.stage as string) || ''} onValueChange={v => update('stage', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar etapa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'wait':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Quantidade</Label>
              <Input type="number" className="mt-1" min={1} value={(config.amount as number) || 30} onChange={e => update('amount', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label className="text-xs">Unidade</Label>
              <Select value={(config.unit as string) || 'minutos'} onValueChange={v => update('unit', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutos">Minutos</SelectItem>
                  <SelectItem value="horas">Horas</SelectItem>
                  <SelectItem value="dias">Dias</SelectItem>
                  <SelectItem value="semanas">Semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
              <p className="text-xs">O fluxo pausará por <span className="font-semibold">{(config.amount as number) || 30} {(config.unit as string) || 'minutos'}</span></p>
            </div>
          </div>
        );

      case 'condition':
      case 'check_tag':
      case 'check_status':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo de condição</Label>
              <Select value={(config.conditionType as string) || 'has_tag'} onValueChange={v => update('conditionType', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="has_tag">Lead TEM a tag</SelectItem>
                  <SelectItem value="no_tag">Lead NÃO TEM a tag</SelectItem>
                  <SelectItem value="field_equals">Campo do lead é igual a</SelectItem>
                  <SelectItem value="in_stage">Lead está na etapa</SelectItem>
                  <SelectItem value="score_gt">Score do lead é maior que</SelectItem>
                  <SelectItem value="opened_email">Lead abriu o email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor</Label>
              <Input className="mt-1" placeholder="Ex: cliente-vip" value={(config.conditionValue as string) || ''} onChange={e => update('conditionValue', e.target.value)} />
            </div>
            {(config.conditionType as string) && (config.conditionValue as string) && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                <p className="text-xs">
                  SE lead {(config.conditionType as string) === 'has_tag' ? 'TEM tag' : (config.conditionType as string) === 'no_tag' ? 'NÃO TEM tag' : (config.conditionType as string) === 'score_gt' ? 'score >' : ''} <span className="font-semibold">'{config.conditionValue as string}'</span>
                </p>
              </div>
            )}
          </div>
        );

      case 'run_ai_agent':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Instrução para o agente</Label>
              <Textarea className="mt-1" rows={4} placeholder="Analise o lead e gere uma mensagem personalizada..." value={(config.instruction as string) || ''} onChange={e => update('instruction', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Salvar resposta em variável</Label>
              <Input className="mt-1" placeholder="ai_response" value={(config.responseVar as string) || ''} onChange={e => update('responseVar', e.target.value)} />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-300">A resposta do agente ficará disponível como <code className="bg-blue-500/20 px-1 rounded">{'{{ai.resposta}}'}</code></p>
            </div>
            <VariableChips />
          </div>
        );

      case 'call_api':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Método</Label>
              <Select value={(config.method as string) || 'POST'} onValueChange={v => update('method', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input className="mt-1" placeholder="https://api.exemplo.com/endpoint" value={(config.url as string) || ''} onChange={e => update('url', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Body (JSON)</Label>
              <Textarea className="mt-1 font-mono text-xs" rows={4} placeholder='{"key": "value"}' value={(config.body as string) || ''} onChange={e => update('body', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Variável de retorno</Label>
              <Input className="mt-1" placeholder="api_response" value={(config.responseVar as string) || ''} onChange={e => update('responseVar', e.target.value)} />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
            <p className="text-xs text-muted-foreground">Configuração básica para este bloco. Ajuste conforme necessário.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cor}20` }}>
              <Icon className="h-4 w-4" style={{ color: cor }} />
            </div>
            <div>
              <p className="text-sm font-semibold">{def.label}</p>
              <Badge variant="outline" className="text-[9px]" style={{ borderColor: `${cor}40`, color: cor }}>{catLabel}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">{def.descricao}</p>
      </div>

      {/* Config */}
      <div className="flex-1 p-4 overflow-y-auto">
        {renderConfig()}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/30 space-y-2">
        <Button className="w-full" size="sm" onClick={() => toast.success('Configuração salva')}>
          Salvar configuração
        </Button>
        <Button variant="outline" size="sm" className="w-full text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3 mr-1.5" /> Excluir bloco
        </Button>
      </div>
    </div>
  );
}
