import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import FormsLayout from "@/components/forms/FormsLayout";

const FormsDashboard = lazy(() => import("./forms/FormsDashboard"));
const FormsTemplates = lazy(() => import("./forms/FormsTemplates"));
const FormsEditor = lazy(() => import("./forms/FormsEditor"));
const FormsResults = lazy(() => import("./forms/FormsResults"));
const FormsShare = lazy(() => import("./forms/FormsShare"));

const Loader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function NexusForms() {
  return (
    <FormsLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route index element={<FormsDashboard />} />
          <Route path="new" element={<FormsTemplates />} />
          <Route path="editor/:id" element={<FormsEditor />} />
          <Route path=":id/results" element={<FormsResults />} />
          <Route path="share/:id" element={<FormsShare />} />
        </Routes>
      </Suspense>
    </FormsLayout>
  );
}
