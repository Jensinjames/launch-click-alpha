import { AdminBreadcrumb } from "./AdminBreadcrumb";
import { Button } from "@/components/ui/button";
import { Bell, Settings, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminAccessIndicator from "../AdminAccessIndicator";
import { useNavigate } from "react-router-dom";

export const AdminHeader = () => {
  const navigate = useNavigate();

  const handleBackToApp = () => {
    navigate('/dashboard');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Back to App + Breadcrumb */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToApp}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>
          <AdminBreadcrumb />
        </div>
        
        {/* Right: Actions and Info */}
        <div className="flex items-center space-x-4">
          {/* Admin Access Indicator */}
          <AdminAccessIndicator showDetails />
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
            >
              3
            </Badge>
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};