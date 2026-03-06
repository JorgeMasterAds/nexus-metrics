import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CRM2Contacts({ crm }: { crm: any }) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", job_title: "" });

  const filtered = crm.contacts.filter((c: any) => {
    const q = search.toLowerCase();
    return !q || [c.first_name, c.last_name, c.email].some((v: any) => v?.toLowerCase().includes(q));
  });

  const handleCreate = () => {
    if (!form.first_name) return;
    crm.createContact.mutate(form);
    setForm({ first_name: "", last_name: "", email: "", phone: "", job_title: "" });
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar contatos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum contato encontrado</p>
        ) : filtered.map((c: any) => (
          <div key={c.id} className="p-4 rounded-xl border border-border/30 bg-card/80 space-y-1">
            <p className="font-medium text-sm">{c.first_name} {c.last_name}</p>
            {c.job_title && <p className="text-xs text-muted-foreground">{c.job_title}</p>}
            {c.crm2_organizations?.name && <p className="text-xs text-muted-foreground">{c.crm2_organizations.name}</p>}
            {c.email && <p className="text-xs text-primary">{c.email}</p>}
            {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
          </div>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div><Label>Sobrenome</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Cargo</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
            <Button className="w-full" onClick={handleCreate} disabled={crm.createContact.isPending}>Criar Contato</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
