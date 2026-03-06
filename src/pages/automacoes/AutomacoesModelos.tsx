import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { templatesMock } from '@/data/automacoes-mock';
import { getBlocoDefinicao } from '@/data/automacoes-blocos';

export default function AutomacoesModelos() {
  const navigate = useNavigate();

  const handleUseTemplate = (templateId: string) => {
    toast.success('Automação criada a partir do modelo!');
    navigate(`/automacoes/editor/template-${templateId}`);
  };

  return (
    <DashboardLayout title="Modelos de Automação" subtitle="Use modelos prontos para acelerar sua configuração">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templatesMock.map(t => (
          <div key={t.id} className="glass rounded-xl p-5 border border-border/30 hover:border-primary/30 transition-all flex flex-col">
            {/* Mini flow preview */}
            <div className="flex items-center gap-1 mb-4 flex-wrap">
              {t.nodes.slice(0, 5).map((n, i) => {
                const def = getBlocoDefinicao(n.type);
                if (!def) return null;
                const Icon = def.icon;
                const cor = def.categoria === 'gatilho' ? 'hsl(217,91%,60%)' : def.categoria === 'acao' ? 'hsl(142,71%,45%)' : 'hsl(38,92%,50%)';
                return (
                  <div key={i} className="flex items-center gap-1">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cor}15`, border: `1px solid ${cor}30` }}>
                      <Icon className="h-4 w-4" style={{ color: cor }} />
                    </div>
                    {i < Math.min(t.nodes.length, 5) - 1 && <div className="w-3 h-px bg-border" />}
                  </div>
                );
              })}
              {t.nodes.length > 5 && <span className="text-[10px] text-muted-foreground ml-1">+{t.nodes.length - 5}</span>}
            </div>

            <h3 className="text-sm font-semibold mb-1">{t.nome}</h3>
            <p className="text-xs text-muted-foreground mb-3 flex-1">{t.descricao}</p>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {t.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>

            <Button size="sm" className="w-full gap-1.5" onClick={() => handleUseTemplate(t.id)}>
              <Zap className="h-3.5 w-3.5" /> Usar este modelo
            </Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
