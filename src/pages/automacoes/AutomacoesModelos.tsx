import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { templatesMock } from '@/data/automacoes-mock';
import { getBlocoDefinicao } from '@/data/automacoes-blocos';
import { useI18n } from '@/lib/i18n';

export default function AutomacoesModelos() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleUseTemplate = (templateId: string) => {
    toast.success(t("template_created"));
    navigate(`/automacoes/editor/template-${templateId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">{t("automation_templates")}</h1>
        <p className="text-xs text-muted-foreground mt-1">{t("templates_subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templatesMock.map(tpl => (
          <div key={tpl.id} className="glass rounded-xl p-5 border border-border/30 hover:border-primary/30 transition-all flex flex-col">
            <div className="flex items-center gap-1 mb-4 flex-wrap">
              {tpl.nodes.slice(0, 5).map((n, i) => {
                const def = getBlocoDefinicao(n.type);
                if (!def) return null;
                const Icon = def.icon;
                const cor = def.categoria === 'gatilho' ? 'hsl(217,91%,60%)' : def.categoria === 'acao' ? 'hsl(142,71%,45%)' : 'hsl(38,92%,50%)';
                return (
                  <div key={i} className="flex items-center gap-1">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cor}15`, border: `1px solid ${cor}30` }}>
                      <Icon className="h-4 w-4" style={{ color: cor }} />
                    </div>
                    {i < Math.min(tpl.nodes.length, 5) - 1 && <div className="w-3 h-px bg-border" />}
                  </div>
                );
              })}
              {tpl.nodes.length > 5 && <span className="text-[10px] text-muted-foreground ml-1">+{tpl.nodes.length - 5}</span>}
            </div>

            <h3 className="text-sm font-semibold mb-1">{tpl.nome}</h3>
            <p className="text-xs text-muted-foreground mb-3 flex-1">{tpl.descricao}</p>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {tpl.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>

            <Button size="sm" className="w-full gap-1.5" onClick={() => handleUseTemplate(tpl.id)}>
              <Zap className="h-3.5 w-3.5" /> {t("use_template")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
