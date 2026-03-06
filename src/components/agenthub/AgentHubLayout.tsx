import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Bot, BookOpen, MessageSquare, Link2, BarChart3,
  Settings, ArrowLeft, Menu, X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/ai-agents" },
  { icon: Bot, label: "Agentes", path: "/ai-agents/agents" },
  { icon: BookOpen, label: "Knowledge Base", path: "/ai-agents/knowledge" },
  { icon: MessageSquare, label: "Conversas", path: "/ai-agents/conversations" },
  { icon: Link2, label: "Canais", path: "/ai-agents/channels" },
  { icon: BarChart3, label: "Analytics", path: "/ai-agents/analytics" },
  { icon: Settings, label: "Configurações", path: "/ai-agents/settings" },
];

export default function AgentHubLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={navCls(isActive(item.path))}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Back to app */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-primary/10 transition-colors w-full rounded-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao Nexus Metrics
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col dark-gradient">
      <div className="flex flex-1 relative z-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col border-r border-border/30 glass-sidebar sticky top-0 h-screen overflow-y-auto overflow-x-hidden transition-all duration-150 z-30">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 flex flex-col w-[270px] h-full border-r border-border/30 p-4 overflow-y-auto glass-sidebar">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center px-4 md:px-6 shrink-0 border-b border-border/30 glass-header">
            <button className="lg:hidden mr-2 p-2 rounded-lg hover:bg-primary/10" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1" />
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
