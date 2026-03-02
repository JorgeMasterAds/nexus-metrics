import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isMobile || isInstalled || dismissed) return;
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) { setDismissed(true); return; }

    // Show after short delay
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [isMobile, isInstalled, dismissed]);

  if (!show || dismissed || isInstalled) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  const handleInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      // iOS Safari doesn't support beforeinstallprompt — show instructions
      alert("Para instalar: toque em \"Compartilhar\" (ícone de seta) e depois \"Adicionar à Tela de Início\".");
    }
    handleDismiss();
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-md rounded-2xl border border-border/50 bg-card/95 backdrop-blur-lg shadow-2xl p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Instalar Nexus Metrics</p>
          <p className="text-xs text-muted-foreground">Acesse como um app direto do celular</p>
        </div>
        <Button size="sm" className="shrink-0 text-xs" onClick={handleInstall}>
          Instalar
        </Button>
        <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
