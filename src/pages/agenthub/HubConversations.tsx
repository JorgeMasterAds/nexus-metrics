import { useState } from "react";
import { useHubConversations, useHubAgents } from "@/hooks/useAgentHub";
import { MessageSquare, Bot } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHANNEL_ICONS: Record<string, string> = { web: "💬", whatsapp: "📱", instagram: "📸", api: "🔌" };

export default function HubConversations() {
  const { agents } = useHubAgents();
  const [agentFilter, setAgentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const { data: conversations, isLoading } = useHubConversations(
    agentFilter !== "all" || channelFilter !== "all"
      ? { agentId: agentFilter !== "all" ? agentFilter : undefined, channelType: channelFilter !== "all" ? channelFilter : undefined }
      : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Conversas</h1>
          <p className="text-sm text-muted-foreground">{(conversations || []).length} conversas</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar mensagens..." className="w-64" />
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Agente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos agentes</SelectItem>
            {agents.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.avatar_emoji} {a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="api">API</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden card-shadow">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : (conversations || []).length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Agente</th>
                <th className="px-4 py-3 text-left">Canal</th>
                <th className="px-4 py-3 text-left">Última Mensagem</th>
                <th className="px-4 py-3 text-left">Msgs</th>
                <th className="px-4 py-3 text-left">Tokens</th>
                <th className="px-4 py-3 text-left">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(conversations || []).map((conv: any) => {
                const lastMsg = conv.hub_messages?.[0];
                return (
                  <tr key={conv.id} className="hover:bg-muted/50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{conv.hub_agents?.avatar_emoji || "🤖"}</span>
                        <span className="font-medium text-foreground">{conv.hub_agents?.name || "Agente"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{CHANNEL_ICONS[conv.channel_type] || "💬"} {conv.channel_type}</td>
                    <td className="px-4 py-3 text-muted-foreground italic max-w-[200px] truncate">{lastMsg?.content?.slice(0, 80) || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{conv.message_count}</td>
                    <td className="px-4 py-3 text-foreground">{conv.token_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: ptBR })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
