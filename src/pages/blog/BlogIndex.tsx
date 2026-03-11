import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ArrowRight, Webhook, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const tutorials = [
  {
    slug: "hotmart",
    title: "Como rastrear UTMs e click_id na Hotmart",
    description: "Tutorial completo sobre como a Hotmart lida com rastreamento via webhook, por que ela NÃO envia UTMs diretamente, e como resolver usando xcod, src (Base64) e source_sck.",
    readTime: "12 min",
    badge: "Mais popular",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    slug: "kiwify",
    title: "Configurando Webhook da Kiwify no Nexus Metrics",
    description: "Passo a passo para integrar a Kiwify com o Nexus Metrics e rastrear todas as suas vendas com UTMs automaticamente.",
    readTime: "5 min",
  },
  {
    slug: "eduzz",
    title: "Configurando Webhook da Eduzz no Nexus Metrics",
    description: "Como configurar postbacks da Eduzz para receber vendas no Nexus Metrics com atribuição completa de UTMs.",
    readTime: "5 min",
  },
  {
    slug: "monetizze",
    title: "Configurando Webhook da Monetizze no Nexus Metrics",
    description: "Integre a Monetizze com o Nexus Metrics para rastrear vendas e atribuir campanhas via postback.",
    readTime: "5 min",
  },
  {
    slug: "cakto",
    title: "Configurando Webhook da Cakto no Nexus Metrics",
    description: "Como configurar o webhook da Cakto, incluindo particularidades do formato de payload (array/objeto).",
    readTime: "5 min",
  },
];

export default function BlogIndex() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Início
          </Button>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Nexus Metrics — Tutoriais</span>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-4">
          <div className="flex items-center gap-2">
            <Webhook className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Tutoriais de Integração</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Guias completos e detalhados para configurar webhooks e rastreamento de UTMs com as principais plataformas de vendas do mercado digital.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-4">
        {tutorials.map((t) => (
          <button
            key={t.slug}
            onClick={() => navigate(`/blog/tutorial/${t.slug}`)}
            className="w-full text-left rounded-xl border border-border/50 bg-card hover:bg-accent/30 transition-colors p-5 sm:p-6 group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">{t.title}</h2>
                  {t.badge && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.badgeColor}`}>{t.badge}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {t.readTime} de leitura</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </main>

      <footer className="border-t border-border/30 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-xs text-muted-foreground">© 2025 Nexus Metrics — Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
