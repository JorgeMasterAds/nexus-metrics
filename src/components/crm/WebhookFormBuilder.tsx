import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, FileCode, ExternalLink, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  webhookId: string;
  webhookToken: string;
}

export default function WebhookFormBuilder({ webhookId, webhookToken }: Props) {
  const { activeAccountId } = useAccount();
  const { activeProjectId } = useActiveProject();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [redirectType, setRedirectType] = useState<"url" | "checkout">("url");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEmbed, setShowEmbed] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  // Tags query
  const { data: allTags = [] } = useQuery({
    queryKey: ["crm-tags", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("lead_tags")
        .select("*")
        .eq("account_id", activeAccountId)
        .order("name");
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  const { data: forms = [] } = useQuery({
    queryKey: ["webhook-forms", webhookId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("webhook_forms")
        .select("*, webhook_form_tags(tag_id, lead_tags:tag_id(id, name, color))")
        .eq("webhook_id", webhookId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!webhookId,
  });

  const createForm = async () => {
    if (!name.trim() || !activeAccountId) return;
    setSaving(true);
    try {
      const { data: newForm, error } = await (supabase as any).from("webhook_forms").insert({
        account_id: activeAccountId,
        project_id: activeProjectId || null,
        webhook_id: webhookId,
        name: name.trim(),
        redirect_type: redirectType,
        redirect_url: redirectUrl.trim() || null,
      }).select("id").single();
      if (error) throw error;

      // Save tags
      if (selectedTagIds.length > 0 && newForm?.id) {
        await (supabase as any).from("webhook_form_tags").insert(
          selectedTagIds.map(tagId => ({ form_id: newForm.id, tag_id: tagId }))
        );
      }

      toast.success("Formulário criado!");
      setName("");
      setRedirectUrl("");
      setSelectedTagIds([]);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["webhook-forms"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Excluir este formulário?")) return;
    await (supabase as any).from("webhook_forms").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["webhook-forms"] });
    toast.success("Formulário excluído");
  };

  const getFormEndpoint = () =>
    `https://${supabaseProjectId}.supabase.co/functions/v1/form-submit/${webhookToken}`;

  const generateEmbedCode = (form: any) => {
    const endpoint = getFormEndpoint();
    const redirect = form.redirect_url ? `\n      window.location.href = "${form.redirect_url}";` : `\n      alert("Enviado com sucesso!");`;

    return `<!-- Formulário ${form.name} - Nexus Metrics -->
<form id="nexus-form-${form.id.slice(0, 8)}" style="max-width:400px;font-family:system-ui,sans-serif;">
  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;margin-bottom:4px;font-weight:500;">Nome</label>
    <input type="text" name="name" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />
  </div>
  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;margin-bottom:4px;font-weight:500;">Telefone</label>
    <input type="tel" name="phone" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />
  </div>
  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;margin-bottom:4px;font-weight:500;">E-mail</label>
    <input type="email" name="email" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;" />
  </div>
  <button type="submit" style="width:100%;padding:12px;background:#6366f1;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
    Enviar
  </button>
</form>
<script>
  document.getElementById("nexus-form-${form.id.slice(0, 8)}").addEventListener("submit", async function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.form_id = "${form.id}";
    try {
      const res = await fetch("${endpoint}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {${redirect}
      } else {
        alert("Erro ao enviar. Tente novamente.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  });
</script>`;
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7">
              <FileCode className="h-3 w-3" /> Criar Formulário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Formulário de Captura</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Nome do Formulário</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Captura Landing Page" />
              </div>
              <div className="space-y-1.5">
                <Label>Após envio, redirecionar para:</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRedirectType("url")}
                    className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", redirectType === "url" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent")}
                  >
                    URL personalizada
                  </button>
                  <button
                    onClick={() => setRedirectType("checkout")}
                    className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", redirectType === "checkout" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent")}
                  >
                    Checkout
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{redirectType === "checkout" ? "URL do Checkout" : "URL de Redirecionamento"}</Label>
                <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://..." />
              </div>
              {/* Tag selector */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags automáticas para leads</Label>
                <p className="text-[10px] text-muted-foreground">Leads capturados por este formulário receberão estas tags.</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allTags.map((tag: any) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
                      className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? "bg-primary/20 border-primary/40 text-primary font-medium"
                          : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {allTags.length === 0 && (
                    <span className="text-[10px] text-muted-foreground">Nenhuma tag criada. Crie tags no CRM.</span>
                  )}
                </div>
              </div>
              <Button onClick={createForm} disabled={saving || !name.trim()} className="w-full">
                {saving ? "Criando..." : "Criar Formulário"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {forms.map((form: any) => (
        <div key={form.id} className="p-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{form.name}</span>
              <Badge variant="outline" className="text-[9px]">
                {form.redirect_type === "checkout" ? "→ Checkout" : "→ URL"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowEmbed(showEmbed === form.id ? null : form.id)}>
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteForm(form.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {form.webhook_form_tags && form.webhook_form_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {form.webhook_form_tags.map((ft: any) => (
                <Badge key={ft.tag_id} variant="outline" className="text-[9px]" style={{ borderColor: ft.lead_tags?.color || undefined, color: ft.lead_tags?.color || undefined }}>
                  <Tag className="h-2 w-2 mr-0.5" />
                  {ft.lead_tags?.name || ft.tag_id}
                </Badge>
              ))}
            </div>
          )}
          {showEmbed === form.id && (
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Textarea
                  readOnly
                  value={generateEmbedCode(form)}
                  className="font-mono text-[10px] h-40 bg-background"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-6 text-[10px] gap-1"
                  onClick={() => copy(generateEmbedCode(form))}
                >
                  <Copy className="h-3 w-3" /> Copiar HTML
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Cole este código em qualquer página HTML para capturar leads automaticamente.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
