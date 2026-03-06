import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart3, GitBranch, Settings, LogOut, FileBarChart,
  HelpCircle, Plug, ChevronDown, Users, LayoutGrid, List, Kanban, Target,
  CreditCard, FolderOpen, Layers, User, Shield, ScrollText, Webhook,
  Sparkles, Bot, Smartphone, Home, Gift, Key, ClipboardList, Megaphone, Bug, Pin, PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ProjectSelector from "@/components/ProjectSelector";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRolePreview } from "@/hooks/useRolePreview";
import { useProjectRole } from "@/hooks/useProjectRole";

const mainNavItems = [
  { icon: Home, label: "Dashboard", path: "/" },
];

const trafficSubItems = [
  { icon: Megaphone, label: "Meta Ads", path: "/meta-ads-report" },
  { icon: Plug, label: "Google Ads", path: "/google-ads-report" },
  { icon: BarChart3, label: "GA4 - Google Analytics", path: "/ga4-report" },
];

const afterReportItems = [
  { icon: FileBarChart, label: "Relatório UTM", path: "/utm-report" },
  { icon: GitBranch, label: "Smart Links", path: "/smart-links" },
];

const integrationSubItems = [
  { icon: Webhook, label: "Webhooks", path: "/integrations?tab=webhooks" },
  { icon: FileBarChart, label: "Formulários", path: "/integrations?tab=forms" },
  { icon: Plug, label: "Meta Ads", path: "/integrations?tab=meta-ads" },
  { icon: Plug, label: "Google", path: "/integrations?tab=google" },
  { icon: ScrollText, label: "Webhook Logs", path: "/integrations?tab=logs" },
];

const settingsSubItems = [
  { icon: Settings, label: "Dados Pessoais", path: "/settings?tab=personal" },
  { icon: FolderOpen, label: "Projetos", path: "/settings?tab=projects" },
  { icon: Users, label: "Equipe", path: "/settings?tab=team" },
  { icon: CreditCard, label: "Assinatura", path: "/settings?tab=subscription" },
  { icon: Gift, label: "Indicações e Afiliados", path: "/settings?tab=referrals" },
  { icon: Key, label: "APIs", path: "/settings?tab=apis" },
];

