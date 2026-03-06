import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHubAgent, useHubAgents, useHubLogs } from "@/hooks/useAgentHub";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Save, Play, GitBranch, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PROVIDERS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro"],
  groq: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant"],
};

function TestChatSheet({ agentId, open, onClose }: { agentId: string; open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-execute", {
        body: { agent_id: agentId, trigger_data: { message: userMsg, history: messages } }
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: "assistant", content: data?.output || data?.reply || data?.ai_response || "Sem resposta" }]);
    } catch (e: any) {
      toast.error(e.message);
      setMessages(prev => [...prev, { role: "assistant", content: "Erro ao processar. Verifique a configuração do agente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col">
        <SheetHeader><SheetTitle>Testar Agente</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Envie uma mensagem para testar o agente</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Pensando...</div>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Digite uma mensagem..." />
          <Button onClick={send} disabled={loading} size="icon"><Send className="h-4 w-4" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function HubAgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useHubAgent(id);
  const { update } = useHubAgents();
  const { data: logs } = useHubLogs(id);
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  const [form, setForm] = useState<any>(null);

  if (agent && !form) {
    const s = agent.hub_agent_settings?.[0] || agent.hub_agent_settings || {};
    setForm({
      name: agent.name, description: agent.description || "", avatar_emoji: agent.avatar_emoji, status: agent.status,
      model_provider: s.model_provider || "openai", model_name: s.model_name || "gpt-4o-mini",
      temperature: s.temperature ?? 0.7, max_tokens: s.max_tokens ?? 2048,
      system_prompt: s.system_prompt || "", opening_statement: s.opening_statement || "",
      memory_enabled: s.memory_enabled ?? true, memory_window: s.memory_window ?? 20,
      rag_enabled: s.rag_enabled ?? false, rag_top_k: s.rag_top_k ?? 5, rag_score_threshold: s.rag_score_threshold ?? 0.5,
    });
  }

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form || !id) return;
    setSaving(true);
    try {
      const { name, description, avatar_emoji, status, ...settings } = form;
      await update.mutateAsync({ id, name, description, avatar_emoji, status, settings });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !form) {
    return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ai-agents/agents")}><ArrowLeft className="h-4 w-4" /></Button>
          <span className="text-2xl">{form.avatar_emoji}</span>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{form.name}</h1>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${form.status === "active" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
              {form.status === "active" ? "Ativo" : "Rascunho"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setTestOpen(true)}>
            <Play className="h-3.5 w-3.5" /> Testar Chat
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="rounded-md border border-border bg-card p-6 space-y-5 card-shadow">
            <h3 className="font-semibold text-foreground">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1" rows={2} />
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-6 space-y-5 card-shadow">
            <h3 className="font-semibold text-foreground">Configuração LLM</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provedor</Label>
                <Select value={form.model_provider} onValueChange={(v) => { set("model_provider", v); set("model_name", PROVIDERS[v][0]); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="groq">Groq</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo</Label>
                <Select value={form.model_name} onValueChange={(v) => set("model_name", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS[form.model_provider]?.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Temperatura: {form.temperature}</Label>
              <Slider value={[form.temperature]} onValueChange={([v]) => set("temperature", v)} min={0} max={2} step={0.1} className="mt-2" />
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea value={form.system_prompt} onChange={(e) => set("system_prompt", e.target.value)} className="mt-1 font-mono text-xs" rows={6} />
            </div>
            <div>
              <Label>Mensagem de Abertura</Label>
              <Input value={form.opening_statement} onChange={(e) => set("opening_statement", e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="text-sm font-medium text-foreground">Memória de Conversa</span>
              <Switch checked={form.memory_enabled} onCheckedChange={(v) => set("memory_enabled", v)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <div className="rounded-md border border-border bg-card p-6 text-center card-shadow">
            <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">Editor de Workflow</h3>
            <p className="text-sm text-muted-foreground mb-4">Edite o fluxo de execução do agente visualmente</p>
            <Button onClick={() => navigate(`/ai-agents/agents/${id}/workflow`)}>
              Abrir Editor de Workflow
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="kb">
          <div className="rounded-md border border-border bg-card p-6 card-shadow">
            <h3 className="font-semibold text-foreground mb-4">Knowledge Bases Vinculadas</h3>
            {agent.hub_agent_knowledge_bases?.length > 0 ? (
              <div className="space-y-2">
                {agent.hub_agent_knowledge_bases.map((akb: any) => (
                  <div key={akb.knowledge_base_id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary">
                    <span className="text-xl">📚</span>
                    <p className="text-sm font-medium text-foreground flex-1">{akb.hub_knowledge_bases?.name || "KB"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma KB vinculada. Vincule uma na página de Knowledge Bases.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="channels">
          <div className="rounded-md border border-border bg-card p-6 text-center py-8 card-shadow">
            <p className="text-sm text-muted-foreground">Conecte canais na página de Canais.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/ai-agents/channels")}>Ir para Canais</Button>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="rounded-md border border-border bg-card overflow-hidden card-shadow">
            {(logs || []).length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum log de execução</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary text-muted-foreground text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tokens</th>
                    <th className="px-4 py-3 text-left">Latência</th>
                    <th className="px-4 py-3 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(logs || []).slice(0, 50).map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${log.status === "success" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{log.total_tokens || 0}</td>
                      <td className="px-4 py-3 text-foreground">{log.latency_ms || 0}ms</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TestChatSheet agentId={id!} open={testOpen} onClose={() => setTestOpen(false)} />
    </div>
  );
}
