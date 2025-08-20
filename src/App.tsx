
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FlowLibrary from "./pages/FlowLibrary";
import WorkflowRunner from "./pages/WorkflowRunner";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Documentation from "./pages/Documentation";
import Analytics from "./pages/Analytics";
import About from "./pages/About";
import WorkflowCreator from "./pages/WorkflowCreator";
import OAuthCallbackPage from "./pages/OAuthCallback";
import Developer from "./pages/Developer";
import ExecutionDashboard from "./pages/ExecutionDashboard";
import Search from "./pages/Search";
import Layout from "./components/Layout";
import { AuthProvider } from "./components/auth/AuthProvider";

const queryClient = new QueryClient();

const WorkflowRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/search/${id}`} replace />;
};

// Universal workflow runner - handles all workflows via the registry

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
              {/* Redirect /flows to /search for consistency */}
              <Route path="/flows" element={<Navigate to="/search" replace />} />
              <Route path="/flows/:id" element={<Navigate to="/search/:id" replace />} />
              <Route path="/search" element={<Search />} />
              <Route path="/search/:id" element={<WorkflowRunner />} />
              {/* Legacy route for keyword-kombat → redirect to loop-over-rows with mode */}
              <Route
                path="/flows/keyword-kombat"
                element={<Navigate to="/search/loop-over-rows?mode=keyword-kombat" replace />}
              />
              <Route path="/workflows/:id" element={<WorkflowRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/executions" element={<ExecutionDashboard />} />
              <Route path="/developer" element={<Developer />} />
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
