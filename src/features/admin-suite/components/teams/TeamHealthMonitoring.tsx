import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Activity, TrendingUp, AlertTriangle, Crown, Calendar } from "lucide-react";

interface TeamHealthMetrics {
  team_id: string;
  team_name: string;
  owner_name: string;
  member_count: number;
  active_members: number;
  total_credits_used: number;
  total_credits_available: number;
  utilization_percentage: number;
  activity_score: number;
  content_generated_30d: number;
  avg_content_per_member: number;
  billing_status: 'current' | 'overdue' | 'trial';
  health_score: number;
  health_status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  last_activity: string;
  created_at: string;
  issues: string[];
}

interface TeamSystemMetrics {
  total_teams: number;
  active_teams: number;
  teams_at_risk: number;
  average_health_score: number;
  total_revenue: number;
  churn_risk_teams: number;
}

export const TeamHealthMonitoring = () => {
  const [sortBy, setSortBy] = useState<string>('health_score');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['team-health-monitoring'],
    queryFn: async (): Promise<{ teams: TeamHealthMetrics[], system: TeamSystemMetrics }> => {
      // Get all teams with comprehensive data
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          profiles!fk_teams_owner(
            full_name,
            email
          ),
          team_members!fk_team_members_team(
            id,
            status,
            user_id,
            created_at
          )
        `);

      if (error) throw error;

      const teamsMetrics: TeamHealthMetrics[] = await Promise.all(
        (teamsData || []).map(async (team: any) => {
          const member_count = team.team_members?.length || 0;
          const active_members = team.team_members?.filter((m: any) => m.status === 'active').length || 0;
          
          // Get user credits for team members
          const memberIds = team.team_members?.map((m: any) => m.user_id) || [];
          const { data: creditsData } = await supabase
            .from('user_credits')
            .select('monthly_limit, credits_used')
            .in('user_id', memberIds);

          const total_credits_used = creditsData?.reduce((sum, c) => sum + c.credits_used, 0) || 0;
          const total_credits_available = creditsData?.reduce((sum, c) => sum + c.monthly_limit, 0) || 0;
          const utilization_percentage = total_credits_available > 0 
            ? (total_credits_used / total_credits_available) * 100 
            : 0;

          // Get content generation metrics (last 30 days)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: contentData } = await supabase
            .from('generated_content')
            .select('id, created_at')
            .in('user_id', memberIds)
            .gte('created_at', thirtyDaysAgo);

          const content_generated_30d = contentData?.length || 0;
          const avg_content_per_member = active_members > 0 ? content_generated_30d / active_members : 0;

          // Get recent activity
          const { data: recentActivity } = await supabase
            .from('generated_content')
            .select('created_at')
            .in('user_id', memberIds)
            .order('created_at', { ascending: false })
            .limit(1);

          const last_activity = recentActivity?.[0]?.created_at || team.created_at;

          // Calculate activity score (0-100)
          const daysSinceLastActivity = Math.floor(
            (Date.now() - new Date(last_activity).getTime()) / (1000 * 60 * 60 * 24)
          );
          let activity_score = Math.max(0, 100 - (daysSinceLastActivity * 5));
          
          // Boost score for high content generation
          if (avg_content_per_member > 10) activity_score = Math.min(100, activity_score + 20);
          if (avg_content_per_member > 5) activity_score = Math.min(100, activity_score + 10);

          // Determine billing status (simplified)
          const billing_status: 'current' | 'overdue' | 'trial' = 'current'; // Would integrate with billing system

          // Calculate health score and identify issues
          let health_score = 0;
          const issues: string[] = [];

          // Member activity (30% weight)
          if (active_members === 0) {
            issues.push('No active members');
            health_score += 0;
          } else if (active_members < member_count * 0.5) {
            issues.push('Low member engagement');
            health_score += 10;
          } else {
            health_score += 30;
          }

          // Content generation (25% weight)
          if (content_generated_30d === 0) {
            issues.push('No content generated in 30 days');
            health_score += 0;
          } else if (avg_content_per_member < 2) {
            issues.push('Low content generation per member');
            health_score += 10;
          } else {
            health_score += 25;
          }

          // Credit utilization (20% weight)
          if (utilization_percentage > 90) {
            issues.push('High credit utilization - upgrade needed');
            health_score += 15;
          } else if (utilization_percentage < 20) {
            issues.push('Very low credit utilization');
            health_score += 10;
          } else {
            health_score += 20;
          }

          // Recent activity (15% weight)
          if (daysSinceLastActivity > 14) {
            issues.push('No activity in 2+ weeks');
            health_score += 0;
          } else if (daysSinceLastActivity > 7) {
            issues.push('Limited recent activity');
            health_score += 8;
          } else {
            health_score += 15;
          }

          // Team size and billing (10% weight)
          if (member_count === 1) {
            issues.push('Single-member team');
            health_score += 5;
          } else {
            health_score += 10;
          }

          // Determine health status
          let health_status: 'excellent' | 'good' | 'needs_attention' | 'critical';
          if (health_score >= 80) health_status = 'excellent';
          else if (health_score >= 60) health_status = 'good';
          else if (health_score >= 40) health_status = 'needs_attention';
          else health_status = 'critical';

          return {
            team_id: team.id,
            team_name: team.name,
            owner_name: team.profiles?.full_name || team.profiles?.email || 'Unknown',
            member_count,
            active_members,
            total_credits_used,
            total_credits_available,
            utilization_percentage,
            activity_score,
            content_generated_30d,
            avg_content_per_member,
            billing_status,
            health_score,
            health_status,
            last_activity,
            created_at: team.created_at,
            issues
          };
        })
      );

      // Calculate system metrics
      const system: TeamSystemMetrics = {
        total_teams: teamsMetrics.length,
        active_teams: teamsMetrics.filter(t => t.health_status !== 'critical').length,
        teams_at_risk: teamsMetrics.filter(t => t.health_status === 'critical' || t.health_status === 'needs_attention').length,
        average_health_score: teamsMetrics.length > 0 
          ? teamsMetrics.reduce((sum, t) => sum + t.health_score, 0) / teamsMetrics.length 
          : 0,
        total_revenue: teamsMetrics.length * 99, // Simplified - would calculate from actual billing
        churn_risk_teams: teamsMetrics.filter(t => t.health_status === 'critical').length
      };

      return { teams: teamsMetrics, system };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });

  const filteredAndSortedTeams = useMemo(() => {
    if (!metrics?.teams) return [];
    
    let filtered = metrics.teams;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(team => team.health_status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'health_score':
          return b.health_score - a.health_score;
        case 'member_count':
          return b.member_count - a.member_count;
        case 'utilization':
          return b.utilization_percentage - a.utilization_percentage;
        case 'activity':
          return b.activity_score - a.activity_score;
        default:
          return b.health_score - a.health_score;
      }
    });
  }, [metrics?.teams, statusFilter, sortBy]);

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'needs_attention': return 'outline';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

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
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-secondary">Total Teams</p>
                <p className="text-2xl font-bold text-primary">{metrics?.system.total_teams}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-success-subtle rounded-lg">
                <Activity className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-secondary">Avg Health Score</p>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.system.average_health_score.toFixed(0)}
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
                <p className="text-sm text-secondary">Teams at Risk</p>
                <p className="text-2xl font-bold text-primary">{metrics?.system.teams_at_risk}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-destructive-subtle rounded-lg">
                <TrendingUp className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-secondary">Churn Risk</p>
                <p className="text-2xl font-bold text-primary">{metrics?.system.churn_risk_teams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Teams Alert */}
      {metrics?.system.churn_risk_teams > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {metrics.system.churn_risk_teams} team{metrics.system.churn_risk_teams > 1 ? 's' : ''} in critical status requiring immediate attention to prevent churn.
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="health_score">Health Score</SelectItem>
            <SelectItem value="member_count">Member Count</SelectItem>
            <SelectItem value="utilization">Credit Usage</SelectItem>
            <SelectItem value="activity">Activity Score</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="needs_attention">Needs Attention</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Health List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Health Monitoring</CardTitle>
          <CardDescription>
            Comprehensive health metrics for all teams including activity, engagement, and billing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedTeams.map((team) => (
              <div key={team.team_id} className="border border-semantic rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-primary">{team.team_name}</h3>
                        <Crown className="h-4 w-4 text-warning" />
                      </div>
                      <p className="text-sm text-secondary">Owner: {team.owner_name}</p>
                      <p className="text-xs text-tertiary">
                        Created {new Date(team.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Badge 
                      variant={getHealthBadgeVariant(team.health_status)}
                      className="capitalize"
                    >
                      {team.health_status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">{team.health_score}</p>
                      <p className="text-xs text-secondary">Health Score</p>
                      <Progress value={team.health_score} className="w-16 h-2 mt-1" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {team.active_members}/{team.member_count}
                      </p>
                      <p className="text-xs text-secondary">Active Members</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium">{team.utilization_percentage.toFixed(1)}%</p>
                      <p className="text-xs text-secondary">Credit Usage</p>
                      <Progress value={team.utilization_percentage} className="w-16 h-2 mt-1" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium">{team.content_generated_30d}</p>
                      <p className="text-xs text-secondary">Content (30d)</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-secondary">
                          {Math.floor((Date.now() - new Date(team.last_activity).getTime()) / (1000 * 60 * 60 * 24))}d ago
                        </span>
                      </div>
                      <p className="text-xs text-secondary">Last Activity</p>
                    </div>
                  </div>
                </div>
                
                {team.issues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-semantic">
                    <div className="flex flex-wrap gap-2">
                      {team.issues.map((issue, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredAndSortedTeams.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">No teams found</h3>
                <p className="text-secondary">
                  {statusFilter !== 'all' 
                    ? `No teams with ${statusFilter.replace('_', ' ')} status found.`
                    : 'No teams available.'
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