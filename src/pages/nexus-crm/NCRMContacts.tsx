import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { Users, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function NCRMContacts() {
  const crm = useCRM2();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", job_title: "" });

  const filtered = crm.contacts.filter((c: any) => {
    const q = search.toLowerCase();
    return !q || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const handleCreate = () => {
    if (!form.first_name) return;
    crm.createContact.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ first_name: "", last_name: "", email: "", phone: "", job_title: "" }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Contatos</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="h-9 pl-9 pr-3 rounded-md text-sm text-foreground w-48 outline-none border border-border bg-secondary" />
          </div>
          <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Novo Contato
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Users className="h-12 w-12 text-primary opacity-40 mb-4" />
          <p className="text-lg font-semibold text-foreground">Nenhum contato</p>
          <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro contato</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary">
                {["Nome", "Email", "Celular", "Cargo", "Empresa", "Criado em"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="transition-colors hover:bg-muted border-b border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary">
                        {(c.first_name || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-foreground font-medium">{c.first_name} {c.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.mobile || c.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.job_title || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.crm2_organizations?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              ["Nome *", "first_name"], ["Sobrenome", "last_name"], ["Email", "email"], ["Telefone", "phone"], ["Cargo", "job_title"]
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary" />
              </div>
            ))}
            <button onClick={handleCreate} disabled={crm.createContact.isPending}
              className="w-full h-10 rounded-md text-sm font-medium text-primary-foreground bg-primary">
              {crm.createContact.isPending ? "Salvando..." : "Criar Contato"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
