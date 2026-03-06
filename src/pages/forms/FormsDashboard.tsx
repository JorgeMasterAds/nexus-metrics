import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Plus, Search, FileText, BarChart3, CheckCircle2, Clock,
  TrendingUp, Eye, Pause, Archive,
} from "lucide-react";
import { mockForms } from "@/lib/formMockData";
import type { NexusForm, FormStatus } from "@/types/forms";
import { cn } from "@/lib/utils";

const statusConfig: Record<FormStatus, { label: string; color: string; icon: any }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
  active: { label: "Ativo", color: "bg-success/15 text-success", icon: CheckCircle2 },
  paused: { label: "Pausado", color: "bg-warning/15 text-warning", icon: Pause },
  completed: { label: "Encerrado", color: "bg-info/15 text-info", icon: Archive },
};

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/80 p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function FormCard({ form, onClick }: { form: NexusForm; onClick: () => void }) {
  const sc = statusConfig[form.status];
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border/30 bg-card/80 p-5 hover:border-primary/40 hover:shadow-[0_0_12px_2px_hsla(0,90%,55%,0.08)] transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{form.name}</h3>
        <Badge variant="outline" className={cn("text-[10px] shrink-0 gap-1", sc.color)}>
          <sc.icon className="h-3 w-3" /> {sc.label}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {form.responseCount} respostas</span>
        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {form.completionRate}% conclusão</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(form.createdAt).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">{form.type === "quiz" ? "Quiz" : form.type === "app" ? "In-App" : "Link"}</Badge>
        <span className="text-[10px] text-muted-foreground">{form.blocks.length} blocos</span>
      </div>
    </button>
  );
}

export default function FormsDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const forms = useMemo(() => {
    return mockForms.filter(f => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      return true;
    });
  }, [search, statusFilter, typeFilter]);

  const totalResponses = mockForms.reduce((s, f) => s + f.responseCount, 0);
  const avgCompletion = Math.round(mockForms.filter(f => f.responseCount > 0).reduce((s, f) => s + f.completionRate, 0) / Math.max(1, mockForms.filter(f => f.responseCount > 0).length));
  const activeForms = mockForms.filter(f => f.status === "active").length;

  return (
    <DashboardLayout
      title={"Nexus Forms" as any}
      subtitle="Crie, publique e analise formulários, pesquisas e quizzes."
      actions={
        <Button onClick={() => navigate("/forms/new")} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Formulário
        </Button>
      }
    >
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total de formulários" value={mockForms.length} icon={ClipboardList} />
        <MetricCard label="Total de respostas" value={totalResponses} icon={BarChart3} />
        <MetricCard label="Taxa média de conclusão" value={`${avgCompletion}%`} icon={TrendingUp} />
        <MetricCard label="Formulários ativos" value={activeForms} icon={CheckCircle2} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar formulários..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="completed">Encerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="app">In-App</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Form Cards */}
      {forms.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum formulário encontrado</h3>
          <p className="text-sm text-muted-foreground mb-6">Crie seu primeiro formulário para começar a coletar respostas.</p>
          <Button onClick={() => navigate("/forms/new")} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar Formulário
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map(f => (
            <FormCard key={f.id} form={f} onClick={() => navigate(`/forms/editor/${f.id}`)} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
