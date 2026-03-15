import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  received_at: string;
  status?: string;
}

interface EventListProps {
  events: Event[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export default function EventList({ events, selectedId, onSelect, className }: EventListProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {events.map((evt) => (
        <button
          key={evt.id}
          onClick={() => onSelect(evt.id)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-xs transition-all border border-transparent",
            selectedId === evt.id
              ? "bg-primary/10 border-primary/30 text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <span>{format(new Date(evt.received_at), "dd/MM/yyyy - HH:mm", { locale: ptBR })}</span>
          {evt.status && evt.status !== "processed" && (
            <span className={cn(
              "ml-2 text-[9px] px-1.5 py-0.5 rounded-full",
              evt.status === "error" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              {evt.status}
            </span>
          )}
        </button>
      ))}
      {events.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhum evento encontrado</p>
      )}
    </div>
  );
}
