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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Agent<span className="text-primary">Hub</span>
            </span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Plataforma de Agentes de IA</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150",
                active
                  ? "text-primary font-medium bg-primary/10 border-l-[3px] border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border-l-[3px] border-transparent"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to app */}
      <div className="p-3 border-t border-border/30">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full rounded-md"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao Nexus Metrics
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "w-[240px] flex-shrink-0 flex flex-col border-r border-border/30 transition-all duration-200",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:shadow-2xl",
          !mobileOpen && "max-lg:-translate-x-full"
        )}
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center px-4 md:px-6 shrink-0 border-b border-border/30 bg-background">
          <button className="lg:hidden mr-2 p-2 rounded-md hover:bg-accent" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
