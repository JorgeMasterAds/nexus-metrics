import { useState, useRef } from "react";
import { useHubKnowledgeBases } from "@/hooks/useAgentHub";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, BookOpen, MoreHorizontal, Trash2, Upload, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const S = supabase as any;

export default function HubKnowledge() {
  const { knowledgeBases, isLoading, create, remove, userId } = useHubKnowledgeBases();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", chunk_size: 500, chunk_overlap: 50 });
  const [creating, setCreating] = useState(false);
  const [selectedKb, setSelectedKb] = useState<any>(null);
  const [addTextOpen, setAddTextOpen] = useState(false);
  const [textForm, setTextForm] = useState({ name: "", content: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await create.mutateAsync(form);
      setShowCreate(false);
      setForm({ name: "", description: "", chunk_size: 500, chunk_overlap: 50 });
    } finally {
      setCreating(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!selectedKb || !userId) return;
    try {
      const text = await file.text();
      const { error } = await S.from("hub_knowledge_documents").insert({
        knowledge_base_id: selectedKb.id,
        user_id: userId,
        name: file.name,
        content: text,
        doc_type: "text",
      });
      if (error) throw error;
      toast.success(`"${file.name}" adicionado!`);
      qc.invalidateQueries({ queryKey: ["hub-kb"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao fazer upload");
    }
  };

  const handleAddText = async () => {
    if (!selectedKb || !userId || !textForm.content.trim()) return;
    try {
      const { error } = await S.from("hub_knowledge_documents").insert({
        knowledge_base_id: selectedKb.id,
        user_id: userId,
        name: textForm.name || "Texto sem título",
        content: textForm.content,
        doc_type: "text",
      });
      if (error) throw error;
      toast.success("Documento adicionado!");
      setAddTextOpen(false);
      setTextForm({ name: "", content: "" });
      qc.invalidateQueries({ queryKey: ["hub-kb"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Bases de Conhecimento</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Knowledge Base
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="rounded-md border border-border bg-card p-6 h-40 animate-pulse" />)}
        </div>
      ) : knowledgeBases.length === 0 ? (
        <div className="text-center py-20 rounded-md border border-border bg-card">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma base de conhecimento</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie uma base de conhecimento para usar RAG nos seus agentes</p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar Knowledge Base
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeBases.map((kb: any) => (
            <div key={kb.id} className="rounded-md border border-border bg-card p-6 card-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">📚</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate(kb.id)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{kb.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{kb.description || "Sem descrição"}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{kb.document_count || 0} docs</span>
                <span>Chunk: {kb.chunk_size}</span>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setSelectedKb(kb)}>
                  <FileText className="h-3 w-3 mr-1" /> Documentos
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept=".txt,.md,.csv" hidden onChange={e => { if (e.target.files?.[0]) handleUploadFile(e.target.files[0]); e.target.value = ""; }} />

      <Dialog open={!!selectedKb} onOpenChange={() => setSelectedKb(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📚 {selectedKb?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedKb?.description || "Sem descrição"}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Upload (.txt, .md)
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddTextOpen(true)}>
                <FileText className="h-3.5 w-3.5" /> Texto direto
              </Button>
            </div>
            <div className="text-center py-8 text-sm text-muted-foreground">
              {(selectedKb?.document_count || 0) === 0
                ? "Nenhum documento adicionado ainda. Use os botões acima para adicionar."
                : `${selectedKb?.document_count} documento(s) nesta base.`}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Text Dialog */}
      <Dialog open={addTextOpen} onOpenChange={setAddTextOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar texto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome do documento</Label>
              <Input value={textForm.name} onChange={e => setTextForm({ ...textForm, name: e.target.value })} className="mt-1" placeholder="Ex: FAQ do produto" />
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <Textarea value={textForm.content} onChange={e => setTextForm({ ...textForm, content: e.target.value })} className="mt-1" rows={8} placeholder="Cole o texto aqui..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTextOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddText} disabled={!textForm.content.trim()}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Manual do produto" className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div>
              <Label>Chunk Size: {form.chunk_size}</Label>
              <Slider value={[form.chunk_size]} onValueChange={([v]) => setForm({ ...form, chunk_size: v })} min={100} max={1000} step={50} className="mt-2" />
            </div>
            <div>
              <Label>Chunk Overlap: {form.chunk_overlap}</Label>
              <Slider value={[form.chunk_overlap]} onValueChange={([v]) => setForm({ ...form, chunk_overlap: v })} min={0} max={200} step={10} className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || creating}>
              {creating ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
