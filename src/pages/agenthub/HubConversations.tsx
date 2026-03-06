import { useState } from "react";
import { useHubConversations, useHubAgents } from "@/hooks/useAgentHub";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const S = supabase as any;
const CHANNEL_ICONS: Record<string, string> = { web: "💬", whatsapp: "📱", instagram: "📸", api: "🔌" };

function ConversationMessages({ convId }: { convId: string | null }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["hub-conv-messages", convId],
    queryFn: async () => {
      const { data } = await S.from("hub_messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!convId,
  });

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Carregando mensagens...</div>;
  if (!messages?.length) return <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem nesta conversa</div>;

  return (
    <div className="flex-1 overflow-y-auto space-y-3 py-4">
      {messages.map((m: any) => (
        <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
          <div className={cn(
            "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
            m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
          )}>
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HubConversations() {
  const { agents } = useHubAgents();
  const [agentFilter, setAgentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [selectedConv, setSelectedConv] = useState<any>(null);
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
                  <tr key={conv.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedConv(conv)}>
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

      <Sheet open={!!selectedConv} onOpenChange={() => setSelectedConv(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span>{selectedConv?.hub_agents?.avatar_emoji || "🤖"}</span>
              Conversa — {selectedConv?.hub_agents?.name || "Agente"}
            </SheetTitle>
          </SheetHeader>
          <ConversationMessages convId={selectedConv?.id} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
