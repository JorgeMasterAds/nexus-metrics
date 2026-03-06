import { useParams, useNavigate } from "react-router-dom";
import { useCRM2, useCRM2Activities, useCRM2Notes } from "@/hooks/useCRM2";
import { useMemo, useState } from "react";
import { ArrowLeft, DollarSign, Calendar, Sparkles, RefreshCw, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function NCRMDealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const crm = useCRM2();
  const activities = useCRM2Activities("deal", id || null);
  const notes = useCRM2Notes("deal", id || null);
  const [tab, setTab] = useState<"activity" | "tasks" | "notes" | "origin">("activity");

  const deal = useMemo(() => crm.deals.find((d: any) => d.id === id), [crm.deals, id]);

  if (!deal) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-[#A0A0A0]">Deal não encontrado</p>
        <button onClick={() => navigate("/crm/deals")} className="text-sm text-[#E5191A] mt-2">← Voltar</button>
      </div>
    );
  }

  const status = deal.crm2_deal_statuses;
  const linkedTasks = crm.tasks.filter((t: any) => t.reference_type === "deal" && t.reference_id === id);
  const originLead = deal.lead_id ? crm.leads.find((l: any) => l.id === deal.lead_id) : null;

  const updateField = (field: string, value: any) => {
    crm.updateDeal.mutate({ id: deal.id, [field]: value });
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/crm/deals")} className="text-sm text-[#A0A0A0] hover:text-[#F5F5F5] flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          <div className="rounded-md border p-5" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
            <h2 className="text-xl font-bold text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{deal.title}</h2>
            {deal.crm2_organizations?.name && <p className="text-sm text-[#A0A0A0]">{deal.crm2_organizations.name}</p>}
            <p className="text-3xl font-bold mt-3" style={{ color: "#E5191A", fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt(deal.deal_value || 0)}
            </p>

            {/* Probability bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#A0A0A0] mb-1">
                <span>Probabilidade</span>
                <span>{deal.probability || status?.probability || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#2A2A2A]">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${deal.probability || status?.probability || 0}%`, background: "#E5191A" }}
                />
              </div>
            </div>

            {/* Next step */}
            <div className="mt-4">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Próximo Passo</p>
              <input
                defaultValue={deal.next_step || ""}
                onBlur={e => updateField("next_step", e.target.value)}
                placeholder="Definir próximo passo..."
                className="w-full bg-transparent text-sm text-[#F5F5F5] border-b border-[#2A2A2A] outline-none focus:border-[#E5191A] pb-1"
              />
            </div>
          </div>

          {/* Status pills */}
          <div className="rounded-md border p-4" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Estágio</p>
            <div className="flex flex-wrap gap-1.5">
              {crm.dealStatuses.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => updateField("status_id", s.id)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    background: deal.status_id === s.id ? `${s.color}30` : "transparent",
                    borderColor: deal.status_id === s.id ? s.color : "#2A2A2A",
                    color: deal.status_id === s.id ? s.color : "#A0A0A0",
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="rounded-md border p-4 space-y-3" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Data de Fechamento</p>
              <input
                type="date"
                defaultValue={deal.expected_closure_date || ""}
                onBlur={e => updateField("expected_closure_date", e.target.value)}
                className="bg-transparent text-sm text-[#F5F5F5] outline-none"
              />
            </div>
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Fonte</p>
              <p className="text-sm text-[#F5F5F5]">{deal.source || "—"}</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-0 border-b" style={{ borderColor: "#2A2A2A" }}>
            {[
              { key: "activity", label: "Atividade" },
              { key: "tasks", label: `Tarefas (${linkedTasks.length})` },
              { key: "notes", label: `Notas (${notes.data?.length || 0})` },
              { key: "origin", label: "Origem" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className="px-4 py-2.5 text-sm transition-colors border-b-2"
                style={{
                  color: tab === t.key ? "#E5191A" : "#A0A0A0",
                  borderColor: tab === t.key ? "#E5191A" : "transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-md border p-5" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
            {tab === "activity" && (
              <div className="space-y-3">
                {(activities.data || []).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(229,25,26,0.15)" }}>
                      <Sparkles className="h-3 w-3 text-[#E5191A]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#F5F5F5]">{a.data?.message || a.activity_type}</p>
                      <p className="text-[10px] text-[#555]">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</p>
                    </div>
                  </div>
                ))}
                {(activities.data || []).length === 0 && <p className="text-sm text-[#555] text-center py-4">Nenhuma atividade</p>}
              </div>
            )}

            {tab === "tasks" && (
              <div className="space-y-2">
                {linkedTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-md border" style={{ borderColor: "#2A2A2A", background: "#111" }}>
                    <input
                      type="checkbox"
                      checked={t.status === "Done"}
                      onChange={() => crm.updateTask.mutate({ id: t.id, status: t.status === "Done" ? "Todo" : "Done" })}
                      className="accent-[#E5191A]"
                    />
                    <span className="text-sm text-[#F5F5F5] flex-1">{t.title}</span>
                  </div>
                ))}
                {linkedTasks.length === 0 && <p className="text-sm text-[#555] text-center py-4">Nenhuma tarefa</p>}
              </div>
            )}

            {tab === "notes" && (
              <div className="space-y-2">
                {(notes.data || []).map((n: any) => (
                  <div key={n.id} className="p-3 rounded-md border" style={{ borderColor: "#2A2A2A", background: "#111" }}>
                    {n.title && <p className="text-sm font-medium text-[#F5F5F5]">{n.title}</p>}
                    <p className="text-sm text-[#A0A0A0]">{n.content}</p>
                  </div>
                ))}
                {(notes.data || []).length === 0 && <p className="text-sm text-[#555] text-center py-4">Nenhuma nota</p>}
              </div>
            )}

            {tab === "origin" && (
              <div>
                {originLead ? (
                  <div className="p-4 rounded-md border" style={{ borderColor: "#2A2A2A", background: "#111" }}>
                    <p className="text-sm text-[#A0A0A0]">Convertido do Lead:</p>
                    <button
                      onClick={() => navigate(`/crm/leads/${originLead.id}`)}
                      className="text-sm font-medium mt-1 hover:underline" style={{ color: "#E5191A" }}
                    >
                      {originLead.first_name} {originLead.last_name}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[#555] text-center py-4">Deal criado diretamente (sem lead de origem)</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
