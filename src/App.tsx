import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
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

// Lazy-loaded pages — each becomes a separate chunk
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Home = lazy(() => import("./pages/Home"));
const SmartLinks = lazy(() => import("./pages/SmartLinks"));
const WebhookLogs = lazy(() => import("./pages/WebhookLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const UtmReport = lazy(() => import("./pages/UtmReport"));
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function RequireAccount({ children }: { children: React.ReactNode }) {
  const { accounts, isLoading, activeAccount } = useAccount();

  if (isLoading) {
    return <ChartLoader text="Carregando conta..." />;
  }

  if (accounts.length === 0 || !activeAccount) {
    return <ChartLoader text="Preparando seu ambiente..." />;
  }

  return (
    <ProjectProvider>
      <RequireProject>{children}</RequireProject>
    </ProjectProvider>
  );
}

function RequireProject({ children }: { children: React.ReactNode }) {
  const { projects, isLoading } = useProject();

  if (isLoading) {
    return <ChartLoader text="Carregando projetos..." />;
  }

  if (projects.length === 0) {
    return <CreateProjectScreen />;
  }

  return <>{children}</>;
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

  if (isLoading) return <ChartLoader text="Verificando acesso..." />;
  if (!isSuperAdmin || isPreviewActive) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const knownAppRoutes = new Set([
    "auth",
    "reset-password",
    "dashboard",
    "home",
    "smart-links",
    "utm-report",
    "webhook-logs",
    "integrations",
    "settings",
    "resources",
    "admin",
    "support",
    "novidades",
    "crm",
    "ai-agents",
    "devices",
    "surveys",
    "automacoes",
    "termos",
    "privacidade",
    "s",
    "view",
    "embed",
  ]);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const isPublicSlugRoute = pathSegments.length === 1 && !knownAppRoutes.has(pathSegments[0]);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (isPublicSlugRoute) {
    return (
      <Routes>
        <Route path="/:slug" element={<PublicSmartLinkRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  if (loading) {
    return <ChartLoader text="Iniciando..." />;
  }

  const Protected = ({ children }: { children: React.ReactNode }) =>
    session ? (
      <AccountProvider>
        <RolePreviewProvider>
          <RequireAccount>{children}</RequireAccount>
        </RolePreviewProvider>
      </AccountProvider>
    ) : (
      <Navigate to="/auth" replace />
    );

  return (
    <Suspense fallback={<ChartLoader text="Carregando..." />}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth" element={session ? <Navigate to="/home" replace /> : <Auth />} />
        <Route path="/home" element={<Protected><Home /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/smart-links" element={<Protected><SmartLinks /></Protected>} />
        <Route path="/utm-report" element={<Protected><UtmReport /></Protected>} />
        <Route path="/webhook-logs" element={<Protected><WebhookLogs /></Protected>} />
        <Route path="/integrations" element={<Protected><Integrations /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/resources" element={<Protected><Resources /></Protected>} />
        <Route path="/admin" element={<Protected><AdminSettings /></Protected>} />
        <Route path="/support" element={<Protected><Support /></Protected>} />
        <Route path="/novidades" element={<Protected><Novidades /></Protected>} />
        <Route path="/crm" element={<Protected><CRM /></Protected>} />
        <Route path="/ai-agents" element={<Protected><RequireSuperAdmin><AIAgents /></RequireSuperAdmin></Protected>} />
        <Route path="/devices" element={<Protected><Devices /></Protected>} />
        <Route path="/surveys" element={<Protected><Surveys /></Protected>} />
        <Route path="/automacoes" element={<Protected><Automations /></Protected>} />
        <Route path="/s/:slug" element={<PublicSurvey />} />
        <Route path="/embed/s/:slug" element={<EmbedSurvey />} />
        <Route path="/termos" element={<TermsOfUse />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/view/:token" element={<PublicView />} />
        <Route path="/" element={<Navigate to={session ? "/home" : "/auth"} replace />} />
        <Route path="/:slug" element={<PublicSmartLinkRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
