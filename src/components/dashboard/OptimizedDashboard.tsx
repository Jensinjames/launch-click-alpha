import React from 'react';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import EnhancedDashboardStats from './EnhancedDashboardStats';
import DashboardStats from './DashboardStats';
import RecentAssets from './RecentAssets';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedDashboardProps {
  enhanced?: boolean;
}

export const OptimizedDashboard = React.memo(({ enhanced = true }: OptimizedDashboardProps) => {
  const { 
    credits, 
    assetsCount,
    recentAssets,
    isLoading, 
    error, 
    refresh,
    debug 
  } = useOptimizedDashboard();

  // Show loading skeleton while data is fetching
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Failed to load dashboard data
        </p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-4 text-xs text-muted-foreground">
            {JSON.stringify(error, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance debug info in development */}
      {import.meta.env.DEV && debug && (
        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground">
          Cache: {debug.cacheStatus} | Last fetch: {debug.lastFetch ? new Date(debug.lastFetch).toLocaleTimeString() : 'Never'}
        </div>
      )}

      {/* Optimized Stats Component */}
      {enhanced ? (
        <EnhancedDashboardStats 
          credits={credits}
          assetsCount={assetsCount}
        />
      ) : (
        <DashboardStats 
          credits={credits}
          assetsCount={assetsCount}
        />
      )}

      {/* Recent Assets - Optimized with cached data */}
      <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <RecentAssets assets={recentAssets} />
      </React.Suspense>
    </div>
  );
});

OptimizedDashboard.displayName = 'OptimizedDashboard';