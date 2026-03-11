import { ReactNode } from "react";
import { ArrowLeft, BookOpen, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BlogLayoutProps {
  title: string;
  subtitle: string;
  readTime: string;
  date: string;
  children: ReactNode;
}

export default function BlogLayout({ title, subtitle, readTime, date, children }: BlogLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Nexus Metrics — Tutoriais</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readTime}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="prose prose-sm prose-invert max-w-none 
          prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
          prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl
          prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-table:text-xs prose-th:text-foreground prose-td:text-muted-foreground
          prose-hr:border-border/30
        ">
          {children}
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center space-y-3">
          <p className="text-xs text-muted-foreground">© 2025 Nexus Metrics — Todos os direitos reservados</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/blog/tutoriais" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Todos os tutoriais</a>
            <a href="/termos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</a>
            <a href="/privacidade" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