interface AppSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(location.pathname === "/settings");
  const [integrationsOpen, setIntegrationsOpen] = useState(location.pathname === "/integrations");
  const [crmOpen, setCrmOpen] = useState(location.pathname.startsWith("/crm") || location.pathname === "/crm-leads");
  const [trafficOpen, setTrafficOpen] = useState(
    location.pathname === "/meta-ads-report" || location.pathname === "/ga4-report" || location.pathname === "/google-ads-report"
  );
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(() => localStorage.getItem("sidebar-pinned") === "true");

  const { activeAccountId } = useAccount();
  const { activeProject } = useActiveProject();
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
    staleTime: 10 * 60_000,
  });

  const { data: isSuperAdmin } = useQuery({
    queryKey: ["sidebar-is-super-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
    staleTime: 10 * 60_000,
  });

  const effectiveRole = isPreviewActive ? previewRole : realRole;
  const isViewerMode = effectiveRole === "viewer";
  const expanded = hovered || pinned;

  const handleLogout = async () => {
    localStorage.removeItem("activeAccountId");
    localStorage.removeItem("activeProjectId");
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const isSettingsActive = location.pathname === "/settings";
  const isIntegrationsActive = location.pathname === "/integrations";

  const iconCls = "h-4 w-4 shrink-0";
  const subIconCls = "h-3.5 w-3.5 shrink-0";

  const navCls = (active: boolean, isExp = expanded) =>
    cn(
      "flex items-center gap-3 rounded-lg text-sm transition-all border border-transparent whitespace-nowrap overflow-hidden",
      isExp ? "px-3 py-2" : "px-0 py-2 justify-center",
      active
        ? "sidebar-active-gradient text-primary-foreground font-medium shadow-md"
        : "text-sidebar-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-sidebar-accent-foreground hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
    );

  const subCls = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-2 py-1 text-xs transition-all border-b whitespace-nowrap overflow-hidden",
      active
        ? "border-primary text-foreground font-medium"
        : "border-transparent text-sidebar-foreground hover:text-sidebar-accent-foreground"
    );

  /** Renders a nav icon with tooltip when collapsed */
  const NavIcon = ({ icon: Icon, label, active, className }: { icon: any; label: string; active?: boolean; className?: string }) => {
    if (expanded) return <Icon className={cn(iconCls, className)} />;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span><Icon className={cn(iconCls, className)} /></span>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    );
  };

  const CollapsedProjectIcon = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex justify-center mb-4">
          <div className="h-8 w-8 rounded-lg bg-muted/50 border border-border/30 overflow-hidden flex items-center justify-center shrink-0">
            {activeProject?.avatar_url ? (
              <img src={activeProject.avatar_url} alt={activeProject.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground">
                {activeProject?.name?.charAt(0)?.toUpperCase() || "P"}
              </span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">{activeProject?.name || "Projeto"}</TooltipContent>
    </Tooltip>
  );

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const show = isMobile || expanded;
    const isExpanded = isMobile || expanded;

    return (
      <>
        <div className={cn("flex items-center mb-5", isExpanded ? "px-3 justify-between" : "justify-center px-0")}>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-primary shrink-0" />
            {show && (
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                Nexus <span className="gradient-text">Metrics</span>
              </span>
            )}
          </Link>
          {show && !isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    const next = !pinned;
                    setPinned(next);
                    localStorage.setItem("sidebar-pinned", String(next));
                  }}
                  className={cn(
                    "p-1.5 rounded-md transition-colors shrink-0",
                    pinned
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {pinned ? t("unpin_sidebar") : t("pin_sidebar")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {show ? (
          <div className="px-3 mb-5">
            <ProjectSelector />
          </div>
        ) : (
          <CollapsedProjectIcon />
        )}

        <nav className="flex-1 space-y-0.5">
          {mainNavItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={onClose} className={navCls(active, isExpanded)}>
                <NavIcon icon={item.icon} label={item.label} active={active} className={active ? "text-primary-foreground" : undefined} />
                {show && item.label}
              </Link>
            );
          })}

          {/* Relatórios */}
          <Link to="/dashboard" onClick={onClose} className={navCls(location.pathname === "/dashboard", isExpanded)}>
            <NavIcon icon={BarChart3} label={t("reports")} className={location.pathname === "/dashboard" ? "text-primary-foreground" : undefined} />
            {show && t("reports")}
          </Link>

          {/* Relatório UTM */}
          <Link to="/utm-report" onClick={onClose} className={navCls(location.pathname === "/utm-report", isExpanded)}>
            <NavIcon icon={FileBarChart} label={t("utm_report")} className={location.pathname === "/utm-report" ? "text-primary-foreground" : undefined} />
            {show && t("utm_report")}
          </Link>

          {/* Tráfego */}
          {(() => {
            const isTrafficActive = ["/meta-ads-report", "/ga4-report", "/google-ads-report"].includes(location.pathname);
            return (
              <div>
              <div className={cn(
                  "flex items-center rounded-lg overflow-hidden border border-transparent transition-all",
                  !show && "justify-center",
                  isTrafficActive ? "sidebar-active-gradient shadow-md" : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
                )}>
                  <button
                    onClick={() => { setTrafficOpen(true); setPinned(true); navigate("/meta-ads-report"); onClose(); }}
                    className={cn(
                      "flex items-center gap-3 flex-1 py-2 text-sm transition-all whitespace-nowrap overflow-hidden",
                      show ? "px-3" : "px-0 justify-center",
                      isTrafficActive ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <NavIcon icon={Megaphone} label={t("traffic")} className={isTrafficActive ? "text-primary-foreground" : undefined} />
                    {show && t("traffic")}
                  </button>
                  {show && (
                    <button
                      onClick={() => { setTrafficOpen(!trafficOpen); setPinned(true); }}
                      className={cn("px-2 py-2 text-sm transition-all", isTrafficActive ? "text-primary-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground")}
                    >
                      <ChevronDown className={cn(iconCls, "transition-transform", trafficOpen && "rotate-180")} />
                    </button>
                  )}
                </div>
                {show && trafficOpen && (
                  <div className="ml-7 mt-0.5 space-y-0 border-l border-sidebar-border pl-3">
                    {trafficSubItems.map((item: any) => {
                      const active = location.pathname === item.path;
                      if (item.disabled) {
                        return (
                          <div key={item.path} className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-muted-foreground/50 cursor-not-allowed whitespace-nowrap">
                            <item.icon className={subIconCls} />
                            {item.label}
                            <span className="ml-auto text-[9px] bg-muted/50 px-1 py-0.5 rounded">{t("coming_soon")}</span>
                          </div>
                        );
                      }
                      return (
                        <Link key={item.path} to={item.path} onClick={onClose} className={subCls(active)}>
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

          {/* Smart Links */}
          <Link to="/smart-links" onClick={onClose} className={navCls(location.pathname === "/smart-links", isExpanded)}>
            <NavIcon icon={GitBranch} label={t("smart_links")} className={location.pathname === "/smart-links" ? "text-primary-foreground" : undefined} />
            {show && t("smart_links")}
          </Link>

          {/* Planejamento */}
          {!isViewerMode && (
            <Link to="/report-templates" onClick={onClose} className={navCls(location.pathname === "/report-templates", isExpanded)}>
              <NavIcon icon={ScrollText} label={t("planning")} className={location.pathname === "/report-templates" ? "text-primary-foreground" : undefined} />
              {show && t("planning")}
            </Link>
          )}

          {!isViewerMode && (<>
          {/* Integrações */}
          <div>
            <div className={cn(
              "flex items-center rounded-lg overflow-hidden border border-transparent transition-all",
              !show && "justify-center",
              isIntegrationsActive ? "sidebar-active-gradient shadow-md" : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
            )}>
              <button
                onClick={() => { setIntegrationsOpen(true); setPinned(true); navigate("/integrations?tab=webhooks"); onClose(); }}
                className={cn(
                  "flex items-center gap-3 flex-1 py-2 text-sm transition-all whitespace-nowrap overflow-hidden",
                  show ? "px-3" : "px-0 justify-center",
                  isIntegrationsActive ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                )}
              >
                <NavIcon icon={Plug} label={t("integrations")} className={isIntegrationsActive ? "text-primary-foreground" : undefined} />
                {show && t("integrations")}
              </button>
              {show && (
                <button
                  onClick={() => { setIntegrationsOpen(!integrationsOpen); setPinned(true); }}
                  className={cn("px-2 py-2 text-sm transition-all", isIntegrationsActive ? "text-primary-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground")}
                >
                  <ChevronDown className={cn(iconCls, "transition-transform", integrationsOpen && "rotate-180")} />
                </button>
              )}
            </div>
            {show && integrationsOpen && (
              <div className="ml-7 mt-0.5 space-y-0 border-l border-sidebar-border pl-3">
                {integrationSubItems.map((item: any) => {
                  const tabParam = new URL(item.path, "http://x").searchParams.get("tab");
                  const currentTab = new URLSearchParams(location.search).get("tab") || "webhooks";
                  const active = isIntegrationsActive && currentTab === tabParam;
                  if (item.disabled) {
                    return (
                      <div key={item.path} className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-muted-foreground/50 cursor-not-allowed whitespace-nowrap">
                        <item.icon className={subIconCls} />
                        {item.label}
                        <span className="ml-auto text-[9px] bg-muted/50 px-1 py-0.5 rounded">em breve</span>
                      </div>
                    );
                  }
                  return (
                    <Link key={item.path} to={item.path} onClick={onClose} className={subCls(active)}>
                      <item.icon className={cn(subIconCls, active && "text-primary")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leads e CRM */}
          {isSuperAdmin && !isPreviewActive ? (
            <div>
              <div className={cn(
                "flex items-center rounded-lg overflow-hidden border border-transparent transition-all",
                !show && "justify-center",
                location.pathname.startsWith("/crm") || location.pathname === "/crm-leads" ? "sidebar-active-gradient shadow-md" : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
              )}>
                <button
                  onClick={() => { setCrmOpen(true); setPinned(true); navigate("/crm-leads?tab=leads"); onClose(); }}
                  className={cn(
                    "flex items-center gap-3 flex-1 py-2 text-sm transition-all whitespace-nowrap overflow-hidden",
                    show ? "px-3" : "px-0 justify-center",
                    location.pathname.startsWith("/crm") || location.pathname === "/crm-leads" ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                  )}
                >
                  <NavIcon icon={Users} label={t("leads_crm")} className={location.pathname.startsWith("/crm") || location.pathname === "/crm-leads" ? "text-primary-foreground" : undefined} />
                  {show && <>{t("leads_crm")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded mr-1">{t("beta")}</span></>}
                </button>
                {show && (
                  <button
                    onClick={() => { setCrmOpen(!crmOpen); setPinned(true); }}
                    className={cn("px-2 py-2 text-sm transition-all", location.pathname.startsWith("/crm") || location.pathname === "/crm-leads" ? "text-primary-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground")}
                  >
                    <ChevronDown className={cn(iconCls, "transition-transform", crmOpen && "rotate-180")} />
                  </button>
                )}
              </div>
              {show && crmOpen && (
                <div className="ml-7 mt-0.5 space-y-0 border-l border-sidebar-border pl-3">
                  {[
                    { icon: Target, label: "Lista de Leads", path: "/crm-leads?tab=leads" },
                    { icon: LayoutGrid, label: "Nexus CRM", path: "/crm" },
                  ].map((item) => {
                    const active = item.path.startsWith("/crm-leads") ? location.pathname === "/crm-leads" : item.path === "/crm" ? location.pathname === "/crm" : location.pathname.startsWith(item.path);
                    return (
                      <Link key={item.path} to={item.path} onClick={onClose} className={subCls(active)}>
                        <item.icon className={cn(subIconCls, active && "text-primary")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-3 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed whitespace-nowrap overflow-hidden", isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center")}>
                  <Users className={iconCls} />
                  {show && <>{t("leads_crm")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("coming_soon")}</span></>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Em breve</TooltipContent>
            </Tooltip>
          )}

          {/* Pesquisas & Quiz - Beta */}
          {isSuperAdmin && !isPreviewActive ? (
            <Link to="/surveys" onClick={onClose} className={navCls(location.pathname === "/surveys", isExpanded)}>
              <NavIcon icon={ClipboardList} label={t("surveys_quiz")} className={location.pathname === "/surveys" ? "text-primary-foreground" : undefined} />
              {show && <>{t("surveys_quiz")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("beta")}</span></>}
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-3 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed whitespace-nowrap overflow-hidden", isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center")}>
                  <ClipboardList className={iconCls} />
                  {show && <>{t("surveys_quiz")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("coming_soon")}</span></>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{t("coming_soon")}</TooltipContent>
            </Tooltip>
          )}

          {/* Automações - Beta */}
          {isSuperAdmin && !isPreviewActive ? (
            <Link to="/automacoes" onClick={onClose} className={navCls(location.pathname === "/automacoes", isExpanded)}>
              <NavIcon icon={Sparkles} label={t("automations")} className={location.pathname === "/automacoes" ? "text-primary-foreground" : undefined} />
              {show && <>{t("automations")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("beta")}</span></>}
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-3 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed whitespace-nowrap overflow-hidden", isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center")}>
                  <Sparkles className={iconCls} />
                  {show && <>{t("automations")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("coming_soon")}</span></>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{t("coming_soon")}</TooltipContent>
            </Tooltip>
          )}

          {/* Agente de IA - Beta */}
          {isSuperAdmin && !isPreviewActive ? (
            <Link to="/ai-agents" onClick={onClose} className={navCls(location.pathname === "/ai-agents", isExpanded)}>
              <NavIcon icon={Bot} label={t("ai_agent")} className={location.pathname === "/ai-agents" ? "text-primary-foreground" : undefined} />
              {show && <>{t("ai_agent")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("beta")}</span></>}
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-3 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed whitespace-nowrap overflow-hidden", isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center")}>
                  <Bot className={iconCls} />
                  {show && <>{t("ai_agent")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("coming_soon")}</span></>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{t("coming_soon")}</TooltipContent>
            </Tooltip>
          )}

          {/* Recursos - Beta */}
          {isSuperAdmin && !isPreviewActive ? (
            <Link to="/resources" onClick={onClose} className={navCls(location.pathname === "/resources", isExpanded)}>
              <NavIcon icon={Layers} label={t("resources")} className={location.pathname === "/resources" ? "text-primary-foreground" : undefined} />
              {show && <>{t("resources")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("beta")}</span></>}
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-3 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed whitespace-nowrap overflow-hidden", isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center")}>
                  <Layers className={iconCls} />
                  {show && <>{t("resources")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("coming_soon")}</span></>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{t("coming_soon")}</TooltipContent>
            </Tooltip>
          )}

          {/* Dispositivos - Beta */}
          {isSuperAdmin && !isPreviewActive ? (
            <Link to="/devices" onClick={onClose} className={navCls(location.pathname === "/devices", isExpanded)}>
              <NavIcon icon={Smartphone} label={t("devices")} className={location.pathname === "/devices" ? "text-primary-foreground" : undefined} />
              {show && <>{t("devices")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("beta")}</span></>}
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-3 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed whitespace-nowrap overflow-hidden", isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center")}>
                  <Smartphone className={iconCls} />
                  {show && <>{t("devices")}<span className="ml-auto text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t("coming_soon")}</span></>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{t("coming_soon")}</TooltipContent>
            </Tooltip>
          )}

          {/* Configurações */}
          <div>
            <div className={cn(
              "flex items-center rounded-lg overflow-hidden",
              !show && "justify-center",
              isSettingsActive && "sidebar-active-gradient shadow-md"
            )}>
              <button
                onClick={() => { setSettingsOpen(true); setPinned(true); navigate("/settings?tab=personal"); onClose(); }}
                className={cn(
                  "flex items-center gap-3 flex-1 py-2 text-sm transition-all whitespace-nowrap overflow-hidden",
                  show ? "px-3" : "px-0 justify-center",
                  isSettingsActive ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <NavIcon icon={Settings} label={t("settings")} className={isSettingsActive ? "text-primary-foreground" : undefined} />
                {show && t("settings")}
              </button>
              {show && (
                <button
                  onClick={() => { setSettingsOpen(!settingsOpen); setPinned(true); }}
                  className={cn("px-2 py-2 text-sm transition-all", isSettingsActive ? "text-primary-foreground" : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground")}
                >
                  <ChevronDown className={cn(iconCls, "transition-transform", settingsOpen && "rotate-180")} />
                </button>
              )}
            </div>
            {show && settingsOpen && (
              <div className="ml-7 mt-0.5 space-y-0 border-l border-sidebar-border pl-3">
                {settingsSubItems.map((item) => {
                  const tabParam = new URL(item.path, "http://x").searchParams.get("tab");
                  const currentTab = new URLSearchParams(location.search).get("tab") || "personal";
                  const active = isSettingsActive && currentTab === tabParam;
                  return (
                    <Link key={item.path} to={item.path} onClick={onClose} className={subCls(active)}>
                      <item.icon className={cn(subIconCls, active && "text-primary")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Novidades */}
          <Link to="/novidades" onClick={onClose} className={navCls(location.pathname === "/novidades", isExpanded)}>
            <NavIcon icon={Sparkles} label={t("news")} className={location.pathname === "/novidades" ? "text-primary-foreground" : undefined} />
            {show && t("news")}
          </Link>

          {/* Administração */}
          {isSuperAdmin && !isPreviewActive && (
            <Link to="/admin" onClick={onClose} className={navCls(location.pathname === "/admin", isExpanded)}>
              <NavIcon icon={Shield} label={t("admin")} className={location.pathname === "/admin" ? "text-primary-foreground" : undefined} />
              {show && t("admin")}
            </Link>
          )}

          {/* Saúde do Sistema - dentro de Admin */}
          {isSuperAdmin && !isPreviewActive && (
            <Link to="/admin?tab=health" onClick={onClose} className={navCls(location.pathname === "/admin" && location.search.includes("tab=health"), isExpanded)}>
              <NavIcon icon={Activity} label={t("system_health")} className={location.pathname === "/admin" && location.search.includes("tab=health") ? "text-primary-foreground" : undefined} />
              {show && t("system_health")}
            </Link>
          )}

          {/* Suporte */}
          <Link to="/support" onClick={onClose} className={navCls(location.pathname === "/support", isExpanded)}>
            <NavIcon icon={HelpCircle} label={t("support")} className={location.pathname === "/support" ? "text-primary-foreground" : undefined} />
            {show && t("support")}
          </Link>

          {/* Reportar Bug */}
          <Link to="/bug-report" onClick={onClose} className={navCls(location.pathname === "/bug-report", isExpanded)}>
            <NavIcon icon={Bug} label={t("report_bug")} className={location.pathname === "/bug-report" ? "text-primary-foreground" : undefined} />
            {show && t("report_bug")}
          </Link>
          </>)}
        </nav>

        <div className="border-t border-sidebar-border pt-4 mt-4 space-y-3">
          {userProfile && (
            <Link
              to="/settings?tab=personal"
              onClick={onClose}
              className={cn("flex items-center gap-3 rounded-lg hover:border hover:border-primary/50 transition-colors py-2", show ? "px-3" : "px-0 justify-center")}
            >
              <div className={cn("rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0", show ? "h-9 w-9" : "h-7 w-7")}>
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4.5 w-4.5 text-muted-foreground" />
                )}
              </div>
              {show && (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{userProfile.full_name || t("user")}</p>
                  <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                </div>
              )}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className={cn("flex items-center gap-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground transition-colors w-full whitespace-nowrap overflow-hidden", show ? "px-3" : "px-0 justify-center")}
          >
            <LogOut className={iconCls} />
            {show && t("logout")}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden lg:flex flex-col border-r border-border/30 sticky top-0 h-screen overflow-y-auto overflow-x-hidden glass-sidebar transition-[width,padding] duration-150 ease-out z-30 will-change-[width]",
          expanded ? "w-[270px] p-4" : "w-[52px] px-1.5 py-4"
        )}
      >
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 flex flex-col w-[270px] h-full border-r border-border/30 p-4 overflow-y-auto glass-sidebar">
            <SidebarContent isMobile />
          </aside>
        </div>
      )}
    </>
  );
}
