import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Bot, BookOpen, MessageSquare, Link2, BarChart3,
  Settings, ArrowLeft, Menu, X, ChevronRight, User, LogOut, Mail,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProjectSelector from "@/components/ProjectSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/ai-agents" },
  { icon: Bot, label: "Agentes", path: "/ai-agents/agents" },
  { icon: BookOpen, label: "Knowledge Base", path: "/ai-agents/knowledge" },
  { icon: MessageSquare, label: "Conversas", path: "/ai-agents/conversations" },
  { icon: Link2, label: "Canais", path: "/ai-agents/channels" },
  { icon: BarChart3, label: "Analytics", path: "/ai-agents/analytics" },
  { icon: Settings, label: "Configurações", path: "/ai-agents/settings" },
];

const pathLabels: Record<string, string> = {
  "/ai-agents": "Dashboard",
  "/ai-agents/agents": "Agentes",
  "/ai-agents/agents/new": "Novo Agente",
  "/ai-agents/knowledge": "Knowledge Base",
  "/ai-agents/conversations": "Conversas",
  "/ai-agents/channels": "Canais",
  "/ai-agents/analytics": "Analytics",
  "/ai-agents/settings": "Configurações",
};

export default function AgentHubLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ["hub-user-profile"],
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

  const isActive = (path: string) => {
    if (path === "/ai-agents") return location.pathname === "/ai-agents";
    return location.pathname.startsWith(path);
  };

  const navCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 border border-transparent",
      active
        ? "sidebar-active-gradient text-primary-foreground font-medium shadow-md"
        : "text-sidebar-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-sidebar-accent-foreground hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
    );

  // Build breadcrumb
  const buildBreadcrumb = () => {
    const segments: { label: string; path: string }[] = [{ label: "AgentHub", path: "/ai-agents" }];
    const pathname = location.pathname;

    if (pathname !== "/ai-agents") {
      // Find matching nav item
      const matchedNav = navItems.find(n => n.path !== "/ai-agents" && pathname.startsWith(n.path));
      if (matchedNav) {
        segments.push({ label: matchedNav.label, path: matchedNav.path });
      }

      // Check for detail pages (e.g., /ai-agents/agents/:id)
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length >= 3 && parts[1] === "agents" && parts[2] !== "new") {
        // It's a detail page, the nav item label will suffice
      }
    }

    return segments;
  };

  const breadcrumb = buildBreadcrumb();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-md flex items-center justify-center bg-primary shadow-[0_0_12px_2px_hsla(0,90%,55%,0.25)]">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Agent<span className="gradient-text">Hub</span>
        </span>
        <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <p className="px-4 text-[10px] text-muted-foreground -mt-2 mb-3">Plataforma de Agentes de IA</p>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={navCls(isActive(item.path))}>
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button onClick={() => navigate("/home")} className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-primary/10 transition-colors w-full rounded-lg">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Nexus Metrics
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col dark-gradient">
      <div className="flex flex-1 relative z-10">
        <aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col border-r border-border/30 glass-sidebar sticky top-0 h-screen overflow-y-auto overflow-x-hidden transition-all duration-150 z-30">
          <SidebarContent />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 flex flex-col w-[270px] h-full border-r border-border/30 p-4 overflow-y-auto glass-sidebar">
              <SidebarContent />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-14 flex items-center px-4 md:px-6 shrink-0 border-b border-border/30 glass-header">
            <button className="lg:hidden mr-2 p-2 rounded-lg hover:bg-primary/10" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <nav className="flex items-center gap-1.5 text-sm">
              {breadcrumb.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  {i < breadcrumb.length - 1 ? (
                    <Link to={s.path} className="text-muted-foreground hover:text-foreground transition-colors">{s.label}</Link>
                  ) : (
                    <span className="text-foreground font-medium">{s.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="w-[200px]">
                <ProjectSelector />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                    <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{userProfile?.full_name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3" />{userProfile?.email}</p>
                    </div>
                  </div>
                  <div className="border-t border-border pt-2 space-y-1">
                    <Link to="/settings?tab=personal" className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors w-full">
                      <Settings className="h-3.5 w-3.5" /> Configurações
                    </Link>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sair
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
