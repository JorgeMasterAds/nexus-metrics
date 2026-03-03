import DashboardLayout from "@/components/DashboardLayout";
import ReportTemplatesComponent from "@/components/reports/ReportTemplates";

export default function ReportTemplatesPage() {
  return (
    <DashboardLayout
      title="Templates de Relatório"
      subtitle="Modelos prontos para análise e planejamento"
    >
      <ReportTemplatesComponent />
    </DashboardLayout>
  );
}
