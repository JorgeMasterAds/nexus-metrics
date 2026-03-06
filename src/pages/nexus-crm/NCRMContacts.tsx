import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { Users, Plus, Search, ArrowUpDown, Mail, Phone, Briefcase, Building2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortKey = "name" | "email" | "created_at";

export default function NCRMContacts() {
  const crm = useCRM2();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", job_title: "" });
  const [selected, setSelected] = useState<any>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = crm.contacts.filter((c: any) => {
    const q = search.toLowerCase();
    return !q || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    let va = "", vb = "";
    if (sortKey === "name") { va = `${a.first_name} ${a.last_name}`; vb = `${b.first_name} ${b.last_name}`; }
    else if (sortKey === "email") { va = a.email || ""; vb = b.email || ""; }
    else { va = a.created_at || ""; vb = b.created_at || ""; }
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleCreate = () => {
    if (!form.first_name) return;
    crm.createContact.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ first_name: "", last_name: "", email: "", phone: "", job_title: "" }); } });
  };

  const SortHeader = ({ label, sKey }: { label: string; sKey: SortKey }) => (
    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(sKey)}>
      <span className="flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3" /></span>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Contatos</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="h-9 pl-9 w-48" />
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Contato
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum contato</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione contatos para gerenciar seus relacionamentos</p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar primeiro contato
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary">
                <SortHeader label="Nome" sKey="name" />
                <SortHeader label="Email" sKey="email" />
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">Celular</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">Empresa</th>
                <SortHeader label="Criado em" sKey="created_at" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c: any) => (
                <tr key={c.id} className="transition-colors hover:bg-muted border-b border-border cursor-pointer" onClick={() => setSelected(c)}>
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

      {/* Contact Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary">
                {(selected?.first_name || "?")[0].toUpperCase()}
              </div>
              {selected?.first_name} {selected?.last_name}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-6">
              <InfoRow icon={Mail} label="Email" value={selected.email} />
              <InfoRow icon={Phone} label="Telefone" value={selected.phone || selected.mobile} />
              <InfoRow icon={Briefcase} label="Cargo" value={selected.job_title} />
              <InfoRow icon={Building2} label="Empresa" value={selected.crm2_organizations?.name} />
              {selected.linkedin_url && <InfoRow icon={Users} label="LinkedIn" value={selected.linkedin_url} />}
              {selected.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm text-foreground">{selected.notes}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">Criado em {new Date(selected.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              ["Nome *", "first_name"], ["Sobrenome", "last_name"], ["Email", "email"], ["Telefone", "phone"], ["Cargo", "job_title"]
            ].map(([label, key]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1" />
              </div>
            ))}
            <Button onClick={handleCreate} disabled={crm.createContact.isPending} className="w-full">
              {crm.createContact.isPending ? "Salvando..." : "Criar Contato"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}
