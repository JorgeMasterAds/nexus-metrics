import { cn } from "@/lib/utils";
import { LucideIcon, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  helpText?: string;
}

export default function MetricCard({ label, value, change, changeType = "neutral", icon: Icon, helpText }: MetricCardProps) {
  return (
    <div className="p-4 rounded-xl border border-border/20 card-shadow glass h-[130px] flex flex-col items-center text-center relative overflow-hidden group transition-all hover:border-primary/20">
      
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest flex items-center gap-1">
          {label}
          {helpText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[200px]">{helpText}</TooltipContent>
            </Tooltip>
          )}
        </span>
        {Icon && (
          <div className="h-7 w-7 rounded-lg gradient-bg-soft flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>
      <div className="text-[26px] font-bold flex-1 flex items-center justify-center leading-none tracking-tight">{value}</div>
      {change && (
        <div className={cn(
          "text-[10px] mt-2 font-medium leading-tight",
          changeType === "positive" && "text-success",
          changeType === "negative" && "text-destructive",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </div>
      )}
    </div>
  );
}
