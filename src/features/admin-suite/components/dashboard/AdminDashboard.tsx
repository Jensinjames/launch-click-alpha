import { AdminStats } from "./AdminStats";
import { QuickActions } from "./QuickActions";

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system health, manage users, and track platform metrics
        </p>
      </div>

      {/* Stats Overview */}
      <AdminStats />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="text-center text-muted-foreground py-8">
          <p>Activity feed will be implemented in Phase 3</p>
        </div>
      </div>
    </div>
  );
};