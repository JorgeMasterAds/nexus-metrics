import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAccount";
import { useCRM2 } from "@/hooks/useCRM2";
import { FileText, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const S = supabase as any;

export default function NCRMNotes() {
  const { activeAccountId } = useAccount();
  const crm = useCRM2();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", reference_type: "general", reference_id: "" });

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
    const payload: any = { title: form.title, content: form.content };
    if (form.reference_type !== "general" && form.reference_id) {
      payload.reference_type = form.reference_type;
      payload.reference_id = form.reference_id;
    }
    // For general notes, don't set reference_type/reference_id
    crm.addNote.mutate(payload, {
      onSuccess: () => { setShowCreate(false); setForm({ title: "", content: "", reference_type: "general", reference_id: "" }); notesQuery.refetch(); }
    });
  };

  const referenceOptions = [
    ...crm.leads.map((l: any) => ({ id: l.id, type: "lead", label: `Lead: ${l.first_name} ${l.last_name || ""}` })),
    ...crm.deals.map((d: any) => ({ id: d.id, type: "deal", label: `Deal: ${d.title}` })),
    ...crm.contacts.map((c: any) => ({ id: c.id, type: "contact", label: `Contato: ${c.first_name} ${c.last_name || ""}` })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Notas</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="h-9 pl-9 pr-3 w-48" />
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Nota
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma nota</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie notas para documentar interações e decisões</p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar primeira nota
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n: any) => (
            <div key={n.id} className="rounded-md border border-border bg-card p-4 transition-all hover:border-primary card-shadow">
              {n.title && <p className="text-sm font-medium text-foreground mb-1">{n.title}</p>}
              <p className="text-sm text-muted-foreground line-clamp-3">{n.content}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                </p>
                {n.reference_type && n.reference_id && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{n.reference_type}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Nota</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="mt-1" />
            </div>
            <div>
              <Label>Vincular a</Label>
              <Select value={form.reference_id ? `${form.reference_type}:${form.reference_id}` : "general"} onValueChange={v => {
                if (v === "general") {
                  setForm({ ...form, reference_type: "general", reference_id: "" });
                } else {
                  const [type, id] = v.split(":");
                  setForm({ ...form, reference_type: type, reference_id: id });
                }
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Nota global (sem vínculo)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Nota global (sem vínculo)</SelectItem>
                  {referenceOptions.map(opt => (
                    <SelectItem key={opt.id} value={`${opt.type}:${opt.id}`}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={!form.content} className="w-full">
              Salvar Nota
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
