import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import {
  Smartphone, Rocket, Users, MessageSquare, Zap, Bot, Webhook, Link2,
  ShieldBan, BarChart2, ArrowLeft, Menu, X, Clock, Play,
  CheckCircle, XCircle, User, LogOut, Mail, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProjectSelector from "@/components/ProjectSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { mockActions } from "@/data/grupozap-mock";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const GZAccounts = lazy(() => import("./grupozap/GZAccounts"));
const GZCampaigns = lazy(() => import("./grupozap/GZCampaigns"));
const GZCampaignDetail = lazy(() => import("./grupozap/GZCampaignDetail"));
const GZGroups = lazy(() => import("./grupozap/GZGroups"));
const GZMessages = lazy(() => import("./grupozap/GZMessages"));
const GZLinks = lazy(() => import("./grupozap/GZLinks"));
const GZActions = lazy(() => import("./grupozap/GZActions"));
const GZAutomations = lazy(() => import("./grupozap/GZAutomations"));
const GZWebhooks = lazy(() => import("./grupozap/GZWebhooks"));
const GZAntiSpam = lazy(() => import("./grupozap/GZAntiSpam"));
const GZLeadScoring = lazy(() => import("./grupozap/GZLeadScoring"));

const navItems = [
  { icon: Smartphone, label: "Contas", path: "accounts" },
  { icon: Rocket, label: "Campanhas", path: "campaigns" },
  { icon: Users, label: "Grupos", path: "groups" },
  { icon: MessageSquare, label: "Mensagens", path: "messages" },
  { icon: Zap, label: "Ações", path: "actions" },
  { icon: Bot, label: "Automações", path: "automations" },
  { icon: Webhook, label: "Webhooks", path: "webhooks" },
  { icon: Link2, label: "Links", path: "links" },
  { icon: ShieldBan, label: "Anti-Spam", path: "anti-spam" },
  { icon: BarChart2, label: "Lead Scoring", path: "lead-scoring" },
];

const actionStatusIcons: Record<string, any> = { scheduled: Clock, queued: Clock, running: Play, completed: CheckCircle, error: XCircle };

function GZSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 rounded-md bg-muted/60 skeleton-shimmer animate-pulse" />
      ))}
    </div>
  );
}

export default function NexusGrupoZap() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pendingActions = mockActions.filter((a) => a.status !== "completed").length;

  const basePath = "/grupozap";
  const currentSub = location.pathname.replace(basePath, "").replace(/^\//, "").split("/")[0] || "accounts";

  const { data: userProfile } = useQuery({
    queryKey: ["gz-user-profile"],
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
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Nexus <span className="gradient-text">GrupoZap</span>
            </span>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map(item => (
              <Link key={item.path} to={`${basePath}/${item.path}`} className={navCls(currentSub === item.path)}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {item.path === "actions" && pendingActions > 0 && (
                  <Badge className="ml-auto h-5 min-w-5 text-[10px] bg-primary/20 text-primary">{pendingActions}</Badge>
                )}
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
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Nexus <span className="gradient-text">GrupoZap</span>
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
            <div className="flex-1" />
            <div className="flex items-center gap-3 ml-auto shrink-0">
              {/* Action queue popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    {pendingActions > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">{pendingActions}</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3 border-b border-border/20"><p className="text-sm font-medium">Fila de Ações</p></div>
                  <div className="max-h-60 overflow-y-auto">
                    {mockActions.map((a) => {
                      const Icon = actionStatusIcons[a.status];
                      return (
                        <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 border-b border-border/10 text-xs">
                          <Icon className={cn("h-3.5 w-3.5", a.status === "completed" ? "text-emerald-400" : a.status === "running" ? "text-purple-400" : a.status === "error" ? "text-red-400" : "text-blue-400")} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{a.type}</p>
                            <p className="text-muted-foreground truncate">{a.scope}</p>
                          </div>
                          <span className="text-muted-foreground shrink-0">{new Date(a.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
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
                    <Link to="/configuracoes?tab=personal" className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors w-full">
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
            <Suspense fallback={<GZSkeleton />}>
              <Routes>
                <Route index element={<Navigate to="accounts" replace />} />
                <Route path="accounts" element={<GZAccounts />} />
                <Route path="campaigns" element={<GZCampaigns />} />
                <Route path="campaigns/:id" element={<GZCampaignDetail />} />
                <Route path="groups" element={<GZGroups />} />
                <Route path="messages" element={<GZMessages />} />
                <Route path="actions" element={<GZActions />} />
                <Route path="automations" element={<GZAutomations />} />
                <Route path="webhooks" element={<GZWebhooks />} />
                <Route path="links" element={<GZLinks />} />
                <Route path="anti-spam" element={<GZAntiSpam />} />
                <Route path="lead-scoring" element={<GZLeadScoring />} />
                <Route path="*" element={<Navigate to="accounts" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
