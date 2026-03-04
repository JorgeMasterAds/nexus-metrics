import { ReactNode, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import OverLimitBanner from "@/components/OverLimitBanner";
import AdminRolePreviewBar from "@/components/AdminRolePreviewBar";
import ThemeToggle from "@/components/ThemeToggle";
import { useShell } from "@/components/AppShell";

const CYBER_PHRASES = [
  "⟨ SYNC ⟩ Conectando ao núcleo...",
  "⟨ DECRYPT ⟩ Decodificando métricas...",
  "⟨ STREAM ⟩ Processando pipeline...",
  "⟨ CALC ⟩ Recalculando ROI...",
  "⟨ UPLOAD ⟩ Sincronizando dados...",
  "⟨ DONE ⟩ Atualização completa ✓",
];

function CyberpunkLoadingBar() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + 2 + Math.random() * 3;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((p) => (p < CYBER_PHRASES.length - 1 ? p + 1 : p));
    }, 280);
    return () => clearInterval(interval);
  }, []);

  const clampedProgress = Math.min(progress, 100);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[10000] flex flex-col items-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glowing progress bar */}
      <div className="w-full h-1 bg-muted/30 relative overflow-hidden">
        <motion.div
          className="h-full"
          style={{
            width: `${clampedProgress}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6), hsl(var(--primary)))",
            boxShadow: "0 0 16px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.4)",
          }}
          transition={{ duration: 0.1 }}
        />
        {/* Scanner line */}
        <motion.div
          className="absolute top-0 h-full w-24"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
          }}
          animate={{ left: ["-10%", "110%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Status text */}
      <motion.div
        className="mt-2 px-5 py-2 rounded-b-lg border border-t-0 border-primary/20 bg-background/90 backdrop-blur-md"
        style={{
          boxShadow: "0 4px 24px hsl(var(--primary) / 0.15), inset 0 0 20px hsl(var(--primary) / 0.03)",
        }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="font-mono text-sm font-bold tracking-wider text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]">
            {CYBER_PHRASES[phraseIdx]}
          </span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {Math.floor(clampedProgress)}%
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const queryClient = useQueryClient();
  const { toggleMobile } = useShell();
  const [rocketVisible, setRocketVisible] = useState(false);

  const { data: isSuperAdmin } = useQuery({
    queryKey: ["sidebar-is-super-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
  });

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries();
    setRocketVisible(false);
    // Force re-mount by toggling off then on
    setTimeout(() => setRocketVisible(true), 10);
    setTimeout(() => setRocketVisible(false), 1700);
  }, [queryClient]);

  return (
    <>
      <header className="border-b border-border/30 glass-header sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-4 lg:py-5">
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 shrink-0">
                <button
                  onClick={toggleMobile}
                  className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight truncate">{title}</h1>
                  {subtitle && <p className="text-sm text-muted-foreground hidden sm:block mt-1">{subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {actions && (
                  <div className="hidden lg:flex items-center gap-2">
                    {actions}
                  </div>
                )}
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  title="Atualizar dados"
                >
                  <RefreshCw className="h-4.5 w-4.5" />
                </button>
                <ThemeToggle />
                {isSuperAdmin && <AdminRolePreviewBar />}
                <NotificationBell />
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-thin lg:hidden">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      <OverLimitBanner />

      <div className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-[1400px] mx-auto w-full">
          {children}
        </div>
      </div>

      {/* Rocket refresh animation overlay */}
      <AnimatePresence>
        {rocketVisible && (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.32), transparent 68%)" }}
              initial={{ bottom: -100, scale: 0.6, opacity: 0.85 }}
              animate={{ bottom: ["−100px", "40%", "110%"], scale: [0.6, 1.2, 1.8], opacity: [0.85, 0.5, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.span
              className="absolute left-1/2 -translate-x-1/2 text-7xl"
              style={{ filter: "drop-shadow(0 0 24px hsl(var(--primary) / 0.9)) drop-shadow(0 0 50px hsl(var(--primary) / 0.45))" }}
              initial={{ bottom: -120, opacity: 1, scale: 1.05, rotate: -6 }}
              animate={{
                bottom: [-120, window.innerHeight * 0.4, window.innerHeight + 150],
                opacity: [1, 1, 0.9],
                scale: [1.05, 1.2, 0.85],
                rotate: [-6, -2, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 0.61, 0.36, 1], times: [0, 0.35, 1] }}
            >
              🚀
            </motion.span>
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full left-1/2"
                style={{
                  width: 5 + (i % 3),
                  height: 5 + (i % 3),
                  background: `hsl(var(--primary) / ${0.62 - i * 0.045})`,
                  marginLeft: (i % 2 === 0 ? -1 : 1) * (5 + i * 4),
                }}
                initial={{ bottom: -80, opacity: 0.95 }}
                animate={{
                  bottom: [-80, window.innerHeight * 0.2 + i * 25, window.innerHeight * 0.5 + i * 35],
                  opacity: [0.95, 0.7, 0],
                  scale: [0.9, 1.2, 0.15],
                }}
                transition={{ duration: 1.2, delay: 0.05 + i * 0.04, ease: "easeOut" }}
              />
            ))}

            <CyberpunkLoadingBar />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
