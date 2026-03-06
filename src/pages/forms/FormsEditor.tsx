import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { FormEditorProvider, useFormEditor } from "@/context/FormEditorContext";
import { mockForms, formTemplates } from "@/lib/formMockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Save, Eye, Rocket, Undo2, Redo2, Plus, Trash2, GripVertical,
  Monitor, Smartphone, ChevronLeft, ChevronRight,
  Type, CircleDot, CheckSquare, Star, TrendingUp, Calendar, Grid3x3,
  List, Image, ShieldCheck, ExternalLink, Upload, Contact, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FormBlock, BlockType, NexusForm } from "@/types/forms";

const blockTypeConfig: { type: BlockType; icon: any; label: string }[] = [
  { type: "open_text", icon: Type, label: "Texto Livre" },
  { type: "multiple_choice_single", icon: CircleDot, label: "Múltipla Escolha (Única)" },
  { type: "multiple_choice_multi", icon: CheckSquare, label: "Múltipla Escolha (Várias)" },
  { type: "rating", icon: Star, label: "Avaliação" },
  { type: "nps", icon: TrendingUp, label: "NPS" },
  { type: "date", icon: Calendar, label: "Data" },
  { type: "matrix", icon: Grid3x3, label: "Matriz" },
  { type: "ranking", icon: List, label: "Classificação" },
  { type: "picture_selection", icon: Image, label: "Seleção por Imagem" },
  { type: "consent", icon: ShieldCheck, label: "Consentimento" },
  { type: "cta", icon: ExternalLink, label: "Call to Action" },
  { type: "file_upload", icon: Upload, label: "Upload de Arquivo" },
  { type: "contact_info", icon: Contact, label: "Informações de Contato" },
  { type: "address", icon: MapPin, label: "Endereço" },
];

function createDefaultBlock(type: BlockType): FormBlock {
  const base = { id: crypto.randomUUID(), type, headline: "", subheader: "", required: false };
  switch (type) {
    case "open_text": return { ...base, type: "open_text", headline: "Sua pergunta aqui", inputType: "text", longAnswer: false };
    case "multiple_choice_single": return { ...base, type: "multiple_choice_single", headline: "Sua pergunta aqui", options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }], allowOther: false, shuffleOptions: false, displayAs: "list" };
    case "multiple_choice_multi": return { ...base, type: "multiple_choice_multi", headline: "Sua pergunta aqui", options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }], allowOther: false, shuffleOptions: false };
    case "rating": return { ...base, type: "rating", headline: "Como você avalia?", scale: 5, style: "star" };
    case "nps": return { ...base, type: "nps", headline: "De 0 a 10, qual a chance de recomendar?", lowLabel: "Nada provável", highLabel: "Muito provável" };
    case "date": return { ...base, type: "date", headline: "Selecione uma data" };
    case "consent": return { ...base, type: "consent", headline: "Consentimento", consentText: "Li e aceito os termos.", checkboxLabel: "Aceito" };
    case "cta": return { ...base, type: "cta", headline: "Ação", buttonLabel: "Continuar", dismissible: true };
    case "contact_info": return { ...base, type: "contact_info", headline: "Seus dados", fields: [{ key: "firstName", enabled: true, required: true }, { key: "email", enabled: true, required: true }, { key: "phone", enabled: true, required: false }, { key: "lastName", enabled: false, required: false }, { key: "company", enabled: false, required: false }] };
    case "address": return { ...base, type: "address", headline: "Endereço" };
    case "file_upload": return { ...base, type: "file_upload", headline: "Envie um arquivo", allowedExtensions: [".pdf", ".jpg", ".png"], maxFileSizeMb: 10 };
    case "matrix": return { ...base, type: "matrix", headline: "Avalie cada item", rows: [{ id: crypto.randomUUID(), label: "Item 1" }], columns: [{ id: crypto.randomUUID(), label: "Bom" }, { id: crypto.randomUUID(), label: "Regular" }] };
    case "ranking": return { ...base, type: "ranking", headline: "Ordene por preferência", options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }] };
    case "picture_selection": return { ...base, type: "picture_selection", headline: "Selecione uma imagem", options: [], multiSelect: false };
    default: return base as any;
  }
}

