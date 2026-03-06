import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Activity, ArrowRight, BarChart3, Bell, CheckCircle2, ChevronDown,
  ChevronRight, Eye, Filter, Globe, Layers, LineChart, Link2, Menu,
  MousePointerClick, Rocket, Shield, Sparkles, Target, TrendingUp,
  Users, X, Zap, ArrowUpRight, Star, Check, ExternalLink,
  Megaphone, ShoppingCart, Webhook, MonitorSmartphone, LayoutDashboard,
  PieChart, FlaskConical, Gauge, CreditCard, Store, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Fade-in wrapper ─── */
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Futuristic Section Separator ─── */
function SectionDivider() {
  return (
    <div className="relative py-2">
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative h-px">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full bg-primary/40 shadow-[0_0_8px_2px] shadow-primary/20" />
        </div>
      </div>
    </div>
  );
}

/* ─── Header ─── */
function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Integrações", href: "#integracoes" },
    { label: "Preços", href: "#precos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/20 shadow-lg shadow-black/10" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <a href="#" className="flex items-center gap-2.5">
          <Activity className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground tracking-tight">Nexus Metrics</span>
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <a key={l.href} href={l.href} className="px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/5">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="gradient-bg hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-200">
              Começar Grátis <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/20 px-4 pb-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-muted-foreground hover:text-foreground">{l.label}</a>
          ))}
          <Link to="/login" onClick={() => setMobileOpen(false)}>
            <Button className="w-full mt-3 gradient-bg hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200">Começar Teste Gratuito</Button>
          </Link>
        </motion.div>
      )}
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Futuristic grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,41,36,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,41,36,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20 sm:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-8 shadow-[0_0_15px_3px] shadow-primary/10 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> Inteligência de dados para tráfego pago
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6"
        >
          Descubra quais anúncios{" "}
          <span className="gradient-text">realmente geram faturamento</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          O Nexus Metrics conecta seus anúncios, UTMs, funis e vendas para revelar o mapa real do seu crescimento.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground mb-10"
        >
          <span>Sem achismo.</span>
          <span className="hidden sm:inline text-border">•</span>
          <span>Sem métricas vaidade.</span>
          <span className="hidden sm:inline text-border">•</span>
          <span>Sem escalar no escuro.</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Link to="/login">
            <Button size="lg" className="h-14 px-10 text-base gradient-bg hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] transition-all duration-200">
              Começar Teste Gratuito <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">Configuração em minutos · Sem cartão de crédito</p>
        </motion.div>

        {/* Quick benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { icon: Target, text: "Qual campanha gera vendas" },
            { icon: Sparkles, text: "Qual criativo traz compradores" },
            { icon: Filter, text: "Qual funil converte mais" },
            { icon: TrendingUp, text: "Onde escalar com segurança" },
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/10 bg-card/20 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
              <b.icon className="h-5 w-5 text-primary group-hover:drop-shadow-[0_0_6px_rgba(255,41,36,0.5)] transition-all" />
              <span className="text-xs text-muted-foreground text-center">{b.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Social Proof Bar — removed fake stats, replaced with value props ─── */
function SocialProofBar() {
  return (
    <section className="py-12 border-y border-border/10">
      <div className="max-w-6xl mx-auto px-4">
        <FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { icon: Zap, text: "Conexão com diversas plataformas" },
              { icon: Globe, text: "Webhooks para receber eventos" },
              { icon: Layers, text: "Centralize tudo em um só local" },
              { icon: Shield, text: "Dados seguros e criptografados" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <item.icon className="h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Problem Section ─── */
function ProblemSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">O problema</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
            Milhares de negócios perdem dinheiro com tráfego por falta de{" "}
            <span className="gradient-text">clareza de dados</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="space-y-6 text-muted-foreground text-base leading-relaxed">
            <p>Você abre o gerenciador de anúncios. CTR, CPM, CPC, leads — tudo parece funcionando. Mas quando olha o faturamento… <span className="text-foreground font-medium">silêncio.</span></p>
            <p>Plataformas de anúncios mostram dados de mídia. <span className="text-foreground font-medium">Elas não mostram de onde realmente vem o dinheiro.</span></p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, text: "Escalar campanhas que não vendem" },
              { icon: Eye, text: "Pausar campanhas lucrativas" },
              { icon: BarChart3, text: "Meses testando sem clareza" },
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-5 rounded-xl border border-destructive/20 bg-destructive/5">
                <p.icon className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{p.text}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Promise Section ─── */
function PromiseSection() {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">A solução</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Tenha uma visão completa do seu tráfego, conecte seus dados e descubra o que realmente <span className="gradient-text">gera vendas</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">Conecte diversas plataformas via webhooks, receba eventos em tempo real e centralize todas as informações em um único painel inteligente.</p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Padrões de compra invisíveis revelados",
              "Criativos subestimados identificados",
              "Campanhas ruins que geram vendas descobertas",
              "O próximo ponto de escala do seu negócio",
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-primary/10 bg-card/50">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">{t}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Who is it for ─── */
function AudienceSection() {
  const audiences = [
    { icon: Megaphone, title: "Gestores de Tráfego", desc: "Veja qual criativo gera vendas, qual campanha gera lucro e onde escalar investimento." },
    { icon: ShoppingCart, title: "Infoprodutores", desc: "Quais anúncios trazem compradores, quais páginas convertem mais e qual tráfego sustenta lançamentos." },
    { icon: Rocket, title: "Lançadores e Estrategistas", desc: "Visão completa do fluxo de aquisição: campanhas, funis e comportamento de compra." },
    { icon: Store, title: "Empreendedores Digitais", desc: "Qual canal gera lucro, qual oferta converte mais e qual público compra mais rápido." },
    { icon: MonitorSmartphone, title: "Negócios Locais", desc: "Qual campanha gera clientes reais, qual anúncio traz agendamentos e qual investimento dá retorno." },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Para quem</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Para quem vive de <span className="gradient-text">crescimento</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiences.map((a, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="p-6 rounded-2xl border border-border/20 bg-card/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px] transition-all duration-200 group h-full">
                <a.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-2">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Insights Reveal ─── */
function InsightsSection() {
  const insights = [
    "O criativo que gera mais vendas mas parece fraco no Ads Manager",
    "O anúncio que traz leads baratos mas compradores ruins",
    "O funil que converte 3x mais que os outros",
    "A campanha responsável pela maior parte do faturamento",
    "O erro invisível que faz campanhas lucrativas parecerem prejuízo",
    "O padrão escondido entre UTMs e compras que revela onde escalar",
  ];

  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Revelações</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            O que você passa a <span className="gradient-text">enxergar</span>
          </h2>
        </FadeIn>
        <div className="space-y-3">
          {insights.map((t, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/15 bg-card/30 hover:border-primary/15 transition-colors">
                <Eye className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{t}</span>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.4} className="text-center mt-8">
          <p className="text-sm text-muted-foreground">Dados que ficam espalhados entre plataformas — o Nexus organiza tudo em <span className="text-foreground font-medium">um único painel</span>.</p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
function HowItWorksSection() {
  const steps = [
    { num: "1", title: "Conecte suas campanhas", desc: "Integre suas contas de anúncios. O sistema captura dados automaticamente." },
    { num: "2", title: "Capture UTMs e vendas", desc: "O Nexus registra UTM campaign, content, source e medium — e cruza com suas vendas." },
    { num: "3", title: "Veja o faturamento real", desc: "Receita por campanha, por anúncio, por criativo. Não cliques — dinheiro real." },
    { num: "4", title: "Tome decisões estratégicas", desc: "Escale campanhas lucrativas, corte desperdício, melhore funis e aumente previsibilidade." },
  ];

  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Passo a passo</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Como o Nexus Metrics <span className="gradient-text">funciona</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="relative p-6 rounded-2xl border border-border/20 bg-card/40 text-center group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px] transition-all duration-200">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_12px_2px] shadow-primary/10 group-hover:shadow-primary/25 transition-shadow">
                  <span className="text-sm font-bold gradient-text">{s.num}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <h3 className="font-semibold text-foreground mb-2 text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  const features = [
    { icon: Gauge, title: "Dashboard de ROAS Real", desc: "Receita real conectada ao investimento. Não apenas métricas de mídia." },
    { icon: Link2, title: "Rastreamento de UTMs", desc: "Caminho completo: anúncio → clique → página → compra. Cada venda atribuída." },
    { icon: PieChart, title: "Análise por Criativo", desc: "Descubra quais anúncios realmente vendem. O criativo fraco pode ser o que mais converte." },
    { icon: FlaskConical, title: "Testes A/B Inteligentes", desc: "Compare anúncios, campanhas, páginas e ofertas. Veja qual variação gera vendas." },
    { icon: LayoutDashboard, title: "Análise de Funis", desc: "Visualize o fluxo completo: tráfego → interação → conversão → faturamento." },
    { icon: Bell, title: "Alertas Inteligentes", desc: "Notificações quando campanhas perdem performance ou criativos param de converter." },
  ];

  return (
    <section id="funcionalidades" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Funcionalidades</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Tudo que você precisa para <span className="gradient-text">escalar com dados</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="p-6 rounded-2xl border border-border/20 bg-card/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px] transition-all duration-200 group h-full">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 group-hover:shadow-[0_0_12px_2px] group-hover:shadow-primary/15 transition-all duration-200">
                  <f.icon className="h-5 w-5 text-primary group-hover:drop-shadow-[0_0_4px_rgba(255,41,36,0.4)]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Integrations ─── */
function IntegrationsSection() {
  const MetaLogo = () => (
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/600px-Facebook_Logo_%282019%29.png" alt="Meta" className="h-8 w-8 object-contain" />
  );
  const GoogleAdsLogo = () => (
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Ads_logo.svg/512px-Google_Ads_logo.svg.png" alt="Google Ads" className="h-8 w-8 object-contain" />
  );
  const HotmartLogo = () => (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none">
      <circle cx="16" cy="16" r="15" fill="#F04E23" />
      <path d="M10 12c0-1 .5-2 1.5-2.5 2-1 4 .5 4 .5s2-1.5 4-.5c1 .5 1.5 1.5 1.5 2.5 0 4-5.5 8-5.5 8S10 16 10 12z" fill="white" />
    </svg>
  );

  const integrations = [
    { logo: <MetaLogo />, name: "Meta Ads", desc: "Facebook & Instagram Ads" },
    { logo: <GoogleAdsLogo />, name: "Google Ads", desc: "Search, Display & YouTube" },
    { logo: <HotmartLogo />, name: "Hotmart", desc: "Infoprodutos, e outras" },
    { logo: <Webhook className="h-8 w-8 text-primary" />, name: "Webhooks", desc: "Qualquer plataforma" },
  ];

  return (
    <section id="integracoes" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Integrações</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Conecte com as plataformas que <span className="gradient-text">você já usa</span>
          </h2>
        </FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {integrations.map((ig, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border/20 bg-card/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all text-center group">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  {ig.logo}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{ig.name}</p>
                  <p className="text-xs text-muted-foreground">{ig.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Before / After ─── */
function BeforeAfterSection() {
  const before = ["Dados espalhados entre plataformas", "Análises confusas", "Decisões baseadas em suposição", "Campanhas escaladas no escuro", "Tempo perdido analisando relatórios"];
  const after = ["Um único dashboard claro", "Receita conectada aos anúncios", "Decisões baseadas em dados reais", "Escala previsível de campanhas", "Tempo focado em crescimento"];

  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Transformação</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Antes e depois do <span className="gradient-text">Nexus Metrics</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-6">
          <FadeIn>
            <div className="p-6 rounded-2xl border border-destructive/15 bg-destructive/5 h-full">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><X className="h-5 w-5 text-destructive" /> Antes</h3>
              <ul className="space-y-3">
                {before.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-destructive/60 mt-0.5 shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="p-6 rounded-2xl border border-primary/15 bg-primary/5 h-full">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Depois</h3>
              <ul className="space-y-3">
                {after.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function PricingSection() {
  const plans = [
    {
      name: "Bronze",
      price: "57",
      desc: "Para quem está começando e quer fazer alguns testes",
      features: ["1 projeto", "3 smartlinks", "3 webhooks", "2 usuários", "500 leads", "1 agente IA", "1 dispositivo", "3 pesquisas", "Relatórios básicos"],
      popular: false,
    },
    {
      name: "Prata",
      price: "97",
      desc: "Para gestores de tráfego e infoprodutores",
      features: ["2 projetos", "5 smartlinks", "10 webhooks", "3 usuários", "2.000 leads", "1 agente IA", "5 pesquisas", "Exportação CSV", "Filtros avançados", "Suporte prioritário"],
      popular: true,
    },
    {
      name: "Ouro",
      price: "147",
      desc: "Para quem quer escalar com dados reais",
      features: ["5 projetos", "10 smartlinks", "20 webhooks", "3 usuários", "10.000 leads", "2 agentes IA", "2 dispositivos", "10 pesquisas", "Relatórios avançados", "Suporte dedicado"],
      popular: false,
    },
  ];

  return (
    <section id="precos" className="py-20 sm:py-28 relative">
      {/* Background glow for pricing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/[0.04] rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Planos</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Escolha o plano ideal para o seu <span className="gradient-text">crescimento</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className={`relative p-6 rounded-2xl border h-full flex flex-col transition-all duration-200 hover:translate-y-[-2px] ${p.popular ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/60" : "border-border/20 bg-card/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Mais utilizado
                  </span>
                )}
                <h3 className="font-bold text-foreground text-lg">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-foreground">R$ {p.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className={`w-full hover:scale-[1.02] transition-all duration-200 ${p.popular ? "gradient-bg hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40" : "bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:shadow-md"}`}>
                    Começar agora
                  </Button>
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function TestimonialsSection() {
  const testimonials = [
    { name: "Lucas Ferreira", role: "Gestor de Tráfego", text: "Antes do Nexus eu escalava no escuro. Agora sei exatamente qual criativo gera faturamento. Meu ROAS real subiu 40% em 2 meses." },
    { name: "Amanda Souza", role: "Infoprodutora", text: "Descobri que minha campanha 'ruim' era responsável por 60% das vendas. Sem o Nexus, eu teria pausado ela." },
    { name: "Rafael Costa", role: "Dono de Agência", text: "Nossos relatórios para clientes ficaram muito mais claros. Retemos mais clientes porque mostramos dados reais de faturamento." },
  ];

  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Depoimentos</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Quem usa, <span className="gradient-text">recomenda</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="p-6 rounded-2xl border border-border/20 bg-card/40 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = [
    { q: "Preciso ser técnico para usar?", a: "Não. A plataforma foi criada para ser simples e visual. Em poucos cliques você conecta suas contas e começa a ver os dados." },
    { q: "Quanto tempo leva para configurar?", a: "Na maioria dos casos, a configuração leva menos de 5 minutos. Basta conectar sua conta de anúncios e sua plataforma de vendas." },
    { q: "Meus dados ficam seguros?", a: "Sim. Todas as integrações utilizam autenticação segura OAuth e protocolos oficiais das plataformas. Seus dados são criptografados." },
    { q: "Funciona apenas para tráfego pago?", a: "Não. O Nexus também ajuda a analisar funis, estratégias de aquisição, testes de ofertas e performance geral de campanhas." },
    { q: "Posso cancelar a qualquer momento?", a: "Sim. Não existe fidelidade. Você pode cancelar sua assinatura quando quiser, sem taxas adicionais." },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Dúvidas</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Perguntas <span className="gradient-text">frequentes</span>
          </h2>
        </FadeIn>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full text-left p-5 rounded-xl border border-border/20 bg-card/40 hover:border-primary/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openIdx === i ? "rotate-180" : ""}`} />
                </div>
                {openIdx === i && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {f.a}
                  </motion.p>
                )}
              </button>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTASection() {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.03]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Escalar deixa de ser tentativa.<br />
            Passa a ser <span className="gradient-text">decisão</span>.
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Conecte suas campanhas. Descubra o que realmente gera vendas. Tome decisões com base em dados reais.
          </p>
          <Link to="/login">
            <Button size="lg" className="h-14 px-10 text-base gradient-bg hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] transition-all duration-200">
              Começar Teste Gratuito <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">Sem cartão de crédito · Cancele quando quiser</p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function LandingFooter() {
  return (
    <footer className="border-t border-border/10 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground text-sm">Nexus Metrics</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Inteligência de dados para tráfego pago. Conecte anúncios com vendas reais.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3">Produto</h4>
            <ul className="space-y-2">
              {["Funcionalidades", "Integrações", "Preços"].map(l => (
                <li key={l}><a href={`#${l.toLowerCase()}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/termos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3">Suporte</h4>
            <ul className="space-y-2">
              <li><Link to="/support" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Central de Ajuda</Link></li>
              <li><Link to="/bug-report" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Reportar Bug</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/10 pt-6 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nexus Metrics. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Landing Page ─── */
const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground dark-gradient">
      <LandingHeader />
      <HeroSection />
      <SocialProofBar />
      <SectionDivider />
      <ProblemSection />
      <SectionDivider />
      <PromiseSection />
      <SectionDivider />
      <AudienceSection />
      <SectionDivider />
      <InsightsSection />
      <SectionDivider />
      <HowItWorksSection />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <IntegrationsSection />
      <SectionDivider />
      <BeforeAfterSection />
      <SectionDivider />
      <PricingSection />
      <SectionDivider />
      <TestimonialsSection />
      <SectionDivider />
      <FAQSection />
      <SectionDivider />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
};

export default Index;
