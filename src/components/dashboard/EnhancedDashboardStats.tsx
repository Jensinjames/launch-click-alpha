import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Users, TrendingUp, Eye, MousePointer, Activity } from "@/lib/icons";
import { Progress } from "@/components/ui/progress";

interface EnhancedDashboardStatsProps {
  credits: {
    used: number;
    limit: number;
  };
  assetsCount: number;
}

const EnhancedDashboardStats = React.memo(({
  credits,
  assetsCount
}: EnhancedDashboardStatsProps) => {
  const statsData = React.useMemo(() => [
    {
      title: "Total Content Generated",
      value: assetsCount,
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      progress: null
    },
    {
      title: "Credits Used This Month",
      value: credits.used,
      change: `${credits.limit - credits.used} remaining`,
      trend: "neutral",
      icon: Zap,
      color: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/20",
      progress: (credits.used / credits.limit) * 100
    },
    {
      title: "Campaign Performance",
      value: "87%",
      change: "+5.2%",
      trend: "up",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      progress: 87
    },
    {
      title: "Avg. Engagement Rate",
      value: "6.4%",
      change: "+1.2%",
      trend: "up",
      icon: Activity,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
      progress: null
    }
  ], [credits.used, credits.limit, assetsCount]);

  return (
    <section aria-labelledby="dashboard-stats-title" className="mb-6">
      <h2 id="dashboard-stats-title" className="sr-only">Dashboard Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card 
              key={index}
              id={`dashboard-stat-${index}`}
              className={`surface-elevated hover:shadow-md transition-all duration-200 border-2 ${stat.borderColor} focus-visible cursor-pointer group`}
              role="img"
              aria-label={`${stat.title}: ${stat.value} (${stat.change})`}
              aria-describedby={`stat-description-${index}`}
              tabIndex={0}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`} aria-hidden="true">
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {stat.value}
                      </div>
                      <div 
                        id={`stat-description-${index}`}
                        className={`text-sm font-medium ${
                          stat.trend === 'up' ? 'text-success' : 
                          stat.trend === 'down' ? 'text-error' : 'text-muted-foreground'
                        }`}
                      >
                        {stat.change}
                      </div>
                    </div>
                  </div>
                  {stat.progress !== null && (
                    <div className="space-y-1">
                      <Progress 
                        value={stat.progress} 
                        className="h-2" 
                        aria-label={`${stat.title} progress: ${stat.progress.toFixed(1)}%`}
                      />
                      <div className="text-xs text-muted-foreground">
                        {stat.progress.toFixed(1)}% of limit
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
});

EnhancedDashboardStats.displayName = 'EnhancedDashboardStats';

export default EnhancedDashboardStats;