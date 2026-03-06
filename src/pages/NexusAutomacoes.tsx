import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AutomacoesLayout from "@/components/automacoes/AutomacoesLayout";

const AutomacoesLista = lazy(() => import("./automacoes/AutomacoesLista"));
const AutomacoesEditor = lazy(() => import("./automacoes/AutomacoesEditor"));
const AutomacoesModelos = lazy(() => import("./automacoes/AutomacoesModelos"));
const AutomacoesHistorico = lazy(() => import("./automacoes/AutomacoesHistorico"));

const Loader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function NexusAutomacoes() {
  return (
    <AutomacoesLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route index element={<AutomacoesLista />} />
          <Route path="editor/:id" element={<AutomacoesEditor />} />
          <Route path="modelos" element={<AutomacoesModelos />} />
          <Route path="historico" element={<AutomacoesHistorico />} />
          <Route path="*" element={<Navigate to="/automacoes" replace />} />
        </Routes>
      </Suspense>
    </AutomacoesLayout>
  );
}
