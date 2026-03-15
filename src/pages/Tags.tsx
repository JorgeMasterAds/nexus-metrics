import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Tag as TagIcon, Users, Webhook } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ChartLoader from "@/components/ChartLoader";
import TagChip from "@/components/TagChip";
import { useTags, type Tag } from "@/hooks/useTags";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#625CF3", "#ef4444", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
];

function TagForm({ tag, onSave, onClose, isPending }: {
  tag?: Tag | null;
  onSave: (data: { name: string; color: string }) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(tag?.name || "");
  const [color, setColor] = useState(tag?.color || PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState("");

  const isValid = /^[a-z0-9-]+$/.test(name.toLowerCase().replace(/\s+/g, "-"));

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label className="text-xs">Nome da tag</Label>
        <Input
          className="mt-1"
          value={name}
          onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          placeholder="ex: compra-realizada"
        />
        {name && !isValid && (
          <p className="text-[10px] text-destructive mt-1">Use apenas letras minúsculas, números e hífens</p>
        )}
      </div>
      <div>
        <Label className="text-xs">Cor</Label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "h-8 w-8 rounded-lg border-2 transition-all",
                color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Input
            className="max-w-[120px] h-8 text-xs"
            value={customColor}
            onChange={(e) => { setCustomColor(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value); }}
            placeholder="#hex"
          />
          <div className="h-8 w-8 rounded-lg border border-border" style={{ backgroundColor: color }} />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <TagChip tag={{ id: "preview", name: name || "preview", color }} size="md" />
      </div>
      <Button className="w-full" onClick={() => onSave({ name, color })} disabled={!name || !isValid || isPending}>
        {isPending ? "Salvando..." : tag ? "Atualizar tag" : "Criar tag"}
      </Button>
    </div>
  );
}

export default function Tags() {
  const { tags, isLoading, createTag, updateTag, deleteTag } = useTags();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  const handleSave = (data: { name: string; color: string }) => {
    if (editingTag) {
      updateTag.mutate({ id: editingTag.id, ...data }, { onSuccess: () => { setShowForm(false); setEditingTag(null); } });
    } else {
      createTag.mutate(data, { onSuccess: () => setShowForm(false) });
    }
  };

  return (
    <DashboardLayout
      title="Tags"
      subtitle="Organize seus leads com etiquetas personalizadas"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingTag(null); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" /> Nova tag
        </Button>
      }
    >
      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <ChartLoader text="Carregando tags..." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <TagIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {search ? "Nenhuma tag encontrada" : "Nenhuma tag criada"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Crie tags para organizar e segmentar seus leads automaticamente.
          </p>
          {!search && (
            <Button onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Criar primeira tag
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tag) => (
            <div
              key={tag.id}
              className="glass rounded-xl p-4 border border-border hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${tag.color}15` }}
                  >
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{tag.name}</h4>
                    <TagChip tag={tag} size="sm" className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {tag.lead_count} leads
                </span>
                <span className="flex items-center gap-1">
                  <Webhook className="h-3 w-3" /> {tag.webhook_count} webhooks
                </span>
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => { setEditingTag(tag); setShowForm(true); }}
                >
                  <Edit2 className="h-3 w-3" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingTag(tag)}
                >
                  <Trash2 className="h-3 w-3" /> Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingTag(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Editar tag" : "Nova tag"}</DialogTitle>
          </DialogHeader>
          <TagForm
            tag={editingTag}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditingTag(null); }}
            isPending={createTag.isPending || updateTag.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag "{deletingTag?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta tag será removida de {deletingTag?.lead_count || 0} leads e {deletingTag?.webhook_count || 0} webhooks. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingTag) deleteTag.mutate(deletingTag.id, { onSuccess: () => setDeletingTag(null) });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
