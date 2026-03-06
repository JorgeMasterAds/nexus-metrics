import { useState } from "react";
import { useCRM2 } from "@/hooks/useCRM2";
import { Building2, Plus, Search, Globe, Users, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function NCRMCompanies() {
  const crm = useCRM2();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", industry: "" });
  const [selected, setSelected] = useState<any>(null);

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
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="h-9 pl-9 w-48" />
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma empresa</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione empresas para vincular a contatos e deals</p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar primeira empresa
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o: any) => (
            <div key={o.id} className="rounded-md border border-border bg-card p-5 space-y-2 transition-all hover:border-primary card-shadow cursor-pointer" onClick={() => setSelected(o)}>
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
                  className="text-xs flex items-center gap-1 text-primary" onClick={e => e.stopPropagation()}>
                  <Globe className="h-3 w-3" /> {o.website}
                </a>
              )}
              {o.annual_revenue && <p className="text-xs text-success">{fmt(o.annual_revenue)}</p>}
              {o.no_of_employees && <p className="text-xs text-muted-foreground">{o.no_of_employees} funcionários</p>}
            </div>
          ))}
        </div>
      )}

      {/* Company Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md flex items-center justify-center text-sm font-bold text-foreground bg-muted border border-border">
                {(selected?.name || "?")[0].toUpperCase()}
              </div>
              {selected?.name}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-6">
              {selected.industry && <InfoRow icon={Building2} label="Setor" value={selected.industry} />}
              {selected.website && <InfoRow icon={Globe} label="Website" value={selected.website} />}
              {selected.territory && <InfoRow icon={Building2} label="Território" value={selected.territory} />}
              {selected.no_of_employees && <InfoRow icon={Users} label="Funcionários" value={selected.no_of_employees} />}
              {selected.annual_revenue && <InfoRow icon={DollarSign} label="Receita anual" value={fmt(selected.annual_revenue)} />}
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
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[["Nome *", "name"], ["Website", "website"], ["Setor", "industry"]].map(([label, key]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1" />
              </div>
            ))}
            <Button onClick={handleCreate} disabled={crm.createOrganization.isPending} className="w-full">
              {crm.createOrganization.isPending ? "Salvando..." : "Criar Empresa"}
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
