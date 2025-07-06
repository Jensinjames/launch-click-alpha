import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
    >
      <Link 
        to="/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Go to dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          {item.href && !item.current ? (
            <Link 
              to={item.href}
              className="hover:text-foreground transition-colors"
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={cn(
                item.current ? "text-foreground font-medium" : "text-muted-foreground"
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;