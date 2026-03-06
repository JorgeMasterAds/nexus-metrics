import { useState } from "react";
import { useHubKnowledgeBases } from "@/hooks/useAgentHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, BookOpen, MoreHorizontal, Trash2, Search, Upload, Link2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function HubKnowledge() {
  const { knowledgeBases, isLoading, create, remove } = useHubKnowledgeBases();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", chunk_size: 500, chunk_overlap: 50 });
  const [creating, setCreating] = useState(false);
  const [selectedKb, setSelectedKb] = useState<any>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Bases de Conhecimento</h1>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="h-4 w-4" /> Nova Knowledge Base
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-40 animate-pulse" />)}
        </div>
      ) : knowledgeBases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <BookOpen className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma base de conhecimento</h3>
          <p className="text-sm text-slate-500 mb-4">Crie uma base de conhecimento para usar RAG nos seus agentes</p>
          <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Plus className="h-4 w-4" /> Criar Knowledge Base
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeBases.map((kb: any) => (
            <div key={kb.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">📚</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-600" onClick={() => remove.mutate(kb.id)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{kb.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{kb.description || "Sem descrição"}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{kb.document_count || 0} docs</span>
                <span>Chunk: {kb.chunk_size}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setSelectedKb(kb)}>
                  <FileText className="h-3 w-3 mr-1" /> Documentos
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => toast.info("Busca RAG em breve!")}>
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KB Detail drawer */}
      <Dialog open={!!selectedKb} onOpenChange={() => setSelectedKb(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📚 {selectedKb?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{selectedKb?.description || "Sem descrição"}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Upload de documentos em breve!")}>
                <Upload className="h-3.5 w-3.5" /> Upload
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Adicionar URL em breve!")}>
                <Link2 className="h-3.5 w-3.5" /> URL
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Texto direto em breve!")}>
                <FileText className="h-3.5 w-3.5" /> Texto
              </Button>
            </div>
            <div className="text-center py-8 text-sm text-slate-400">
              Nenhum documento adicionado ainda. Use os botões acima para adicionar documentos.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create modal */}
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
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreate} disabled={!form.name.trim() || creating}>
              {creating ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
