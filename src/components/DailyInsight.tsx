import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DailyInsightProps {
  accountId?: string;
  projectId?: string;
}

export default function DailyInsight({ accountId, projectId }: DailyInsightProps) {
  const { data: insight, isLoading } = useQuery({
    queryKey: ["daily-insight", accountId, projectId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("daily-insight", {
        body: { account_id: accountId, project_id: projectId || null },
      });
      if (error) throw error;
      return data as { message: string; trend: string; insight_date: string } | null;
    },
    staleTime: 30 * 60_000, // 30 min cache
    refetchInterval: false,
    enabled: !!accountId,
    retry: 1,
  });

  if (isLoading || !insight?.message) return null;

  const trendIcon = insight.trend === "up"
    ? <TrendingUp className="h-4 w-4 text-success shrink-0" />
    : insight.trend === "down"
    ? <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
    : <Minus className="h-4 w-4 text-muted-foreground shrink-0" />;

  const borderColor = insight.trend === "up"
    ? "border-success/30"
    : insight.trend === "down"
    ? "border-destructive/30"
    : "border-border/30";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${borderColor} glass card-shadow`}
      >
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-primary" />
          {trendIcon}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{insight.message}</p>
      </motion.div>
    </AnimatePresence>
  );
}
