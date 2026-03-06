import { useParams, useNavigate } from "react-router-dom";
import { useCRM2, useCRM2Activities, useCRM2Notes } from "@/hooks/useCRM2";
import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Mail, Phone, Globe, Briefcase, Sparkles, RefreshCw, MessageSquare, FileText, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;
  let label = "Frio", color = "hsl(var(--info))";
  if (pct >= 81) { label = "Hot 🔥"; color = "hsl(var(--primary))"; }
  else if (pct >= 61) { label = "Quente"; color = "hsl(var(--warning))"; }
  else if (pct >= 31) { label = "Morno"; color = "hsl(var(--warning))"; }

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)" className="transition-all duration-500" />
        <text x="60" y="55" textAnchor="middle" className="fill-foreground text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{pct}</text>
        <text x="60" y="75" textAnchor="middle" className="text-xs" fill={color}>{label}</text>
      </svg>
    </div>
  );
}

const activityIcons: Record<string, { icon: any; color: string }> = {
  creation: { icon: Sparkles, color: "hsl(var(--primary))" },
  changed: { icon: RefreshCw, color: "hsl(var(--muted-foreground))" },
  comment: { icon: MessageSquare, color: "hsl(var(--info))" },
  note: { icon: FileText, color: "hsl(280, 80%, 55%)" },
  task: { icon: CheckSquare, color: "hsl(var(--success))" },
  conversion: { icon: ArrowRight, color: "hsl(var(--primary))" },
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
        <p className="text-muted-foreground">Lead não encontrado</p>
        <button onClick={() => navigate("/crm/leads")} className="text-sm text-primary mt-2">← Voltar</button>
      </div>
    );
  }

  const linkedTasks = crm.tasks.filter((t: any) => t.reference_type === "lead" && t.reference_id === id);

  const handleConvert = () => {
    crm.convertLeadToDeal.mutate(lead.id, {
      onSuccess: (dealId: string) => { navigate(`/crm/deals/${dealId}`); },
    });
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    toast.success("Comentário adicionado!");
    setComment("");
  };

  const updateField = (field: string, value: any) => {
    crm.updateLead.mutate({ id: lead.id, [field]: value });
  };

  const Field = ({ label, value, icon: Icon, field }: { label: string; value: string; icon: any; field: string }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-border">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {editing ? (
          <input
            defaultValue={value}
            onBlur={e => { if (e.target.value !== value) updateField(field, e.target.value); }}
            className="w-full bg-transparent text-sm text-foreground border-b border-border outline-none focus:border-primary"
          />
        ) : (
          <p className="text-sm text-foreground truncate">{value || "—"}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/crm/leads")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-card p-5 card-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground bg-primary">
                {(lead.first_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {lead.first_name} {lead.last_name}
                </h2>
                {lead.organization && <p className="text-sm text-muted-foreground">{lead.organization}</p>}
              </div>
            </div>

            <ScoreGauge score={lead.score || 0} />

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleConvert}
                disabled={lead.converted || crm.convertLeadToDeal.isPending}
                className="flex-1 h-9 rounded-md text-xs font-medium text-primary-foreground bg-primary disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <ArrowRight className="h-3.5 w-3.5" /> Converter em Deal
              </button>
              <button
                onClick={() => setEditing(!editing)}
                className="h-9 px-3 rounded-md text-xs font-medium text-foreground border border-border bg-secondary"
              >
                {editing ? "Salvar" : "Editar"}
              </button>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-4 card-shadow">
            <Field label="Email" value={lead.email} icon={Mail} field="email" />
            <Field label="Telefone" value={lead.phone} icon={Phone} field="phone" />
            <Field label="Site" value={lead.website} icon={Globe} field="website" />
            <Field label="Cargo" value={lead.job_title} icon={Briefcase} field="job_title" />
          </div>

          <div className="rounded-md border border-border bg-card p-4 card-shadow">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {crm.leadStatuses.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => updateField("status_id", s.id)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    background: lead.status_id === s.id ? `${s.color}30` : "transparent",
                    borderColor: lead.status_id === s.id ? s.color : "hsl(var(--border))",
                    color: lead.status_id === s.id ? s.color : "hsl(var(--muted-foreground))",
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-0 border-b border-border">
            {[
              { key: "activity", label: "Atividade" },
              { key: "tasks", label: `Tarefas (${linkedTasks.length})` },
              { key: "notes", label: `Notas (${notes.data?.length || 0})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={cn("px-4 py-2.5 text-sm transition-colors border-b-2", tab === t.key ? "text-primary border-primary" : "text-muted-foreground border-transparent")}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-md border border-border bg-card p-5 card-shadow">
            {tab === "activity" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Adicionar comentário..."
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-md text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border bg-secondary"
                  />
                  <button onClick={handleAddComment} className="h-fit px-3 py-2 rounded-md text-xs text-primary-foreground bg-primary">
                    Comentar
                  </button>
                </div>
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
                          <p className="text-sm text-foreground">
                            {a.data?.message || a.data?.content || `${a.activity_type}: ${a.data?.field_label || ""} ${a.data?.old_value ? `de ${a.data.old_value}` : ""} ${a.data?.value ? `para ${a.data.value}` : ""}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(activities.data || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>}
                </div>
              </div>
            )}

            {tab === "tasks" && (
              <div className="space-y-2">
                {linkedTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-secondary">
                    <input
                      type="checkbox"
                      checked={t.status === "Done"}
                      onChange={() => crm.updateTask.mutate({ id: t.id, status: t.status === "Done" ? "Todo" : "Done" })}
                      className="accent-primary"
                    />
                    <span className={cn("text-sm flex-1", t.status === "Done" ? "line-through text-muted-foreground" : "text-foreground")}>{t.title}</span>
                  </div>
                ))}
                {linkedTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa vinculada</p>}
              </div>
            )}

            {tab === "notes" && (
              <div className="space-y-2">
                {(notes.data || []).map((n: any) => (
                  <div key={n.id} className="p-3 rounded-md border border-border bg-secondary">
                    {n.title && <p className="text-sm font-medium text-foreground">{n.title}</p>}
                    <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
                  </div>
                ))}
                {(notes.data || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma nota</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
