import { Eye, ChevronDown, Trash2 } from "lucide-react";
import { useRolePreview, PreviewRole } from "@/hooks/useRolePreview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_OPTIONS: { value: PreviewRole; label: string }[] = [
  { value: "real", label: "Admin (real)" },
  { value: "member", label: "Membro" },
  { value: "viewer", label: "Visualizador" },
];

async function clearAllCaches() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Cache limpo! Recarregando...");
    setTimeout(() => location.reload(), 800);
  } catch (e) {
    toast.error("Erro ao limpar cache");
    console.error(e);
  }
}

export default function AdminRolePreviewBar() {
  const { previewRole, setPreviewRole, isPreviewActive } = useRolePreview();
  const currentLabel = ROLE_OPTIONS.find((o) => o.value === previewRole)?.label ?? "Admin (real)";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium",
            isPreviewActive
              ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
              : "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)] border border-transparent hover:border-primary/30"
          )}
          title="Alternar modo de visualização"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">{isPreviewActive ? currentLabel : ""}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {ROLE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setPreviewRole(opt.value)}
            className={cn(
              "text-xs cursor-pointer",
              previewRole === opt.value && "font-semibold text-primary"
            )}
          >
            {opt.label}
            {previewRole === opt.value && <span className="ml-auto text-primary">●</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={clearAllCaches}
          className="text-xs cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Limpar Cache
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
