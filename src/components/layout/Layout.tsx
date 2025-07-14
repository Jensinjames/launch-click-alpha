
import React from 'react';
import Sidebar from "./Sidebar";
import { SkipLink } from '@/hooks/useKeyboardNavigation';
import { ErrorBoundaryProvider } from '@/components/shared/ErrorBoundaryProvider';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <ErrorBoundaryProvider>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background">
        {/* Skip links for accessibility */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#sidebar-nav">Skip to navigation</SkipLink>
        
        <Sidebar />
        
        <div className="flex-1 w-full lg:ml-0">
          <main 
            id="main-content"
            className="p-4 sm:p-6 lg:p-8 focus-visible w-full"
            tabIndex={-1}
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundaryProvider>
  );
};

export default Layout;
