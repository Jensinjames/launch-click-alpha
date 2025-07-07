import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Shield, CreditCard, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickActions = [
  {
    title: "Add New User",
    description: "Create a new user account",
    icon: UserPlus,
    action: "/admin/users",
    variant: "default" as const
  },
  {
    title: "Manage Credits",
    description: "Adjust user credit balances",
    icon: CreditCard,
    action: "/admin/billing",
    variant: "secondary" as const
  },
  {
    title: "Security Audit",
    description: "Review security logs",
    icon: Shield,
    action: "/admin/security",
    variant: "outline" as const
  },
  {
    title: "Export Data",
    description: "Download system reports",
    icon: Download,
    action: "#",
    variant: "outline" as const
  }
];

export const QuickActions = () => {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    if (action === "#") {
      // Handle export or other special actions
      console.log("Export functionality will be implemented in Phase 3");
      return;
    }
    navigate(action);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => handleAction(action.action)}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};