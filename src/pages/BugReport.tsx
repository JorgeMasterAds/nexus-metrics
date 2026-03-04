import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { Send, Bug, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";

export default function BugReport() {
  const { toast } = useToast();
  const { activeAccountId } = useAccount();
  const [category, setCategory] = useState("bug");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data } = await supabase.auth.getUser(); return data.user; },
  });

  const submitTicket = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await (supabase as any).from("support_tickets").insert({
        user_id: user?.id,
        account_id: activeAccountId,
        category,
        subject: subject.trim(),
        body: body.trim(),
      });
      if (error) throw error;
      toast({ title: "Mensagem enviada!", description: "Entraremos em contato em breve." });
      setSubject("");
      setBody("");
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <DashboardLayout title="Reportar Bug" subtitle="Envie relatos de bugs, sugestões ou reclamações" actions={<ProductTour {...TOURS.bugReport} />}>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Envie sua mensagem
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">Envie sua dúvida, sugestão ou relato. Nossa equipe responderá o mais breve possível.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">🐛 Relato de Bug</SelectItem>
                    <SelectItem value="suggestion">💡 Sugestão</SelectItem>
                    <SelectItem value="complaint">⚠️ Reclamação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assunto</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Resumo da sua mensagem" className="text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mensagem</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Descreva com detalhes o que aconteceu, passos para reproduzir..." className="text-xs min-h-[120px]" />
            </div>
            <Button onClick={submitTicket} disabled={sending || !subject.trim() || !body.trim()} className="gradient-bg border-0 text-primary-foreground hover:opacity-90 text-xs gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {sending ? "Enviando..." : "Envie sua mensagem"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
