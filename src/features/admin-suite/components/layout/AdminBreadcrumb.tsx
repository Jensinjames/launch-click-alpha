import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const breadcrumbLabels: Record<string, string> = {
  admin: "Dashboard",
  users: "User Management",
  teams: "Team Administration", 
  billing: "Billing & Credits",
  security: "Security & Audit",
  system: "System Administration"
};

export const AdminBreadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Remove 'admin' from segments for cleaner breadcrumb
  const adminSegments = pathSegments.slice(1); // Skip 'admin'
  
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {/* Home/Dashboard Link */}
      <Link 
        to="/admin" 
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Admin
      </Link>
      
      {/* Dynamic Breadcrumb Segments */}
      {adminSegments.map((segment, index) => {
        const isLast = index === adminSegments.length - 1;
        const path = `/admin/${adminSegments.slice(0, index + 1).join('/')}`;
        const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        
        return (
          <div key={segment} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link 
                to={path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};