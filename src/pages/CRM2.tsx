import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutGrid, List, Users, Building2, CheckSquare, Settings2, Plus, TrendingUp } from "lucide-react";
import { useCRM2 } from "@/hooks/useCRM2";
import CRM2Dashboard from "@/components/crm2/CRM2Dashboard";
import CRM2LeadsList from "@/components/crm2/CRM2LeadsList";
import CRM2DealsKanban from "@/components/crm2/CRM2DealsKanban";
import CRM2Contacts from "@/components/crm2/CRM2Contacts";
import CRM2Companies from "@/components/crm2/CRM2Companies";
import CRM2Tasks from "@/components/crm2/CRM2Tasks";
import CRM2Settings from "@/components/crm2/CRM2Settings";

export default function CRM2() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const crm = useCRM2();

  const tabDescriptions: Record<string, string> = {
    dashboard: "Visão geral do seu pipeline de vendas",
    leads: "Gerencie e qualifique seus leads",
    deals: "Acompanhe negócios no pipeline",
    contacts: "Diretório de contatos",
    companies: "Empresas e organizações",
    tasks: "Tarefas vinculadas a leads e deals",
    settings: "Configure estágios do pipeline",
  };

  return (
    <DashboardLayout title="CRM Pro" subtitle={tabDescriptions[activeTab]}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 border border-border/30 rounded-xl p-1 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-3.5 w-3.5" /> Leads
          </TabsTrigger>
          <TabsTrigger value="deals" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <LayoutGrid className="h-3.5 w-3.5" /> Deals
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <List className="h-3.5 w-3.5" /> Contatos
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building2 className="h-3.5 w-3.5" /> Empresas
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CheckSquare className="h-3.5 w-3.5" /> Tarefas
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings2 className="h-3.5 w-3.5" /> Configurações
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {crm.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              <TabsContent value="dashboard" className="mt-0"><CRM2Dashboard crm={crm} /></TabsContent>
              <TabsContent value="leads" className="mt-0"><CRM2LeadsList crm={crm} /></TabsContent>
              <TabsContent value="deals" className="mt-0"><CRM2DealsKanban crm={crm} /></TabsContent>
              <TabsContent value="contacts" className="mt-0"><CRM2Contacts crm={crm} /></TabsContent>
              <TabsContent value="companies" className="mt-0"><CRM2Companies crm={crm} /></TabsContent>
              <TabsContent value="tasks" className="mt-0"><CRM2Tasks crm={crm} /></TabsContent>
              <TabsContent value="settings" className="mt-0"><CRM2Settings crm={crm} /></TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </DashboardLayout>
  );
}
