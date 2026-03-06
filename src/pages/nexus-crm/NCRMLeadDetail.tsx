import { useParams, useNavigate } from "react-router-dom";
import { useCRM2, useCRM2Activities, useCRM2Notes } from "@/hooks/useCRM2";
import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Mail, Phone, Globe, Briefcase, Sparkles, RefreshCw, MessageSquare, FileText, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;
  let label = "Frio", color = "#60A5FA";
  if (pct >= 81) { label = "Hot 🔥"; color = "#E5191A"; }
  else if (pct >= 61) { label = "Quente"; color = "#FB923C"; }
  else if (pct >= 31) { label = "Morno"; color = "#FBBF24"; }

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="45" fill="none" stroke="#2A2A2A" strokeWidth="8" />
        <circle cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)" className="transition-all duration-500" />
        <text x="60" y="55" textAnchor="middle" className="fill-[#F5F5F5] text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{pct}</text>
        <text x="60" y="75" textAnchor="middle" className="text-xs" fill={color}>{label}</text>
      </svg>
    </div>
  );
}

const activityIcons: Record<string, { icon: any; color: string }> = {
  creation: { icon: Sparkles, color: "#E5191A" },
  changed: { icon: RefreshCw, color: "#6B7280" },
  comment: { icon: MessageSquare, color: "#3B82F6" },
  note: { icon: FileText, color: "#8B5CF6" },
  task: { icon: CheckSquare, color: "#22C55E" },
  conversion: { icon: ArrowRight, color: "#E5191A" },
};

