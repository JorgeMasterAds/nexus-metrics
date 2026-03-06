import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import {
  LayoutDashboard, Target, Kanban, Users, Building2, CheckSquare,
  FileText, Settings, ArrowLeft, Search, Bell, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/hooks/useAccount";
import { Input } from "@/components/ui/input";

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
        <div key={i} className="h-20 rounded-md bg-[#1C1C1C] animate-pulse" />
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
    <div className="flex h-[calc(100vh-0px)] overflow-hidden" style={{ background: "#0A0A0A" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "w-[240px] flex-shrink-0 flex flex-col border-r transition-all duration-200",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:shadow-2xl",
          !mobileOpen && "max-lg:-translate-x-full"
        )}
        style={{ background: "#0D0D0D", borderColor: "#2A2A2A" }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-2.5 border-b" style={{ borderColor: "#2A2A2A" }}>
          <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: "#E5191A" }}>
            <Kanban className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#F5F5F5] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Nexus <span style={{ color: "#E5191A" }}>CRM</span>
            </span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4 text-[#A0A0A0]" />
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
                    ? "text-[#E5191A] font-medium"
                    : "text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#1C1C1C]"
                )}
                style={isActive ? {
                  background: "rgba(229, 25, 26, 0.08)",
                  borderLeft: "3px solid #E5191A",
                } : { borderLeft: "3px solid transparent" }}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back link */}
        <div className="p-3 border-t" style={{ borderColor: "#2A2A2A" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors w-full rounded-md hover:bg-[#1C1C1C]"
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
        <header
          className="h-14 flex items-center gap-3 px-4 border-b flex-shrink-0"
          style={{ background: "#0A0A0A", borderColor: "#2A2A2A" }}
        >
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-[#A0A0A0]" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
            <input
              placeholder="Buscar leads, deals, contatos..."
              className="w-full h-9 pl-9 pr-3 rounded-md text-sm text-[#F5F5F5] placeholder:text-[#555] outline-none transition-shadow"
              style={{
                background: "#111",
                border: "1px solid #2A2A2A",
              }}
              onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(229,25,26,0.4)"}
              onBlur={(e) => e.target.style.boxShadow = "none"}
            />
          </div>
          <button className="p-2 rounded-md hover:bg-[#1C1C1C] transition-colors">
            <Bell className="h-4 w-4 text-[#A0A0A0]" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "#0A0A0A" }}>
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
