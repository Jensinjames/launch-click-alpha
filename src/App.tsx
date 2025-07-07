
import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AppProviders } from "@/components/providers/AppProviders";
import { FeatureAccessProvider } from '@/contexts/FeatureAccessContext';
import React from 'react';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Generate = lazy(() => import("./pages/Generate"));
const Content = lazy(() => import("./pages/Content"));
const Assemblies = lazy(() => import("./pages/Assemblies"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Billing = lazy(() => import("./pages/Billing"));
const Teams = lazy(() => import("./pages/Teams"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Settings = lazy(() => import("./pages/Settings"));
// Admin Suite Components
const AdminLayout = lazy(() => 
  import("./features/admin-suite").then(m => ({ default: m.AdminLayout }))
);
const AdminDashboard = lazy(() => 
  import("./features/admin-suite").then(m => ({ default: m.AdminDashboard }))
);
const UserManagement = lazy(() => 
  import("./features/admin-suite").then(m => ({ default: m.UserManagement }))
);
const TeamAdministration = lazy(() => 
  import("./features/admin-suite").then(m => ({ default: m.TeamAdministration }))
);
const BillingManagement = lazy(() => 
  import("./features/admin-suite").then(m => ({ default: m.BillingManagement }))
);
const SecurityManagement = lazy(() => 
  import("./features/admin-suite").then(m => ({ default: m.SecurityManagement }))
);
const SystemManagement = lazy(() => 
  import("./features/admin-suite").then(m => ({ default: m.SystemManagement }))
);

// Legacy admin page for backward compatibility
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
          path="/content/:type"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Content />
            </Suspense>
          }
        />
        <Route
          path="/assemblies"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Assemblies />
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
        {/* Admin Suite with Nested Routes */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AdminLayout />
            </Suspense>
          }
        >
          {/* Admin Dashboard */}
          <Route
            index
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <AdminDashboard />
              </Suspense>
            }
          />
          {/* User Management */}
          <Route
            path="users"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <UserManagement />
              </Suspense>
            }
          />
          {/* Team Administration */}
          <Route
            path="teams"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <TeamAdministration />
              </Suspense>
            }
          />
          {/* Billing Management */}
          <Route
            path="billing"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <BillingManagement />
              </Suspense>
            }
          />
          {/* Security Management */}
          <Route
            path="security"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <SecurityManagement />
              </Suspense>
            }
          />
          {/* System Management */}
          <Route
            path="system"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <SystemManagement />
              </Suspense>
            }
          />
        </Route>

        {/* Legacy Admin Route for Backward Compatibility */}
        <Route
          path="/admin-legacy"
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
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
