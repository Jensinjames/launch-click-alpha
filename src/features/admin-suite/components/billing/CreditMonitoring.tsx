import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, Activity, DollarSign } from "lucide-react";

interface CreditUsageMetrics {
  user_id: string;
  full_name: string;
  email: string;
  plan_type: string;
  monthly_limit: number;
  credits_used: number;
  usage_percentage: number;
  daily_average: number;
  weekly_trend: number;
  projected_monthly: number;
  risk_level: 'low' | 'medium' | 'high';
  anomaly_detected: boolean;
}

interface SystemMetrics {
  total_users: number;
  total_credits_used: number;
  total_credits_available: number;
  average_utilization: number;
  high_usage_users: number;
  credit_velocity: number;
  projected_revenue_impact: number;
}

export const CreditMonitoring = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['credit-monitoring', timeRange],
    queryFn: async (): Promise<{ users: CreditUsageMetrics[], system: SystemMetrics }> => {
      // Get user credits with usage patterns
      const { data: creditsData, error } = await supabase
        .from('user_credits')
        .select(`
          user_id,
          monthly_limit,
          credits_used,
          reset_at,
          profiles!fk_user_credits_profiles(
            full_name,
            email
          ),
          user_plans!fk_user_credits_user_plans(
            plan_type
          )
        `);

      if (error) throw error;

      // Calculate usage patterns and anomalies
      const usersMetrics: CreditUsageMetrics[] = await Promise.all(
        (creditsData || []).map(async (user: any) => {
          const usage_percentage = (user.credits_used / user.monthly_limit) * 100;
          
          // Get content generation history for trend analysis
          const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
          const { data: contentHistory } = await supabase
            .from('generated_content')
            .select('created_at')
            .eq('user_id', user.user_id)
            .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

          // Calculate daily patterns
          const daily_average = (contentHistory?.length || 0) / daysBack;
          const recent_days = Math.min(3, daysBack);
          const recent_content = contentHistory?.filter(c => 
            new Date(c.created_at) > new Date(Date.now() - recent_days * 24 * 60 * 60 * 1000)
          ).length || 0;
          
          const recent_average = recent_content / recent_days;
          const weekly_trend = daily_average > 0 ? ((recent_average - daily_average) / daily_average) * 100 : 0;
          
          // Project monthly usage
          const days_in_month = 30;
          const projected_monthly = Math.round(daily_average * days_in_month);
          
          // Detect anomalies and risk levels
          let risk_level: 'low' | 'medium' | 'high' = 'low';
          let anomaly_detected = false;

          if (usage_percentage > 90) {
            risk_level = 'high';
          } else if (usage_percentage > 70) {
            risk_level = 'medium';
          }

          // Anomaly detection: sudden spikes in usage
          if (weekly_trend > 200 || (usage_percentage > 80 && weekly_trend > 50)) {
            anomaly_detected = true;
            risk_level = 'high';
          }

          return {
            user_id: user.user_id,
            full_name: user.profiles?.full_name || 'Unknown',
            email: user.profiles?.email || '',
            plan_type: user.user_plans?.plan_type || 'starter',
            monthly_limit: user.monthly_limit,
            credits_used: user.credits_used,
            usage_percentage,
            daily_average,
            weekly_trend,
            projected_monthly,
            risk_level,
            anomaly_detected
          };
        })
      );

      // Calculate system-wide metrics
      const system: SystemMetrics = {
        total_users: usersMetrics.length,
        total_credits_used: usersMetrics.reduce((sum, u) => sum + u.credits_used, 0),
        total_credits_available: usersMetrics.reduce((sum, u) => sum + u.monthly_limit, 0),
        average_utilization: usersMetrics.length > 0 
          ? usersMetrics.reduce((sum, u) => sum + u.usage_percentage, 0) / usersMetrics.length 
          : 0,
        high_usage_users: usersMetrics.filter(u => u.usage_percentage > 80).length,
        credit_velocity: usersMetrics.reduce((sum, u) => sum + u.daily_average, 0),
        projected_revenue_impact: usersMetrics.filter(u => u.risk_level === 'high').length * 50 // Estimated revenue at risk
      };

      return { users: usersMetrics, system };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time feel
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  const filteredUsers = useMemo(() => {
    if (!metrics?.users) return [];
    
    let filtered = metrics.users;
    
    if (riskFilter !== 'all') {
      filtered = filtered.filter(user => user.risk_level === riskFilter);
    }
    
    return filtered.sort((a, b) => {
      // Sort by risk level first, then by usage percentage
      const riskOrder = { high: 0, medium: 1, low: 2 };
      const riskComparison = riskOrder[a.risk_level] - riskOrder[b.risk_level];
      if (riskComparison !== 0) return riskComparison;
      
      return b.usage_percentage - a.usage_percentage;
    });
  }, [metrics?.users, riskFilter]);

  const alertCount = useMemo(() => 
    metrics?.users.filter(u => u.anomaly_detected || u.risk_level === 'high').length || 0
  , [metrics?.users]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-surface-secondary rounded w-1/2"></div>
                  <div className="h-8 bg-surface-secondary rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary-subtle rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-secondary">Total Usage</p>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.system.average_utilization.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-warning-subtle rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-secondary">High Usage Users</p>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.system.high_usage_users}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-success-subtle rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-secondary">Credit Velocity</p>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.system.credit_velocity.toFixed(1)}/day
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-destructive-subtle rounded-lg">
                <DollarSign className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-secondary">Revenue at Risk</p>
                <p className="text-2xl font-bold text-primary">
                  ${metrics?.system.projected_revenue_impact}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alertCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alertCount} user{alertCount > 1 ? 's' : ''} detected with high usage or anomalous patterns requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Credit Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Credit Monitoring</CardTitle>
          <CardDescription>
            Live tracking of user credit consumption patterns and anomaly detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.user_id} className="border border-semantic rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-primary">{user.full_name}</h3>
                        {user.anomaly_detected && (
                          <Badge variant="destructive" className="text-xs">
                            Anomaly
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-secondary">{user.email}</p>
                    </div>
                    
                    <Badge 
                      variant={user.risk_level === 'high' ? 'destructive' : 
                               user.risk_level === 'medium' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {user.risk_level} Risk
                    </Badge>

                    <Badge variant="outline" className="capitalize">
                      {user.plan_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {user.credits_used} / {user.monthly_limit}
                      </p>
                      <p className="text-xs text-secondary">
                        {user.usage_percentage.toFixed(1)}% used
                      </p>
                      <Progress 
                        value={user.usage_percentage} 
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        {user.weekly_trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className={`text-sm ${user.weekly_trend > 0 ? 'text-success' : 'text-destructive'}`}>
                          {user.weekly_trend > 0 ? '+' : ''}{user.weekly_trend.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-secondary">
                        Weekly trend
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {user.projected_monthly}
                      </p>
                      <p className="text-xs text-secondary">
                        Projected monthly
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {user.daily_average.toFixed(1)}
                      </p>
                      <p className="text-xs text-secondary">
                        Daily average
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">No users found</h3>
                <p className="text-secondary">
                  {riskFilter !== 'all' 
                    ? `No users with ${riskFilter} risk level found.`
                    : 'No credit usage data available.'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};