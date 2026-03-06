import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import {
  LayoutDashboard, Target, Kanban, Users, Building2, CheckSquare,
  FileText, Settings, ArrowLeft, Search, Bell, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div key={i} className="h-20 rounded-md bg-muted/60 skeleton-shimmer animate-pulse" />
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

  const navCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 border border-transparent",
      active
        ? "sidebar-active-gradient text-primary-foreground font-medium shadow-md"
        : "text-sidebar-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-sidebar-accent-foreground hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
    );

  return (
    <div className="min-h-screen flex flex-col dark-gradient">
      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex w-[240px] flex-shrink-0 flex-col border-r border-border/30 glass-sidebar sticky top-0 h-screen overflow-y-auto overflow-x-hidden transition-all duration-150 z-30",
          )}
        >
          {/* Logo */}
          <div className="p-4 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md flex items-center justify-center bg-primary shadow-[0_0_12px_2px_hsla(0,90%,55%,0.25)]">
              <Kanban className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Nexus <span className="gradient-text">CRM</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={`${basePath}/${item.path}`}
                className={navCls(currentSub === item.path)}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Back link */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-primary/10 transition-colors w-full rounded-lg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Nexus Metrics
            </button>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 flex flex-col w-[270px] h-full border-r border-border/30 p-4 overflow-y-auto glass-sidebar">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-8 w-8 rounded-md flex items-center justify-center bg-primary">
                  <Kanban className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Nexus <span className="gradient-text">CRM</span>
                </span>
                <button className="ml-auto" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={`${basePath}/${item.path}`}
                    onClick={() => setMobileOpen(false)}
                    className={navCls(currentSub === item.path)}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="pt-3 border-t border-sidebar-border">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors w-full rounded-lg"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao Nexus Metrics
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Header */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border/30 flex-shrink-0 glass-header">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar leads, deals, contatos..."
                className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow"
              />
            </div>
            <button className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)] transition-all">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
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
    </div>
  );
}
