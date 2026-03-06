import { useState } from "react";
import { useHubChannels, useHubAgents } from "@/hooks/useAgentHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Link2, Smartphone, Camera, MessageSquare, Plug2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CHANNEL_TYPES = [
  { value: "whatsapp", label: "WhatsApp Business", icon: "📱", desc: "Conecte via WhatsApp Cloud API" },
  { value: "instagram", label: "Instagram Messaging", icon: "📸", desc: "Mensagens via Instagram Graph API" },
  { value: "web", label: "Web Chat Widget", icon: "💬", desc: "Widget embeddable no seu site" },
  { value: "api", label: "API Direta", icon: "🔌", desc: "Integre via API REST" },
];

export default function HubChannels() {
  const { channels, isLoading, create } = useHubChannels();
  const { agents } = useHubAgents();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [form, setForm] = useState({ agent_id: "", channel_name: "", credentials: {} as any });

  const handleCreate = async () => {
    if (!form.agent_id || !selectedType) return;
    await create.mutateAsync({ agent_id: form.agent_id, channel_type: selectedType, channel_name: form.channel_name, credentials: form.credentials });
    setShowCreate(false);
    setSelectedType(null);
    setForm({ agent_id: "", channel_name: "", credentials: {} });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Canais Conectados</h1>
        <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 gap-1.5">
          <Plus className="h-4 w-4" /> Conectar Canal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="rounded-md border border-border bg-card p-6 h-32 animate-pulse" />)}
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-20 rounded-md border border-border bg-card">
          <Link2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum canal conectado</h3>
          <p className="text-sm text-muted-foreground mb-4">Conecte canais para receber mensagens em seus agentes</p>
          <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 gap-1.5">
            <Plus className="h-4 w-4" /> Conectar Canal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((ch: any) => {
            const type = CHANNEL_TYPES.find((t) => t.value === ch.channel_type);
            return (
              <div key={ch.id} className="rounded-md border border-border bg-card p-6 card-shadow">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{type?.icon || "🔌"}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{ch.channel_name || type?.label}</h3>
                    <p className="text-xs text-muted-foreground">Agente: {ch.hub_agents?.name || "—"}</p>
                    <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${ch.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                      {ch.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedType ? `Configurar ${CHANNEL_TYPES.find((t) => t.value === selectedType)?.label}` : "Conectar Canal"}</DialogTitle>
          </DialogHeader>
          {!selectedType ? (
            <div className="grid grid-cols-2 gap-3">
              {CHANNEL_TYPES.map((t) => (
                <button key={t.value} onClick={() => setSelectedType(t.value)} className="p-4 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-all text-center">
                  <span className="text-3xl block mb-2">{t.icon}</span>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Agente *</Label>
                <Select value={form.agent_id} onValueChange={(v) => setForm({ ...form, agent_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar agente..." /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.avatar_emoji} {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do Canal</Label>
                <Input value={form.channel_name} onChange={(e) => setForm({ ...form, channel_name: e.target.value })} className="mt-1" placeholder="Ex: WhatsApp Principal" />
              </div>
              {selectedType === "whatsapp" && (
                <>
                  <div>
                    <Label>Phone Number ID</Label>
                    <Input onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, phone_number_id: e.target.value } })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Access Token</Label>
                    <Input type="password" onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, access_token: e.target.value } })} className="mt-1" />
                  </div>
                </>
              )}
              {selectedType === "instagram" && (
                <div>
                  <Label>Page Access Token</Label>
                  <Input type="password" onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, page_token: e.target.value } })} className="mt-1" />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedType(null)}>Voltar</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={!form.agent_id}>Conectar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
