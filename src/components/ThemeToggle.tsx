import { useTheme, AppTheme } from "@/hooks/useTheme";
import { Sun, Moon, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes: { value: AppTheme; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
  { value: "colorful", label: "Colorido", icon: Palette },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = themes.find((t) => t.value === theme) || themes[0];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:shadow-[0_0_8px_1px_hsla(0,90%,55%,0.12)] transition-all border border-transparent hover:border-primary/30"
          title="Alterar tema"
        >
          <Icon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn("gap-2 cursor-pointer", theme === t.value && "font-semibold")}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {theme === t.value && <span className="ml-auto text-primary text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
