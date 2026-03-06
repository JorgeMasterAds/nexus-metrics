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
        <h1 className="text-2xl font-bold text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Empresas</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="h-9 pl-9 pr-3 rounded-md text-sm text-[#F5F5F5] w-48 outline-none"
              style={{ background: "#111", border: "1px solid #2A2A2A" }} />
          </div>
          <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-md text-sm font-medium text-white flex items-center gap-1.5" style={{ background: "#E5191A" }}>
            <Plus className="h-4 w-4" /> Nova Empresa
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Building2 className="h-12 w-12 text-[#E5191A] opacity-40 mb-4" />
          <p className="text-lg font-semibold text-[#F5F5F5]">Nenhuma empresa</p>
          <p className="text-sm text-[#A0A0A0]">Adicione empresas para vincular a contatos e deals</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o: any) => (
            <div key={o.id} className="rounded-md border p-5 space-y-2 transition-all hover:border-[#E5191A]"
              style={{ background: "#161616", borderColor: "#2A2A2A" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md flex items-center justify-center text-sm font-bold text-white" style={{ background: "#1C1C1C", border: "1px solid #2A2A2A" }}>
                  {o.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F5F5F5]">{o.name}</p>
                  {o.industry && <p className="text-xs text-[#A0A0A0]">{o.industry}</p>}
                </div>
              </div>
              {o.website && (
                <a href={o.website.startsWith("http") ? o.website : `https://${o.website}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1" style={{ color: "#E5191A" }}>
                  <Globe className="h-3 w-3" /> {o.website}
                </a>
              )}
              {o.annual_revenue && <p className="text-xs text-[#22C55E]">{fmt(o.annual_revenue)}</p>}
              {o.no_of_employees && <p className="text-xs text-[#A0A0A0]">{o.no_of_employees} funcionários</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ background: "#161616", borderColor: "#2A2A2A" }}>
          <DialogHeader><DialogTitle className="text-[#F5F5F5]">Nova Empresa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[["Nome *", "name"], ["Website", "website"], ["Setor", "industry"]].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs text-[#A0A0A0] mb-1 block">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full h-9 px-3 rounded-md text-sm text-[#F5F5F5] outline-none" style={{ background: "#111", border: "1px solid #2A2A2A" }} />
              </div>
            ))}
            <button onClick={handleCreate} disabled={crm.createOrganization.isPending}
              className="w-full h-10 rounded-md text-sm font-medium text-white" style={{ background: "#E5191A" }}>
              {crm.createOrganization.isPending ? "Salvando..." : "Criar Empresa"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
