import { useState, useCallback, useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";

/**
 * Hook to manage which chart sections are visible on a page.
 * Persists to localStorage per project+page.
 */
// IDs that should be hidden by default (user enables via Personalizar)
const HIDDEN_BY_DEFAULT_PREFIXES = ["meta-", "gads-", "ga4-"];

export function useChartVisibility(page: string, allSections: { id: string; label: string }[]) {
  const { activeProjectId } = useActiveProject();
  const storageKey = `nexus_chart_visibility_${page}_${activeProjectId}`;

  const isDefaultVisible = (id: string) => !HIDDEN_BY_DEFAULT_PREFIXES.some(p => id.startsWith(p));

  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default: core visible, integrations hidden
    const defaults: Record<string, boolean> = {};
    allSections.forEach(s => { defaults[s.id] = isDefaultVisible(s.id); });
    return defaults;
  });

  useEffect(() => {
    // Ensure new sections added later get their default visibility
    setVisible(prev => {
      const updated = { ...prev };
      let changed = false;
      allSections.forEach(s => {
        if (!(s.id in updated)) { updated[s.id] = isDefaultVisible(s.id); changed = true; }
      });
      return changed ? updated : prev;
    });
  }, [allSections.length]);

  const toggle = useCallback((id: string) => {
    setVisible(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const resetVisibility = useCallback(() => {
    const defaults: Record<string, boolean> = {};
    allSections.forEach(s => { defaults[s.id] = isDefaultVisible(s.id); });
    setVisible(defaults);
    localStorage.removeItem(storageKey);
  }, [storageKey, allSections]);

  const isVisible = useCallback((id: string) => visible[id] !== false, [visible]);

  return { visible, toggle, isVisible, resetVisibility, allSections };
}
