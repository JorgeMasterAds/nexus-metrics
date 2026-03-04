import { useState, useCallback, useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";

export interface CustomMetric {
  id: string;
  name: string;
  description?: string;
  formula: string;
  format: "number" | "currency" | "percent";
  variables: string[];
}

const AVAILABLE_VARIABLES = [
  { id: "vendas", label: "Vendas", description: "Total de vendas aprovadas" },
  { id: "faturamento", label: "Faturamento", description: "Receita total (R$)" },
  { id: "views", label: "Views", description: "Total de visualizações/cliques" },
  { id: "ticket_medio", label: "Ticket Médio", description: "Valor médio por venda" },
  { id: "taxa_conversao", label: "Taxa de Conversão", description: "Vendas / Views × 100" },
  { id: "investimento", label: "Investimento", description: "Gasto total em ads" },
  { id: "roas", label: "ROAS", description: "Faturamento / Investimento" },
  { id: "leads", label: "Leads", description: "Total de leads capturados" },
  { id: "abandono", label: "Abandono", description: "Eventos de abandono de carrinho" },
  { id: "order_bumps", label: "Order Bumps", description: "Total de order bumps" },
  { id: "ob_receita", label: "Receita OB", description: "Receita de order bumps" },
  { id: "meta_spend", label: "Meta Ads: Gasto", description: "Investimento Meta Ads" },
  { id: "meta_impressions", label: "Meta Ads: Impressões", description: "Impressões Meta" },
  { id: "meta_clicks", label: "Meta Ads: Cliques", description: "Cliques Meta" },
  { id: "meta_ctr", label: "Meta Ads: CTR", description: "CTR Meta" },
  { id: "meta_cpm", label: "Meta Ads: CPM", description: "CPM Meta" },
  { id: "gads_spend", label: "Google Ads: Gasto", description: "Investimento Google Ads" },
  { id: "gads_clicks", label: "Google Ads: Cliques", description: "Cliques Google Ads" },
  { id: "gads_impressions", label: "Google Ads: Impressões", description: "Impressões Google Ads" },
];

export { AVAILABLE_VARIABLES };

export function useCustomMetrics(page: string) {
  const { activeProjectId } = useActiveProject();
  const storageKey = `nexus_custom_metrics_${page}_${activeProjectId}`;

  const [metrics, setMetrics] = useState<CustomMetric[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(metrics));
  }, [metrics, storageKey]);

  const addMetric = useCallback((metric: Omit<CustomMetric, "id">) => {
    const newMetric: CustomMetric = {
      ...metric,
      id: `custom-${Date.now()}`,
    };
    setMetrics(prev => [...prev, newMetric]);
    return newMetric;
  }, []);

  const removeMetric = useCallback((id: string) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMetric = useCallback((id: string, updates: Partial<CustomMetric>) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  /**
   * Evaluate a custom metric formula given a data context
   */
  const evaluate = useCallback((formula: string, data: Record<string, number>): number => {
    try {
      // Replace variable names with their values
      let expr = formula;
      for (const [key, value] of Object.entries(data)) {
        expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(value));
      }
      // Only allow numbers, operators, parentheses, spaces, dots
      if (!/^[\d\s+\-*/().,%]+$/.test(expr)) return 0;
      // eslint-disable-next-line no-eval
      const result = new Function(`return (${expr})`)();
      return typeof result === "number" && isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  }, []);

  return { metrics, addMetric, removeMetric, updateMetric, evaluate };
}
