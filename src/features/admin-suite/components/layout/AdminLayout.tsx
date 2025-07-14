import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useAdminSecurityMiddleware } from "../../hooks/useAdminSecurityMiddleware";

export const AdminLayout = () => {
  const { isSessionActive } = useAdminSecurityMiddleware();

  if (!isSessionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Session Expired</h2>
          <p className="text-muted-foreground">Please refresh to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <AdminSidebar />
      <div className="flex-1 flex flex-col w-full lg:ml-0">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-6 overflow-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};