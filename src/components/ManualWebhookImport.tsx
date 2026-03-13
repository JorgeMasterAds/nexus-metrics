import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, AlertCircle } from "lucide-react";

export default function ManualWebhookImport() {
  const { activeAccountId } = useAccount();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [selectedWebhook, setSelectedWebhook] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { data: webhooks = [] } = useQuery({
    queryKey: ["import-webhooks", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("webhooks")
        .select("id, name, token, platform, project_id")
        .eq("account_id", activeAccountId)
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    enabled: !!activeAccountId && open,
  });

  const handleSubmit = async () => {
    if (!selectedWebhook || !jsonInput.trim()) return;
    setSending(true);
    setResult(null);

    const webhook = webhooks.find((w: any) => w.id === selectedWebhook);
    if (!webhook?.token) {
      setResult({ ok: false, message: "Webhook não encontrado" });
      setSending(false);
      return;
    }

    try {
      const payload = JSON.parse(jsonInput.trim());
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/webhook/${webhook.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setResult({ ok: true, message: "Webhook processado com sucesso!" });
        toast({ title: "Webhook importado com sucesso!" });
        queryClient.invalidateQueries({ queryKey: ["webhook-logs"] });
        setJsonInput("");
      } else {
        const errText = await res.text();
        setResult({ ok: false, message: `Erro ${res.status}: ${errText}` });
      }
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setResult({ ok: false, message: "JSON inválido. Verifique o formato." });
      } else {
        setResult({ ok: false, message: err.message });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Importar Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Webhook Manualmente</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Cole o payload JSON enviado pela plataforma (Cakto, Hotmart, etc.) para processá-lo manualmente no Nexus.
        </p>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Webhook de destino</Label>
            <Select value={selectedWebhook} onValueChange={setSelectedWebhook}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione o webhook" />
              </SelectTrigger>
              <SelectContent>
                {webhooks.map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.platform})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payload JSON</Label>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"event": "PURCHASE_APPROVED", "data": { ... }}'
              className="font-mono text-[11px] min-h-[200px]"
            />
          </div>
          {result && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${result.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{result.message}</span>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={sending || !selectedWebhook || !jsonInput.trim()}
            className="w-full"
          >
            {sending ? "Processando..." : "Enviar Webhook"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
