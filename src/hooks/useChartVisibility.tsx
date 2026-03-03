import { useState, useCallback, useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";

/**
 * Hook to manage which chart sections are visible on a page.
 * Persists to localStorage per project+page.
 */
export function useChartVisibility(page: string, allSections: { id: string; label: string }[]) {
  const { activeProjectId } = useActiveProject();
  const storageKey = `nexus_chart_visibility_${page}_${activeProjectId}`;

  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default: all visible
    const defaults: Record<string, boolean> = {};
    allSections.forEach(s => { defaults[s.id] = true; });
    return defaults;
  });

  useEffect(() => {
    // Ensure new sections added later default to visible
    setVisible(prev => {
      const updated = { ...prev };
      let changed = false;
      allSections.forEach(s => {
        if (!(s.id in updated)) { updated[s.id] = true; changed = true; }
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

  const isVisible = useCallback((id: string) => visible[id] !== false, [visible]);

  return { visible, toggle, isVisible, allSections };
}
