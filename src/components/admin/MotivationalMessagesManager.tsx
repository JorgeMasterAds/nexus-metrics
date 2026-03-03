import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function MotivationalMessagesManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newMsg, setNewMsg] = useState("");

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["admin-motivational-messages"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("motivational_messages")
        .select("*")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const addMessage = async () => {
    if (!newMsg.trim()) return;
    const { error } = await (supabase as any)
      .from("motivational_messages")
      .insert({ message: newMsg.trim() });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Mensagem adicionada!" });
    setNewMsg("");
    refetch();
    qc.invalidateQueries({ queryKey: ["motivational-messages-all"] });
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await (supabase as any)
      .from("motivational_messages")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    refetch();
    qc.invalidateQueries({ queryKey: ["motivational-messages-all"] });
  };

  const deleteMessage = async (id: string) => {
    const { error } = await (supabase as any)
      .from("motivational_messages")
      .delete()
      .eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Mensagem removida" });
    refetch();
    qc.invalidateQueries({ queryKey: ["motivational-messages-all"] });
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
      <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />Mensagens Motivacionais
      </h2>
      <p className="text-[10px] text-muted-foreground mb-4">
        Cadastre várias frases. Elas serão exibidas de forma aleatória na barra de Meta de Faturamento.
      </p>

      {/* Add new */}
      <div className="flex gap-2 mb-4">
        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder='💪 "O sucesso é a soma de pequenos esforços..."'
          className="text-xs flex-1"
          onKeyDown={(e) => e.key === "Enter" && addMessage()}
        />
        <Button size="sm" className="gradient-bg border-0 text-primary-foreground hover:opacity-90 text-xs gap-1" onClick={addMessage} disabled={!newMsg.trim()}>
          <Plus className="h-3 w-3" />Adicionar
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mensagem cadastrada.</p>
        )}
        {messages.map((msg: any) => (
          <div key={msg.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/30">
            <button
              onClick={() => toggleActive(msg.id, msg.is_active)}
              className="shrink-0"
              title={msg.is_active ? "Desativar" : "Ativar"}
            >
              {msg.is_active ? (
                <ToggleRight className="h-4 w-4 text-success" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <span className={`text-xs flex-1 ${msg.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>
              {msg.message}
            </span>
            <button onClick={() => deleteMessage(msg.id)} className="p-1 rounded hover:bg-destructive/20 transition-colors shrink-0" title="Excluir">
              <Trash2 className="h-3 w-3 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