// ── Block List (Left Panel) ──
function BlockList() {
  const { state, dispatch } = useFormEditor();
  const [showPicker, setShowPicker] = useState(false);

  const questionBlocks = state.form.blocks.filter(b => b.type !== "welcome_card" && b.type !== "ending_card");
  const welcomeBlock = state.form.blocks.find(b => b.type === "welcome_card");
  const endingBlock = state.form.blocks.find(b => b.type === "ending_card");

  const addBlock = (type: BlockType) => {
    const block = createDefaultBlock(type);
    dispatch({ type: "ADD_BLOCK", block, afterId: state.selectedBlockId || undefined });
    setShowPicker(false);
  };

  return (
    <div className="w-[280px] shrink-0 border-r border-border/30 bg-card/30 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Blocos
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Welcome */}
        {welcomeBlock && (
          <button
            onClick={() => dispatch({ type: "SELECT_BLOCK", id: welcomeBlock.id })}
            className={cn("w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors",
              state.selectedBlockId === welcomeBlock.id ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <span className="text-primary">👋</span> Welcome Card
          </button>
        )}

        {/* Question blocks */}
        {questionBlocks.map((block, i) => {
          const config = blockTypeConfig.find(c => c.type === block.type);
          const Icon = config?.icon || Type;
          return (
            <button
              key={block.id}
              onClick={() => dispatch({ type: "SELECT_BLOCK", id: block.id })}
              className={cn("w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors group",
                state.selectedBlockId === block.id ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-muted text-foreground"
              )}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{i + 1}. {block.headline || config?.label || "Sem título"}</span>
              <button
                onClick={e => { e.stopPropagation(); dispatch({ type: "REMOVE_BLOCK", id: block.id }); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          );
        })}

        {/* Add button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar bloco
        </button>

        {showPicker && (
          <div className="border border-border/30 rounded-lg bg-card p-2 space-y-0.5 mt-1">
            {blockTypeConfig.map(c => (
              <button
                key={c.type}
                onClick={() => addBlock(c.type)}
                className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 hover:bg-primary/10 text-foreground transition-colors"
              >
                <c.icon className="h-3.5 w-3.5 text-muted-foreground" /> {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Ending */}
        {endingBlock && (
          <button
            onClick={() => dispatch({ type: "SELECT_BLOCK", id: endingBlock.id })}
            className={cn("w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors",
              state.selectedBlockId === endingBlock.id ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <span className="text-primary">🎉</span> Ending Card
          </button>
        )}
      </div>
    </div>
  );
}

// ── Block Preview (Center) ──
function BlockPreview() {
  const { state, dispatch } = useFormEditor();
  const [previewIndex, setPreviewIndex] = useState(0);
  const blocks = state.form.blocks;
  const currentBlock = blocks[previewIndex];
  const isMobile = state.previewMode === "mobile";

  if (!currentBlock) return <div className="flex-1 flex items-center justify-center text-muted-foreground">Adicione blocos ao formulário</div>;

  const config = blockTypeConfig.find(c => c.type === currentBlock.type);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
      {/* Preview mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: "SET_PREVIEW_MODE", mode: "desktop" })} className={cn("p-1.5 rounded", !isMobile ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Monitor className="h-4 w-4" />
        </button>
        <button onClick={() => dispatch({ type: "SET_PREVIEW_MODE", mode: "mobile" })} className={cn("p-1.5 rounded", isMobile ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Smartphone className="h-4 w-4" />
        </button>
      </div>

      <div className={cn(
        "rounded-2xl border border-border/30 bg-card p-8 shadow-lg transition-all",
        isMobile ? "w-[375px]" : "w-full max-w-[640px]"
      )}>
        {/* Progress */}
        {state.form.settings.progressBar && blocks.length > 1 && (
          <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((previewIndex + 1) / blocks.length) * 100}%` }} />
          </div>
        )}

        {currentBlock.imageUrl && (
          <img src={currentBlock.imageUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />
        )}

        <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: state.form.styling.fontFamily }}>
          {currentBlock.headline || "Sem título"}
        </h2>
        {currentBlock.subheader && (
          <p className="text-sm text-muted-foreground mb-4">{currentBlock.subheader}</p>
        )}

        {/* Block-specific preview */}
        {currentBlock.type === "welcome_card" && (
          <Button className="mt-4">{(currentBlock as any).buttonLabel || "Começar"}</Button>
        )}
        {currentBlock.type === "ending_card" && (
          <div className="text-center py-4">
            <span className="text-4xl">🎉</span>
            {(currentBlock as any).buttonLabel && <Button className="mt-4">{(currentBlock as any).buttonLabel}</Button>}
          </div>
        )}
        {currentBlock.type === "open_text" && (
          <div className="mt-3">
            {(currentBlock as any).longAnswer ? (
              <Textarea placeholder={(currentBlock as any).placeholder || "Digite sua resposta..."} className="resize-none" />
            ) : (
              <Input placeholder={(currentBlock as any).placeholder || "Digite sua resposta..."} />
            )}
          </div>
        )}
        {(currentBlock.type === "multiple_choice_single" || currentBlock.type === "multiple_choice_multi") && (
          <div className="mt-3 space-y-2">
            {((currentBlock as any).options || []).map((opt: any) => (
              <label key={opt.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 hover:border-primary/40 cursor-pointer transition-colors">
                <div className={cn("h-4 w-4 rounded border border-border", currentBlock.type === "multiple_choice_single" ? "rounded-full" : "rounded")} />
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
            {(currentBlock as any).allowOther && (
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 border-dashed">
                <div className={cn("h-4 w-4 rounded border border-border", currentBlock.type === "multiple_choice_single" ? "rounded-full" : "rounded")} />
                <span className="text-sm text-muted-foreground">Outro...</span>
              </label>
            )}
          </div>
        )}
        {currentBlock.type === "rating" && (
          <div className="mt-4 flex items-center gap-2 justify-center">
            {Array.from({ length: (currentBlock as any).scale || 5 }, (_, i) => (
              <button key={i} className="text-2xl text-muted-foreground hover:text-primary transition-colors">
                {(currentBlock as any).style === "star" ? "★" : (currentBlock as any).style === "smiley" ? ["😡", "😞", "😐", "😊", "😍"][Math.min(i, 4)] : i + 1}
              </button>
            ))}
          </div>
        )}
        {currentBlock.type === "nps" && (
          <div className="mt-4">
            <div className="flex gap-1 justify-center">
              {Array.from({ length: 11 }, (_, i) => (
                <button key={i} className={cn("h-9 w-9 rounded-lg text-xs font-medium border transition-colors",
                  i <= 6 ? "border-destructive/30 hover:bg-destructive/10 text-destructive" :
                  i <= 8 ? "border-warning/30 hover:bg-warning/10 text-warning" :
                  "border-success/30 hover:bg-success/10 text-success"
                )}>
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{(currentBlock as any).lowLabel}</span>
              <span>{(currentBlock as any).highLabel}</span>
            </div>
          </div>
        )}
        {currentBlock.type === "date" && <Input type="date" className="mt-3 max-w-[200px]" />}
        {currentBlock.type === "consent" && (
          <label className="mt-3 flex items-start gap-2 cursor-pointer">
            <div className="h-4 w-4 rounded border border-border mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">{(currentBlock as any).checkboxLabel}</span>
          </label>
        )}
        {currentBlock.type === "contact_info" && (
          <div className="mt-3 space-y-2">
            {((currentBlock as any).fields || []).filter((f: any) => f.enabled).map((f: any) => (
              <Input key={f.key} placeholder={{ firstName: "Nome", lastName: "Sobrenome", email: "Email", phone: "Telefone", company: "Empresa" }[f.key as string] || f.key} />
            ))}
          </div>
        )}
        {currentBlock.type === "address" && (
          <div className="mt-3 space-y-2">
            <Input placeholder="Rua" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Número" />
              <Input placeholder="Complemento" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Cidade" />
              <Input placeholder="Estado" />
            </div>
            <Input placeholder="CEP" />
          </div>
        )}
        {currentBlock.type === "cta" && (
          <Button className="mt-4">{(currentBlock as any).buttonLabel || "Continuar"}</Button>
        )}

        {currentBlock.required && (
          <p className="text-[10px] text-destructive mt-2">* Obrigatório</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-4">
        <Button variant="outline" size="sm" disabled={previewIndex === 0} onClick={() => setPreviewIndex(i => i - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">{previewIndex + 1} / {blocks.length}</span>
        <Button variant="outline" size="sm" disabled={previewIndex >= blocks.length - 1} onClick={() => setPreviewIndex(i => i + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Block Settings (Right Panel) ──
function BlockSettings() {
  const { state, dispatch } = useFormEditor();
  const selected = state.form.blocks.find(b => b.id === state.selectedBlockId);

  if (!selected) {
    return (
      <div className="w-[320px] shrink-0 border-l border-border/30 bg-card/30 flex items-center justify-center p-6">
        <p className="text-xs text-muted-foreground text-center">Selecione um bloco para editar suas configurações.</p>
      </div>
    );
  }

  const update = (updates: Partial<FormBlock>) => dispatch({ type: "UPDATE_BLOCK", id: selected.id, updates });

  return (
    <div className="w-[320px] shrink-0 border-l border-border/30 bg-card/30 flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="content" className="flex flex-col h-full">
        <TabsList className="mx-3 mt-3">
          <TabsTrigger value="content" className="text-xs">Conteúdo</TabsTrigger>
          <TabsTrigger value="logic" className="text-xs">Lógica</TabsTrigger>
          <TabsTrigger value="styling" className="text-xs">Aparência</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Título</Label>
            <Input value={selected.headline} onChange={e => update({ headline: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subtítulo</Label>
            <Textarea value={selected.subheader || ""} onChange={e => update({ subheader: e.target.value })} className="resize-none" rows={2} />
          </div>
          {selected.type !== "welcome_card" && selected.type !== "ending_card" && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Obrigatório</Label>
              <Switch checked={selected.required} onCheckedChange={v => update({ required: v })} />
            </div>
          )}

          {/* Type-specific settings */}
          {selected.type === "open_text" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de input</Label>
                <Select value={(selected as any).inputType} onValueChange={v => update({ inputType: v } as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Resposta longa</Label>
                <Switch checked={(selected as any).longAnswer} onCheckedChange={v => update({ longAnswer: v } as any)} />
              </div>
            </>
          )}

          {selected.type === "rating" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Escala</Label>
                <Select value={String((selected as any).scale)} onValueChange={v => update({ scale: Number(v) } as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 7, 10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estilo</Label>
                <Select value={(selected as any).style} onValueChange={v => update({ style: v } as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="star">Estrela</SelectItem>
                    <SelectItem value="smiley">Emoji</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {(selected.type === "welcome_card" || selected.type === "ending_card") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Texto do botão</Label>
              <Input value={(selected as any).buttonLabel || ""} onChange={e => update({ buttonLabel: e.target.value } as any)} />
            </div>
          )}

          {(selected.type === "multiple_choice_single" || selected.type === "multiple_choice_multi") && (
            <div className="space-y-2">
              <Label className="text-xs">Opções</Label>
              {((selected as any).options || []).map((opt: any, idx: number) => (
                <div key={opt.id} className="flex items-center gap-1.5">
                  <Input value={opt.label} onChange={e => {
                    const opts = [...(selected as any).options];
                    opts[idx] = { ...opts[idx], label: e.target.value };
                    update({ options: opts } as any);
                  }} className="text-xs" />
                  <button onClick={() => {
                    const opts = (selected as any).options.filter((_: any, i: number) => i !== idx);
                    update({ options: opts } as any);
                  }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                const opts = [...((selected as any).options || []), { id: crypto.randomUUID(), label: `Opção ${((selected as any).options?.length || 0) + 1}` }];
                update({ options: opts } as any);
              }}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar opção
              </Button>
              <div className="flex items-center justify-between mt-2">
                <Label className="text-xs">Permitir "Outro"</Label>
                <Switch checked={(selected as any).allowOther} onCheckedChange={v => update({ allowOther: v } as any)} />
              </div>
            </div>
          )}

          {selected.type === "nps" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Rótulo baixo (0)</Label>
                <Input value={(selected as any).lowLabel} onChange={e => update({ lowLabel: e.target.value } as any)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rótulo alto (10)</Label>
                <Input value={(selected as any).highLabel} onChange={e => update({ highLabel: e.target.value } as any)} />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="logic" className="flex-1 overflow-y-auto p-3">
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">Lógica condicional em breve.</p>
            <p className="text-[10px] text-muted-foreground mt-1">Configure saltos, variáveis e regras visuais.</p>
          </div>
        </TabsContent>

        <TabsContent value="styling" className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Cor da marca</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={state.form.styling.brandColor.startsWith("#") ? state.form.styling.brandColor : "#dc2626"} onChange={e => dispatch({ type: "UPDATE_STYLING", styling: { brandColor: e.target.value } })} className="h-8 w-8 rounded cursor-pointer" />
              <Input value={state.form.styling.brandColor} onChange={e => dispatch({ type: "UPDATE_STYLING", styling: { brandColor: e.target.value } })} className="text-xs" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fonte</Label>
            <Select value={state.form.styling.fontFamily} onValueChange={v => dispatch({ type: "UPDATE_STYLING", styling: { fontFamily: v } })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="'Space Grotesk', sans-serif">Space Grotesk</SelectItem>
                <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Raio da borda</Label>
            <Input type="number" min={0} max={24} value={state.form.styling.borderRadius} onChange={e => dispatch({ type: "UPDATE_STYLING", styling: { borderRadius: Number(e.target.value) } })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Barra de progresso</Label>
            <Switch checked={state.form.settings.progressBar} onCheckedChange={v => dispatch({ type: "UPDATE_SETTINGS", settings: { progressBar: v } })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Botão voltar</Label>
            <Switch checked={state.form.settings.backButton} onCheckedChange={v => dispatch({ type: "UPDATE_SETTINGS", settings: { backButton: v } })} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Editor Header ──
function EditorHeader() {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useFormEditor();
  const navigate = useNavigate();

  const handlePublish = () => {
    dispatch({ type: "UPDATE_STATUS", status: "active" });
    toast.success("Formulário publicado!");
    navigate(`/forms/share/${state.form.id}`);
  };

  const handleSave = () => {
    dispatch({ type: "SET_SAVING", saving: true });
    setTimeout(() => {
      dispatch({ type: "MARK_SAVED" });
      toast.success("Salvo!");
    }, 400);
  };

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border/30 bg-card/50 shrink-0">
      <Button variant="ghost" size="sm" onClick={() => navigate("/forms")} className="gap-1.5 text-xs">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <input
        value={state.form.name}
        onChange={e => dispatch({ type: "UPDATE_NAME", name: e.target.value })}
        className="text-sm font-semibold text-foreground bg-transparent border-none outline-none flex-1 min-w-0"
        placeholder="Nome do formulário"
      />

      <Badge variant="outline" className="text-[10px] shrink-0">
        {state.form.status === "draft" ? "Rascunho" : state.form.status === "active" ? "Ativo" : state.form.status === "paused" ? "Pausado" : "Encerrado"}
      </Badge>

      {state.isSaving && <span className="text-[10px] text-muted-foreground animate-pulse">Salvando...</span>}
      {state.isDirty && !state.isSaving && <span className="text-[10px] text-warning">● Não salvo</span>}

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8"><Undo2 className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8"><Redo2 className="h-3.5 w-3.5" /></Button>
      </div>

      <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5 text-xs">
        <Save className="h-3.5 w-3.5" /> Salvar
      </Button>
      <Button size="sm" onClick={handlePublish} className="gap-1.5 text-xs">
        <Rocket className="h-3.5 w-3.5" /> Publicar
      </Button>
    </header>
  );
}

// ── Main Editor Page ──
function EditorContent() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader />
      <div className="flex-1 flex overflow-hidden">
        <BlockList />
        <BlockPreview />
        <BlockSettings />
      </div>
    </div>
  );
}

export default function FormsEditor() {
  const { id } = useParams();

  const form = useMemo(() => {
    const found = mockForms.find(f => f.id === id);
    if (found) return found;
    // Check templates
    const template = formTemplates.find(t => t.id === id);
    if (template) {
      return {
        id: crypto.randomUUID(),
        name: template.name,
        status: "draft" as const,
        type: "link" as const,
        blocks: template.blocks.map(b => ({ ...b, id: crypto.randomUUID() })),
        variables: [],
        styling: {
          brandColor: "hsl(0 84% 60%)", accentColor: "hsl(0 84% 50%)",
          backgroundColor: "hsl(240 5% 6%)", cardColor: "hsl(240 4% 10%)",
          textColor: "hsl(0 0% 98%)", fontFamily: "'Space Grotesk', sans-serif",
          borderRadius: 12, cardArrangement: "straight" as const, backgroundType: "color" as const,
        },
        settings: { allowMultipleResponses: false, requireEmail: false, isPublic: true, progressBar: true, backButton: true },
        responseCount: 0, completionRate: 0, avgResponseTime: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } satisfies NexusForm;
    }
    return null;
  }, [id]);

  if (!form) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Formulário não encontrado.</div>;

  return (
    <FormEditorProvider initialForm={form}>
      <EditorContent />
    </FormEditorProvider>
  );
}
