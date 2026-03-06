import { ReactNode, useState, useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
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

function RefreshStatusBar() {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + 3 + Math.random() * 4;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !done) setDone(true);
  }, [progress, done]);

  const { t } = useI18n();
  const label = done ? t("updated") : t("loading_bar");

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[10000]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      {/* Progress bar - taller, with text inside */}
      <div className="w-full h-7 bg-primary/20 relative overflow-hidden shadow-[0_0_16px_hsl(var(--primary)/0.5)]">
        <motion.div
          className="h-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8),0_0_24px_hsl(var(--primary)/0.4)]"
          style={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.08 }}
        />
        {!done && (
          <motion.div
            className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent"
            animate={{ left: ["-10%", "110%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {/* Label inside the bar */}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {!done ? (
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          ) : (
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          )}
          <span className="font-mono text-xs font-semibold tracking-widest text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {label}
          </span>
        </div>
      </div>
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
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { toggleMobile } = useShell();
  const [rocketKey, setRocketKey] = useState(0);
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
    setRocketKey((k) => k + 1);
    requestAnimationFrame(() => {
      setRocketVisible(true);
      setTimeout(() => setRocketVisible(false), 1800);
    });
  }, [queryClient]);

  return (
    <>
      <header className="border-b border-border/20 glass-header sticky top-0 z-40 backdrop-blur-xl">
        <div className="px-4 lg:px-8 py-3.5 lg:py-4">
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 shrink-0">
                <button
                  onClick={toggleMobile}
                  className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">{title}</h1>
                  {subtitle && <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">{subtitle}</p>}
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
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)] transition-all border border-transparent hover:border-primary/30"
                  title={t("refresh_data")}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <ThemeToggle />
                {isSuperAdmin && <AdminRolePreviewBar />}
                <NotificationBell />
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2 mt-2.5 overflow-x-auto scrollbar-thin lg:hidden" style={{ background: 'transparent', backdropFilter: 'none' }}>
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
      <AnimatePresence mode="wait">
        {rocketVisible && (
          <motion.div
            key={rocketKey}
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
              animate={{ bottom: ["-100px", "40%", "110%"], scale: [0.6, 1.2, 1.8], opacity: [0.85, 0.5, 0] }}
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

            <RefreshStatusBar />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
