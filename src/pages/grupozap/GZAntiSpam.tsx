import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Trash2, ShieldBan } from "lucide-react";
import { mockBlockedNumbers, type GZBlockedNumber } from "@/data/grupozap-mock";
import { toast } from "sonner";

export default function GZAntiSpam() {
  const [blocked, setBlocked] = useState<GZBlockedNumber[]>(mockBlockedNumbers);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  const handleAdd = () => {
    if (!phone) return;
    setBlocked((prev) => [...prev, { id: `bl-${Date.now()}`, phone, reason, addedAt: new Date().toISOString().split("T")[0] }]);
    setPhone(""); setReason("");
    toast.success("Número bloqueado");
  };

  const handleRemove = (id: string) => {
    setBlocked((prev) => prev.filter((b) => b.id !== id));
    toast.success("Número desbloqueado");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Anti-Spam</h1>
        <p className="text-sm text-muted-foreground">Blocklist de participantes indesejados</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div><Label>Número</Label><Input placeholder="+55 11 99999-0000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Motivo (opcional)</Label><Input placeholder="Spam, concorrente..." value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button className="gap-1.5 flex-1" onClick={handleAdd}><Plus className="h-4 w-4" /> Adicionar</Button>
              <Button variant="outline" className="gap-1.5"><Upload className="h-4 w-4" /> CSV</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/20 bg-muted/20"><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Número</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Motivo</th><th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Adicionado</th><th className="px-4 py-2.5"></th></tr></thead>
          <tbody>
            {blocked.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground"><ShieldBan className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>Nenhum número bloqueado</p></td></tr>
            ) : blocked.map((b) => (
              <tr key={b.id} className="border-b border-border/10 hover:bg-muted/10">
                <td className="px-4 py-2.5 font-medium">{b.phone}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.reason || "—"}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.addedAt}</td>
                <td className="px-4 py-2.5"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(b.id)}><Trash2 className="h-3 w-3" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
