import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { Building2, Plus, Search, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function NCRMCompanies() {
  const crm = useCRM2();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", industry: "" });

  const filtered = crm.organizations.filter((o: any) => !search || o.name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!form.name) return;
    crm.createOrganization.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ name: "", website: "", industry: "" }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Empresas</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="h-9 pl-9 pr-3 rounded-md text-sm text-foreground w-48 outline-none border border-border bg-secondary" />
          </div>
          <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Nova Empresa
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Building2 className="h-12 w-12 text-primary opacity-40 mb-4" />
          <p className="text-lg font-semibold text-foreground">Nenhuma empresa</p>
          <p className="text-sm text-muted-foreground">Adicione empresas para vincular a contatos e deals</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o: any) => (
            <div key={o.id} className="rounded-md border border-border bg-card p-5 space-y-2 transition-all hover:border-primary card-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md flex items-center justify-center text-sm font-bold text-foreground bg-muted border border-border">
                  {o.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{o.name}</p>
                  {o.industry && <p className="text-xs text-muted-foreground">{o.industry}</p>}
                </div>
              </div>
              {o.website && (
                <a href={o.website.startsWith("http") ? o.website : `https://${o.website}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-primary">
                  <Globe className="h-3 w-3" /> {o.website}
                </a>
              )}
              {o.annual_revenue && <p className="text-xs text-success">{fmt(o.annual_revenue)}</p>}
              {o.no_of_employees && <p className="text-xs text-muted-foreground">{o.no_of_employees} funcionários</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[["Nome *", "name"], ["Website", "website"], ["Setor", "industry"]].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full h-9 px-3 rounded-md text-sm text-foreground outline-none border border-border bg-secondary" />
              </div>
            ))}
            <button onClick={handleCreate} disabled={crm.createOrganization.isPending}
              className="w-full h-10 rounded-md text-sm font-medium text-primary-foreground bg-primary">
              {crm.createOrganization.isPending ? "Salvando..." : "Criar Empresa"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
