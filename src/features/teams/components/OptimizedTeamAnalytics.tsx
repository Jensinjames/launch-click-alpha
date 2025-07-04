
import React, { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TeamAdminData } from "@/types/team";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CreditCard, Calendar } from "lucide-react";
import { AnalyticsSkeleton } from "@/components/skeletons/AnalyticsSkeleton";

interface OptimizedTeamAnalyticsProps {
  teamData: TeamAdminData;
  isLoading?: boolean;
}

// Memoized metric card component
const MetricCard = React.memo(({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center space-x-3">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className="text-sm text-secondary">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-tertiary">{subtitle}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

export const OptimizedTeamAnalytics = React.memo(({ 
  teamData, 
  isLoading = false 
}: OptimizedTeamAnalyticsProps) => {
  // Memoize expensive calculations
  const analytics = useMemo(() => {
    const { members, statistics } = teamData;

    const creditUsageData = members.map(member => ({
      name: member.name.split(' ')[0],
      used: member.credits.credits_used,
      remaining: member.credits.credits_remaining,
      limit: member.credits.monthly_limit
    }));

    const roleDistribution = members.reduce((acc: Array<{role: string, count: number}>, member) => {
      const existing = acc.find(item => item.role === member.role);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ role: member.role, count: 1 });
      }
      return acc;
    }, []);

    const topUsers = [...members]
      .sort((a, b) => b.credits.credits_used - a.credits.credits_used)
      .slice(0, 5);

    const avgUtilization = members.length > 0 
      ? members.reduce((sum, member) => 
          sum + (member.credits.credits_used / member.credits.monthly_limit * 100), 0
        ) / members.length 
      : 0;

    return {
      creditUsageData,
      roleDistribution,
      topUsers,
      avgUtilization,
      statistics
    };
  }, [teamData]);

  const COLORS = useMemo(() => ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'], []);

  // Memoized tooltip formatter
  const formatTooltip = useCallback((value: number, name: string) => {
    return [`${value} credits`, name === 'used' ? 'Used' : 'Remaining'];
  }, []);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={TrendingUp}
          title="Avg Utilization"
          value={`${analytics.avgUtilization.toFixed(1)}%`}
          color="text-info"
        />
        <MetricCard
          icon={Users}
          title="Active Members"
          value={analytics.statistics.active_members}
          color="text-success"
        />
        <MetricCard
          icon={CreditCard}
          title="Credits Pool"
          value={analytics.statistics.total_credits_available}
          color="text-primary"
        />
        <MetricCard
          icon={Calendar}
          title="This Month"
          value={analytics.statistics.total_credits_used}
          subtitle="credits used"
          color="text-warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage by Member</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.creditUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={formatTooltip} />
                <Bar dataKey="used" fill="#8884d8" name="used" />
                <Bar dataKey="remaining" fill="#82ca9d" name="remaining" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Team Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, count }) => `${role}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Credit Users This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topUsers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-secondary">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{member.credits.credits_used} credits</p>
                  <Progress 
                    value={(member.credits.credits_used / member.credits.monthly_limit) * 100}
                    className="w-24 h-2 mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

OptimizedTeamAnalytics.displayName = 'OptimizedTeamAnalytics';
