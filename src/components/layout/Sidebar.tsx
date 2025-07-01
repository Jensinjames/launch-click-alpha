
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BarChart3, CreditCard, Zap, Settings, Menu, X, FileText, Users, Puzzle } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import LogoutButton from "@/components/auth/LogoutButton";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      featureName: 'page_access_dashboard'
    },
    {
      name: 'Generate',
      href: '/generate',
      icon: Zap,
      featureName: 'page_access_generate'
    },
    {
      name: 'Content',
      href: '/content',
      icon: FileText,
      featureName: 'page_access_content'
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: Users,
      featureName: 'page_access_teams'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      featureName: 'page_access_analytics'
    },
    {
      name: 'Integrations',
      href: '/integrations',
      icon: Puzzle,
      featureName: 'integrations'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      featureName: 'page_access_settings'
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: CreditCard,
      featureName: 'page_access_billing'
    }
  ];

  const isActive = (href: string) => location.pathname === href;

  console.log('[Sidebar] Rendering sidebar, current location:', location.pathname);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card shadow-md border-border hover:bg-accent"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-sm border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl",
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-8 border-b border-border/50">
            <div className="p-2.5 bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="ml-3 font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent my-0 px-0 py-0 text-xl">
              Launch Click
            </span>
          </div>

          {/* Navigation */}
          <nav role="navigation" aria-label="Main menu" className="flex-1 space-y-2 py-[21px] my-0 px-0">
            {navigation.map((item) => (
              <SidebarItem
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                featureName={item.featureName}
                isActive={isActive(item.href)}
                onNavigate={() => setIsOpen(false)}
              />
            ))}
          </nav>

          {/* User section with LogoutButton */}
          <div className="border-t border-border/50 p-4">
            <LogoutButton
              variant="ghost"
              showConfirmation={true}
              className="w-full justify-start text-foreground hover:text-accent-foreground hover:bg-accent"
            />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
