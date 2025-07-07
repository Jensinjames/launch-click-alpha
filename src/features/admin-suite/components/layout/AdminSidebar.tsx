import { NavLink } from "react-router-dom";
import { Shield, Users, CreditCard, Activity, Settings, BarChart3, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEnhancedAdminAccess } from "../../hooks/useEnhancedAdminAccess";
import { hasAdminFeatureAccess } from "../../utils/adminPermissions";

const adminNavItems = [
  { 
    path: "/admin", 
    label: "Dashboard", 
    icon: BarChart3, 
    feature: "admin.system.monitoring" as const,
    end: true 
  },
  { 
    path: "/admin/users", 
    label: "Users", 
    icon: Users, 
    feature: "admin.users.view" as const 
  },
  { 
    path: "/admin/teams", 
    label: "Teams", 
    icon: Users, 
    feature: "admin.teams.view" as const 
  },
  { 
    path: "/admin/billing", 
    label: "Billing", 
    icon: CreditCard, 
    feature: "admin.billing.view" as const 
  },
  { 
    path: "/admin/security", 
    label: "Security", 
    icon: Shield, 
    feature: "admin.security.audit" as const 
  },
  { 
    path: "/admin/system", 
    label: "System", 
    icon: Database, 
    feature: "admin.system.monitoring" as const 
  },
];

export const AdminSidebar = () => {
  const adminInfo = useEnhancedAdminAccess();
  
  // Create compatible AdminAccessInfo object
  const adminAccessInfo = {
    ...adminInfo,
    planTierAccess: adminInfo.hasAccess && adminInfo.permissions.canAccessSystem,
  };

  const getNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:text-foreground hover:bg-accent"
    }`;

  return (
    <aside className="w-64 bg-card border-r border-border p-4">
      {/* Admin Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
            <Badge variant="secondary" className="text-xs">
              {adminInfo.accessLevel?.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {adminNavItems.map(({ path, label, icon: Icon, feature, end }) => {
          const hasAccess = hasAdminFeatureAccess(feature, adminAccessInfo);
          
          if (!hasAccess) return null;

          return (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={getNavItemClass}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="mt-8 p-4 bg-accent rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-2">Quick Stats</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Active Users</span>
            <span className="font-mono">--</span>
          </div>
          <div className="flex justify-between">
            <span>Total Teams</span>
            <span className="font-mono">--</span>
          </div>
          <div className="flex justify-between">
            <span>System Status</span>
            <Badge variant="default" className="h-4 px-2 text-xs">Online</Badge>
          </div>
        </div>
      </div>
    </aside>
  );
};