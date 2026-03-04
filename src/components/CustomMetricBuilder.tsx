import { useState } from "react";
import { Plus, X, Calculator, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_VARIABLES, type CustomMetric } from "@/hooks/useCustomMetrics";
import { cn } from "@/lib/utils";

interface Props {
  metrics: CustomMetric[];
  onAdd: (metric: Omit<CustomMetric, "id">) => void;
  onRemove: (id: string) => void;
}

const OPERATORS = [
  { label: "+", value: " + " },
  { label: "−", value: " - " },
  { label: "×", value: " * " },
  { label: "÷", value: " / " },
  { label: "(", value: "(" },
  { label: ")", value: ")" },
];

export default function CustomMetricBuilder({ metrics, onAdd, onRemove }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formula, setFormula] = useState("");
  const [format, setFormat] = useState<"number" | "currency" | "percent">("number");

  const insertVariable = (varId: string) => {
    setFormula(prev => prev + (prev && !prev.endsWith(" ") && !prev.endsWith("(") ? " " : "") + varId);
  };

  const insertOperator = (op: string) => {
    setFormula(prev => prev + op);
  };

  const handleSave = () => {
    if (!name.trim() || !formula.trim()) return;
    const usedVars = AVAILABLE_VARIABLES.filter(v => formula.includes(v.id)).map(v => v.id);
    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      formula: formula.trim(),
      format,
      variables: usedVars,
    });
    setName("");
    setDescription("");
    setFormula("");
    setFormat("number");
    setIsCreating(false);
  };

  return (
    <div className="space-y-3">
      {/* Existing custom metrics */}
      {metrics.length > 0 && (
        <div className="space-y-1">
          {metrics.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-primary/20 bg-primary/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{m.formula}</p>
              </div>
              <button
                onClick={() => onRemove(m.id)}
                className="ml-2 p-1 rounded hover:bg-destructive/20 transition-colors shrink-0"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isCreating ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs gap-1.5 border-dashed"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Criar métrica personalizada
        </Button>
      ) : (
        <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">Nova métrica</span>
            </div>
            <button onClick={() => setIsCreating(false)} className="p-0.5 rounded hover:bg-accent/50">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Variable selector */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Variáveis disponíveis</label>
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_VARIABLES.map(v => (
                <button
                  key={v.id}
                  onClick={() => insertVariable(v.id)}
                  className="px-2 py-1 text-[10px] rounded border border-border/40 bg-card/60 hover:bg-accent/40 hover:border-primary/30 transition-all truncate max-w-[120px]"
                  title={v.description}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operators */}
          <div className="flex items-center gap-1">
            {OPERATORS.map(op => (
              <button
                key={op.label}
                onClick={() => insertOperator(op.value)}
                className="h-7 w-7 flex items-center justify-center rounded border border-border/40 bg-card/60 hover:bg-accent/40 text-xs font-mono font-bold transition-all"
              >
                {op.label}
              </button>
            ))}
          </div>

          {/* Formula */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Fórmula</label>
            <Textarea
              value={formula}
              onChange={e => setFormula(e.target.value)}
              placeholder="Ex: faturamento / vendas"
              className="h-16 text-xs font-mono resize-none bg-background/50"
            />
          </div>

          {/* Name & Format */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value.slice(0, 100))}
                placeholder="Nome da métrica"
                className="text-xs h-8 bg-background/50"
              />
              <span className="text-[9px] text-muted-foreground">{name.length}/100</span>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Formato</label>
              <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                <SelectTrigger className="h-8 text-xs bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Numérico</SelectItem>
                  <SelectItem value="currency">Moeda (R$)</SelectItem>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Descrição <span className="text-muted-foreground/60">· Opcional</span></label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 350))}
              placeholder="Descreva esta métrica"
              className="text-xs h-8 bg-background/50"
            />
            <span className="text-[9px] text-muted-foreground">{description.length}/350</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setIsCreating(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="text-xs h-7" onClick={handleSave} disabled={!name.trim() || !formula.trim()}>
              Criar métrica
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
