import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Target, Kanban, Users, Building2, CheckSquare,
  FileText, Settings, ArrowLeft, Search, Menu, X, ChevronRight, User, LogOut, Mail
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useCRM2 } from "@/hooks/useCRM2";
import ProjectSelector from "@/components/ProjectSelector";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

function CRMCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const crm = useCRM2();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (!q.trim()) return { leads: [], deals: [], contacts: [], orgs: [] };
    const query = q.toLowerCase();
    return {
      leads: crm.leads.filter((l: any) => `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(query)).slice(0, 5),
      deals: crm.deals.filter((d: any) => (d.title || "").toLowerCase().includes(query)).slice(0, 5),
      contacts: crm.contacts.filter((c: any) => `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(query)).slice(0, 5),
      orgs: crm.organizations.filter((o: any) => (o.name || "").toLowerCase().includes(query)).slice(0, 5),
    };
  }, [q, crm.leads, crm.deals, crm.contacts, crm.organizations]);

  const hasResults = results.leads.length + results.deals.length + results.contacts.length + results.orgs.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-lg overflow-hidden">
        <Command className="border-0">
          <CommandInput placeholder="Buscar leads, deals, contatos..." value={q} onValueChange={setQ} />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            {results.leads.length > 0 && (
              <CommandGroup heading="Leads">
                {results.leads.map((l: any) => (
                  <CommandItem key={l.id} onSelect={() => { navigate(`/crm/leads/${l.id}`); onClose(); }}>
                    <Target className="h-3.5 w-3.5 mr-2 text-primary" />
                    {l.first_name} {l.last_name} {l.email && <span className="text-muted-foreground ml-1">— {l.email}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.deals.length > 0 && (
              <CommandGroup heading="Deals">
                {results.deals.map((d: any) => (
                  <CommandItem key={d.id} onSelect={() => { navigate(`/crm/deals/${d.id}`); onClose(); }}>
                    <Kanban className="h-3.5 w-3.5 mr-2 text-success" />
                    {d.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.contacts.length > 0 && (
              <CommandGroup heading="Contatos">
                {results.contacts.map((c: any) => (
                  <CommandItem key={c.id} onSelect={() => { navigate(`/crm/contacts`); onClose(); }}>
                    <Users className="h-3.5 w-3.5 mr-2 text-info" />
                    {c.first_name} {c.last_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.orgs.length > 0 && (
              <CommandGroup heading="Empresas">
                {results.orgs.map((o: any) => (
                  <CommandItem key={o.id} onSelect={() => { navigate(`/crm/companies`); onClose(); }}>
                    <Building2 className="h-3.5 w-3.5 mr-2 text-warning" />
                    {o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export default function NexusCRM() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ["crm-user-profile"],
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

  const basePath = "/crm";
  const currentSub = location.pathname.replace(basePath, "").replace(/^\//, "").split("/")[0] || "";

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 border border-transparent",
      active
        ? "sidebar-active-gradient text-primary-foreground font-medium shadow-md"
        : "text-sidebar-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-sidebar-accent-foreground hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)]"
    );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col border-r border-border/30 glass-sidebar sticky top-0 h-screen overflow-y-auto overflow-x-hidden transition-all duration-150 z-30">
          <div className="p-4 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md flex items-center justify-center bg-primary shadow-[0_0_12px_2px_hsla(0,90%,55%,0.25)]">
              <Kanban className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Nexus <span className="gradient-text">CRM</span>
            </span>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map(item => (
              <Link key={item.path} to={`${basePath}/${item.path}`} className={navCls(currentSub === item.path)}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-primary/10 transition-colors w-full rounded-lg"> 
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Nexus Metrics
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
                  <Link key={item.path} to={`${basePath}/${item.path}`} onClick={() => setMobileOpen(false)} className={navCls(currentSub === item.path)}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="pt-3 border-t border-sidebar-border">
                <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors w-full rounded-lg"> 
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Nexus Metrics
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border/30 flex-shrink-0 glass-header">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setCmdOpen(true)}
              className="relative flex-1 max-w-md flex items-center gap-2 h-9 pl-9 pr-3 rounded-lg text-sm text-muted-foreground border border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <span>Buscar leads, deals, contatos...</span>
              <kbd className="ml-auto hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">⌘K</kbd>
            </button>
            <div className="flex items-center gap-3 ml-auto shrink-0">
              <ThemeToggle />
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

      <CRMCommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
