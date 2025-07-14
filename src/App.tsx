
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FlowLibrary from "./pages/FlowLibrary";
import FlowRunner from "./pages/FlowRunner";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import CreatorsDashboard from "./pages/CreatorsDashboard";
import OAuthCallbackPage from "./pages/OAuthCallback";
import Layout from "./components/Layout";
import { AuthProvider } from "./components/auth/AuthProvider";

const queryClient = new QueryClient();

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
              <Route path="/flows/:id" element={<FlowRunner />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/creators" element={<CreatorsDashboard />} />
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
