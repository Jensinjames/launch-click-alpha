
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Users, Clock } from "lucide-react";

interface DashboardStatsProps {
  credits: {
    used: number;
    limit: number;
  };
  assetsCount: number;
}

const DashboardStats = React.memo(({
  credits,
  assetsCount
}: DashboardStatsProps) => {
  const statsData = React.useMemo(() => [
    {
      title: "Total Content Generated",
      value: assetsCount,
      change: "+0%",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20"
    },
    {
      title: "Credits Used This Month",
      value: credits.used,
      change: "+0%",
      icon: Zap,
      color: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/20"
    },
    {
      title: "Team Members",
      value: 1,
      change: "+0%",
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20"
    },
    {
      title: "Avg. Generation Time",
      value: "< 30s",
      change: "-20%",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20"
    }
  ], [credits.used, assetsCount]);

  return (
    <section aria-labelledby="dashboard-stats-title" className="mb-12">
      <h2 id="dashboard-stats-title" className="sr-only">Dashboard Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card 
              key={index} 
              className={`surface-elevated hover:shadow-md transition-all duration-200 border-2 ${stat.borderColor} focus-visible`}
              role="img"
              aria-label={`${stat.title}: ${stat.value} (${stat.change})`}
              tabIndex={0}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`} aria-hidden="true">
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-success font-medium">
                      {stat.change}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;
