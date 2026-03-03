import { Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Props {
  sections: { id: string; label: string }[];
  visible: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export default function ChartVisibilityMenu({ sections, visible, onToggle }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Personalizar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Exibir seções</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sections.map(s => (
          <DropdownMenuCheckboxItem
            key={s.id}
            checked={visible[s.id] !== false}
            onCheckedChange={() => onToggle(s.id)}
            className="text-xs"
          >
            {visible[s.id] !== false ? (
              <Eye className="h-3 w-3 mr-1.5 text-primary" />
            ) : (
              <EyeOff className="h-3 w-3 mr-1.5 text-muted-foreground" />
            )}
            {s.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
