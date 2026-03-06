import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHubAgents, useHubKnowledgeBases } from "@/hooks/useAgentHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, MessageSquare, Wrench, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJIS = ["🤖", "🧠", "💼", "🎯", "🛒", "📞", "📝", "🌐", "💬", "🔥", "⚡", "🎨"];
const STEPS = ["Informações", "LLM", "Knowledge Base", "Revisão"];

const PROVIDERS: Record<string, { label: string; models: string[] }> = {
  openai: { label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  anthropic: { label: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"] },
  google: { label: "Google", models: ["gemini-2.5-flash", "gemini-2.5-pro"] },
  groq: { label: "Groq", models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant"] },
};

const MODES = [
  { value: "chat", label: "Chat", desc: "Conversa simples com LLM", icon: MessageSquare },
  { value: "agent", label: "Agente", desc: "Com ferramentas e RAG", icon: Wrench },
  { value: "workflow", label: "Workflow", desc: "Fluxo customizado", icon: GitBranch },
];

export default function HubAgentNew() {
  const navigate = useNavigate();
  const { create } = useHubAgents();
  const { knowledgeBases } = useHubKnowledgeBases();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", avatar_emoji: "🤖", mode: "chat",
    model_provider: "openai", model_name: "gpt-4o-mini", temperature: 0.7, max_tokens: 2048,
    system_prompt: "", opening_statement: "", memory_enabled: true, memory_window: 20,
    rag_enabled: false, rag_top_k: 5, rag_score_threshold: 0.5,
    knowledge_base_ids: [] as string[],
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const agent = await create.mutateAsync(form);
      navigate(`/ai-agents/agents/${agent.id}`);
    } finally {
      setCreating(false);
    }
  };

  const canNext = step === 0 ? form.name.trim().length > 0 : true;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ai-agents/agents")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Criar Agente</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all",
                i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={cn("text-xs hidden sm:block", i === step ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</span>
            {i < STEPS.length - 1 && <div className={cn("flex-1 h-0.5 rounded", i < step ? "bg-success" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border bg-card p-6 card-shadow">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Nome do agente *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Assistente de Vendas" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Descrição</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Descreva o que este agente faz..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-sm font-medium">Avatar</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => set("avatar_emoji", e)} className={cn("h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all", form.avatar_emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary hover:bg-muted")}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Modo</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {MODES.map((m) => (
                  <button key={m.value} onClick={() => set("mode", m.value)} className={cn("p-4 rounded-md border text-left transition-all", form.mode === m.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>
                    <m.icon className={cn("h-5 w-5 mb-2", form.mode === m.value ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Provedor</Label>
                <Select value={form.model_provider} onValueChange={(v) => { set("model_provider", v); set("model_name", PROVIDERS[v].models[0]); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDERS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Modelo</Label>
                <Select value={form.model_name} onValueChange={(v) => set("model_name", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS[form.model_provider]?.models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Temperatura: {form.temperature}</Label>
              <Slider value={[form.temperature]} onValueChange={([v]) => set("temperature", v)} min={0} max={2} step={0.1} className="mt-2" />
            </div>
            <div>
              <Label className="text-sm font-medium">Max Tokens</Label>
              <Input type="number" value={form.max_tokens} onChange={(e) => set("max_tokens", Number(e.target.value))} min={256} max={8192} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">System Prompt</Label>
              <Textarea value={form.system_prompt} onChange={(e) => set("system_prompt", e.target.value)} placeholder="Você é um assistente especializado em..." className="mt-1 font-mono text-xs" rows={6} />
            </div>
            <div>
              <Label className="text-sm font-medium">Mensagem de Abertura</Label>
              <Input value={form.opening_statement} onChange={(e) => set("opening_statement", e.target.value)} placeholder="Olá! Como posso ajudar?" className="mt-1" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm font-medium text-foreground">Memória de Conversa</p>
                <p className="text-xs text-muted-foreground">Manter histórico das últimas {form.memory_window} mensagens</p>
              </div>
              <Switch checked={form.memory_enabled} onCheckedChange={(v) => set("memory_enabled", v)} />
            </div>
            {form.memory_enabled && (
              <div>
                <Label className="text-sm font-medium">Janela de Memória (mensagens)</Label>
                <Slider value={[form.memory_window]} onValueChange={([v]) => set("memory_window", v)} min={1} max={50} step={1} className="mt-2" />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm font-medium text-foreground">Habilitar RAG</p>
                <p className="text-xs text-muted-foreground">Conectar bases de conhecimento ao agente</p>
              </div>
              <Switch checked={form.rag_enabled} onCheckedChange={(v) => set("rag_enabled", v)} />
            </div>
            {form.rag_enabled && (
              <>
                {knowledgeBases.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <p>Nenhuma Knowledge Base encontrada.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/ai-agents/knowledge")}>Criar Knowledge Base</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selecionar Knowledge Bases</Label>
                    {knowledgeBases.map((kb: any) => (
                      <label key={kb.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={form.knowledge_base_ids.includes(kb.id)}
                          onCheckedChange={(checked) => {
                            set("knowledge_base_ids", checked
                              ? [...form.knowledge_base_ids, kb.id]
                              : form.knowledge_base_ids.filter((id: string) => id !== kb.id));
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">📚 {kb.name}</p>
                          <p className="text-xs text-muted-foreground">{kb.description || "Sem descrição"} • {kb.document_count} docs</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Top K: {form.rag_top_k}</Label>
                  <Slider value={[form.rag_top_k]} onValueChange={([v]) => set("rag_top_k", v)} min={1} max={20} step={1} className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Threshold: {form.rag_score_threshold}</Label>
                  <Slider value={[form.rag_score_threshold]} onValueChange={([v]) => set("rag_score_threshold", v)} min={0} max={1} step={0.05} className="mt-2" />
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Revisão do Agente</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Nome", `${form.avatar_emoji} ${form.name}`],
                ["Modo", MODES.find((m) => m.value === form.mode)?.label],
                ["Modelo", `${PROVIDERS[form.model_provider]?.label} / ${form.model_name}`],
                ["Temperatura", form.temperature],
                ["Memória", form.memory_enabled ? `Sim (${form.memory_window} msgs)` : "Não"],
                ["RAG", form.rag_enabled ? `Sim (${form.knowledge_base_ids.length} KBs)` : "Não"],
              ].map(([label, value]) => (
                <div key={label as string} className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
            {form.system_prompt && (
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground mb-1">System Prompt</p>
                <p className="text-xs font-mono text-foreground/70 whitespace-pre-wrap line-clamp-4">{form.system_prompt}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate("/ai-agents/agents")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> {step > 0 ? "Voltar" : "Cancelar"}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="bg-primary hover:bg-primary/90 gap-1.5">
            Próximo <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={creating} className="bg-success hover:bg-success/90 gap-1.5">
            <Check className="h-4 w-4" /> {creating ? "Criando..." : "Criar Agente"}
          </Button>
        )}
      </div>
    </div>
  );
}
