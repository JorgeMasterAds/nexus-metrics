import DashboardLayout from "@/components/DashboardLayout";
import ReportTemplatesComponent from "@/components/reports/ReportTemplates";

export default function ReportTemplatesPage() {
  return (
    <DashboardLayout
      title="Planejamento"
      subtitle="Modelos prontos para análise e planejamento"
    >
      <ReportTemplatesComponent />
    </DashboardLayout>
  );
}
