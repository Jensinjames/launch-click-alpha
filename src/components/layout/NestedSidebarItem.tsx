import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon, ChevronDown, ChevronRight } from "@/lib/icons";
import { useFeatureAccessContext } from "@/contexts/SimpleFeatureAccessContext";
import { cn } from "@/lib/utils";

interface SidebarChild {
  name: string;
  href: string;
  icon: LucideIcon;
  featureName?: string;
}

interface NestedSidebarItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  featureName: string;
  children?: SidebarChild[];
  onNavigate: () => void;
}

export const NestedSidebarItem = ({ 
  name, 
  href, 
  icon: Icon, 
  featureName, 
  children, 
  onNavigate 
}: NestedSidebarItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { hasAccess, isLoading } = useFeatureAccessContext();
  
  // Get access from bulk provider
  const hasFeatureAccess = hasAccess(featureName);
  const canAccess = isLoading || hasFeatureAccess;
  const needsUpgrade = !isLoading && !hasFeatureAccess;

  // Check if current route matches parent or any child
  const isParentActive = location.pathname === href;
  const isChildActive = children?.some(child => location.pathname === child.href) || false;
  const isActive = isParentActive || isChildActive;

  // Auto-expand if child is active
  const shouldBeExpanded = isExpanded || isChildActive;

  const handleParentClick = (e: React.MouseEvent) => {
    if (!canAccess) return;
    
    if (children && children.length > 0) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else {
      onNavigate();
    }
  };

  const handleChildClick = () => {
    onNavigate();
  };

  return (
    <div className="space-y-1">
      {/* Parent Item */}
      <Link
        to={canAccess && (!children || children.length === 0) ? href : "#"}
        onClick={handleParentClick}
        className={cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background group",
          isActive
            ? "bg-primary/10 text-primary border-r-2 border-primary shadow-sm"
            : canAccess
            ? "text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
            : "text-muted-foreground cursor-not-allowed opacity-50"
        )}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={children && children.length > 0 ? shouldBeExpanded : undefined}
        aria-describedby={needsUpgrade ? `${name}-upgrade-needed` : undefined}
      >
        <Icon className="h-5 w-5 mr-3 transition-colors" aria-hidden="true" />
        <span className="flex-1">{name}</span>
        
        {children && children.length > 0 && canAccess && (
          <div className="ml-2">
            {shouldBeExpanded ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            )}
          </div>
        )}
        
        {needsUpgrade && (
          <>
            <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full shadow-sm animate-pulse" aria-hidden="true" />
            <span id={`${name}-upgrade-needed`} className="sr-only">
              Requires upgrade
            </span>
          </>
        )}
      </Link>

      {/* Children Items */}
      {children && children.length > 0 && canAccess && shouldBeExpanded && (
        <div className="ml-4 space-y-1 overflow-hidden">
          {children.map((child) => {
            const ChildIcon = child.icon;
            const isChildItemActive = location.pathname === child.href;
            const childHasAccess = !child.featureName || isLoading || hasAccess(child.featureName);
            const childCanAccess = isLoading || childHasAccess;
            
            return (
              <Link
                key={child.name}
                to={childCanAccess ? child.href : "#"}
                onClick={() => childCanAccess && handleChildClick()}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background group",
                  isChildItemActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary shadow-sm"
                    : childCanAccess
                    ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
                    : "text-muted-foreground cursor-not-allowed opacity-30"
                )}
                aria-current={isChildItemActive ? 'page' : undefined}
              >
                <ChildIcon className="h-4 w-4 mr-3 transition-colors" aria-hidden="true" />
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};