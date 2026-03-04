import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Lock, Globe, Code, BarChart2 } from "lucide-react";
import ProductTour, { TOURS } from "@/components/ProductTour";

const PLATFORM_SMARTLINK_DOMAIN = "smartlink.nexusmetrics.jmads.com.br";

export default function Resources() {
  return (
    <DashboardLayout title="Recursos" subtitle="Gerencie domínios e recursos da plataforma" actions={<ProductTour {...TOURS.resources} />}>
      <div className="space-y-4">
        <ResourceCard
          icon={Globe}
          title="Domínio Personalizado para Smart Links"
          description={<>Futuramente você poderá configurar seu próprio domínio para Smart Links. Caso não configure, o domínio padrão da plataforma (<code className="bg-muted px-1 py-0.5 rounded text-primary">{PLATFORM_SMARTLINK_DOMAIN}</code>) será utilizado automaticamente.</>}
        />
        <ResourceCard
          icon={Code}
          title="Inserir Pixel"
          description="Configure pixels de rastreamento (Meta Pixel, TikTok Pixel, etc.) para acompanhar conversões e otimizar campanhas."
        />
        <ResourceCard
          icon={BarChart2}
          title="Inserir Google Analytics"
          description="Conecte o Google Analytics para monitorar o tráfego e comportamento dos visitantes nos seus Smart Links."
        />
      </div>
    </DashboardLayout>
  );
}

function ResourceCard({ icon: Icon, title, description }: { icon: any; title: string; description: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 opacity-60">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h2>
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50">Em breve</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
