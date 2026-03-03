import { useState } from "react";
import { Eye, EyeOff, SlidersHorizontal, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Props {
  sections: { id: string; label: string }[];
  visible: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export default function ChartVisibilityMenu({ sections, visible, onToggle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Personalizar
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[320px] sm:w-[360px] !bg-[hsla(240,5%,7%,0.75)] backdrop-blur-xl border-l border-border/40 shadow-2xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Personalizar relatório
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
          {(() => {
            // Group sections by prefix category
            const groups: { label: string; items: typeof sections }[] = [];
            const categorize = (s: { id: string; label: string }) => {
              if (s.id.startsWith("meta-")) return "Meta Ads";
              if (s.id.startsWith("gads-")) return "Google Ads";
              if (s.id.startsWith("ga4-")) return "GA4";
              if (s.id.startsWith("utm-")) return "UTM Detalhado";
              if (s.id.startsWith("kpi-")) return "KPIs Principais";
              if (s.id.startsWith("chart-")) return "Mini-gráficos";
              return "Geral";
            };

            const groupMap = new Map<string, typeof sections>();
            const groupOrder = ["KPIs Principais", "Geral", "Mini-gráficos", "Meta Ads", "Google Ads", "GA4", "UTM Detalhado"];
            sections.forEach(s => {
              const cat = categorize(s);
              if (!groupMap.has(cat)) groupMap.set(cat, []);
              groupMap.get(cat)!.push(s);
            });

            return groupOrder.filter(g => groupMap.has(g)).map(groupLabel => (
              <div key={groupLabel}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {groupLabel}
                </p>
                <div className="space-y-1">
                  {groupMap.get(groupLabel)!.map(s => {
                    const isVisible = visible[s.id] !== false;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer group",
                          isVisible
                            ? "border-border/40 bg-card/60 backdrop-blur-sm hover:bg-accent/30"
                            : "border-border/20 bg-muted/20 opacity-60 hover:opacity-80"
                        )}
                        onClick={() => onToggle(s.id)}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span className="flex-1 text-sm font-medium">{s.label}</span>
                        {isVisible ? (
                          <Eye className="h-4 w-4 text-primary" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        {isVisible && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggle(s.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
