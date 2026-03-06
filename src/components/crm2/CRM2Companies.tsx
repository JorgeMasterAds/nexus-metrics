import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CRM2Companies({ crm }: { crm: any }) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", industry: "" });

  const filtered = crm.organizations.filter((o: any) => {
    const q = search.toLowerCase();
    return !q || o.name?.toLowerCase().includes(q);
  });

  const handleCreate = () => {
    if (!form.name) return;
    crm.createOrganization.mutate(form);
    setForm({ name: "", website: "", industry: "" });
    setShowCreate(false);
  };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar empresas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Empresa
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhuma empresa encontrada</p>
        ) : filtered.map((o: any) => (
          <div key={o.id} className="p-4 rounded-xl border border-border/30 bg-card/80 space-y-1">
            <p className="font-medium text-sm">{o.name}</p>
            {o.industry && <p className="text-xs text-muted-foreground">{o.industry}</p>}
            {o.website && (
              <a href={o.website.startsWith("http") ? o.website : `https://${o.website}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1">
                <Globe className="h-3 w-3" /> {o.website}
              </a>
            )}
            {o.annual_revenue && <p className="text-xs text-emerald-400">{fmt(o.annual_revenue)}</p>}
            {o.no_of_employees && <p className="text-xs text-muted-foreground">{o.no_of_employees} funcionários</p>}
          </div>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Indústria</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
            <Button className="w-full" onClick={handleCreate} disabled={crm.createOrganization.isPending}>Criar Empresa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
