import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  animate?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, lines = 1, animate = true, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-4 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted rounded",
              animate && "animate-pulse",
              index === lines - 1 && lines > 1 && "w-3/4" // Last line shorter for realism
            )}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";

// Specialized skeleton components
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6 border border-border rounded-lg bg-card", className)}>
    <div className="space-y-4">
      <Skeleton lines={1} className="h-6" />
      <Skeleton lines={2} />
      <div className="flex gap-4">
        <Skeleton lines={1} className="h-10 w-20" />
        <Skeleton lines={1} className="h-10 w-20" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => (
  <div className={cn("space-y-3", className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} lines={1} className="h-4" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} lines={1} className="h-4" />
        ))}
      </div>
    ))}
  </div>
);

export const DashboardCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6 border border-border rounded-lg bg-card space-y-4", className)}>
    <div className="flex items-center justify-between">
      <Skeleton lines={1} className="h-5 w-32" />
      <Skeleton lines={1} className="h-4 w-16" />
    </div>
    <Skeleton lines={1} className="h-8 w-24" />
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton lines={1} className="h-3 w-20" />
        <Skeleton lines={1} className="h-3 w-12" />
      </div>
      <Skeleton lines={1} className="h-2 w-full" />
    </div>
  </div>
);

export const ContentCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-4 border border-border rounded-lg bg-card space-y-3", className)}>
    <div className="flex items-start gap-3">
      <Skeleton lines={1} className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton lines={1} className="h-4 w-3/4" />
        <Skeleton lines={1} className="h-3 w-1/2" />
      </div>
      <Skeleton lines={1} className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton lines={2} />
    <div className="flex gap-2">
      <Skeleton lines={1} className="h-8 w-16" />
      <Skeleton lines={1} className="h-8 w-16" />
      <Skeleton lines={1} className="h-8 w-16" />
    </div>
  </div>
);