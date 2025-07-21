
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FlowLibrary from "./pages/FlowLibrary";
import FlowRunner from "./pages/FlowRunner";
import LoopOverRowsRunner from "./pages/FlowRunner-simple";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Documentation from "./pages/Documentation";
import Analytics from "./pages/Analytics";
import About from "./pages/About";
import WorkflowCreator from "./pages/WorkflowCreator";
import OAuthCallbackPage from "./pages/OAuthCallback";
import Layout from "./components/Layout";
import { AuthProvider } from "./components/auth/AuthProvider";

const queryClient = new QueryClient();

const WorkflowRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/flows/${id}`} replace />;
};

const FlowRunnerRoute = () => {
  const { id } = useParams<{ id: string }>();
  // Use simplified component for loop-over-rows to avoid React hook errors
  if (id === 'loop-over-rows') {
    return <LoopOverRowsRunner />;
  }
  return <FlowRunner />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/flows" element={<FlowLibrary />} />
              <Route path="/flows/:id" element={<FlowRunnerRoute />} />
              <Route path="/workflows/:id" element={<WorkflowRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/about" element={<About />} />
              <Route path="/creators/new" element={<WorkflowCreator />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/oauth/callback/:service" element={<OAuthCallbackPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
