import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { AccountProvider, useAccount } from "@/hooks/useAccount";
import { I18nProvider } from "@/lib/i18n";

import { RolePreviewProvider, useRolePreview } from "@/hooks/useRolePreview";
import { ThemeProvider } from "@/hooks/useTheme";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import SupportChatWidget from "@/components/SupportChatWidget";
import CreateProjectScreen from "./components/CreateProjectScreen";
import { ProjectProvider, useProject } from "./hooks/useProject";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";

// ── Lazy-loaded pages ──
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SmartLinks = lazy(() => import("./pages/SmartLinks"));
const Settings = lazy(() => import("./pages/Settings"));
const UtmReport = lazy(() => import("./pages/UtmReport"));
const UtmGeneratorPage = lazy(() => import("./pages/UtmGeneratorPage"));
const NexusCRM = lazy(() => import("./pages/NexusCRM"));
const CRMLeads = lazy(() => import("./pages/CRM"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Support = lazy(() => import("./pages/Support"));
const WebhookLogs = lazy(() => import("./pages/WebhookLogs"));
const ReportTemplates = lazy(() => import("./pages/ReportTemplates"));
const MetaAdsReport = lazy(() => import("./pages/MetaAdsReport"));
const GA4Report = lazy(() => import("./pages/GA4Report"));
const GoogleAdsReport = lazy(() => import("./pages/GoogleAdsReport"));
const BugReport = lazy(() => import("./pages/BugReport"));
const Resources = lazy(() => import("./pages/Resources"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicSmartLinkRedirect = lazy(() => import("./pages/PublicSmartLinkRedirect"));
const Novidades = lazy(() => import("./pages/Novidades"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const Devices = lazy(() => import("./pages/Devices"));
const Surveys = lazy(() => import("./pages/Surveys"));
const PublicSurvey = lazy(() => import("./pages/PublicSurvey"));
const EmbedSurvey = lazy(() => import("./pages/EmbedSurvey"));
const PublicView = lazy(() => import("./pages/PublicView"));
const Automations = lazy(() => import("./pages/Automations"));
const NexusAutomacoes = lazy(() => import("./pages/NexusAutomacoes"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const DataDeletionStatus = lazy(() => import("./pages/DataDeletionStatus"));
const GoogleOAuthCallback = lazy(() => import("./pages/GoogleOAuthCallback"));
const BlogIndex = lazy(() => import("./pages/blog/BlogIndex"));
const BlogHotmart = lazy(() => import("./pages/blog/BlogHotmart"));
const BlogKiwify = lazy(() => import("./pages/blog/BlogKiwify"));
const BlogEduzz = lazy(() => import("./pages/blog/BlogEduzz"));
const BlogMonetizze = lazy(() => import("./pages/blog/BlogMonetizze"));
const BlogCakto = lazy(() => import("./pages/blog/BlogCakto"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const Atendimento = lazy(() => import("./pages/Atendimento"));
const NexusGrupoZap = lazy(() => import("./pages/NexusGrupoZap"));
const FormsDashboard = lazy(() => import("./pages/forms/FormsDashboard"));
const FormsTemplates = lazy(() => import("./pages/forms/FormsTemplates"));
const FormsEditor = lazy(() => import("./pages/forms/FormsEditor"));
const FormsResults = lazy(() => import("./pages/forms/FormsResults"));
const FormsShare = lazy(() => import("./pages/forms/FormsShare"));
const NexusForms = lazy(() => import("./pages/NexusForms"));

/** Prefetch core routes during idle time so menu navigation feels instant */
function prefetchCoreRoutes() {
  const coreImports = [
    () => import("./pages/Home"),
    () => import("./pages/Dashboard"),
    () => import("./pages/SmartLinks"),
    () => import("./pages/Settings"),
    () => import("./pages/UtmReport"),
    () => import("./pages/Integrations"),
    () => import("./pages/Support"),
    () => import("./pages/ReportTemplates"),
    () => import("./pages/MetaAdsReport"),
    () => import("./pages/GA4Report"),
    () => import("./pages/GoogleAdsReport"),
  ];
  let idx = 0;
  const loadNext = () => {
    if (idx < coreImports.length) {
      coreImports[idx]().catch(() => {});
      idx++;
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(loadNext, { timeout: 3000 });
      } else {
        setTimeout(loadNext, 200);
      }
    }
  };
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(loadNext, { timeout: 2000 });
  } else {
    setTimeout(loadNext, 1000);
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15 * 60_000, retry: 1, refetchOnWindowFocus: false } },
});

// Session context so layout route can access session
const SessionContext = createContext<Session | null>(null);

/** Content-area skeleton loader matching dark UI */
function ContentLoader({ text: _text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex-1 p-6 space-y-6 animate-fade-in">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-md bg-muted/60 skeleton-shimmer" />
        <div className="h-4 w-64 rounded-md bg-muted/40 skeleton-shimmer" style={{ animationDelay: "0.1s" }} />
      </div>

      {/* Card skeleton */}
      <div className="rounded-xl border border-border/20 bg-card/50 p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted/50 skeleton-shimmer" style={{ animationDelay: "0.15s" }} />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded-md bg-muted/60 skeleton-shimmer" style={{ animationDelay: "0.2s" }} />
          <div className="h-3 w-48 rounded-md bg-muted/40 skeleton-shimmer" style={{ animationDelay: "0.25s" }} />
        </div>
      </div>

      {/* List skeleton */}
      <div className="rounded-xl border border-border/20 bg-card/50 p-5 space-y-1">
        <div className="h-4 w-44 rounded-md bg-muted/60 skeleton-shimmer mb-4" style={{ animationDelay: "0.3s" }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 px-3 rounded-lg border border-border/10" style={{ animationDelay: `${0.35 + i * 0.08}s` }}>
            <div className="h-4 w-4 rounded-full bg-muted/50 skeleton-shimmer" style={{ animationDelay: `${0.35 + i * 0.08}s` }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 rounded-md bg-muted/60 skeleton-shimmer" style={{ animationDelay: `${0.4 + i * 0.08}s` }} />
              <div className="h-3 w-28 rounded-md bg-muted/40 skeleton-shimmer" style={{ animationDelay: `${0.45 + i * 0.08}s` }} />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-muted/40 skeleton-shimmer" style={{ animationDelay: `${0.5 + i * 0.08}s` }} />
              <div className="h-6 w-14 rounded-full bg-muted/40 skeleton-shimmer" style={{ animationDelay: `${0.55 + i * 0.08}s` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Checks account is loaded, then renders AppShell + project check + Outlet */
function RequireAccountContent() {
  const { accounts, isLoading, activeAccount } = useAccount();

  if (isLoading) {
    return <ContentLoader text="Carregando conta..." />;
  }

  if (accounts.length === 0 || !activeAccount) {
    return <ContentLoader text="Preparando seu ambiente..." />;
  }

  return (
    <ProjectProvider>
      <AppShell>
        <RequireProjectContent />
      </AppShell>
    </ProjectProvider>
  );
}

/** Checks project is loaded, then renders Suspense + Outlet */
function RequireProjectContent() {
  const { projects, isLoading } = useProject();

  if (isLoading) {
    return <ContentLoader text="Carregando projetos..." />;
  }

  if (projects.length === 0) {
    return <CreateProjectScreen />;
  }

  return (
    <Suspense fallback={<ContentLoader />}>
      <Outlet />
    </Suspense>
  );
}

/** Layout route for all protected pages — persists sidebar across navigation */
function ProtectedLayout() {
  const session = useContext(SessionContext);
  if (!session) return <Navigate to="/login" replace />;

  return (
    <AccountProvider>
      <RolePreviewProvider>
        <RequireAccountContent />
        <SupportChatWidget />
      </RolePreviewProvider>
    </AccountProvider>
  );
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isPreviewActive } = useRolePreview();

  const { data: isSuperAdmin, isLoading } = useQuery({
    queryKey: ["sidebar-is-super-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
    staleTime: 10 * 60_000,
  });

  if (isLoading) return <ContentLoader text="Verificando acesso..." />;
  if (!isSuperAdmin || isPreviewActive) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isLanding);

  const knownAppRoutes = new Set([
    "auth", "login", "reset-password", "dashboard", "relatorios", "smart-links", "utm", "trafego",
    "planejamento", "integracoes", "configuracoes", "recursos", "admin", "suporte", "novidades",
    "crm", "crm2", "leads", "ai-agents", "dispositivos", "pesquisas", "automacoes", "termos",
    "privacidade", "data-deletion", "data-deletion-status", "not-found", "blog",
    "s", "view", "embed", "reportar-bug", "system-health", "forms", "atendimento", "grupozap",
    "home",
  ]);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const isSmartlinkDomain = window.location.hostname.startsWith("smartlink.");
  const isDeepLinkRoute = pathSegments.length === 1 && pathSegments[0].startsWith("dl-");
  // Support /projectSlug/dl-deepSlug pattern
  const isProjectDeepLinkRoute = pathSegments.length === 2 && pathSegments[1].startsWith("dl-");
  const isPublicSlugRoute = (isSmartlinkDomain && pathSegments.length === 1 && !knownAppRoutes.has(pathSegments[0])) || isDeepLinkRoute || isProjectDeepLinkRoute;

  useEffect(() => {
    if (isLanding) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) prefetchCoreRoutes();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries();
        prefetchCoreRoutes();
      }
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });
    return () => subscription.unsubscribe();
  }, [isLanding]);

  // Landing page rendered by LandingRoute — skip everything here
  if (isLanding) return null;

  if (isPublicSlugRoute) {
    return (
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path="/:slug" element={<PublicSmartLinkRedirect />} />
          <Route path="/:projectSlug/:slug" element={<PublicSmartLinkRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Iniciando...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
          <Route path="/auth" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
          <Route path="/s/:slug" element={<PublicSurvey />} />
          <Route path="/embed/s/:slug" element={<EmbedSurvey />} />
          <Route path="/termos" element={<TermsOfUse />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/data-deletion-status" element={<DataDeletionStatus />} />
          <Route path="/view/:token" element={<PublicView />} />
          <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
          <Route path="/blog/tutoriais" element={<BlogIndex />} />
          <Route path="/blog/tutorial/hotmart" element={<BlogHotmart />} />
          <Route path="/blog/tutorial/kiwify" element={<BlogKiwify />} />
          <Route path="/blog/tutorial/eduzz" element={<BlogEduzz />} />
          <Route path="/blog/tutorial/monetizze" element={<BlogMonetizze />} />
          <Route path="/blog/tutorial/cakto" element={<BlogCakto />} />

          {/* Protected layout route — sidebar persists across navigation */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/relatorios" element={<Dashboard />} />
            <Route path="/smart-links" element={<SmartLinks />} />
            <Route path="/utm/relatorio" element={<UtmReport />} />
            <Route path="/utm/gerador" element={<UtmGeneratorPage />} />
            <Route path="/planejamento" element={<ReportTemplates />} />
            <Route path="/trafego/meta-ads" element={<MetaAdsReport />} />
            <Route path="/trafego/ga4" element={<GA4Report />} />
            <Route path="/trafego/google-ads" element={<GoogleAdsReport />} />
            <Route path="/integracoes" element={<Integrations />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/recursos" element={<Resources />} />
            <Route path="/admin" element={<AdminSettings />} />
            <Route path="/suporte" element={<Support />} />
            <Route path="/reportar-bug" element={<BugReport />} />
            <Route path="/novidades" element={<Novidades />} />
            <Route path="/leads" element={<CRMLeads />} />
            <Route path="/crm2" element={<Navigate to="/crm" replace />} />
            <Route path="/dispositivos" element={<Devices />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="/atendimento" element={<RequireSuperAdmin><Atendimento /></RequireSuperAdmin>} />
            {/* Legacy redirects */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/utm-report" element={<Navigate to="/utm/relatorio" replace />} />
            <Route path="/utm-generator" element={<Navigate to="/utm/gerador" replace />} />
            <Route path="/report-templates" element={<Navigate to="/planejamento" replace />} />
            <Route path="/meta-ads-report" element={<Navigate to="/trafego/meta-ads" replace />} />
            <Route path="/ga4-report" element={<Navigate to="/trafego/ga4" replace />} />
            <Route path="/google-ads-report" element={<Navigate to="/trafego/google-ads" replace />} />
            <Route path="/integrations" element={<Navigate to="/integracoes" replace />} />
            <Route path="/settings" element={<Navigate to="/configuracoes" replace />} />
            <Route path="/support" element={<Navigate to="/suporte" replace />} />
            <Route path="/bug-report" element={<Navigate to="/reportar-bug" replace />} />
            <Route path="/resources" element={<Navigate to="/recursos" replace />} />
            <Route path="/devices" element={<Navigate to="/dispositivos" replace />} />
            <Route path="/crm-leads" element={<Navigate to="/leads" replace />} />
            <Route path="/webhook-logs" element={<Navigate to="/integracoes?tab=logs" replace />} />
          </Route>

          {/* AgentHub — standalone route outside ProtectedLayout (no Nexus sidebar) */}
          <Route path="/ai-agents/*" element={
            session ? (
              <AccountProvider>
                <RolePreviewProvider>
                  <RequireSuperAdmin>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <AIAgents />
                    </Suspense>
                  </RequireSuperAdmin>
                </RolePreviewProvider>
              </AccountProvider>
            ) : <Navigate to="/login" replace />
          } />

          {/* Nexus CRM — standalone route outside ProtectedLayout */}
          <Route path="/crm/*" element={
            session ? (
              <AccountProvider>
                <RolePreviewProvider>
                  <ProjectProvider>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <NexusCRM />
                    </Suspense>
                  </ProjectProvider>
                </RolePreviewProvider>
              </AccountProvider>
            ) : <Navigate to="/login" replace />
          } />

          {/* Nexus Forms — standalone route outside ProtectedLayout */}
          <Route path="/forms/*" element={
            session ? (
              <AccountProvider>
                <RolePreviewProvider>
                  <ProjectProvider>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <NexusForms />
                    </Suspense>
                  </ProjectProvider>
                </RolePreviewProvider>
              </AccountProvider>
            ) : <Navigate to="/login" replace />
          } />

          {/* Nexus Pesquisas — standalone route outside ProtectedLayout */}
          <Route path="/pesquisas/*" element={
            session ? (
              <AccountProvider>
                <RolePreviewProvider>
                  <ProjectProvider>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <Surveys />
                    </Suspense>
                  </ProjectProvider>
                </RolePreviewProvider>
              </AccountProvider>
            ) : <Navigate to="/login" replace />
          } />

          <Route path="/grupozap/*" element={
            session ? (
              <AccountProvider>
                <RolePreviewProvider>
                  <ProjectProvider>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <NexusGrupoZap />
                    </Suspense>
                  </ProjectProvider>
                </RolePreviewProvider>
              </AccountProvider>
            ) : <Navigate to="/login" replace />
          } />

          {/* Nexus Automações — standalone route outside ProtectedLayout */}
          <Route path="/automacoes/*" element={
            session ? (
              <AccountProvider>
                <RolePreviewProvider>
                  <ProjectProvider>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <NexusAutomacoes />
                    </Suspense>
                  </ProjectProvider>
                </RolePreviewProvider>
              </AccountProvider>
            ) : <Navigate to="/login" replace />
          } />

          {isSmartlinkDomain && <Route path="/:slug" element={<PublicSmartLinkRedirect />} />}
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </SessionContext.Provider>
  );
}

import ErrorBoundary from "@/components/ErrorBoundary";

/** Renders landing page at "/" — redirects logged-in users to dashboard */
function LandingRoute() {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/") return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecked(true);
    });
  }, [location.pathname]);

  if (location.pathname !== "/") return null;

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasSession) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Index />
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <BrowserRouter>
              <LandingRoute />
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
