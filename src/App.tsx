
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { EnhancedSecurityProvider } from "@/components/providers/EnhancedSecurityProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FeatureAccessProvider } from '@/contexts/FeatureAccessContext';
import { queryClient } from "@/lib/queryClient";
import React from 'react';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Generate = lazy(() => import("./pages/Generate"));
const Content = lazy(() => import("./pages/Content"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Billing = lazy(() => import("./pages/Billing"));
const Teams = lazy(() => import("./pages/Teams"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));

// Lazy load development monitor
const FeatureAccessMonitor = lazy(() => 
  import('@/components/dev/FeatureAccessMonitor').then(m => ({ 
    default: m.FeatureAccessMonitor 
  }))
);

// App content wrapper to get current route
const AppContent = () => {
  const location = useLocation();
  
  return (
    <FeatureAccessProvider route={location.pathname}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/generate"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Generate />
            </Suspense>
          }
        />
        <Route
          path="/content"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Content />
            </Suspense>
          }
        />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Analytics />
            </Suspense>
          }
        />
        <Route
          path="/billing"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Billing />
            </Suspense>
          }
        />
        <Route
          path="/teams"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Teams />
            </Suspense>
          }
        />
        <Route
          path="/integrations"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Integrations />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Settings />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Development performance monitor */}
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <FeatureAccessMonitor />
        </Suspense>
      )}
    </FeatureAccessProvider>
  );
};


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EnhancedSecurityProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </EnhancedSecurityProvider>
    </QueryClientProvider>
  );
}

export default App;
