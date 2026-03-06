import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHubAgent, useHubAgents, useHubLogs } from "@/hooks/useAgentHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Play, GitBranch } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro"],
  groq: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant"],
};

export default function HubAgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useHubAgent(id);
  const { update } = useHubAgents();
  const { data: logs } = useHubLogs(id);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>(null);

  // Init form from agent data
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
    return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ai-agents/agents")}><ArrowLeft className="h-4 w-4" /></Button>
          <span className="text-2xl">{form.avatar_emoji}</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{form.name}</h1>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${form.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {form.status === "active" ? "Ativo" : "Rascunho"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Chat de teste em breve!")}>
            <Play className="h-3.5 w-3.5" /> Testar Chat
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5" onClick={handleSave} disabled={saving}>
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h3 className="font-semibold text-slate-900">Informações Básicas</h3>
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

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h3 className="font-semibold text-slate-900">Configuração LLM</h3>
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span className="text-sm font-medium">Memória de Conversa</span>
              <Switch checked={form.memory_enabled} onCheckedChange={(v) => set("memory_enabled", v)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <GitBranch className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-medium text-slate-900 mb-2">Editor de Workflow</h3>
            <p className="text-sm text-slate-500 mb-4">Edite o fluxo de execução do agente visualmente</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/ai-agents/agents/${id}/workflow`)}>
              Abrir Editor de Workflow
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="kb">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Knowledge Bases Vinculadas</h3>
            {agent.hub_agent_knowledge_bases?.length > 0 ? (
              <div className="space-y-2">
                {agent.hub_agent_knowledge_bases.map((akb: any) => (
                  <div key={akb.knowledge_base_id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                    <span className="text-xl">📚</span>
                    <p className="text-sm font-medium flex-1">{akb.hub_knowledge_bases?.name || "KB"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Nenhuma KB vinculada. Vincule uma na página de Knowledge Bases.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="channels">
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center py-8">
            <p className="text-sm text-slate-500">Conecte canais na página de Canais.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/ai-agents/channels")}>Ir para Canais</Button>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {(logs || []).length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Nenhum log de execução</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tokens</th>
                    <th className="px-4 py-3 text-left">Latência</th>
                    <th className="px-4 py-3 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(logs || []).slice(0, 50).map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${log.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{log.total_tokens || 0}</td>
                      <td className="px-4 py-3 text-slate-600">{log.latency_ms || 0}ms</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(log.created_at).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
