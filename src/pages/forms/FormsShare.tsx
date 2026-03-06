import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, ExternalLink, Code, Mail, QrCode, Lock, Globe } from "lucide-react";
import { mockForms } from "@/lib/formMockData";
import { toast } from "sonner";

export default function FormsShare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const form = mockForms.find(f => f.id === id);

  if (!form) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Formulário não encontrado.</div>;

  const publicUrl = `${window.location.origin}/f/${form.id}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <DashboardLayout
      title={`Compartilhar: ${form.name}` as any}
      subtitle="Configure como seu formulário será distribuído."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/forms")} className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/forms/${id}/results`)} className="gap-1.5 text-xs">
            Ver Resultados
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Link */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Link Compartilhável</h3>
          </div>
          <div className="flex gap-2">
            <Input value={publicUrl} readOnly className="text-xs" />
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(publicUrl, "Link")} className="shrink-0 gap-1">
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-success/15 text-success gap-1">
              <Globe className="h-3 w-3" /> Público
            </Badge>
          </div>
        </div>

        {/* Embed */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Incorporar (Embed)</h3>
          </div>
          <div className="relative">
            <pre className="text-[10px] p-3 rounded-lg bg-secondary text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all border border-border/30">{embedCode}</pre>
          </div>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(embedCode, "Código embed")} className="gap-1">
            <Copy className="h-3.5 w-3.5" /> Copiar Código
          </Button>
        </div>

        {/* QR Code placeholder */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">QR Code</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-muted/30 rounded-lg border border-border/20">
            <div className="text-center">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">QR Code para {publicUrl}</p>
            </div>
          </div>
        </div>

        {/* Access settings */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Configurações de Acesso</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Público (sem autenticação)</Label>
              <Switch checked={form.settings.isPublic} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Permitir múltiplas respostas</Label>
              <Switch checked={form.settings.allowMultipleResponses} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Exigir email</Label>
              <Switch checked={form.settings.requireEmail} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Limite de respostas</Label>
              <Input type="number" placeholder="Sem limite" value={form.settings.responseLimit || ""} className="text-xs" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
