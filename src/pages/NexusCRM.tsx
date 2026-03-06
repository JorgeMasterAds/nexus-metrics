import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import {
  LayoutDashboard, Target, Kanban, Users, Building2, CheckSquare,
  FileText, Settings, ArrowLeft, Search, Bell, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/hooks/useAccount";

const NCRMDashboard = lazy(() => import("./nexus-crm/NCRMDashboard"));
const NCRMLeads = lazy(() => import("./nexus-crm/NCRMLeads"));
const NCRMLeadDetail = lazy(() => import("./nexus-crm/NCRMLeadDetail"));
const NCRMDeals = lazy(() => import("./nexus-crm/NCRMDeals"));
const NCRMDealDetail = lazy(() => import("./nexus-crm/NCRMDealDetail"));
const NCRMContacts = lazy(() => import("./nexus-crm/NCRMContacts"));
const NCRMCompanies = lazy(() => import("./nexus-crm/NCRMCompanies"));
const NCRMTasks = lazy(() => import("./nexus-crm/NCRMTasks"));
const NCRMNotes = lazy(() => import("./nexus-crm/NCRMNotes"));
const NCRMSettings = lazy(() => import("./nexus-crm/NCRMSettings"));

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "" },
  { icon: Target, label: "Leads", path: "leads" },
  { icon: Kanban, label: "Pipeline", path: "deals" },
  { icon: Users, label: "Contatos", path: "contacts" },
  { icon: Building2, label: "Empresas", path: "companies" },
  { icon: CheckSquare, label: "Tarefas", path: "tasks" },
  { icon: FileText, label: "Notas", path: "notes" },
  { icon: Settings, label: "Configurações", path: "settings" },
];

function CRMSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 rounded-md bg-accent animate-pulse" />
      ))}
    </div>
  );
}

export default function NexusCRM() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = "/crm";
  const currentSub = location.pathname.replace(basePath, "").replace(/^\//, "").split("/")[0] || "";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "w-[240px] flex-shrink-0 flex flex-col border-r border-border/30 transition-all duration-200",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:shadow-2xl",
          !mobileOpen && "max-lg:-translate-x-full"
        )}
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-2.5 border-b border-border/30">
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-primary">
            <Kanban className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Nexus <span className="text-primary">CRM</span>
            </span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = currentSub === item.path;
            return (
              <Link
                key={item.path}
                to={`${basePath}/${item.path}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150",
                  isActive
                    ? "text-primary font-medium bg-primary/10 border-l-[3px] border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border-l-[3px] border-transparent"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back link */}
        <div className="p-3 border-t border-border/30">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full rounded-md hover:bg-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao Nexus Metrics
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border/30 flex-shrink-0 bg-background">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar leads, deals, contatos..."
              className="w-full h-9 pl-9 pr-3 rounded-md text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow bg-secondary border border-border/30 focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button className="p-2 rounded-md hover:bg-accent transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Suspense fallback={<CRMSkeleton />}>
            <Routes>
              <Route index element={<NCRMDashboard />} />
              <Route path="leads" element={<NCRMLeads />} />
              <Route path="leads/:id" element={<NCRMLeadDetail />} />
              <Route path="deals" element={<NCRMDeals />} />
              <Route path="deals/:id" element={<NCRMDealDetail />} />
              <Route path="contacts" element={<NCRMContacts />} />
              <Route path="companies" element={<NCRMCompanies />} />
              <Route path="tasks" element={<NCRMTasks />} />
              <Route path="notes" element={<NCRMNotes />} />
              <Route path="settings" element={<NCRMSettings />} />
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
