import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCRM } from "@/hooks/useCRM";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const TAG_COLORS = [
  "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#f97316",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#6366f1",
];

export default function TagsManager() {
  const { tags, createTag } = useCRM();
  const { activeAccountId } = useAccount();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deletingTag, setDeletingTag] = useState<any>(null);

  const updateTag = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const { error } = await (supabase as any).from("lead_tags").update({ name, color }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-tags"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Tag atualizada!");
      setEditingTag(null);
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("lead_tag_assignments").delete().eq("tag_id", id);
      const { error } = await (supabase as any).from("lead_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-tags"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Tag removida!");
      setDeletingTag(null);
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTag.mutate({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(TAG_COLORS[0]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Tags</h2>
          <p className="text-sm text-muted-foreground">Crie, edite e gerencie tags para organizar seus leads.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gradient-bg border-0 text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Nova Tag
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Input placeholder="Nome da tag" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()} autoFocus className="flex-1" />
            <ColorPickerInline color={newColor} onChange={setNewColor} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}>Criar</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {tags.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-12 text-center">
          <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma tag criada ainda.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {tags.map((tag: any) => (
            <div key={tag.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 card-shadow">
              {editingTag?.id === tag.id ? (
                <>
                  <ColorPickerInline color={editColor} onChange={setEditColor} />
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && updateTag.mutate({ id: tag.id, name: editName, color: editColor })}
                    className="flex-1 h-8" autoFocus />
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => updateTag.mutate({ id: tag.id, name: editName, color: editColor })}>Salvar</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingTag(null)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="flex-1 text-sm font-medium">{tag.name}</span>
                  <button onClick={() => { setEditingTag(tag); setEditName(tag.name); setEditColor(tag.color); }}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeletingTag(tag)}
                    className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingTag} onOpenChange={(o) => !o && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag "{deletingTag?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A tag será removida de todos os leads associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTag && deleteTag.mutate(deletingTag.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ColorPickerInline({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-8 w-8 rounded-lg flex-shrink-0 ring-1 ring-border hover:ring-primary transition-all cursor-pointer" style={{ backgroundColor: color }} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 z-50" align="start">
        <div className="flex flex-wrap gap-1.5 max-w-[160px]">
          {TAG_COLORS.map((c) => (
            <button key={c} onClick={() => onChange(c)}
              className={cn("h-6 w-6 rounded-full transition-all", color === c ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:scale-110")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
