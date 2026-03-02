import { useState } from "react";
import { X, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NODE_TYPES, type FlowNode } from "./AutomationNodeTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";

interface NodeConfigPanelProps {
  node: FlowNode;
  onUpdate: (config: Record<string, any>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function AutomationNodeConfig({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const def = NODE_TYPES[node.type];
  if (!def) return null;
  const Icon = def.icon;
  const config = node.config || {};
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();

  // Fetch pipelines & stages for CRM move
  const { data: pipelines = [] } = useQuery({
    queryKey: ["pipelines-config", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("pipelines")
        .select("*, pipeline_stages(*)")
        .eq("account_id", activeAccountId)
        .eq("project_id", activeProjectId)
        .order("created_at");
      return data || [];
    },
    enabled: !!activeAccountId && !!activeProjectId && node.type === "crm_move",
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ["tags-config", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("lead_tags")
        .select("*")
        .eq("account_id", activeAccountId)
        .order("name");
      return data || [];
    },
    enabled: !!activeAccountId && ["add_tag", "remove_tag", "condition_tag", "trigger_tag_added"].includes(node.type),
  });

  // Fetch surveys
  const { data: surveys = [] } = useQuery({
    queryKey: ["surveys-config", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("surveys")
        .select("id, title, type")
        .eq("account_id", activeAccountId)
        .eq("project_id", activeProjectId)
        .order("title");
      return data || [];
    },
    enabled: !!activeAccountId && !!activeProjectId && node.type === "trigger_survey_response",
  });

  // Fetch smartlinks
  const { data: smartlinks = [] } = useQuery({
    queryKey: ["smartlinks-config", activeAccountId, activeProjectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("smartlinks")
        .select("id, name, slug")
        .eq("account_id", activeAccountId)
        .eq("project_id", activeProjectId)
        .order("name");
      return data || [];
    },
    enabled: !!activeAccountId && !!activeProjectId && node.type === "trigger_smartlink_click",
  });

  const selectedPipeline = pipelines.find((p: any) => p.id === config.pipeline_id);
  const stages = selectedPipeline?.pipeline_stages || [];

  return (
    <div className="w-80 bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${def.color}20` }}>
            <Icon className="h-4 w-4" style={{ color: def.color }} />
          </div>
          <span className="text-sm font-semibold">{def.label}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="p-4 space-y-4">
        {/* ─── Start trigger config ─── */}
        {node.type === "start" && (
          <>
            <p className="text-xs text-muted-foreground">Configure o gatilho inicial deste fluxo.</p>
            {[
              { key: "webhook_event", label: "Evento de Webhook / Venda" },
              { key: "form_submit", label: "Formulário enviado" },
              { key: "tag_added", label: "Tag adicionada ao lead" },
              { key: "smartlink_click", label: "Clique em SmartLink" },
              { key: "survey_response", label: "Resposta de pesquisa/quiz" },
              { key: "manual", label: "Execução manual" },
            ].map((t) => (
              <button key={t.key} onClick={() => onUpdate({ ...config, trigger: t.key })}
                className={cn("flex items-center gap-3 w-full p-3 rounded-lg border text-left text-xs",
                  config.trigger === t.key ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/30")}>
                {t.label}
                {config.trigger === t.key && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
              </button>
            ))}
          </>
        )}

        {/* ─── CRM Move ─── */}
        {node.type === "crm_move" && (
          <>
            <div>
              <Label className="text-xs">Pipeline (Kanban)</Label>
              <Select value={config.pipeline_id || ""} onValueChange={(v) => onUpdate({ ...config, pipeline_id: v, stage_id: "" })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione o pipeline" /></SelectTrigger>
                <SelectContent>
                  {pipelines.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {config.pipeline_id && (
              <div>
                <Label className="text-xs">Etapa de destino</Label>
                <Select value={config.stage_id || ""} onValueChange={(v) => onUpdate({ ...config, stage_id: v })}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                  <SelectContent>
                    {stages.sort((a: any, b: any) => a.position - b.position).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* ─── Add/Remove Tag ─── */}
        {(node.type === "add_tag" || node.type === "remove_tag") && (
          <div>
            <Label className="text-xs">Tag</Label>
            <Select value={config.tag_id || ""} onValueChange={(v) => onUpdate({ ...config, tag_id: v })}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione a tag" /></SelectTrigger>
              <SelectContent>
                {tags.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ─── Condition Tag ─── */}
        {node.type === "condition_tag" && (
          <>
            <div>
              <Label className="text-xs">Tag</Label>
              <Select value={config.tag_id || ""} onValueChange={(v) => onUpdate({ ...config, tag_id: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione a tag" /></SelectTrigger>
                <SelectContent>
                  {tags.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Condição</Label>
              <Select value={config.operator || "has"} onValueChange={(v) => onUpdate({ ...config, operator: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="has">Lead TEM a tag</SelectItem>
                  <SelectItem value="not_has">Lead NÃO tem a tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* ─── Condition UTM ─── */}
        {node.type === "condition_utm" && (
          <>
            <div>
              <Label className="text-xs">Parâmetro UTM</Label>
              <Select value={config.utm_param || "utm_source"} onValueChange={(v) => onUpdate({ ...config, utm_param: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utm_source">utm_source</SelectItem>
                  <SelectItem value="utm_medium">utm_medium</SelectItem>
                  <SelectItem value="utm_campaign">utm_campaign</SelectItem>
                  <SelectItem value="utm_content">utm_content</SelectItem>
                  <SelectItem value="utm_term">utm_term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor esperado</Label>
              <Input className="mt-1 text-xs" value={config.utm_value || ""} onChange={(e) => onUpdate({ ...config, utm_value: e.target.value })} placeholder="ex: google, facebook" />
            </div>
          </>
        )}

        {/* ─── Condition Source ─── */}
        {node.type === "condition_source" && (
          <div>
            <Label className="text-xs">Fonte do lead</Label>
            <Input className="mt-1 text-xs" value={config.source_value || ""} onChange={(e) => onUpdate({ ...config, source_value: e.target.value })} placeholder="ex: webhook, form, manual" />
          </div>
        )}

        {/* ─── Timer ─── */}
        {node.type === "timer" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tempo</Label>
                <Input type="number" className="mt-1 text-xs" value={config.delay_value || 1} onChange={(e) => onUpdate({ ...config, delay_value: parseInt(e.target.value) || 1 })} min={1} />
              </div>
              <div>
                <Label className="text-xs">Unidade</Label>
                <Select value={config.delay_unit || "hours"} onValueChange={(v) => onUpdate({ ...config, delay_unit: v })}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={config.business_hours || false} onCheckedChange={(v) => onUpdate({ ...config, business_hours: v })} />
              <Label className="text-xs">Apenas em horário comercial</Label>
            </div>
            {config.business_hours && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input type="time" className="mt-1 text-xs" value={config.bh_start || "08:00"} onChange={(e) => onUpdate({ ...config, bh_start: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Fim</Label>
                  <Input type="time" className="mt-1 text-xs" value={config.bh_end || "18:00"} onChange={(e) => onUpdate({ ...config, bh_end: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs mb-2 block">Dias da semana</Label>
              <div className="flex gap-1 flex-wrap">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => {
                  const days = config.days || [0, 1, 2, 3, 4];
                  const active = days.includes(i);
                  return (
                    <button key={d} onClick={() => {
                      const newDays = active ? days.filter((x: number) => x !== i) : [...days, i];
                      onUpdate({ ...config, days: newDays });
                    }} className={cn("px-2 py-1 text-[10px] rounded-md border transition-colors",
                      active ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted/30")}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── Webhook Send ─── */}
        {node.type === "webhook_send" && (
          <>
            <div>
              <Label className="text-xs">URL de destino</Label>
              <Input className="mt-1 text-xs" value={config.url || ""} onChange={(e) => onUpdate({ ...config, url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">Método</Label>
              <Select value={config.method || "POST"} onValueChange={(v) => onUpdate({ ...config, method: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Headers (JSON)</Label>
              <Textarea className="mt-1 font-mono text-[10px]" rows={3} value={config.headers || '{"Content-Type": "application/json"}'} onChange={(e) => onUpdate({ ...config, headers: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Body Template (JSON)</Label>
              <Textarea className="mt-1 font-mono text-[10px]" rows={5} value={config.body_template || ''} onChange={(e) => onUpdate({ ...config, body_template: e.target.value })} placeholder='{"lead_id": "{{lead.id}}", "name": "{{lead.name}}"}' />
            </div>
          </>
        )}

        {/* ─── Update Lead ─── */}
        {node.type === "update_lead" && (
          <>
            <div>
              <Label className="text-xs">Campo a atualizar</Label>
              <Select value={config.field || "name"} onValueChange={(v) => onUpdate({ ...config, field: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="source">Fonte</SelectItem>
                  <SelectItem value="notes">Observações</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Novo valor</Label>
              <Input className="mt-1 text-xs" value={config.value || ""} onChange={(e) => onUpdate({ ...config, value: e.target.value })} placeholder="Valor ou template {{lead.field}}" />
            </div>
          </>
        )}

        {/* ─── Add Note ─── */}
        {node.type === "add_note" && (
          <div>
            <Label className="text-xs">Conteúdo da nota</Label>
            <Textarea className="mt-1 text-xs" rows={4} value={config.note_content || ""} onChange={(e) => onUpdate({ ...config, note_content: e.target.value })} placeholder="Lead entrou no fluxo de automação..." />
          </div>
        )}

        {/* ─── Trigger Tag Added ─── */}
        {node.type === "trigger_tag_added" && (
          <div>
            <Label className="text-xs">Tag que aciona o fluxo</Label>
            <Select value={config.tag_id || ""} onValueChange={(v) => onUpdate({ ...config, tag_id: v })}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione a tag" /></SelectTrigger>
              <SelectContent>
                {tags.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ─── Trigger SmartLink Click ─── */}
        {node.type === "trigger_smartlink_click" && (
          <div>
            <Label className="text-xs">SmartLink</Label>
            <Select value={config.smartlink_id || ""} onValueChange={(v) => onUpdate({ ...config, smartlink_id: v })}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione o SmartLink" /></SelectTrigger>
              <SelectContent>
                {smartlinks.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name || s.slug}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ─── Trigger Survey Response ─── */}
        {node.type === "trigger_survey_response" && (
          <>
            <div>
              <Label className="text-xs">Pesquisa / Quiz</Label>
              <Select value={config.survey_id || ""} onValueChange={(v) => onUpdate({ ...config, survey_id: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {surveys.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.title} ({s.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Filtro por pontuação (quiz)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Select value={config.score_operator || "gte"} onValueChange={(v) => onUpdate({ ...config, score_operator: v })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gte">≥ Maior ou igual</SelectItem>
                    <SelectItem value="lte">≤ Menor ou igual</SelectItem>
                    <SelectItem value="eq">= Igual</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" className="text-xs" value={config.score_value ?? ""} onChange={(e) => onUpdate({ ...config, score_value: parseInt(e.target.value) || 0 })} placeholder="Score" />
              </div>
            </div>
          </>
        )}

        {/* ─── Router ─── */}
        {node.type === "router" && (
          <div>
            <Label className="text-xs mb-2 block">Rotas condicionais</Label>
            <p className="text-[10px] text-muted-foreground">Configure as saídas condicionais conectando este node a diferentes destinos. Cada conexão representa uma rota.</p>
          </div>
        )}

        {/* ─── Trigger Webhook ─── */}
        {node.type === "trigger_webhook" && (
          <>
            <div>
              <Label className="text-xs">Plataforma</Label>
              <Select value={config.platform || ""} onValueChange={(v) => onUpdate({ ...config, platform: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="kiwify">Kiwify</SelectItem>
                  <SelectItem value="eduzz">Eduzz</SelectItem>
                  <SelectItem value="monetizze">Monetizze</SelectItem>
                  <SelectItem value="cakto">Cakto</SelectItem>
                  <SelectItem value="custom">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Evento</Label>
              <Select value={config.event_type || "purchase"} onValueChange={(v) => onUpdate({ ...config, event_type: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Compra aprovada</SelectItem>
                  <SelectItem value="refund">Reembolso</SelectItem>
                  <SelectItem value="chargeback">Chargeback</SelectItem>
                  <SelectItem value="abandoned_cart">Carrinho abandonado</SelectItem>
                  <SelectItem value="any">Qualquer evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* ─── Trigger Form ─── */}
        {node.type === "trigger_form" && (
          <p className="text-xs text-muted-foreground">Este gatilho será acionado quando qualquer formulário do projeto for enviado.</p>
        )}
      </div>

      {/* Delete button */}
      {node.type !== "start" && (
        <div className="p-4 border-t border-border">
          <Button variant="destructive" size="sm" className="w-full text-xs" onClick={onDelete}>
            Remover node
          </Button>
        </div>
      )}
    </div>
  );
}
