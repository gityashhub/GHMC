import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companies = lazy(() => import("./pages/Companies"));
const Inward = lazy(() => import("./pages/Inward"));
const Outward = lazy(() => import("./pages/Outward"));
const Transporters = lazy(() => import("./pages/Transporters"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - cache for 10 minutes
      refetchOnMount: true, // Refetch on mount if data is stale
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/companies"
                    element={
                      <ProtectedRoute>
                        <Companies />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inward"
                    element={
                      <ProtectedRoute>
                        <Inward />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/outward"
                    element={
                      <ProtectedRoute>
                        <Outward />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transporters"
                    element={
                      <ProtectedRoute>
                        <Transporters />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoices"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Invoices />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
