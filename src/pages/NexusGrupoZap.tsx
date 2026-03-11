import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import {
  Smartphone, Rocket, Users, MessageSquare, Zap, Bot, Webhook, Link2,
  ShieldBan, BarChart2, ArrowLeft, Menu, X, Activity, Clock, Play,
  CheckCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProjectSelector from "@/components/ProjectSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { mockActions } from "@/data/grupozap-mock";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

const actionStatusIcons = { scheduled: Clock, queued: Clock, running: Play, completed: CheckCircle, error: XCircle };

function GZSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-fade-in">
      <div className="h-6 w-40 rounded-md bg-muted/60 skeleton-shimmer" />
      <div className="h-4 w-64 rounded-md bg-muted/40 skeleton-shimmer" />
      <div className="grid grid-cols-3 gap-4 mt-6">{[0,1,2].map(i => <div key={i} className="h-28 rounded-xl bg-muted/30 skeleton-shimmer" />)}</div>
    </div>
  );
}

export default function NexusGrupoZap() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pendingActions = mockActions.filter((a) => a.status !== "completed").length;

  const currentPath = location.pathname.replace("/grupozap", "").replace(/^\//, "") || "accounts";
  const basePath = currentPath.split("/")[0];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] border-r border-border/30 sticky top-0 h-screen overflow-y-auto glass-sidebar p-4">
        <Link to="/home" className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold">Nexus <span className="gradient-text">Metrics</span></span>
        </Link>
        <Link to="/grupozap" className="flex items-center gap-2 mb-5 px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">GrupoZap</span>
        </Link>
        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => {
            const isActive = basePath === item.path;
            return (
              <Link
                key={item.path}
                to={`/grupozap/${item.path}`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "sidebar-active-gradient text-primary-foreground font-medium shadow-md"
                    : "text-sidebar-foreground hover:bg-primary/10"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.path === "actions" && pendingActions > 0 && (
                  <Badge className="ml-auto h-5 min-w-5 text-[10px] bg-primary/20 text-primary">{pendingActions}</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/30 pt-3 mt-3">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-xs justify-start" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Nexus
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 flex flex-col w-[260px] h-full border-r border-border/30 p-4 overflow-y-auto glass-sidebar">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold">GrupoZap</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <nav className="flex-1 space-y-0.5">
              {navItems.map((item) => {
                const isActive = basePath === item.path;
                return (
                  <Link key={item.path} to={`/grupozap/${item.path}`} onClick={() => setMobileOpen(false)}
                    className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all", isActive ? "sidebar-active-gradient text-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-primary/10")}>
                    <item.icon className="h-4 w-4" /><span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/30 px-4 py-2.5 glass-sidebar">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></Button>
            <div className="hidden lg:block w-48"><ProjectSelector /></div>
          </div>
          <div className="flex items-center gap-2">
            {/* Action queue popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Zap className="h-4 w-4" />
                  {pendingActions > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">{pendingActions}</span>}
                </Button>
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
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
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
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
