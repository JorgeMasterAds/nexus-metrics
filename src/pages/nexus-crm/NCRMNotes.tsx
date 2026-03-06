import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useCRM2 } from "@/hooks/useCRM2";
import { FileText, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const S = supabase as any;

export default function NCRMNotes() {
  const { activeAccountId } = useAccount();
  const crm = useCRM2();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  const notesQuery = useQuery({
    queryKey: ["crm2-all-notes", activeAccountId],
    queryFn: async () => {
      const { data } = await S.from("crm2_notes").select("*")
        .eq("account_id", activeAccountId).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  const notes = (notesQuery.data || []).filter((n: any) => {
    const q = search.toLowerCase();
    return !q || (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q);
  });

  const handleCreate = () => {
    if (!form.content) return;
    crm.addNote.mutate({ ...form, reference_type: "lead", reference_id: "" }, {
      onSuccess: () => { setShowCreate(false); setForm({ title: "", content: "" }); notesQuery.refetch(); }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Notas</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="h-9 pl-9 pr-3 rounded-md text-sm text-[#F5F5F5] w-48 outline-none"
              style={{ background: "#111", border: "1px solid #2A2A2A" }} />
          </div>
          <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-white flex items-center gap-1.5" style={{ background: "#E5191A" }}>
            <Plus className="h-4 w-4" /> Nova Nota
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <FileText className="h-12 w-12 text-[#E5191A] opacity-40 mb-4" />
          <p className="text-lg font-semibold text-[#F5F5F5]">Nenhuma nota</p>
          <p className="text-sm text-[#A0A0A0]">Crie notas para documentar interações</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n: any) => (
            <div key={n.id} className="rounded-md border p-4 transition-all hover:border-[#E5191A]"
              style={{ background: "#161616", borderColor: "#2A2A2A" }}>
              {n.title && <p className="text-sm font-medium text-[#F5F5F5] mb-1">{n.title}</p>}
              <p className="text-sm text-[#A0A0A0] line-clamp-3">{n.content}</p>
              <p className="text-[10px] text-[#555] mt-3">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ background: "#161616", borderColor: "#2A2A2A" }}>
          <DialogHeader><DialogTitle className="text-[#F5F5F5]">Nova Nota</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#A0A0A0] mb-1 block">Título</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full h-9 px-3 rounded-md text-sm text-[#F5F5F5] outline-none" style={{ background: "#111", border: "1px solid #2A2A2A" }} />
            </div>
            <div>
              <label className="text-xs text-[#A0A0A0] mb-1 block">Conteúdo *</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5}
                className="w-full px-3 py-2 rounded-md text-sm text-[#F5F5F5] outline-none resize-none" style={{ background: "#111", border: "1px solid #2A2A2A" }} />
            </div>
            <button onClick={handleCreate} disabled={!form.content}
              className="w-full h-10 rounded-md text-sm font-medium text-white disabled:opacity-50" style={{ background: "#E5191A" }}>
              Salvar Nota
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
