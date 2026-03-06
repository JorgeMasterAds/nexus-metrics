import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, AlertTriangle, Info, AlertOctagon, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const severityConfig = {
  info: { icon: Info, bg: "bg-info/15 border-info/30", text: "text-info" },
  warning: { icon: AlertTriangle, bg: "bg-warning/15 border-warning/30", text: "text-warning" },
  error: { icon: AlertOctagon, bg: "bg-destructive/15 border-destructive/30", text: "text-destructive" },
  critical: { icon: ShieldAlert, bg: "bg-destructive/20 border-destructive/40", text: "text-destructive" },
};

export default function GlobalAlertBanner() {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("dismissed-global-alerts") || "[]"); } catch { return []; }
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["global-alerts-active"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("global_alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 300_000,
  });

  useEffect(() => {
    localStorage.setItem("dismissed-global-alerts", JSON.stringify(dismissed));
  }, [dismissed]);

  const visible = alerts.filter((a: any) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-0">
      {visible.map((alert: any) => {
        const sev = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.warning;
        const Icon = sev.icon;
        return (
          <div key={alert.id} className={cn("flex items-center gap-3 px-4 py-2.5 border-b text-sm", sev.bg)}>
            <Icon className={cn("h-4 w-4 shrink-0", sev.text)} />
            <div className="flex-1 min-w-0">
              <span className={cn("font-semibold mr-2", sev.text)}>{alert.title}</span>
              <span className="text-foreground/80">{alert.message}</span>
            </div>
            <button
              onClick={() => setDismissed((d) => [...d, alert.id])}
              className="p-1 rounded hover:bg-foreground/10 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5 text-foreground/60" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
