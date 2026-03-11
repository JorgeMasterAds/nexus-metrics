import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Activity, ArrowRight, BarChart3, Bell, CheckCircle2, ChevronDown,
  ChevronRight, Eye, Filter, Globe, Layers, LineChart, Link2, Menu,
  MousePointerClick, Rocket, Shield, Sparkles, Target, TrendingUp,
  Users, X, Zap, ArrowUpRight, Star, Check, ExternalLink,
  Megaphone, ShoppingCart, Webhook, MonitorSmartphone, LayoutDashboard,
  PieChart, FlaskConical, Gauge, CreditCard, Store, Radio, Facebook, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useI18n, type Locale } from "@/lib/i18n";
import logoFacebook from "@/assets/logo-facebook.png";
import logoGoogleAds from "@/assets/logo-google-ads-new.png";
import logoHotmart from "@/assets/logo-hotmart.png";

const LOCALE_FLAGS: Record<Locale, { emoji: string; label: string }> = {
  "pt-BR": { emoji: "🇧🇷", label: "Português" },
  "en": { emoji: "🇺🇸", label: "English" },
  "es": { emoji: "🇪🇸", label: "Español" },
};

/* ─── Language Switcher ─── */
function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/20 hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 text-sm ${className}`}>
          <span className="text-base">{LOCALE_FLAGS[locale].emoji}</span>
          <span className="hidden sm:inline text-muted-foreground text-xs">{LOCALE_FLAGS[locale].label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end" sideOffset={8}>
        {(Object.keys(LOCALE_FLAGS) as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${locale === l ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
          >
            <span className="text-base">{LOCALE_FLAGS[l].emoji}</span>
            {LOCALE_FLAGS[l].label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

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
    <div className="relative z-20 -my-1 pointer-events-none">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative h-px z-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 -top-[3px] w-[7px] h-[7px] rounded-full bg-primary/60 shadow-[0_0_10px_3px] shadow-primary/30" />
        </div>
      </div>
    </div>
  );
}

/* ─── Header ─── */
function LandingHeader() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { label: t("lp_features"), href: "#funcionalidades" },
    { label: t("lp_how_it_works"), href: "#como-funciona" },
    { label: t("lp_integrations"), href: "#integracoes" },
    { label: t("lp_pricing"), href: "#precos" },
    { label: t("lp_faq"), href: "#faq" },
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
            <a key={l.href} href={l.href} className="px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg border border-transparent hover:border-primary/40 hover:bg-primary/10 hover:shadow-[0_0_10px_2px_hsl(var(--primary)/0.15)]">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <Link to="/dashboard"> 
              <Button size="sm" className="gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] hover:scale-105 transition-all duration-200">
                {t("lp_go_dashboard")} <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="border border-transparent hover:border-primary/40 hover:bg-primary/10 hover:text-foreground hover:shadow-[0_0_10px_2px_hsl(var(--primary)/0.15)] transition-all duration-200">{t("lp_login")}</Button>
              </Link>
              <a href="#precos">
                <Button size="sm" className="gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] hover:scale-105 transition-all duration-200">
                  {t("lp_start_free")} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </a>
            </>
          )}
        </div>
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/20 px-4 pb-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-muted-foreground hover:text-foreground">{l.label}</a>
          ))}
          {isLoggedIn ? (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-3 gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] transition-all duration-200">{t("lp_go_dashboard")}</Button>
            </Link>
          ) : (
            <a href="#precos" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-3 gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] transition-all duration-200">{t("lp_start_free_test")}</Button>
            </a>
          )}
        </motion.div>
      )}
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,41,36,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,41,36,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20 sm:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6 shadow-[0_0_15px_3px] shadow-primary/10 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> {t("lp_badge")}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground leading-[1.1] tracking-tight mb-5 max-w-4xl mx-auto"
        >
          {t("lp_hero_title_1")}{" "}
          <br className="hidden sm:block" />
          {t("lp_hero_title_2")}{" "}
          <span className="gradient-text">{t("lp_hero_title_3")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          {t("lp_hero_sub")}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
          <a href="#precos">
            <Button size="lg" className="h-14 px-10 text-base gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_25px_8px_hsl(var(--primary)/0.45)] hover:scale-[1.03] transition-all duration-200">
              {t("lp_start_free_trial")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-3">{t("lp_hero_microcopy")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground mb-14"
        >
          {[t("lp_diff_1"), t("lp_diff_2"), t("lp_diff_3")].map((text, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shadow-[0_0_4px_1px] shadow-primary/20" />
              {text}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
        >
          {[
            { icon: Target, text: t("lp_benefit_1") },
            { icon: Sparkles, text: t("lp_benefit_2") },
            { icon: Filter, text: t("lp_benefit_3") },
            { icon: TrendingUp, text: t("lp_benefit_4") },
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

/* ─── Social Proof Bar ─── */
function SocialProofBar() {
  const { t } = useI18n();
  return (
    <section className="py-12 border-y border-border/10">
      <div className="max-w-6xl mx-auto px-4">
        <FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { icon: Zap, text: t("lp_social_1") },
              { icon: Globe, text: t("lp_social_2") },
              { icon: Layers, text: t("lp_social_3") },
              { icon: Shield, text: t("lp_social_4") },
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
  const { t } = useI18n();
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_problem_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
            {t("lp_problem_title_1")}{" "}
            <span className="gradient-text">{t("lp_problem_title_2")}</span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="space-y-6 text-muted-foreground text-base leading-relaxed">
            <p>{t("lp_problem_p1")} <span className="text-foreground font-medium">{t("lp_problem_p1_bold")}</span></p>
            <p>{t("lp_problem_p2")} <span className="text-foreground font-medium">{t("lp_problem_p2_bold")}</span></p>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {[t("lp_problem_card_1"), t("lp_problem_card_2"), t("lp_problem_card_3")].map((text, i) => {
              const icons = [TrendingUp, Eye, BarChart3];
              const Icon = icons[i];
              return (
                <div key={i} className="flex items-start gap-3 p-5 rounded-xl border border-destructive/20 bg-destructive/5">
                  <Icon className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Promise Section ─── */
function PromiseSection() {
  const { t } = useI18n();
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/[0.03]" />
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,41,36,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,41,36,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.06] rounded-full blur-[100px] pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_solution_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            {t("lp_solution_title_1")} <span className="gradient-text">{t("lp_solution_title_2")}</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">{t("lp_solution_sub")}</p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="grid sm:grid-cols-2 gap-4">
            {[t("lp_solution_item_1"), t("lp_solution_item_2"), t("lp_solution_item_3"), t("lp_solution_item_4")].map((text, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-sm group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px] transition-all duration-200">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(255,41,36,0.5)] transition-all" />
                <span className="text-sm text-foreground">{text}</span>
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
  const { t } = useI18n();
  const audiences = [
    { icon: Megaphone, title: t("lp_audience_1_title"), desc: t("lp_audience_1_desc") },
    { icon: ShoppingCart, title: t("lp_audience_2_title"), desc: t("lp_audience_2_desc") },
    { icon: Rocket, title: t("lp_audience_3_title"), desc: t("lp_audience_3_desc") },
    { icon: Store, title: t("lp_audience_4_title"), desc: t("lp_audience_4_desc") },
    { icon: MonitorSmartphone, title: t("lp_audience_5_title"), desc: t("lp_audience_5_desc") },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_audience_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_audience_title_1")} <span className="gradient-text">{t("lp_audience_title_2")}</span>
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
        <FadeIn className="text-center mt-10">
          <a href="#precos">
            <Button className="gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] hover:scale-[1.02] transition-all duration-200">
              {t("lp_see_plans")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Insights Reveal ─── */
function InsightsSection() {
  const { t } = useI18n();
  const insights = [
    t("lp_insight_1"), t("lp_insight_2"), t("lp_insight_3"),
    t("lp_insight_4"), t("lp_insight_5"), t("lp_insight_6"),
  ];

  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_insights_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_insights_title_1")} <span className="gradient-text">{t("lp_insights_title_2")}</span>
          </h2>
        </FadeIn>
        <div className="space-y-3">
          {insights.map((text, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/15 bg-card/30 hover:border-primary/15 transition-colors">
                <Eye className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{text}</span>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.4} className="text-center mt-8">
          <p className="text-sm text-muted-foreground">{t("lp_insights_footer_1")} <span className="text-foreground font-medium">{t("lp_insights_footer_2")}</span>.</p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
function HowItWorksSection() {
  const { t } = useI18n();
  const steps = [
    { num: "1", title: t("lp_step_1_title"), desc: t("lp_step_1_desc") },
    { num: "2", title: t("lp_step_2_title"), desc: t("lp_step_2_desc") },
    { num: "3", title: t("lp_step_3_title"), desc: t("lp_step_3_desc") },
    { num: "4", title: t("lp_step_4_title"), desc: t("lp_step_4_desc") },
  ];

  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_steps_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_steps_title_1")} <span className="gradient-text">{t("lp_steps_title_2")}</span>
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
        <FadeIn className="text-center mt-10">
          <a href="#precos">
            <Button className="gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] hover:scale-[1.02] transition-all duration-200">
              {t("lp_start_now")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  const { t } = useI18n();
  const features = [
    { icon: Gauge, title: t("lp_feat_1_title"), desc: t("lp_feat_1_desc") },
    { icon: Link2, title: t("lp_feat_2_title"), desc: t("lp_feat_2_desc") },
    { icon: PieChart, title: t("lp_feat_3_title"), desc: t("lp_feat_3_desc") },
    { icon: FlaskConical, title: t("lp_feat_4_title"), desc: t("lp_feat_4_desc") },
    { icon: LayoutDashboard, title: t("lp_feat_5_title"), desc: t("lp_feat_5_desc") },
    { icon: Bell, title: t("lp_feat_6_title"), desc: t("lp_feat_6_desc") },
  ];

  return (
    <section id="funcionalidades" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_feat_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_feat_title_1")} <span className="gradient-text">{t("lp_feat_title_2")}</span>
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
  const { t } = useI18n();
  const integrations = [
    { icon: <img src={logoFacebook} alt="Meta Ads" className="h-8 w-8 object-contain" />, name: "Meta Ads", desc: "Facebook & Instagram Ads" },
    { icon: <img src={logoGoogleAds} alt="Google Ads" className="h-8 w-8 object-contain" />, name: "Google Ads", desc: "Search, Display & YouTube" },
    { icon: <img src={logoHotmart} alt="Hotmart" className="h-8 w-8 object-contain" />, name: "Hotmart", desc: t("lp_integ_hotmart_desc") },
    { icon: <Webhook className="h-8 w-8 text-primary" />, name: "Webhooks", desc: t("lp_integ_webhooks_desc") },
  ];

  return (
    <section id="integracoes" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_integ_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_integ_title_1")} <span className="gradient-text">{t("lp_integ_title_2")}</span>
          </h2>
        </FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {integrations.map((ig, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border/20 bg-card/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all text-center group">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  {ig.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{ig.name}</p>
                  <p className="text-xs text-muted-foreground">{ig.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn className="text-center mt-10">
          <a href="#precos">
            <Button className="gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] hover:scale-[1.02] transition-all duration-200">
              {t("lp_choose_plan")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Before / After ─── */
function BeforeAfterSection() {
  const { t } = useI18n();
  const before = [t("lp_before_1"), t("lp_before_2"), t("lp_before_3"), t("lp_before_4"), t("lp_before_5")];
  const after = [t("lp_after_1"), t("lp_after_2"), t("lp_after_3"), t("lp_after_4"), t("lp_after_5")];

  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_transform_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_transform_title_1")} <span className="gradient-text">Nexus Metrics</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-6">
          <FadeIn>
            <div className="p-6 rounded-2xl border border-destructive/15 bg-destructive/5 h-full">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><X className="h-5 w-5 text-destructive" /> {t("lp_before")}</h3>
              <ul className="space-y-3">
                {before.map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-destructive/60 mt-0.5 shrink-0" />{text}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="p-6 rounded-2xl border border-primary/15 bg-primary/5 h-full">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> {t("lp_after")}</h3>
              <ul className="space-y-3">
                {after.map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{text}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
        <FadeIn className="text-center mt-10">
          <a href="#precos">
            <Button className="gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)] hover:scale-[1.02] transition-all duration-200">
              {t("lp_transform_cta")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function PricingSection() {
  const { t } = useI18n();
  const plans = [
    {
      name: "Bronze",
      price: "57",
      desc: t("lp_plan_bronze_desc"),
      features: ["1 projeto", "3 smartlinks", "3 webhooks", "2 usuários", "500 leads", "1 agente IA", "1 dispositivo", "3 pesquisas", "Relatórios básicos"],
      popular: false,
      checkoutUrl: "https://pay.hotmart.com/W99134498P?checkoutMode=10",
    },
    {
      name: "Prata",
      price: "97",
      desc: t("lp_plan_silver_desc"),
      features: ["2 projetos", "5 smartlinks", "10 webhooks", "3 usuários", "2.000 leads", "1 agente IA", "5 pesquisas", "Exportação CSV", "Filtros avançados", "Suporte prioritário"],
      popular: true,
      checkoutUrl: "https://pay.hotmart.com/W99134498P?checkoutMode=10&offerId=q8v5m2k0",
    },
    {
      name: "Ouro",
      price: "147",
      desc: t("lp_plan_gold_desc"),
      features: ["5 projetos", "10 smartlinks", "20 webhooks", "3 usuários", "10.000 leads", "2 agentes IA", "2 dispositivos", "10 pesquisas", "Relatórios avançados", "Suporte dedicado"],
      popular: false,
      checkoutUrl: "https://pay.hotmart.com/W99134498P?checkoutMode=10&offerId=r7x4n1l9",
    },
  ];

  return (
    <section id="precos" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/[0.04] rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_pricing_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_pricing_title_1")} <span className="gradient-text">{t("lp_pricing_title_2")}</span>
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className={`relative p-6 rounded-2xl border h-full flex flex-col transition-all duration-200 hover:translate-y-[-2px] ${p.popular ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/60" : "border-border/20 bg-card/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {t("lp_most_used")}
                  </span>
                )}
                <h3 className="font-bold text-foreground text-lg">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-foreground">R$ {p.price}</span>
                  <span className="text-sm text-muted-foreground">{t("lp_per_month")}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <a href={p.checkoutUrl} target="_blank" rel="noopener noreferrer">
                  <Button className={`w-full hover:scale-[1.02] transition-all duration-200 ${p.popular ? "gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_20px_5px_hsl(var(--primary)/0.4)]" : "bg-secondary text-secondary-foreground border border-transparent hover:border-primary/40 hover:bg-primary/10 hover:text-foreground hover:shadow-[0_0_10px_2px_hsl(var(--primary)/0.15)]"}`}>
                    {t("lp_subscribe")}
                  </Button>
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Benefits Marquee ─── */
function BenefitsMarquee() {
  const { t } = useI18n();
  const benefits = [
    { icon: CreditCard, text: t("lp_marquee_1") },
    { icon: Target, text: t("lp_marquee_2") },
    { icon: BarChart3, text: t("lp_marquee_3") },
    { icon: FlaskConical, text: t("lp_marquee_4") },
    { icon: Zap, text: t("lp_marquee_5") },
    { icon: Layers, text: t("lp_marquee_6") },
    { icon: LineChart, text: t("lp_marquee_7") },
    { icon: Users, text: t("lp_marquee_8") },
  ];
  const doubled = [...benefits, ...benefits];

  return (
    <section className="py-10 overflow-hidden">
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee w-max gap-6">
          {doubled.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/20 bg-card/40 whitespace-nowrap">
              <b.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials Marquee ─── */
function TestimonialsSection() {
  const { t } = useI18n();
  const row1 = [
    { name: "Lucas F.", role: "Gestor de Tráfego", text: "Antes do Nexus eu escalava no escuro. Agora sei exatamente qual criativo gera faturamento.", color: "bg-blue-500" },
    { name: "Amanda S.", role: "Infoprodutora", text: "Descobri que minha campanha 'ruim' era responsável por 60% das vendas. Sem o Nexus, eu teria pausado ela.", color: "bg-emerald-500" },
    { name: "Rafael C.", role: "Dono de Agência", text: "Nossos relatórios para clientes ficaram muito mais claros. Retemos mais clientes porque mostramos dados reais.", color: "bg-purple-500" },
    { name: "Juliana R.", role: "Afiliada", text: "Antes vendia manualmente. Agora é tudo automático e ganho muito mais. Renda passiva de verdade!", color: "bg-yellow-500" },
    { name: "Carlos E.", role: "E-commerce", text: "Suporte excelente e pagamentos sempre em dia. Super recomendo!", color: "bg-orange-500" },
    { name: "Fernanda L.", role: "Copywriter", text: "Já tenho uma base de clientes fiéis. O sistema de relatórios é genial!", color: "bg-pink-500" },
  ];
  const row2 = [
    { name: "Ricardo P.", role: "Media Buyer", text: "Melhor plataforma para análise real de dados. As métricas caem no painel na hora!", color: "bg-red-500" },
    { name: "Patrícia V.", role: "Gestora de Tráfego", text: "A automação é perfeita. Configurei o webhook e os dados entram sozinhos.", color: "bg-teal-500" },
    { name: "Thiago B.", role: "Infoprodutor", text: "Ganho tempo em cada análise. O dashboard mostra tudo que preciso sem complicação.", color: "bg-indigo-500" },
    { name: "Marina A.", role: "Agência Digital", text: "Meus clientes adoram os relatórios. Profissional demais!", color: "bg-cyan-500" },
    { name: "Diego M.", role: "Consultor", text: "Finalmente consigo mostrar pro cliente de onde vem cada real de faturamento.", color: "bg-lime-500" },
    { name: "Beatriz N.", role: "Social Media", text: "Interface linda e funcional. Fácil de usar mesmo sem ser técnica.", color: "bg-fuchsia-500" },
  ];

  const doubled1 = [...row1, ...row1];
  const doubled2 = [...row2, ...row2];

  const TestimonialCard = ({ t: testimonial }: { t: typeof row1[0] }) => (
    <div className="w-[320px] shrink-0 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-muted-foreground text-sm font-bold">
          {testimonial.name[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-primary">{testimonial.role}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-2">
        {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />)}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">"{testimonial.text}"</p>
    </div>
  );

  return (
    <section className="py-20 sm:py-28 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-14">
        <FadeIn className="text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_testimonials_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_testimonials_title_1")} <span className="gradient-text">{t("lp_testimonials_title_2")}</span>
          </h2>
        </FadeIn>
      </div>
      <div className="relative space-y-6">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee-slow w-max gap-6">
          {doubled1.map((testimonial, i) => <TestimonialCard key={i} t={testimonial} />)}
        </div>
        <div className="flex animate-marquee-reverse w-max gap-6">
          {doubled2.map((testimonial, i) => <TestimonialCard key={i} t={testimonial} />)}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQSection() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = [
    { q: t("lp_faq_1_q"), a: t("lp_faq_1_a") },
    { q: t("lp_faq_2_q"), a: t("lp_faq_2_a") },
    { q: t("lp_faq_3_q"), a: t("lp_faq_3_a") },
    { q: t("lp_faq_4_q"), a: t("lp_faq_4_a") },
    { q: t("lp_faq_5_q"), a: t("lp_faq_5_a") },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">{t("lp_faq_tag")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("lp_faq_title_1")} <span className="gradient-text">{t("lp_faq_title_2")}</span>
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
  const { t } = useI18n();
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-primary/[0.03]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("lp_final_title_1")}<br />
            {t("lp_final_title_2")} <span className="gradient-text">{t("lp_final_title_3")}</span>.
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            {t("lp_final_sub")}
          </p>
          <a href="#precos">
            <Button size="lg" className="h-14 px-10 text-base gradient-bg text-primary-foreground shadow-none hover:bg-primary/80 hover:shadow-[0_0_25px_8px_hsl(var(--primary)/0.45)] hover:scale-[1.03] transition-all duration-200">
              {t("lp_start_free_trial")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-4">{t("lp_final_microcopy")}</p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function LandingFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border/10 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground text-sm">Nexus Metrics</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("lp_footer_desc")}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3">{t("lp_footer_product")}</h4>
            <ul className="space-y-2">
              <li><a href="#funcionalidades" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("lp_features")}</a></li>
              <li><a href="#integracoes" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("lp_integrations")}</a></li>
              <li><a href="#precos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("lp_pricing")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3">{t("lp_footer_legal")}</h4>
            <ul className="space-y-2">
              <li><Link to="/termos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("lp_footer_terms")}</Link></li>
              <li><Link to="/privacidade" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("lp_footer_privacy")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3">{t("lp_footer_support")}</h4>
            <ul className="space-y-2">
              <li><Link to="/support" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("lp_footer_help")}</Link></li>
              <li><Link to="/bug-report" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("lp_footer_bug")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/10 pt-6 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nexus Metrics. {t("lp_footer_rights")}</p>
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
      <BenefitsMarquee />
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
