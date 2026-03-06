import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AgentHubLayout from "@/components/agenthub/AgentHubLayout";

const HubDashboard = lazy(() => import("./agenthub/HubDashboard"));
const HubAgents = lazy(() => import("./agenthub/HubAgents"));
const HubAgentNew = lazy(() => import("./agenthub/HubAgentNew"));
const HubAgentDetail = lazy(() => import("./agenthub/HubAgentDetail"));
const HubKnowledge = lazy(() => import("./agenthub/HubKnowledge"));
const HubConversations = lazy(() => import("./agenthub/HubConversations"));
const HubChannels = lazy(() => import("./agenthub/HubChannels"));
const HubAnalytics = lazy(() => import("./agenthub/HubAnalytics"));
const HubSettings = lazy(() => import("./agenthub/HubSettings"));
const HubWorkflowEditor = lazy(() => import("./agenthub/HubWorkflowEditor"));

const Loader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function AIAgents() {
  return (
    <AgentHubLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route index element={<HubDashboard />} />
          <Route path="agents" element={<HubAgents />} />
          <Route path="agents/new" element={<HubAgentNew />} />
          <Route path="agents/:id" element={<HubAgentDetail />} />
          <Route path="agents/:id/workflow" element={<HubWorkflowEditor />} />
          <Route path="knowledge" element={<HubKnowledge />} />
          <Route path="conversations" element={<HubConversations />} />
          <Route path="channels" element={<HubChannels />} />
          <Route path="analytics" element={<HubAnalytics />} />
          <Route path="settings" element={<HubSettings />} />
        </Routes>
      </Suspense>
    </AgentHubLayout>
  );
}
