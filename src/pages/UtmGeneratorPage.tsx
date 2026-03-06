import DashboardLayout from "@/components/DashboardLayout";
import UtmGenerator from "@/components/UtmGenerator";

export default function UtmGeneratorPage() {
  return (
    <DashboardLayout title="Gerador de UTMs">
      <UtmGenerator />
    </DashboardLayout>
  );
}
