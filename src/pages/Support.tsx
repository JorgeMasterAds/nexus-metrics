import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { MessageCircle, Mail, BookOpen, GraduationCap, ExternalLink, Send, Bug, Lightbulb, AlertTriangle, Heart, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const WHATSAPP_URL = "https://wa.me/5511959939693?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20Nexus%20Metrics";
const SUPPORT_EMAIL = "nexusmetrics@jmads.com.br";

export default function Support() {
  const { toast } = useToast();
  const { activeAccountId } = useAccount();
  const [category, setCategory] = useState("suggestion");
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

  const categoryIcons: Record<string, any> = {
    suggestion: Lightbulb,
    complaint: AlertTriangle,
    bug: Bug,
  };

  return (
    <DashboardLayout title="Suporte" subtitle="Central de ajuda e atendimento" actions={<ProductTour {...TOURS.support} />}>
      <div className="space-y-6">
        <div className="w-full space-y-4">
          {/* Beta Welcome Banner — on top */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 card-shadow p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                <Heart className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Obrigado pela confiança! 💙
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Estamos na <span className="font-semibold text-muted-foreground">fase Beta 1.0</span> e um sonho está sendo realizado com muito carinho e dedicação.
                  Seu projeto estará em boas mãos — trabalhamos diariamente para entregar a melhor experiência possível para você.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-3 ml-11">
              <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground text-left">Importante — <span className="text-muted-foreground">Fase Beta</span></p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Faça <strong>download e exportações dos seus dados regularmente</strong> (CSV, Excel ou PDF).
                  Caso encontre algum bug ou erro, por favor nos avise imediatamente através do formulário abaixo ou pelo WhatsApp. Sua contribuição é fundamental para melhorarmos a plataforma!
                </p>
              </div>
            </div>
          </div>


          {/* Cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <div className="rounded-xl bg-card border border-border/50 card-shadow p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></div>
                <h3 className="text-sm font-semibold">WhatsApp</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">Fale com nossa equipe.</p>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
                Abrir <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Documentação */}
            <div className="rounded-xl bg-card border border-border/50 card-shadow p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><BookOpen className="h-4 w-4" /></div>
                <h3 className="text-sm font-semibold">Documentação</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">Acesse nossos recursos e documentos legais.</p>
              <div className="space-y-2">
                <a href="/privacy-policy" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  <BookOpen className="h-3 w-3" /> Política de Privacidade
                </a>
                <a href="/terms-of-use" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  <BookOpen className="h-3 w-3" /> Termos de Uso
                </a>
                <button onClick={() => setShowHotmartTutorial(v => !v)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 w-full text-left">
                  <Webhook className="h-3 w-3" /> Tutorial: Rastreamento Hotmart
                </button>
              </div>
            </div>

            {/* Tutoriais */}
            <div className="rounded-xl bg-card border border-border/50 card-shadow p-5 flex flex-col opacity-60">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground"><GraduationCap className="h-4 w-4" /></div>
                <h3 className="text-sm font-semibold">Tutoriais</h3>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs cursor-not-allowed mt-auto" disabled>Em breve</Button>
                </TooltipTrigger>
                <TooltipContent>Em breve</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Quick help */}
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 text-center">
            <h3 className="text-sm font-semibold mb-2">Precisa de ajuda rápida?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Nossa equipe está disponível de segunda a sexta, das 9h às 18h.
            </p>
            <Button
              className="gradient-bg border-0 text-primary-foreground hover:opacity-90 gap-2"
              onClick={() => window.open(WHATSAPP_URL, "_blank")}
            >
              <MessageCircle className="h-4 w-4" />
              Falar com suporte
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
