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
    <section aria-labelledby="dashboard-stats-title" className="mb-8">
      <h2 id="dashboard-stats-title" className="sr-only">Dashboard Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card 
              key={index}
              id={`dashboard-stat-${index}`}
              className={`bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-2 ${stat.borderColor} hover:shadow-elegant hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-300 focus-visible cursor-pointer group relative overflow-hidden`}
              role="img"
              aria-label={`${stat.title}: ${stat.value} (${stat.change})`}
              aria-describedby={`stat-description-${index}`}
              tabIndex={0}
            >
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground/90">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgColor} to-transparent border border-border/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`} aria-hidden="true">
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                        {stat.value}
                      </div>
                      <div 
                        id={`stat-description-${index}`}
                        className={`text-sm font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                          stat.trend === 'up' ? 'text-success bg-success/10' : 
                          stat.trend === 'down' ? 'text-error bg-error/10' : 'text-muted-foreground bg-muted/20'
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