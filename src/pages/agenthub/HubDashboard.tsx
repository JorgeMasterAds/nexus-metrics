import { Link } from "react-router-dom";
import { Bot, MessageSquare, Zap, PlayCircle, ArrowRight } from "lucide-react";
import { useHubAgents, useHubConversations, useHubQuotas } from "@/hooks/useAgentHub";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function HubDashboard() {
  const { agents, isLoading } = useHubAgents();
  const { data: conversations } = useHubConversations();
  const { data: quotas } = useHubQuotas();

  const activeAgents = agents.filter((a: any) => a.status === "active");
  const tokensUsed = quotas?.tokens_used || 0;
  const tokensLimit = quotas?.tokens_limit || 100000;
  const tokensPct = Math.round((tokensUsed / tokensLimit) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel de Controle</h1>
        <p className="text-sm text-slate-500">{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Bot} label="Total de Agentes" value={agents.length} color="bg-blue-500" />
        <MetricCard icon={MessageSquare} label="Conversas Hoje" value={(conversations || []).filter((c: any) => new Date(c.created_at).toDateString() === new Date().toDateString()).length} color="bg-green-500" />
        <MetricCard icon={Zap} label={`Tokens (${tokensPct}%)`} value={tokensUsed.toLocaleString()} color="bg-orange-500" />
        <MetricCard icon={PlayCircle} label="Agentes Ativos" value={activeAgents.length} color="bg-purple-500" />
      </div>

      {/* Token usage bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Uso de Tokens</span>
          <span className="text-xs text-slate-500">{tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(tokensPct, 100)}%` }} />
        </div>
      </div>

      {/* Recent agents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Agentes Recentes</h2>
          <Link to="/ai-agents/agents" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Ver todos <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Carregando...</div>
        ) : agents.length === 0 ? (
          <div className="p-8 text-center">
            <Bot className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-3">Nenhum agente criado</p>
            <Link to="/ai-agents/agents/new" className="text-sm text-blue-600 hover:underline">Criar primeiro agente →</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {agents.slice(0, 5).map((agent: any) => (
              <Link key={agent.id} to={`/ai-agents/agents/${agent.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <span className="text-2xl">{agent.avatar_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{agent.name}</p>
                  <p className="text-xs text-slate-500 truncate">{agent.description || "Sem descrição"}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${agent.status === "active" ? "bg-green-100 text-green-700" : agent.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  {agent.status === "active" ? "Ativo" : agent.status === "draft" ? "Rascunho" : "Inativo"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
