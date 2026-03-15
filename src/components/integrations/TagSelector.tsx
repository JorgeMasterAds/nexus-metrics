import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, X, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TagSelectorProps {
  accountId?: string;
  projectId?: string;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  label?: string;
  helpText?: string;
}

export default function TagSelector({
  accountId,
  projectId,
  selectedTagIds,
  onTagsChange,
  label = "Tags adicionais ao lead",
  helpText = "As tags de compra serão adicionadas dinamicamente. Utilize esta opção somente se desejar incluir uma nova tag. (Exemplo: nome-do-produto)",
}: TagSelectorProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: allTags = [] } = useQuery({
    queryKey: ["lead_tags", accountId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("lead_tags")
        .select("*")
        .eq("account_id", accountId)
        .order("name");
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!accountId,
  });

  const filteredTags = allTags.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim() || !accountId) return;
    setCreating(true);
    try {
      const normalizedName = newTagName.trim().toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await (supabase as any)
        .from("lead_tags")
        .insert({
          account_id: accountId,
          project_id: projectId || null,
          name: normalizedName,
          color: "#6366f1",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Tag criada!");
      qc.invalidateQueries({ queryKey: ["lead_tags"] });
      if (data?.id) {
        onTagsChange([...selectedTagIds, data.id]);
      }
      setNewTagName("");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const selectedTags = allTags.filter((t: any) => selectedTagIds.includes(t.id));

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5" /> {label}
      </Label>

      <div className="flex items-center gap-2">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 flex items-center justify-between min-h-[40px] px-3 py-2 rounded-md border border-input bg-card text-sm text-left"
            >
              <span className="text-muted-foreground truncate">
                {selectedTags.length > 0
                  ? selectedTags.map((t: any) => t.name).join(", ")
                  : "Selecionar tags..."}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tag..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredTags.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma tag encontrada.
                </p>
              ) : (
                filteredTags.map((tag: any) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        selectedTagIds.includes(tag.id)
                          ? "bg-primary border-primary"
                          : "border-input"
                      }`}
                    >
                      {selectedTagIds.includes(tag.id) && (
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{tag.name}</span>
                    {tag.description && (
                      <span className="text-muted-foreground text-xs ml-1">- {tag.description}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          title="Criar Tag"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedTags.map((tag: any) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/10"
              style={{ borderColor: tag.color || undefined, color: tag.color || undefined }}
              onClick={() => toggleTag(tag.id)}
            >
              <Tag className="h-2.5 w-2.5" />
              {tag.name}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">{helpText}</p>

      {/* Create Tag Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Criar Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nome"
              onKeyDown={(e) => e.key === "Enter" && createTag()}
            />
            <div className="flex justify-end">
              <Button onClick={createTag} disabled={creating || !newTagName.trim()}>
                {creating ? "Salvando..." : "SALVAR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
