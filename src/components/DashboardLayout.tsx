import { ReactNode, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  GitBranch,
  Settings,
  LogOut,
  Menu,
  FileBarChart,
  HelpCircle,
  Plug,
  ChevronDown,
  Users,
  LayoutGrid,
  List,
  Building2,
  CreditCard,
  FolderOpen,
  Layers,
  User,
  Shield,
  ScrollText,
  Webhook,
  Sparkles,
  Bot,
  Smartphone,
  Home,
  Gift,
  Key,
  RefreshCw,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ProjectSelector from "@/components/ProjectSelector";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationBell from "@/components/NotificationBell";
import OverLimitBanner from "@/components/OverLimitBanner";
import AdminRolePreviewBar from "@/components/AdminRolePreviewBar";
import { useRolePreview } from "@/hooks/useRolePreview";
import { useProjectRole } from "@/hooks/useProjectRole";
import ThemeToggle from "@/components/ThemeToggle";

const mainNavItems = [
  { icon: Home, label: "Dashboard", path: "/" },
];

const reportSubItems = [
  { icon: Activity, label: "Relatório", path: "/dashboard" },
  { icon: ScrollText, label: "Planejamento", path: "/report-templates" },
  { icon: Megaphone, label: "Meta Ads", path: "/meta-ads-report" },
  { icon: BarChart3, label: "GA4", path: "/ga4-report" },
];

const afterReportItems = [
  { icon: FileBarChart, label: "Relatório UTM", path: "/utm-report" },
  { icon: GitBranch, label: "Smart Links", path: "/smart-links" },
];

const integrationSubItems = [
  { icon: Webhook, label: "Webhooks", path: "/integrations?tab=webhooks" },
  { icon: FileBarChart, label: "Formulários", path: "/integrations?tab=forms" },
  { icon: ScrollText, label: "Webhook Logs", path: "/integrations?tab=logs" },
  { icon: Plug, label: "Meta Ads", path: "/integrations?tab=meta-ads" },
  { icon: Plug, label: "Google Ads", path: "/integrations?tab=google-ads", disabled: true },
];

const settingsSubItems = [
  { icon: Settings, label: "Dados Pessoais", path: "/settings?tab=personal" },
  { icon: FolderOpen, label: "Projetos", path: "/settings?tab=projects" },
  { icon: Users, label: "Equipe", path: "/settings?tab=team" },
  { icon: CreditCard, label: "Assinatura", path: "/settings?tab=subscription" },
  { icon: Gift, label: "Indicações e Afiliados", path: "/settings?tab=referrals" },
  { icon: Key, label: "APIs", path: "/settings?tab=apis" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(location.pathname === "/settings");
  const [integrationsOpen, setIntegrationsOpen] = useState(location.pathname === "/integrations");
  const [crmOpen, setCrmOpen] = useState(location.pathname === "/crm");
  const [reportsOpen, setReportsOpen] = useState(location.pathname === "/dashboard" || location.pathname === "/report-templates" || location.pathname === "/meta-ads-report" || location.pathname === "/ga4-report");
  const [rocketVisible, setRocketVisible] = useState(false);

  const { activeAccountId } = useAccount();
  const { previewRole, isPreviewActive } = useRolePreview();
  const { role: realRole } = useProjectRole();

  const { data: userProfile } = useQuery({
    queryKey: ["sidebar-user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return { email: user.email, ...profile };
    },
  });

  const { data: isSuperAdmin } = useQuery({
    queryKey: ["sidebar-is-super-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
  });

  const effectiveRole = isPreviewActive ? previewRole : realRole;
  const isViewerMode = effectiveRole === "viewer";
  const showPreviewBar = !!isSuperAdmin;

  const handleLogout = async () => {
    localStorage.removeItem("activeAccountId");
    localStorage.removeItem("activeProjectId");
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const isSettingsActive = location.pathname === "/settings";
  const isIntegrationsActive = location.pathname === "/integrations";

  // Reusable nav link styles
  const navCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
      active
        ? "sidebar-active-gradient text-primary-foreground font-medium shadow-md"
        : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
    );

  const subCls = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-2 py-1.5 text-xs transition-all border-b",
      active
        ? "border-primary text-foreground font-medium"
        : "border-transparent text-sidebar-foreground hover:text-sidebar-accent-foreground"
    );

  const iconCls = "h-4 w-4";
  const subIconCls = "h-3.5 w-3.5";

  const SidebarContent = () => (
    <>
      <Link to="/dashboard" className="flex items-center justify-center gap-2.5 px-3 mb-5">
        <Activity className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">
          Nexus <span className="gradient-text">Metrics</span>
        </span>
      </Link>

      <div className="px-3 mb-5">
        <ProjectSelector />
      </div>

      <nav className="flex-1 space-y-0.5">
        {(isViewerMode
          ? mainNavItems
          : mainNavItems
        ).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={navCls(active)}
            >
              <item.icon className={cn(iconCls, active && "text-primary-foreground")} />
              {item.label}
            </Link>
          );
        })}

        {/* Relatórios with submenu */}
        {(() => {
          const isReportsActive = ["/dashboard", "/report-templates", "/meta-ads-report", "/ga4-report"].includes(location.pathname);
          const visibleItems = isViewerMode
            ? reportSubItems.filter(i => i.path === "/dashboard")
            : reportSubItems;
          return (
            <div>
              <div className={cn(
                "flex items-center rounded-lg overflow-hidden",
                isReportsActive && "sidebar-active-gradient shadow-md"
              )}>
                <button
                  onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                    isReportsActive
                      ? "text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <BarChart3 className={cn(iconCls, isReportsActive && "text-primary-foreground")} />
                  Relatórios
                </button>
                <button
                  onClick={() => setReportsOpen(!reportsOpen)}
                  className={cn(
                    "px-2 py-2 text-sm transition-all",
                    isReportsActive
                      ? "text-primary-foreground"
                      : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <ChevronDown className={cn(iconCls, "transition-transform", reportsOpen && "rotate-180")} />
                </button>
              </div>
              {reportsOpen && (
                <div className="ml-4 mt-1 space-y-0 border-l border-sidebar-border pl-3">
                  {visibleItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={subCls(active)}
                      >
                        <item.icon className={cn(subIconCls, active && "text-primary")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {afterReportItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={navCls(active)}
            >
              <item.icon className={cn(iconCls, active && "text-primary-foreground")} />
              {item.label}
            </Link>
          );
        })}

        {!isViewerMode && (<>
        {/* Integrações with submenu */}
        <div>
        <div className={cn(
            "flex items-center rounded-lg overflow-hidden",
            isIntegrationsActive && "sidebar-active-gradient shadow-md"
          )}>
            <button
              onClick={() => { navigate("/integrations?tab=webhooks"); setMobileOpen(false); }}
              className={cn(
                "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                isIntegrationsActive
                  ? "text-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Plug className={cn(iconCls, isIntegrationsActive && "text-primary-foreground")} />
              Integrações
            </button>
            <button
              onClick={() => setIntegrationsOpen(!integrationsOpen)}
              className={cn(
                "px-2 py-2 text-sm transition-all",
                isIntegrationsActive
                  ? "text-primary-foreground"
                  : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <ChevronDown className={cn(iconCls, "transition-transform", integrationsOpen && "rotate-180")} />
            </button>
          </div>
          {integrationsOpen && (
            <div className="ml-4 mt-1 space-y-0 border-l border-sidebar-border pl-3">
              {integrationSubItems.map((item: any) => {
                const tabParam = new URL(item.path, "http://x").searchParams.get("tab");
                const currentTab = new URLSearchParams(location.search).get("tab") || "webhooks";
                const active = isIntegrationsActive && currentTab === tabParam;
                if (item.disabled) {
                  return (
                    <div key={item.path} className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-muted-foreground/50 cursor-not-allowed">
                      <item.icon className={subIconCls} />
                      {item.label}
                      <span className="ml-auto text-[9px] bg-muted/50 px-1 py-0.5 rounded">em breve</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={subCls(active)}
                  >
                    <item.icon className={cn(subIconCls, active && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Meta Ads and Google Ads are now sub-items of Integrações - removed from here */}


        {/* Leads with submenu */}
        <div>
          <div className={cn(
              "flex items-center rounded-lg overflow-hidden",
              location.pathname === "/crm" && "sidebar-active-gradient shadow-md"
            )}>
            <button
              onClick={() => { navigate("/crm"); setMobileOpen(false); }}
              className={cn(
                "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                location.pathname === "/crm"
                  ? "text-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Users className={cn(iconCls, location.pathname === "/crm" && "text-primary-foreground")} />
              Leads
            </button>
            <button
              onClick={() => setCrmOpen(!crmOpen)}
              className={cn(
                "px-2 py-2 text-sm transition-all",
                location.pathname === "/crm"
                  ? "text-primary-foreground"
                  : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <ChevronDown className={cn(iconCls, "transition-transform", crmOpen && "rotate-180")} />
            </button>
          </div>
          {crmOpen && (
            <div className="ml-4 mt-1 space-y-0 border-l border-sidebar-border pl-3">
              <Link
                to="/crm"
                onClick={() => setMobileOpen(false)}
                className={subCls(location.pathname === "/crm" && !new URLSearchParams(location.search).get("tab"))}
              >
                <LayoutGrid className={cn(subIconCls, location.pathname === "/crm" && !new URLSearchParams(location.search).get("tab") && "text-primary")} />
                CRM (Kanban)
              </Link>
              <Link
                to="/crm?tab=leads"
                onClick={() => setMobileOpen(false)}
                className={subCls(location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "leads")}
              >
                <List className={cn(subIconCls, location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "leads" && "text-primary")} />
                Lista de Leads
              </Link>
              <Link
                to="/crm?tab=tags"
                onClick={() => setMobileOpen(false)}
                className={subCls(location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "tags")}
              >
                <Layers className={cn(subIconCls, location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "tags" && "text-primary")} />
                Tags
              </Link>
            </div>
          )}
        </div>

        {/* Pesquisas & Quiz - Beta */}
        {isSuperAdmin && !isPreviewActive ? (
          <Link
            to="/surveys"
            onClick={() => setMobileOpen(false)}
            className={navCls(location.pathname === "/surveys")}
          >
            <ClipboardList className={cn(iconCls, location.pathname === "/surveys" && "text-primary-foreground")} />
            Pesquisas & Quiz
            <span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">beta</span>
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed">
                <ClipboardList className={iconCls} />
                Pesquisas & Quiz
                <span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">em breve</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Em breve</TooltipContent>
          </Tooltip>
        )}

        {/* Automações - Beta */}
        {isSuperAdmin && !isPreviewActive ? (
          <Link
            to="/automacoes"
            onClick={() => setMobileOpen(false)}
            className={navCls(location.pathname === "/automacoes")}
          >
            <Sparkles className={cn(iconCls, location.pathname === "/automacoes" && "text-primary-foreground")} />
            Automações
            <span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">beta</span>
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed">
                <Sparkles className={iconCls} />
                Automações
                <span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">em breve</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Em breve</TooltipContent>
          </Tooltip>
        )}

        {/* Agente de IA - Beta */}
        {isSuperAdmin && !isPreviewActive ? (
          <Link
            to="/ai-agents"
            onClick={() => setMobileOpen(false)}
            className={navCls(location.pathname === "/ai-agents")}
          >
            <Bot className={cn(iconCls, location.pathname === "/ai-agents" && "text-primary-foreground")} />
            Agente de IA
            <span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">beta</span>
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed">
                <Bot className={iconCls} />
                Agente de IA
                <span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">em breve</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Em breve</TooltipContent>
          </Tooltip>
        )}

        {/* Recursos */}
        <Link
          to="/resources"
          onClick={() => setMobileOpen(false)}
          className={navCls(location.pathname === "/resources")}
        >
          <Layers className={cn(iconCls, location.pathname === "/resources" && "text-primary-foreground")} />
          Recursos
        </Link>

        {/* Dispositivos */}
        <Link
          to="/devices"
          onClick={() => setMobileOpen(false)}
          className={navCls(location.pathname === "/devices")}
        >
          <Smartphone className={cn(iconCls, location.pathname === "/devices" && "text-primary-foreground")} />
          Dispositivos
        </Link>

        {/* Configurações with submenu */}
        <div>
          <div className={cn(
              "flex items-center rounded-lg overflow-hidden",
              isSettingsActive && "sidebar-active-gradient shadow-md"
            )}>
            <button
              onClick={() => { navigate("/settings?tab=personal"); setMobileOpen(false); }}
              className={cn(
                "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                isSettingsActive
                  ? "text-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className={cn(iconCls, isSettingsActive && "text-primary-foreground")} />
              Configurações
            </button>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={cn(
                "px-2 py-2 text-sm transition-all",
                isSettingsActive
                  ? "text-primary-foreground"
                  : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <ChevronDown className={cn(iconCls, "transition-transform", settingsOpen && "rotate-180")} />
            </button>
          </div>
          {settingsOpen && (
            <div className="ml-4 mt-1 space-y-0 border-l border-sidebar-border pl-3">
              {settingsSubItems.map((item) => {
                const tabParam = new URL(item.path, "http://x").searchParams.get("tab");
                const currentTab = new URLSearchParams(location.search).get("tab") || "personal";
                const active = isSettingsActive && currentTab === tabParam;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={subCls(active)}
                  >
                    <item.icon className={cn(subIconCls, active && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Novidades - link to page */}
        <Link
          to="/novidades"
          onClick={() => setMobileOpen(false)}
          className={navCls(location.pathname === "/novidades")}
        >
          <Sparkles className={cn(iconCls, location.pathname === "/novidades" && "text-primary-foreground")} />
          Novidades
        </Link>

        {/* Admin - only for super admins in real mode */}
        {isSuperAdmin && !isPreviewActive && (
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={navCls(location.pathname === "/admin")}
          >
            <Shield className={cn(iconCls, location.pathname === "/admin" && "text-primary-foreground")} />
            Administração
          </Link>
        )}

        <Link
          to="/support"
          onClick={() => setMobileOpen(false)}
          className={navCls(location.pathname === "/support")}
        >
          <HelpCircle className={cn(iconCls, location.pathname === "/support" && "text-primary-foreground")} />
          Suporte
        </Link>
        </>)}
      </nav>

      <div className="border-t border-sidebar-border pt-4 mt-4 space-y-3">
        {userProfile && (
          <Link
            to="/settings?tab=personal"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 rounded-lg hover:border hover:border-primary/50 transition-colors py-2"
          >
            <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
              {userProfile.avatar_url ? (
                <img src={userProfile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4.5 w-4.5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userProfile.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
            </div>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          <LogOut className={iconCls} />
          Sair
        </button>
      </div>
    </>
  );

  const RefreshButton = useCallback(() => (
    <button
      onClick={() => {
        void queryClient.invalidateQueries();
        setRocketVisible(true);
        setTimeout(() => setRocketVisible(false), 1700);
      }}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      title="Atualizar dados"
    >
      <RefreshCw className="h-4.5 w-4.5" />
    </button>
  ), [queryClient]);

  return (
    <div className="min-h-screen flex flex-col dark-gradient">
      <div className="flex flex-1">
      <aside className="hidden lg:flex flex-col w-[270px] border-r border-border/30 p-4 sticky top-0 h-screen overflow-y-auto glass-sidebar">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-[270px] h-full border-r border-border/30 p-4 overflow-y-auto glass-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="border-b border-border/30 glass-header sticky top-0 z-40">
          <div className="px-4 lg:px-8 py-4 lg:py-5">
            <div className="max-w-[1400px] mx-auto w-full">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                  <button
                    onClick={() => setMobileOpen(true)}
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
                  <RefreshButton />
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
      </main>
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
            {/* Glow trail */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.32), transparent 68%)" }}
              initial={{ bottom: -100, scale: 0.6, opacity: 0.85 }}
              animate={{ bottom: ["−100px", "40%", "110%"], scale: [0.6, 1.2, 1.8], opacity: [0.85, 0.5, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Rocket emoji */}
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

            {/* Particles trailing behind */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
