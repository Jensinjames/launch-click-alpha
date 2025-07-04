import { Link } from "react-router-dom";
import { LucideIcon } from "@/lib/icons";
import { useFeatureAccessContext } from "@/contexts/FeatureAccessContext";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  featureName: string;
  isActive: boolean;
  onNavigate: () => void;
}

export const SidebarItem = ({ name, href, icon: Icon, featureName, isActive, onNavigate }: SidebarItemProps) => {
  const { hasAccess, isLoading } = useFeatureAccessContext();
  
  // Get access from bulk provider (no individual loading states)
  const hasFeatureAccess = hasAccess(featureName);
  const canAccess = isLoading || hasFeatureAccess;
  const needsUpgrade = !isLoading && !hasFeatureAccess;
  
  console.log(`[SidebarItem] ${name} (${featureName}):`, { hasFeatureAccess, canAccess, isLoading });

  return (
    <Link
      to={canAccess ? href : "#"}
      onClick={() => canAccess && onNavigate()}
      className={cn(
        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background group",
        isActive
          ? "bg-primary/10 text-primary border-r-2 border-primary shadow-sm"
          : canAccess
          ? "text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
          : "text-muted-foreground cursor-not-allowed opacity-50"
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-describedby={needsUpgrade ? `${name}-upgrade-needed` : undefined}
    >
      <Icon className="h-5 w-5 mr-3 transition-colors" aria-hidden="true" />
      {name}
      {needsUpgrade && (
        <>
          <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full shadow-sm animate-pulse" aria-hidden="true" />
          <span id={`${name}-upgrade-needed`} className="sr-only">
            Requires upgrade
          </span>
        </>
      )}
    </Link>
  );
};