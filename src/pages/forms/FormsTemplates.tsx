import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Star, TrendingUp, MessageSquare, Brain, UserPlus, LogOut, FileText, ArrowLeft,
} from "lucide-react";
import { formTemplates } from "@/lib/formMockData";
import type { FormTemplate } from "@/types/forms";

const iconMap: Record<string, any> = {
  Star, TrendingUp, MessageSquare, Brain, UserPlus, LogOut, FileText,
};

function TemplateCard({ template, onSelect }: { template: FormTemplate; onSelect: () => void }) {
  const Icon = iconMap[template.icon] || FileText;
  return (
    <button
      onClick={onSelect}
      className="text-left rounded-xl border border-border/30 bg-card/80 p-6 hover:border-primary/40 hover:shadow-[0_0_16px_2px_hsla(0,90%,55%,0.1)] transition-all group"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{template.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{template.category}</span>
        <span className="text-[10px] text-muted-foreground">{template.blocks.length} blocos</span>
      </div>
    </button>
  );
}

export default function FormsTemplates() {
  const navigate = useNavigate();

  const handleSelect = (template: FormTemplate) => {
    // In real app: create form in DB from template, then navigate to editor
    // For now: use template ID as form ID
    navigate(`/forms/editor/${template.id}`);
  };

  return (
    <DashboardLayout
      title={"Novo Formulário" as any}
      subtitle="Escolha um template para começar ou crie do zero."
      actions={
        <Button variant="outline" onClick={() => navigate("/forms")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {formTemplates.map(t => (
          <TemplateCard key={t.id} template={t} onSelect={() => handleSelect(t)} />
        ))}
      </div>
    </DashboardLayout>
  );
}
