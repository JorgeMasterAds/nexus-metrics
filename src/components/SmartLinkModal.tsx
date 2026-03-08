import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberStepper } from "@/components/ui/number-stepper";
import { X, Plus, Trash2, AlertTriangle, Database } from "lucide-react";
import { useUsageLimits } from "@/hooks/useSubscription";

interface Variant {
  id?: string;
  name: string;
  url: string;
  weight: number;
  is_active: boolean;
  _hasData?: boolean; // local flag: variant has clicks/conversions
  _dataCount?: { clicks: number; conversions: number };
}

interface Props {
  link?: any;
  accountId?: string;
  projectId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SmartLinkModal({ link, accountId, projectId, onClose, onSaved }: Props) {
  const isEditing = !!link;
  const { toast } = useToast();
  const qc = useQueryClient();
  const { maxVariants } = useUsageLimits();

  const [name, setName] = useState(link?.name || "");
  const [slug, setSlug] = useState(link?.slug || "");
  const [variants, setVariants] = useState<Variant[]>(
    link?.smartlink_variants?.length > 0
      ? link.smartlink_variants.map((v: any) => ({ id: v.id, name: v.name, url: v.url, weight: v.weight, is_active: v.is_active }))
      : [
          { name: "Variante A", url: "", weight: 50, is_active: true },
          { name: "Variante B", url: "", weight: 50, is_active: true },
        ]
  );
  const [loading, setLoading] = useState(false);
  const [pendingRemoveIdx, setPendingRemoveIdx] = useState<number | null>(null);

  // On mount (edit mode), check which variants have historical data
  useEffect(() => {
    if (!isEditing) return;
    const variantIds = variants.filter(v => v.id).map(v => v.id!);
    if (variantIds.length === 0) return;

    (async () => {
      const results = await Promise.all(
        variantIds.map(async (vid) => {
          const [{ count: clicks }, { count: conversions }] = await Promise.all([
            (supabase as any).from("clicks").select("id", { count: "exact", head: true }).eq("variant_id", vid),
            (supabase as any).from("conversions").select("id", { count: "exact", head: true }).eq("variant_id", vid),
          ]);
          return { vid, clicks: clicks || 0, conversions: conversions || 0 };
        })
      );

      setVariants(prev => prev.map(v => {
        if (!v.id) return v;
        const r = results.find(r => r.vid === v.id);
        if (!r) return v;
        return {
          ...v,
          _hasData: r.clicks > 0 || r.conversions > 0,
          _dataCount: { clicks: r.clicks, conversions: r.conversions },
        };
      }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const totalWeight = variants.reduce((s, v) => s + v.weight, 0);

  const addVariant = () => {
    if (variants.length >= maxVariants) {
      toast({ title: "Limite atingido", description: `Seu plano permite no máximo ${maxVariants} variantes por Smart Link.`, variant: "destructive" });
      return;
    }
    setVariants([...variants, { name: `Variante ${String.fromCharCode(65 + variants.length)}`, url: "", weight: 0, is_active: true }]);
  };

  const removeVariant = (i: number) => {
    if (variants.length <= 1) return;
    const v = variants[i];
    // If variant has historical data, show confirmation
    if (v._hasData) {
      setPendingRemoveIdx(i);
      return;
    }
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const confirmRemoveVariant = () => {
    if (pendingRemoveIdx === null) return;
    // Don't remove from state — archive it (set inactive + weight 0)
    setVariants(variants.map((v, idx) =>
      idx === pendingRemoveIdx ? { ...v, is_active: false, weight: 0 } : v
    ));
    setPendingRemoveIdx(null);
    toast({ title: "Variante arquivada", description: "Dados históricos preservados. A variante ficará inativa com peso 0." });
  };

  const updateVariant = (i: number, field: keyof Variant, value: any) => {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  };

  const equalizeWeights = () => {
    const activeVariants = variants.filter(v => v.is_active);
    const w = Math.floor(100 / activeVariants.length);
    const remainder = 100 - w * activeVariants.length;
    let activeIdx = 0;
    setVariants(variants.map((v) => {
      if (!v.is_active) return { ...v, weight: 0 };
      const weight = w + (activeIdx === 0 ? remainder : 0);
      activeIdx++;
      return { ...v, weight };
    }));
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({ title: "Preencha nome e slug", variant: "destructive" });
      return;
    }
    // Only active variants need to sum 100
    const activeWeight = variants.filter(v => v.is_active).reduce((s, v) => s + v.weight, 0);
    if (activeWeight !== 100) {
      toast({ title: `Pesos das variantes ativas devem somar 100% (atual: ${activeWeight}%)`, variant: "destructive" });
      return;
    }
    if (variants.filter(v => v.is_active).some(v => !v.url.trim())) {
      toast({ title: "Todas as variantes ativas precisam de uma URL", variant: "destructive" });
      return;
    }
    const activeUrls = variants.filter(v => v.is_active).map(v => v.url.trim().toLowerCase());
    const uniqueUrls = new Set(activeUrls);
    if (uniqueUrls.size !== activeUrls.length) {
      toast({ title: "As variantes ativas não podem ter URLs iguais", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Não autenticado");

      if (isEditing) {
        const { error } = await (supabase as any).from("smartlinks").update({ name, slug }).eq("id", link.id);
        if (error) throw error;

        // Separate existing variants (have id) from new ones
        const existingVariants = variants.filter(v => v.id);
        const newVariants = variants.filter(v => !v.id);

        // Find removed variant IDs (were in original but not in current list)
        const currentIds = new Set(existingVariants.map(v => v.id));
        const originalIds = (link.smartlink_variants || []).map((v: any) => v.id);
        const removedIds = originalIds.filter((id: string) => !currentIds.has(id));

        // NEVER hard-delete variants — always archive (preserve historical metrics)
        if (removedIds.length > 0) {
          const { error: ae } = await (supabase as any)
            .from("smartlink_variants")
            .update({ is_active: false, weight: 0 })
            .in("id", removedIds);
          if (ae) throw ae;
        }

        // Update existing variants (preserving their IDs and historical data)
        for (const v of existingVariants) {
          const { error: ue } = await (supabase as any)
            .from("smartlink_variants")
            .update({ name: v.name, url: v.url, weight: v.weight, is_active: v.is_active })
            .eq("id", v.id);
          if (ue) throw ue;
        }

        // Insert only new variants
        if (newVariants.length > 0) {
          const { error: ve } = await (supabase as any).from("smartlink_variants").insert(
            newVariants.map(v => ({ smartlink_id: link.id, account_id: accountId, name: v.name, url: v.url, weight: v.weight, is_active: v.is_active }))
          );
          if (ve) throw ve;
        }
      } else {
        const { data: sl, error: sle } = await (supabase as any)
          .from("smartlinks")
          .insert({ name, slug: slug.toLowerCase().replace(/\s+/g, "-"), account_id: accountId, project_id: projectId || null, created_by: userId })
          .select()
          .single();
        if (sle) throw sle;

        const { error: ve } = await (supabase as any).from("smartlink_variants").insert(
          variants.filter(v => v.is_active).map(v => ({ smartlink_id: sl.id, account_id: accountId, name: v.name, url: v.url, weight: v.weight, is_active: v.is_active }))
        );
        if (ve) throw ve;
      }

      toast({ title: isEditing ? "Smart Link atualizado!" : "Smart Link criado!" });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeWeight = variants.filter(v => v.is_active).reduce((s, v) => s + v.weight, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border/50 rounded-xl card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold">{isEditing ? "Editar Smart Link" : "Novo Smart Link"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome do Smart Link</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: VSL Principal" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL)</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                  placeholder="vsl-principal"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Variantes</Label>
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" onClick={equalizeWeights} className="h-7 px-2 text-xs">
                  Dividir %
                </Button>
                <span className={`text-xs font-mono ${activeWeight === 100 ? "text-success" : "text-destructive"}`}>
                  Ativas: {activeWeight}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={v.id || i} className={`rounded-lg border p-4 space-y-3 ${
                  !v.is_active ? "border-muted bg-muted/10 opacity-60" : "border-border/40 bg-muted/20"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={v.name}
                        onChange={(e) => updateVariant(i, "name", e.target.value)}
                        placeholder="Nome da variante"
                        className="font-medium h-8 text-sm w-40"
                      />
                      {v._hasData && (
                        <span className="flex items-center gap-1 text-xs text-amber-500" title={`${v._dataCount?.clicks || 0} cliques, ${v._dataCount?.conversions || 0} conversões`}>
                          <Database className="h-3 w-3" />
                          dados
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Peso:</Label>
                        <NumberStepper
                          value={v.weight}
                          onChange={(val) => updateVariant(i, "weight", val)}
                          min={0}
                          max={100}
                          suffix="%"
                        />
                      </div>
                      <button
                        onClick={() => updateVariant(i, "is_active", !v.is_active)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${v.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}
                      >
                        {v.is_active ? "Ativa" : "Inativa"}
                      </button>
                      {variants.length > 1 && (
                        <button onClick={() => removeVariant(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Input
                    value={v.url}
                    onChange={(e) => updateVariant(i, "url", e.target.value)}
                    placeholder="https://sua-pagina.com/venda"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addVariant}
              disabled={variants.length >= maxVariants}
              className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border/50 rounded-lg py-2.5 transition-colors hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Adicionar variante {variants.length >= maxVariants && `(máx. ${maxVariants})`}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={loading || activeWeight !== 100}
            className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
          >
            {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar Smart Link"}
          </Button>
        </div>
      </div>

      {/* Confirmation dialog for removing variant with data */}
      {pendingRemoveIdx !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="font-semibold">Variante com dados históricos</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              A variante <strong>"{variants[pendingRemoveIdx]?.name}"</strong> possui{" "}
              <strong>{variants[pendingRemoveIdx]?._dataCount?.clicks || 0} cliques</strong> e{" "}
              <strong>{variants[pendingRemoveIdx]?._dataCount?.conversions || 0} conversões</strong> vinculadas.
            </p>
            <p className="text-sm text-muted-foreground">
              Para preservar os dados, ela será <strong>arquivada</strong> (inativa, peso 0) em vez de excluída.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setPendingRemoveIdx(null)}>Cancelar</Button>
              <Button size="sm" variant="destructive" onClick={confirmRemoveVariant}>Arquivar variante</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
