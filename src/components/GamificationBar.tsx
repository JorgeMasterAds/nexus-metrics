import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Trophy, Pencil } from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useState, useEffect } from "react";


interface Props {
  since: string;
  until: string;
  goal: number;
  onEditGoal?: () => void;
}

export default function GamificationBar({ since, until, goal, onEditGoal }: Props) {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();

  const { data: revenue = 0 } = useQuery({
    queryKey: ["gamification-revenue", since, until, activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversions")
        .select("amount")
        .eq("status", "approved")
        .gte("created_at", since)
        .lte("created_at", until);
      if (activeAccountId) q = q.eq("account_id", activeAccountId);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data } = await q;
      return (data || []).reduce((s: number, c: any) => s + Number(c.amount), 0);
    },
    staleTime: 60000,
    enabled: !!activeAccountId,
  });

  // Fetch all active motivational messages
  const { data: messages = [] } = useQuery({
    queryKey: ["motivational-messages-all"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("motivational_messages")
        .select("id, message")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      return (data || []) as { id: string; message: string }[];
    },
    staleTime: 300000,
  });

  // Rotate messages randomly every 10 seconds
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    // Pick initial random index
    setCurrentIdx(Math.floor(Math.random() * messages.length));
    const interval = setInterval(() => {
      setCurrentIdx((prev) => {
        let next: number;
        do {
          next = Math.floor(Math.random() * messages.length);
        } while (next === prev && messages.length > 1);
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages.length > 0
    ? messages[currentIdx % messages.length]?.message
    : '💪 "O sucesso é a soma de pequenos esforços repetidos dia após dia."';

  const percent = goal > 0 ? Math.min((revenue / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - revenue, 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className="relative rounded-xl p-2.5 sm:p-3 mb-4 overflow-hidden border border-destructive/30 bg-destructive/5"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-warning shrink-0" />
          <span className="text-xs font-semibold">Meta de Faturamento</span>
          {onEditGoal && (
            <button onClick={onEditGoal} className="p-0.5 rounded hover:bg-accent/50 transition-colors" title="Editar meta">
              <Pencil className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <span className="text-[10px] text-muted-foreground">{percent.toFixed(1)}% atingido</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
          <span>{fmt(revenue)} / {fmt(goal)}</span>
          <span>Faltam {fmt(remaining)}</span>
        </div>
      </div>
      <Progress value={percent} className="h-2 mb-1.5" />
      {percent >= 100 ? (
        <p className="text-xs text-success font-semibold">🎉 Meta batida!</p>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          {currentMessage}
        </p>
      )}
    </div>
  );
}
