import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, CreditCard, TrendingUp } from 'lucide-react';
import { TeamAnalytics } from '../types';

interface TeamMetricsProps {
  analytics: TeamAnalytics;
  isLoading?: boolean;
}

export const TeamMetrics: React.FC<TeamMetricsProps> = ({ analytics, isLoading }) => {
  const metrics = [
    {
      title: 'Team Members',
      value: analytics.total_members,
      subValue: `${analytics.active_members} active`,
      icon: Users,
      trend: '+12%',
      color: 'text-info'
    },
    {
      title: 'Content Generated',
      value: analytics.content_generated,
      subValue: 'This period',
      icon: Activity,
      trend: '+23%',
      color: 'text-success'
    },
    {
      title: 'Credits Used',
      value: analytics.credits_used,
      subValue: `${analytics.credits_available} available`,
      icon: CreditCard,
      trend: '-5%',
      color: 'text-warning'
    },
    {
      title: 'Activity Score',
      value: Math.round(analytics.activity_score),
      subValue: 'Team engagement',
      icon: TrendingUp,
      trend: '+8%',
      color: 'text-primary'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="surface-elevated hover:shadow-md transition-all duration-normal">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-5 w-5 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-tertiary">
                {metric.subValue}
              </p>
              <span className={`text-xs font-medium ${
                metric.trend.startsWith('+') ? 'text-success' : 'text-warning'
              }`}>
                {metric.trend}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};