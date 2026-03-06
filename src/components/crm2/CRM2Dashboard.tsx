import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Target } from "lucide-react";

export default function CRM2Dashboard({ crm }: { crm: any }) {
  const { leads, deals, contacts, organizations, dealStatuses } = crm;

  const openDeals = deals.filter((d: any) => d.crm2_deal_statuses?.type === "Open");
  const wonDeals = deals.filter((d: any) => d.crm2_deal_statuses?.type === "Won");
  const totalPipelineValue = openDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const totalWonValue = wonDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const unconvertedLeads = leads.filter((l: any) => !l.converted);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const stats = [
    { label: "Leads Ativos", value: unconvertedLeads.length, icon: Users, color: "text-blue-500" },
    { label: "Deals Abertos", value: openDeals.length, icon: Target, color: "text-amber-500" },
    { label: "Pipeline", value: fmt(totalPipelineValue), icon: TrendingUp, color: "text-purple-500" },
    { label: "Receita Ganha", value: fmt(totalWonValue), icon: DollarSign, color: "text-emerald-500" },
  ];

  // Deals by stage
  const dealsByStage = (dealStatuses || []).map((st: any) => ({
    ...st,
    count: deals.filter((d: any) => d.status_id === st.id).length,
    value: deals.filter((d: any) => d.status_id === st.id).reduce((s: number, d: any) => s + (d.deal_value || 0), 0),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/30 bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/30 bg-card/80">
        <CardHeader><CardTitle className="text-sm">Pipeline por Estágio</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dealsByStage.map((st: any) => (
              <div key={st.id} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                <span className="text-sm flex-1">{st.name}</span>
                <span className="text-xs text-muted-foreground">{st.count} deals</span>
                <span className="text-sm font-medium">{fmt(st.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/30 bg-card/80">
          <CardHeader><CardTitle className="text-sm">Leads Recentes</CardTitle></CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead ainda.</p>
            ) : (
              <div className="space-y-2">
                {leads.slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{l.first_name} {l.last_name}</p>
                      <p className="text-xs text-muted-foreground">{l.email || l.organization || "—"}</p>
                    </div>
                    {l.crm2_lead_statuses && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: l.crm2_lead_statuses.color, color: l.crm2_lead_statuses.color }}>
                        {l.crm2_lead_statuses.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-card/80">
          <CardHeader><CardTitle className="text-sm">Deals Recentes</CardTitle></CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum deal ainda.</p>
            ) : (
              <div className="space-y-2">
                {deals.slice(0, 5).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{d.title || "Deal sem título"}</p>
                      <p className="text-xs text-muted-foreground">{d.crm2_organizations?.name || "—"}</p>
                    </div>
                    <span className="text-sm font-medium">{d.deal_value ? fmt(d.deal_value) : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
