import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
}

export default function MetricCard({ label, value, change, changeType = "neutral", icon: Icon }: MetricCardProps) {
  return (
    <div className="p-4 rounded-xl border border-border/20 card-shadow glass h-[130px] flex flex-col items-center text-center relative overflow-hidden group transition-all hover:border-border/40">
      
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">{label}</span>
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
