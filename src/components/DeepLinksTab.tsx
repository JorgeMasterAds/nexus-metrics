import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "@/hooks/useAccount";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectRole } from "@/hooks/useProjectRole";
import { Plus, Copy, Trash2, ExternalLink, X, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const generateShortSlug = () => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const SMARTLINK_DOMAIN = "smartlink.nexusmetrics.jmads.com.br";

export default function DeepLinksTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { activeAccountId } = useAccount();
  const { activeProjectId, activeProject } = useActiveProject();
  const { canCreate, canEdit, canDelete } = useProjectRole();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Fetch custom domain
  const { data: customDomain } = useQuery({
    queryKey: ["active-custom-domain", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("custom_domains")
        .select("domain")
        .eq("account_id", activeAccountId)
        .eq("is_verified", true)
        .eq("is_active", true);
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data } = await q.limit(1).maybeSingle();
      return data?.domain || null;
    },
    enabled: !!activeAccountId,
  });

  // Fetch project slug
  const { data: projectSlug } = useQuery({
    queryKey: ["project-slug", activeProjectId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("projects")
        .select("slug")
        .eq("id", activeProjectId)
        .maybeSingle();
      return data?.slug || null;
    },
    enabled: !!activeProjectId,
  });

  const { data: deeplinks = [], isLoading } = useQuery({
    queryKey: ["deeplinks", activeAccountId, activeProjectId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("deeplinks")
        .select("*")
        .eq("account_id", activeAccountId)
        .order("created_at", { ascending: false });
      if (activeProjectId) q = q.eq("project_id", activeProjectId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  const getDeepLinkUrl = (dlSlug: string) => {
    const domain = customDomain || SMARTLINK_DOMAIN;
    const projPath = projectSlug ? `${projectSlug}/` : "";
    return `https://${domain}/${projPath}dl-${dlSlug}`;
  };

  const copyLink = (dlSlug: string) => {
    navigator.clipboard.writeText(getDeepLinkUrl(dlSlug));
    toast({ title: "Link copiado!" });
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDestinationUrl("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (dl: any) => {
    setName(dl.name);
    setSlug(dl.slug);
    setDestinationUrl(dl.destination_url);
    setEditingId(dl.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim() || !destinationUrl.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    try {
      new URL(destinationUrl);
    } catch {
      toast({ title: "URL de destino inválida", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Não autenticado");

      const cleanSlug = slug.toLowerCase().replace(/^dl-+/, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      if (editingId) {
        const { error } = await (supabase as any)
          .from("deeplinks")
          .update({ name, slug: cleanSlug, destination_url: destinationUrl })
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Deep Link atualizado!" });
      } else {
        const { error } = await (supabase as any)
          .from("deeplinks")
          .insert({
            name,
            slug: cleanSlug,
            destination_url: destinationUrl,
            account_id: activeAccountId,
            project_id: activeProjectId || null,
            created_by: userId,
          });
        if (error) throw error;
        toast({ title: "Deep Link criado!" });
      }

      qc.invalidateQueries({ queryKey: ["deeplinks"] });
      resetForm();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("deeplinks").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deeplinks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("deeplinks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deeplinks"] });
      toast({ title: "Deep Link excluído" });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{editingId ? "Editar Deep Link" : "Novo Deep Link"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Checkout Produto X" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">dl-</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/^dl-+/, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                  placeholder="checkout-produto-x"
                />
                <Button type="button" variant="outline" size="sm" className="h-10 px-3" onClick={() => setSlug(generateShortSlug())}>
                  Curto
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>URL de destino</Label>
              <Input value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="https://exemplo.com/pagina" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button
              size="sm"
              className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Salvando..." : editingId ? "Salvar" : "Criar Deep Link"}
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      {canCreate && !showForm && (
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Deep Link
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border/50 rounded-xl card-shadow p-6 space-y-4">
            <h3 className="font-semibold">Excluir Deep Link</h3>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong>{deleteTarget.name}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(deleteTarget.id)}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : deeplinks.length === 0 && !showForm ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center">
          <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm mb-4">Nenhum Deep Link criado ainda.</p>
          {canCreate && (
            <Button className="gradient-bg border-0 text-primary-foreground" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Criar primeiro Deep Link
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {deeplinks.map((dl: any) => (
            <div key={dl.id} className="rounded-xl bg-card border border-border/50 card-shadow p-4">
              <div className="flex items-center gap-3">
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dl.is_active ? "bg-success" : "bg-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{dl.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {getDeepLinkUrl(dl.slug)}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-muted/40 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Acessos:</span>
                  <span className="text-sm font-bold">{dl.click_count.toLocaleString("pt-BR")}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(dl.slug)} className="text-muted-foreground hover:text-foreground transition-colors" title="Copiar link">
                    <Copy className="h-4 w-4" />
                  </button>
                  <a href={dl.destination_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Abrir destino">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {canEdit && (
                    <Switch
                      checked={dl.is_active}
                      onCheckedChange={(val) => toggleActive.mutate({ id: dl.id, is_active: val })}
                      className="scale-75"
                    />
                  )}
                  {canEdit && (
                    <button onClick={() => handleEdit(dl)} className="text-muted-foreground hover:text-foreground transition-colors text-xs underline">
                      Editar
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setDeleteTarget(dl)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1.5 truncate pl-5">
                → {dl.destination_url}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
