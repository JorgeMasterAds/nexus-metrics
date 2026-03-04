import { useState } from "react";
import { Share2, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SharedViewManager from "@/components/SharedViewManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";

interface ShareReportButtonProps {
  size?: "default" | "sm" | "icon";
}

export default function ShareReportButton({ size = "default" }: ShareReportButtonProps) {
  const { activeProjectId } = useActiveProject();

  const { data: tokensCount = 0 } = useQuery({
    queryKey: ["shared-view-tokens-count", activeProjectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("shared_view_tokens")
        .select("id", { count: "exact", head: true })
        .eq("project_id", activeProjectId)
        .eq("is_active", true);
      return data?.length ?? 0;
    },
    enabled: !!activeProjectId,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 rounded-none px-3 hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)] hover:text-foreground">
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Compartilhar</span>
          {tokensCount > 0 && (
            <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {tokensCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Relatório</DialogTitle>
        </DialogHeader>
        <SharedViewManager />
      </DialogContent>
    </Dialog>
  );
}
