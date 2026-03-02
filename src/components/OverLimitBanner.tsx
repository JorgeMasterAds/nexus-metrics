import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useOverLimitCheck } from "@/hooks/useOverLimitCheck";

export default function OverLimitBanner() {
  const { isOverLimit, overLimitItems } = useOverLimitCheck();

  if (!isOverLimit) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mx-4 lg:mx-8 mt-4">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm font-semibold text-destructive">Limite do plano excedido</span>
        </div>
        <div className="flex-1 text-xs text-muted-foreground">
          Você possui mais recursos do que seu plano permite:{" "}
          {overLimitItems.map((item, i) => (
            <span key={item.label}>
              {i > 0 && ", "}
              <span className="font-semibold text-foreground">
                {item.label} ({item.current}/{item.max})
              </span>
            </span>
          ))}
          . Para continuar usando, faça upgrade ou exclua/arquive os itens excedentes.
        </div>
        <Link
          to="/settings"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg gradient-bg text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Fazer upgrade <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
