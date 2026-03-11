import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, RefreshCw, Trash2, QrCode, Smartphone } from "lucide-react";
import { mockAccounts, type GZAccount } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  connected: { label: "Conectado", color: "bg-emerald-500", pulse: true },
  disconnected: { label: "Desconectado", color: "bg-red-500", pulse: false },
  reconnecting: { label: "Reconectando", color: "bg-yellow-500", pulse: true },
};

export default function GZAccounts() {
  const [accounts, setAccounts] = useState<GZAccount[]>(mockAccounts);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [qrStatus, setQrStatus] = useState<"waiting" | "connecting" | "done">("waiting");

  const handleAdd = () => {
    setQrStatus("waiting");
    setTimeout(() => setQrStatus("connecting"), 3000);
    setTimeout(() => {
      setQrStatus("done");
      const acc: GZAccount = {
        id: `acc-${Date.now()}`,
        name: newName || "Nova Conta",
        phone: `+55 11 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        status: "connected",
        campaignCount: 0,
      };
      setAccounts((prev) => [...prev, acc]);
      toast.success("Conta conectada com sucesso!");
      setTimeout(() => { setOpen(false); setNewName(""); }, 800);
    }, 5000);
  };

  const handleRemove = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Conta removida");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas conexões de WhatsApp</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Adicionar Conta</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome da conta (ex: Sandy)" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="relative h-48 w-48 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center bg-muted/20 overflow-hidden">
                  <QrCode className="h-24 w-24 text-muted-foreground/30" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse" />
                  {/* Scanline animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/60 animate-bounce" style={{ animationDuration: "2s" }} />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Abra o WhatsApp → Aparelhos Conectados → Conectar aparelho → Escaneie o QR Code
                </p>
                <Badge variant={qrStatus === "done" ? "default" : "secondary"} className={cn("gap-1.5", qrStatus === "done" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30")}>
                  <div className={cn("h-2 w-2 rounded-full", qrStatus === "waiting" ? "bg-yellow-500 animate-pulse" : qrStatus === "connecting" ? "bg-blue-500 animate-pulse" : "bg-emerald-500")} />
                  {qrStatus === "waiting" ? "Aguardando leitura..." : qrStatus === "connecting" ? "Conectando..." : "Conectado ✓"}
                </Badge>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={qrStatus !== "waiting"}>
                {qrStatus === "waiting" ? "Escanear QR Code" : qrStatus === "connecting" ? "Conectando..." : "Conectado!"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => {
          const st = statusConfig[acc.status];
          return (
            <Card key={acc.id} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{acc.name}</p>
                      <span className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", st.color, st.pulse && "animate-pulse")} />
                        <span className="text-[11px] text-muted-foreground">{st.label}</span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{acc.phone}</p>
                    <p className="text-xs text-muted-foreground mt-1">{acc.campaignCount} campanha(s)</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                    <RefreshCw className="h-3 w-3" /> Reconectar
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleRemove(acc.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
