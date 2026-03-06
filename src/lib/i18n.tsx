import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Locale = "pt-BR" | "en" | "es";

const translations: Record<Locale, Record<string, string>> = {
  "pt-BR": {
    // Sidebar nav
    "dashboard": "Dashboard",
    "reports": "Relatórios",
    "utm_report": "Relatório UTM",
    "traffic": "Tráfego",
    "smart_links": "Smart Links",
    "planning": "Planejamento",
    "integrations": "Integrações",
    "leads_crm": "Leads e CRM",
    "lead_list": "Lista de Leads",
    "surveys_quiz": "Pesquisas & Quiz",
    "automations": "Automações",
    "ai_agent": "Agente de IA",
    "resources": "Recursos",
    "devices": "Dispositivos",
    "forms": "Formulários",
    "news": "Novidades",
    "admin": "Administração",
    "system_health": "Saúde do Sistema",
    "support": "Suporte",
    "report_bug": "Reportar Bug",
    "logout": "Sair",
    "coming_soon": "em breve",
    "beta": "beta",
    "back_to": "Voltar ao Nexus Metrics",
    "pin_sidebar": "Fixar sidebar aberta",
    "unpin_sidebar": "Desafixar sidebar",

    // Settings tabs
    "settings": "Configurações",
    "personal_data": "Dados Pessoais",
    "preferences": "Preferências",
    "projects": "Projetos",
    "team": "Equipe",
    "subscription": "Assinatura",
    "referrals": "Indicações e Afiliados",
    "apis": "APIs",
    "security": "Segurança",

    // Common actions
    "save": "Salvar",
    "cancel": "Cancelar",
    "edit": "Editar",
    "delete": "Excluir",
    "create": "Criar",
    "search": "Buscar",
    "filter": "Filtrar",
    "export": "Exportar",
    "import": "Importar",
    "close": "Fechar",
    "confirm": "Confirmar",
    "back": "Voltar",
    "next": "Próximo",
    "previous": "Anterior",
    "yes": "Sim",
    "no": "Não",
    "loading": "Carregando...",
    "saving": "Salvando...",
    "no_data": "Nenhum dado encontrado",
    "user": "Usuário",

    // KPIs / Metrics
    "total_views": "Total Views",
    "sales": "Vendas",
    "conversion_rate": "Taxa Conv.",
    "revenue": "Faturamento",
    "avg_ticket": "Ticket Médio",
    "investment": "Investimento",
    "roas": "ROAS",
    "abandonment": "Abandono",
    "clicks": "Cliques",
    "impressions": "Impressões",
    "leads": "Leads",
    "ctr": "CTR",
    "cpm": "CPM",
    "cpc": "CPC",

    // Dashboard
    "daily_sales": "Vendas Diárias",
    "conversion_events": "Eventos de Conversão",
    "product_summary": "Resumo por Produto",
    "order_bumps": "Produtos vs Order Bumps",
    "revenue_by_source": "Receita por Origem",
    "revenue_by_campaign": "Receita por Campanha",
    "revenue_by_medium": "Receita por Medium",
    "revenue_by_content": "Receita por Content",
    "revenue_by_product": "Receita por Produto",
    "payment_methods": "Meios de Pagamento",
    "revenue_goal": "Meta de Faturamento",
    "usage_limits": "Limites de Uso",
    "sales_chart": "Gráfico de Vendas",
    "products": "Produtos",

    // Webhooks
    "webhooks": "Webhooks",
    "webhook_logs": "Webhook Logs",

    // Dates
    "today": "Hoje",
    "yesterday": "Ontem",
    "last_7_days": "Últimos 7 dias",
    "last_30_days": "Últimos 30 dias",
    "this_month": "Este mês",
    "last_month": "Mês passado",
    "custom": "Personalizado",

    // Misc
    "language": "Idioma",
    "currency": "Moeda",
    "theme": "Tema",
    "dark": "Escuro",
    "light": "Claro",
    "colorful": "Colorido",
    "organization": "Minha Organização",
    "updated": "ATUALIZADO ✓",
    "loading_bar": "CARREGANDO...",
    "refresh_data": "Atualizar dados",

    // Meta Ads
    "meta_ads": "Meta Ads",
    "google_ads": "Google Ads",
    "ga4": "GA4 - Google Analytics",

    // Preferences
    "language_region": "Idioma e Região",
    "language_region_desc": "Defina o idioma da interface e a moeda padrão para exibição de valores financeiros.",
    "currency_note": "A moeda selecionada será usada para exibir valores na interface. Dados importados via Webhooks, Meta Ads e Google Ads respeitam a moeda original da plataforma — certifique-se de que a moeda configurada aqui corresponde à moeda das suas contas de anúncio.",
    "save_preferences": "Salvar preferências",
    "preferences_saved": "Preferências salvas!",
    "error": "Erro",
  },
  "en": {
    // Sidebar nav
    "dashboard": "Dashboard",
    "reports": "Reports",
    "utm_report": "UTM Report",
    "traffic": "Traffic",
    "smart_links": "Smart Links",
    "planning": "Planning",
    "integrations": "Integrations",
    "leads_crm": "Leads & CRM",
    "lead_list": "Lead List",
    "surveys_quiz": "Surveys & Quiz",
    "automations": "Automations",
    "ai_agent": "AI Agent",
    "resources": "Resources",
    "devices": "Devices",
    "forms": "Forms",
    "news": "What's New",
    "admin": "Administration",
    "system_health": "System Health",
    "support": "Support",
    "report_bug": "Report Bug",
    "logout": "Sign Out",
    "coming_soon": "soon",
    "beta": "beta",
    "back_to": "Back to Nexus Metrics",
    "pin_sidebar": "Pin sidebar open",
    "unpin_sidebar": "Unpin sidebar",

    // Settings tabs
    "settings": "Settings",
    "personal_data": "Personal Data",
    "preferences": "Preferences",
    "projects": "Projects",
    "team": "Team",
    "subscription": "Subscription",
    "referrals": "Referrals & Affiliates",
    "apis": "APIs",
    "security": "Security",

    // Common actions
    "save": "Save",
    "cancel": "Cancel",
    "edit": "Edit",
    "delete": "Delete",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "close": "Close",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "yes": "Yes",
    "no": "No",
    "loading": "Loading...",
    "saving": "Saving...",
    "no_data": "No data found",
    "user": "User",

    // KPIs
    "total_views": "Total Views",
    "sales": "Sales",
    "conversion_rate": "Conv. Rate",
    "revenue": "Revenue",
    "avg_ticket": "Avg. Ticket",
    "investment": "Investment",
    "roas": "ROAS",
    "abandonment": "Abandonment",
    "clicks": "Clicks",
    "impressions": "Impressions",
    "leads": "Leads",
    "ctr": "CTR",
    "cpm": "CPM",
    "cpc": "CPC",

    // Dashboard
    "daily_sales": "Daily Sales",
    "conversion_events": "Conversion Events",
    "product_summary": "Product Summary",
    "order_bumps": "Products vs Order Bumps",
    "revenue_by_source": "Revenue by Source",
    "revenue_by_campaign": "Revenue by Campaign",
    "revenue_by_medium": "Revenue by Medium",
    "revenue_by_content": "Revenue by Content",
    "revenue_by_product": "Revenue by Product",
    "payment_methods": "Payment Methods",
    "revenue_goal": "Revenue Goal",
    "usage_limits": "Usage Limits",
    "sales_chart": "Sales Chart",
    "products": "Products",

    // Webhooks
    "webhooks": "Webhooks",
    "webhook_logs": "Webhook Logs",

    // Dates
    "today": "Today",
    "yesterday": "Yesterday",
    "last_7_days": "Last 7 days",
    "last_30_days": "Last 30 days",
    "this_month": "This month",
    "last_month": "Last month",
    "custom": "Custom",

    // Misc
    "language": "Language",
    "currency": "Currency",
    "theme": "Theme",
    "dark": "Dark",
    "light": "Light",
    "colorful": "Colorful",
    "organization": "My Organization",
    "updated": "UPDATED ✓",
    "loading_bar": "LOADING...",
    "refresh_data": "Refresh data",

    // Meta / Google
    "meta_ads": "Meta Ads",
    "google_ads": "Google Ads",
    "ga4": "GA4 - Google Analytics",

    // Preferences
    "language_region": "Language & Region",
    "language_region_desc": "Set the interface language and the default currency for displaying financial values.",
    "currency_note": "The selected currency will be used to display values in the interface. Data imported via Webhooks, Meta Ads and Google Ads respect the original platform currency — make sure the currency configured here matches your ad accounts.",
    "save_preferences": "Save preferences",
    "preferences_saved": "Preferences saved!",
    "error": "Error",
  },
  "es": {
    // Sidebar nav
    "dashboard": "Dashboard",
    "reports": "Reportes",
    "utm_report": "Informe UTM",
    "traffic": "Tráfico",
    "smart_links": "Smart Links",
    "planning": "Planificación",
    "integrations": "Integraciones",
    "leads_crm": "Leads y CRM",
    "lead_list": "Lista de Leads",
    "surveys_quiz": "Encuestas y Quiz",
    "automations": "Automatizaciones",
    "ai_agent": "Agente de IA",
    "resources": "Recursos",
    "devices": "Dispositivos",
    "forms": "Formularios",
    "news": "Novedades",
    "admin": "Administración",
    "system_health": "Salud del Sistema",
    "support": "Soporte",
    "report_bug": "Reportar Bug",
    "logout": "Salir",
    "coming_soon": "próximamente",
    "beta": "beta",
    "back_to": "Volver a Nexus Metrics",
    "pin_sidebar": "Fijar sidebar abierta",
    "unpin_sidebar": "Desfijar sidebar",

    // Settings tabs
    "settings": "Configuración",
    "personal_data": "Datos Personales",
    "preferences": "Preferencias",
    "projects": "Proyectos",
    "team": "Equipo",
    "subscription": "Suscripción",
    "referrals": "Referidos y Afiliados",
    "apis": "APIs",
    "security": "Seguridad",

    // Common actions
    "save": "Guardar",
    "cancel": "Cancelar",
    "edit": "Editar",
    "delete": "Eliminar",
    "create": "Crear",
    "search": "Buscar",
    "filter": "Filtrar",
    "export": "Exportar",
    "import": "Importar",
    "close": "Cerrar",
    "confirm": "Confirmar",
    "back": "Volver",
    "next": "Siguiente",
    "previous": "Anterior",
    "yes": "Sí",
    "no": "No",
    "loading": "Cargando...",
    "saving": "Guardando...",
    "no_data": "Sin datos",
    "user": "Usuario",

    // KPIs
    "total_views": "Vistas Totales",
    "sales": "Ventas",
    "conversion_rate": "Tasa Conv.",
    "revenue": "Ingresos",
    "avg_ticket": "Ticket Promedio",
    "investment": "Inversión",
    "roas": "ROAS",
    "abandonment": "Abandono",
    "clicks": "Clics",
    "impressions": "Impresiones",
    "leads": "Leads",
    "ctr": "CTR",
    "cpm": "CPM",
    "cpc": "CPC",

    // Dashboard
    "daily_sales": "Ventas Diarias",
    "conversion_events": "Eventos de Conversión",
    "product_summary": "Resumen por Producto",
    "order_bumps": "Productos vs Order Bumps",
    "revenue_by_source": "Ingresos por Origen",
    "revenue_by_campaign": "Ingresos por Campaña",
    "revenue_by_medium": "Ingresos por Medio",
    "revenue_by_content": "Ingresos por Contenido",
    "revenue_by_product": "Ingresos por Producto",
    "payment_methods": "Métodos de Pago",
    "revenue_goal": "Meta de Ingresos",
    "usage_limits": "Límites de Uso",
    "sales_chart": "Gráfico de Ventas",
    "products": "Productos",

    // Webhooks
    "webhooks": "Webhooks",
    "webhook_logs": "Logs de Webhook",

    // Dates
    "today": "Hoy",
    "yesterday": "Ayer",
    "last_7_days": "Últimos 7 días",
    "last_30_days": "Últimos 30 días",
    "this_month": "Este mes",
    "last_month": "Mes pasado",
    "custom": "Personalizado",

    // Misc
    "language": "Idioma",
    "currency": "Moneda",
    "theme": "Tema",
    "dark": "Oscuro",
    "light": "Claro",
    "colorful": "Colorido",
    "organization": "Mi Organización",
    "updated": "ACTUALIZADO ✓",
    "loading_bar": "CARGANDO...",
    "refresh_data": "Actualizar datos",

    // Meta / Google
    "meta_ads": "Meta Ads",
    "google_ads": "Google Ads",
    "ga4": "GA4 - Google Analytics",

    // Preferences
    "language_region": "Idioma y Región",
    "language_region_desc": "Define el idioma de la interfaz y la moneda predeterminada para mostrar valores financieros.",
    "currency_note": "La moneda seleccionada se usará para mostrar valores en la interfaz. Los datos importados por Webhooks, Meta Ads y Google Ads respetan la moneda original de la plataforma — asegúrese de que la moneda configurada aquí coincida con sus cuentas de anuncios.",
    "save_preferences": "Guardar preferencias",
    "preferences_saved": "¡Preferencias guardadas!",
    "error": "Error",
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pt-BR",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("nexus-locale");
    return (saved as Locale) || "pt-BR";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("nexus-locale", l);
    document.documentElement.lang = l === "pt-BR" ? "pt-BR" : l;
  }, []);

  const t = useCallback((key: string) => {
    return translations[locale]?.[key] || translations["pt-BR"]?.[key] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];
