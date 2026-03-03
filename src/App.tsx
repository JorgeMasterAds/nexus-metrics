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
import ChartLoader from "@/components/ChartLoader";
import { RolePreviewProvider, useRolePreview } from "@/hooks/useRolePreview";
import { ThemeProvider } from "@/hooks/useTheme";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import CreateProjectScreen from "./components/CreateProjectScreen";
import { ProjectProvider, useProject } from "./hooks/useProject";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";

// Lazy-loaded pages
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Home = lazy(() => import("./pages/Home"));
const SmartLinks = lazy(() => import("./pages/SmartLinks"));
const WebhookLogs = lazy(() => import("./pages/WebhookLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const UtmReport = lazy(() => import("./pages/UtmReport"));
const ReportTemplates = lazy(() => import("./pages/ReportTemplates"));
const MetaAdsReport = lazy(() => import("./pages/MetaAdsReport"));
const GA4Report = lazy(() => import("./pages/GA4Report"));
const Support = lazy(() => import("./pages/Support"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Resources = lazy(() => import("./pages/Resources"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicSmartLinkRedirect = lazy(() => import("./pages/PublicSmartLinkRedirect"));
const Novidades = lazy(() => import("./pages/Novidades"));
const CRM = lazy(() => import("./pages/CRM"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const Devices = lazy(() => import("./pages/Devices"));
const Surveys = lazy(() => import("./pages/Surveys"));
const PublicSurvey = lazy(() => import("./pages/PublicSurvey"));
const EmbedSurvey = lazy(() => import("./pages/EmbedSurvey"));
const PublicView = lazy(() => import("./pages/PublicView"));
const Automations = lazy(() => import("./pages/Automations"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const DataDeletionStatus = lazy(() => import("./pages/DataDeletionStatus"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

// Session context so layout route can access session
const SessionContext = createContext<Session | null>(null);

/** Content-area loader (no full screen, keeps sidebar visible) */
function ContentLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/** Checks account is loaded, then renders AppShell + project check + Outlet */
function RequireAccountContent() {
  const { accounts, isLoading, activeAccount } = useAccount();

  if (isLoading) {
    return <ChartLoader text="Carregando conta..." />;
  }

  if (accounts.length === 0 || !activeAccount) {
    return <ChartLoader text="Preparando seu ambiente..." />;
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
  if (!session) return <Navigate to="/auth" replace />;

  return (
    <AccountProvider>
      <RolePreviewProvider>
        <RequireAccountContent />
      </RolePreviewProvider>
    </AccountProvider>
  );
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isPreviewActive } = useRolePreview();

  const { data: isSuperAdmin, isLoading } = useQuery({
    queryKey: ["require-super-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
  });

  if (isLoading) return <ContentLoader text="Verificando acesso..." />;
  if (!isSuperAdmin || isPreviewActive) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const knownAppRoutes = new Set([
    "auth", "reset-password", "dashboard", "smart-links", "utm-report",
    "report-templates", "meta-ads-report", "ga4-report", "webhook-logs",
    "integrations", "settings", "resources", "admin", "support", "novidades",
    "crm", "ai-agents", "devices", "surveys", "automacoes", "termos",
    "privacidade", "data-deletion", "data-deletion-status", "not-found",
    "home", "s", "view", "embed",
  ]);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const isSmartlinkDomain = window.location.hostname.startsWith("smartlink.");
  const isPublicSlugRoute = isSmartlinkDomain && pathSegments.length === 1 && !knownAppRoutes.has(pathSegments[0]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isPublicSlugRoute) {
    return (
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path="/:slug" element={<PublicSmartLinkRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    );
  }

  if (loading) {
    return <ChartLoader text="Iniciando..." />;
  }

  return (
    <SessionContext.Provider value={session}>
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/s/:slug" element={<PublicSurvey />} />
          <Route path="/embed/s/:slug" element={<EmbedSurvey />} />
          <Route path="/termos" element={<TermsOfUse />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/data-deletion-status" element={<DataDeletionStatus />} />
          <Route path="/view/:token" element={<PublicView />} />

          {/* Protected layout route — sidebar persists across navigation */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/smart-links" element={<SmartLinks />} />
            <Route path="/utm-report" element={<UtmReport />} />
            <Route path="/report-templates" element={<ReportTemplates />} />
            <Route path="/meta-ads-report" element={<MetaAdsReport />} />
            <Route path="/ga4-report" element={<GA4Report />} />
            <Route path="/webhook-logs" element={<WebhookLogs />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/admin" element={<AdminSettings />} />
            <Route path="/support" element={<Support />} />
            <Route path="/novidades" element={<Novidades />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/ai-agents" element={<RequireSuperAdmin><AIAgents /></RequireSuperAdmin>} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/surveys" element={<Surveys />} />
            <Route path="/automacoes" element={<Automations />} />
          </Route>

          {isSmartlinkDomain && <Route path="/:slug" element={<PublicSmartLinkRedirect />} />}
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </SessionContext.Provider>
  );
}

const App = () => (
  <ThemeProvider>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  </ThemeProvider>
);

export default App;
