import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Copy, Webhook, AlertTriangle } from "lucide-react";
import { mockWebhooks, mockAccounts } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const platforms = ["Hotmart", "Eduzz", "Kiwify", "Guru", "Green", "Active Campaign", "API Genérica"];

export default function GZWebhooks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-sm text-muted-foreground">Integrações com plataformas de vendas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Criar Webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input placeholder="Hotmart - Curso Principal" /></div>
              <div><Label>Plataforma</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>ID do Produto</Label><Input placeholder="12345" /></div>
              <div><Label>Conta WhatsApp</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{mockAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
              <Alert className="border-yellow-500/30 bg-yellow-500/5"><AlertTriangle className="h-4 w-4 text-yellow-500" /><AlertDescription className="text-xs">Recomendamos usar uma conta separada para webhooks para evitar risco de banimento.</AlertDescription></Alert>
              <Button className="w-full" onClick={() => toast.success("Webhook criado!")}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {mockWebhooks.map((wh) => (
          <Card key={wh.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{wh.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] mt-1">{wh.platform}</Badge>
                </div>
                <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-1.5">
                  <span className="text-[10px] text-muted-foreground truncate max-w-48">{wh.url}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copiada!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border/20 overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/20 border-b border-border/20"><th className="text-left px-3 py-2 font-medium text-muted-foreground">Evento</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Mensagem</th><th className="text-center px-3 py-2 font-medium text-muted-foreground">Ativo</th><th className="text-center px-3 py-2 font-medium text-muted-foreground">Execuções</th></tr></thead>
                  <tbody>
                    {wh.events.map((ev, i) => (
                      <tr key={i} className="border-b border-border/10">
                        <td className="px-3 py-2 font-medium">{ev.event}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-48">{ev.message}</td>
                        <td className="px-3 py-2 text-center"><Switch checked={ev.enabled} /></td>
                        <td className="px-3 py-2 text-center">{ev.executions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
