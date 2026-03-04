import DashboardLayout from "@/components/DashboardLayout";
import ReportTemplatesComponent from "@/components/reports/ReportTemplates";
import ProductTour, { TOURS } from "@/components/ProductTour";

export default function ReportTemplatesPage() {
  return (
    <DashboardLayout
      title="Planejamento"
      subtitle="Modelos prontos para análise e planejamento"
      actions={<ProductTour {...TOURS.reportTemplates} />}
    >
      <ReportTemplatesComponent />
    </DashboardLayout>
  );
}
