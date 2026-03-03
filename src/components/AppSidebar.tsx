import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart3, GitBranch, Settings, LogOut, FileBarChart,
  HelpCircle, Plug, ChevronDown, Users, LayoutGrid, List,
  CreditCard, FolderOpen, Layers, User, Shield, ScrollText, Webhook,
  Sparkles, Bot, Smartphone, Home, Gift, Key, ClipboardList, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ProjectSelector from "@/components/ProjectSelector";
import { useAccount } from "@/hooks/useAccount";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRolePreview } from "@/hooks/useRolePreview";
import { useProjectRole } from "@/hooks/useProjectRole";

const mainNavItems = [
  { icon: Home, label: "Dashboard", path: "/" },
];

const trafficSubItems = [
  { icon: Megaphone, label: "Meta Ads", path: "/meta-ads-report" },
  { icon: Plug, label: "Google Ads", path: "/google-ads-report", disabled: true },
  { icon: BarChart3, label: "GA4 - Google Analytics", path: "/ga4-report" },
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

interface AppSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(location.pathname === "/settings");
  const [integrationsOpen, setIntegrationsOpen] = useState(location.pathname === "/integrations");
  const [crmOpen, setCrmOpen] = useState(location.pathname === "/crm");
  const [trafficOpen, setTrafficOpen] = useState(
    location.pathname === "/meta-ads-report" || location.pathname === "/ga4-report" || location.pathname === "/google-ads-report"
  );

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

  const handleLogout = async () => {
    localStorage.removeItem("activeAccountId");
    localStorage.removeItem("activeProjectId");
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const isSettingsActive = location.pathname === "/settings";
  const isIntegrationsActive = location.pathname === "/integrations";

  const navCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all border border-transparent",
      active
        ? "sidebar-active-gradient text-primary-foreground font-medium shadow-md"
        : "text-sidebar-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-sidebar-accent-foreground hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
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
        {mainNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onClose} className={navCls(active)}>
              <item.icon className={cn(iconCls, active && "text-primary-foreground")} />
              {item.label}
            </Link>
          );
        })}

        {/* Planejamento */}
        {!isViewerMode && (
          <Link to="/report-templates" onClick={onClose} className={navCls(location.pathname === "/report-templates")}>
            <ScrollText className={cn(iconCls, location.pathname === "/report-templates" && "text-primary-foreground")} />
            Planejamento
          </Link>
        )}

        {/* Relatórios */}
        <Link to="/dashboard" onClick={onClose} className={navCls(location.pathname === "/dashboard")}>
          <BarChart3 className={cn(iconCls, location.pathname === "/dashboard" && "text-primary-foreground")} />
          Relatórios
        </Link>

        {afterReportItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onClose} className={navCls(active)}>
              <item.icon className={cn(iconCls, active && "text-primary-foreground")} />
              {item.label}
            </Link>
          );
        })}

        {/* Tráfego */}
        {(() => {
          const isTrafficActive = ["/meta-ads-report", "/ga4-report", "/google-ads-report"].includes(location.pathname);
          return (
            <div>
              <div className={cn(
                "flex items-center rounded-lg overflow-hidden border border-transparent transition-all",
                isTrafficActive ? "sidebar-active-gradient shadow-md" : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
              )}>
                <button
                  onClick={() => { navigate("/meta-ads-report"); onClose(); }}
                  className={cn(
                    "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                    isTrafficActive ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Megaphone className={cn(iconCls, isTrafficActive && "text-primary-foreground")} />
                  Tráfego
                </button>
                <button
                  onClick={() => setTrafficOpen(!trafficOpen)}
                  className={cn("px-2 py-2 text-sm transition-all", isTrafficActive ? "text-primary-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground")}
                >
                  <ChevronDown className={cn(iconCls, "transition-transform", trafficOpen && "rotate-180")} />
                </button>
              </div>
              {trafficOpen && (
                <div className="ml-4 mt-1 space-y-0 border-l border-sidebar-border pl-3">
                  {trafficSubItems.map((item: any) => {
                    const active = location.pathname === item.path;
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

        {!isViewerMode && (<>
        {/* Integrações */}
        <div>
          <div className={cn(
            "flex items-center rounded-lg overflow-hidden border border-transparent transition-all",
            isIntegrationsActive ? "sidebar-active-gradient shadow-md" : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
          )}>
            <button
              onClick={() => { navigate("/integrations?tab=webhooks"); onClose(); }}
              className={cn(
                "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                isIntegrationsActive ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
              )}
            >
              <Plug className={cn(iconCls, isIntegrationsActive && "text-primary-foreground")} />
              Integrações
            </button>
            <button
              onClick={() => setIntegrationsOpen(!integrationsOpen)}
              className={cn("px-2 py-2 text-sm transition-all", isIntegrationsActive ? "text-primary-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground")}
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
                  <Link key={item.path} to={item.path} onClick={onClose} className={subCls(active)}>
                    <item.icon className={cn(subIconCls, active && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads */}
        <div>
          <div className={cn(
            "flex items-center rounded-lg overflow-hidden border border-transparent transition-all",
            location.pathname === "/crm" ? "sidebar-active-gradient shadow-md" : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
          )}>
            <button
              onClick={() => { navigate("/crm"); onClose(); }}
              className={cn(
                "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                location.pathname === "/crm" ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
              )}
            >
              <Users className={cn(iconCls, location.pathname === "/crm" && "text-primary-foreground")} />
              Leads
            </button>
            <button
              onClick={() => setCrmOpen(!crmOpen)}
              className={cn("px-2 py-2 text-sm transition-all", location.pathname === "/crm" ? "text-primary-foreground" : "text-sidebar-foreground hover:text-sidebar-accent-foreground")}
            >
              <ChevronDown className={cn(iconCls, "transition-transform", crmOpen && "rotate-180")} />
            </button>
          </div>
          {crmOpen && (
            <div className="ml-4 mt-1 space-y-0 border-l border-sidebar-border pl-3">
              <Link to="/crm" onClick={onClose} className={subCls(location.pathname === "/crm" && !new URLSearchParams(location.search).get("tab"))}>
                <LayoutGrid className={cn(subIconCls, location.pathname === "/crm" && !new URLSearchParams(location.search).get("tab") && "text-primary")} />
                CRM (Kanban)
              </Link>
              <Link to="/crm?tab=leads" onClick={onClose} className={subCls(location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "leads")}>
                <List className={cn(subIconCls, location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "leads" && "text-primary")} />
                Lista de Leads
              </Link>
              <Link to="/crm?tab=tags" onClick={onClose} className={subCls(location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "tags")}>
                <Layers className={cn(subIconCls, location.pathname === "/crm" && new URLSearchParams(location.search).get("tab") === "tags" && "text-primary")} />
                Tags
              </Link>
            </div>
          )}
        </div>

        {/* Pesquisas & Quiz - Beta */}
        {isSuperAdmin && !isPreviewActive ? (
          <Link to="/surveys" onClick={onClose} className={navCls(location.pathname === "/surveys")}>
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
          <Link to="/automacoes" onClick={onClose} className={navCls(location.pathname === "/automacoes")}>
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
          <Link to="/ai-agents" onClick={onClose} className={navCls(location.pathname === "/ai-agents")}>
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
        <Link to="/resources" onClick={onClose} className={navCls(location.pathname === "/resources")}>
          <Layers className={cn(iconCls, location.pathname === "/resources" && "text-primary-foreground")} />
          Recursos
        </Link>

        {/* Dispositivos */}
        <Link to="/devices" onClick={onClose} className={navCls(location.pathname === "/devices")}>
          <Smartphone className={cn(iconCls, location.pathname === "/devices" && "text-primary-foreground")} />
          Dispositivos
        </Link>

        {/* Configurações */}
        <div>
          <div className={cn(
            "flex items-center rounded-lg overflow-hidden",
            isSettingsActive && "sidebar-active-gradient shadow-md"
          )}>
            <button
              onClick={() => { navigate("/settings?tab=personal"); onClose(); }}
              className={cn(
                "flex items-center gap-3 flex-1 px-3 py-2 text-sm transition-all",
                isSettingsActive ? "text-primary-foreground font-medium" : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className={cn(iconCls, isSettingsActive && "text-primary-foreground")} />
              Configurações
            </button>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={cn("px-2 py-2 text-sm transition-all", isSettingsActive ? "text-primary-foreground" : "text-sidebar-foreground hover:border hover:border-primary/50 hover:text-sidebar-accent-foreground")}
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
        <Link to="/novidades" onClick={onClose} className={navCls(location.pathname === "/novidades")}>
          <Sparkles className={cn(iconCls, location.pathname === "/novidades" && "text-primary-foreground")} />
          Novidades
        </Link>

        {/* Administração */}
        {isSuperAdmin && !isPreviewActive && (
          <Link to="/admin" onClick={onClose} className={navCls(location.pathname === "/admin")}>
            <Shield className={cn(iconCls, location.pathname === "/admin" && "text-primary-foreground")} />
            Administração
          </Link>
        )}

        {/* Suporte */}
        <Link to="/support" onClick={onClose} className={navCls(location.pathname === "/support")}>
          <HelpCircle className={cn(iconCls, location.pathname === "/support" && "text-primary-foreground")} />
          Suporte
        </Link>
        </>)}
      </nav>

      <div className="border-t border-sidebar-border pt-4 mt-4 space-y-3">
        {userProfile && (
          <Link
            to="/settings?tab=personal"
            onClick={onClose}
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

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[270px] border-r border-border/30 p-4 sticky top-0 h-screen overflow-y-auto glass-sidebar">
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative flex flex-col w-[270px] h-full border-r border-border/30 p-4 overflow-y-auto glass-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