export default function NCRMLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const crm = useCRM2();
  const activities = useCRM2Activities("lead", id || null);
  const notes = useCRM2Notes("lead", id || null);
  const [tab, setTab] = useState<"activity" | "tasks" | "notes">("activity");
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");

  const lead = useMemo(() => crm.leads.find((l: any) => l.id === id), [crm.leads, id]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-[#A0A0A0]">Lead não encontrado</p>
        <button onClick={() => navigate("/crm/leads")} className="text-sm text-[#E5191A] mt-2">← Voltar</button>
      </div>
    );
  }

  const status = lead.crm2_lead_statuses;
  const linkedTasks = crm.tasks.filter((t: any) => t.reference_type === "lead" && t.reference_id === id);

  const handleConvert = () => {
    crm.convertLeadToDeal.mutate(lead.id, {
      onSuccess: (dealId: string) => {
        navigate(`/crm/deals/${dealId}`);
      },
    });
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    // Add activity
    const { activeAccountId } = crm as any;
    toast.success("Comentário adicionado!");
    setComment("");
  };

  const updateField = (field: string, value: any) => {
    crm.updateLead.mutate({ id: lead.id, [field]: value });
  };

  const Field = ({ label, value, icon: Icon, field }: { label: string; value: string; icon: any; field: string }) => (
    <div className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: "#2A2A2A" }}>
      <Icon className="h-4 w-4 text-[#555] mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#555] uppercase tracking-wider">{label}</p>
        {editing ? (
          <input
            defaultValue={value}
            onBlur={e => { if (e.target.value !== value) updateField(field, e.target.value); }}
            className="w-full bg-transparent text-sm text-[#F5F5F5] border-b border-[#2A2A2A] outline-none focus:border-[#E5191A]"
          />
        ) : (
          <p className="text-sm text-[#F5F5F5] truncate">{value || "—"}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/crm/leads")} className="text-sm text-[#A0A0A0] hover:text-[#F5F5F5] flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Header card */}
          <div className="rounded-md border p-5" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "#E5191A" }}>
                {(lead.first_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {lead.first_name} {lead.last_name}
                </h2>
                {lead.organization && <p className="text-sm text-[#A0A0A0]">{lead.organization}</p>}
              </div>
            </div>

            <ScoreGauge score={lead.score || 0} />

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleConvert}
                disabled={lead.converted || crm.convertLeadToDeal.isPending}
                className="flex-1 h-9 rounded-md text-xs font-medium text-white disabled:opacity-50 flex items-center justify-center gap-1"
                style={{ background: "#E5191A" }}
              >
                <ArrowRight className="h-3.5 w-3.5" /> Converter em Deal
              </button>
              <button
                onClick={() => setEditing(!editing)}
                className="h-9 px-3 rounded-md text-xs font-medium text-[#F5F5F5] border"
                style={{ background: "#1C1C1C", borderColor: "#2A2A2A" }}
              >
                {editing ? "Salvar" : "Editar"}
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="rounded-md border p-4" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
            <Field label="Email" value={lead.email} icon={Mail} field="email" />
            <Field label="Telefone" value={lead.phone} icon={Phone} field="phone" />
            <Field label="Site" value={lead.website} icon={Globe} field="website" />
            <Field label="Cargo" value={lead.job_title} icon={Briefcase} field="job_title" />
          </div>

          {/* Status */}
          <div className="rounded-md border p-4" style={{ background: "#161616", borderColor: "#2A2A2A" }}>
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {crm.leadStatuses.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => updateField("status_id", s.id)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    background: lead.status_id === s.id ? `${s.color}30` : "transparent",
                    borderColor: lead.status_id === s.id ? s.color : "#2A2A2A",
                    color: lead.status_id === s.id ? s.color : "#A0A0A0",
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-0 border-b" style={{ borderColor: "#2A2A2A" }}>
            {[
              { key: "activity", label: "Atividade" },
              { key: "tasks", label: `Tarefas (${linkedTasks.length})` },
              { key: "notes", label: `Notas (${notes.data?.length || 0})` },
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
              <div className="space-y-4">
                {/* Comment box */}
                <div className="flex gap-2">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Adicionar comentário..."
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-md text-sm text-[#F5F5F5] placeholder:text-[#555] resize-none outline-none"
                    style={{ background: "#111", border: "1px solid #2A2A2A" }}
                  />
                  <button onClick={handleAddComment} className="h-fit px-3 py-2 rounded-md text-xs text-white" style={{ background: "#E5191A" }}>
                    Comentar
                  </button>
                </div>
                {/* Timeline */}
                <div className="space-y-3">
                  {(activities.data || []).map((a: any) => {
                    const config = activityIcons[a.activity_type] || activityIcons.creation;
                    const Icon = config.icon;
                    return (
                      <div key={a.id} className="flex items-start gap-3">
                        <div className="mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}20` }}>
                          <Icon className="h-3 w-3" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F5F5F5]">
                            {a.data?.message || a.data?.content || `${a.activity_type}: ${a.data?.field_label || ""} ${a.data?.old_value ? `de ${a.data.old_value}` : ""} ${a.data?.value ? `para ${a.data.value}` : ""}`}
                          </p>
                          <p className="text-[10px] text-[#555] mt-0.5">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(activities.data || []).length === 0 && <p className="text-sm text-[#555] text-center py-4">Nenhuma atividade registrada</p>}
                </div>
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
                    <span className={`text-sm flex-1 ${t.status === "Done" ? "line-through text-[#555]" : "text-[#F5F5F5]"}`}>{t.title}</span>
                  </div>
                ))}
                {linkedTasks.length === 0 && <p className="text-sm text-[#555] text-center py-4">Nenhuma tarefa vinculada</p>}
              </div>
            )}

            {tab === "notes" && (
              <div className="space-y-2">
                {(notes.data || []).map((n: any) => (
                  <div key={n.id} className="p-3 rounded-md border" style={{ borderColor: "#2A2A2A", background: "#111" }}>
                    {n.title && <p className="text-sm font-medium text-[#F5F5F5]">{n.title}</p>}
                    <p className="text-sm text-[#A0A0A0] mt-1">{n.content}</p>
                  </div>
                ))}
                {(notes.data || []).length === 0 && <p className="text-sm text-[#555] text-center py-4">Nenhuma nota</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
