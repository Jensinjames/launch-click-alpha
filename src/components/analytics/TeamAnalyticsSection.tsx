import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamMetrics } from '@/features/teams/components/TeamMetrics';
import { useTeamAnalytics } from '@/features/teams/hooks/useTeamAnalytics';
import { useUserTeams } from '@/hooks/useUserTeams';

export const TeamAnalyticsSection: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: userTeams = [] } = useUserTeams();
  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    error: analyticsError 
  } = useTeamAnalytics(selectedTeamId, selectedPeriod);

  // Set default team if not selected and teams available
  React.useEffect(() => {
    if (!selectedTeamId && userTeams.length > 0) {
      setSelectedTeamId(userTeams[0].id);
    }
  }, [userTeams, selectedTeamId]);

  if (userTeams.length === 0) {
    return (
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-primary">Team Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-tertiary">You're not a member of any teams yet.</p>
            <p className="text-caption mt-2">Join or create a team to see team analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="surface-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary">Team Analytics</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent>
                  {userTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod as any}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analyticsError && (
            <div className="text-center py-8">
              <p className="text-error">Failed to load team analytics</p>
              <p className="text-caption mt-2">{analyticsError.message}</p>
            </div>
          )}
          
          {analytics && !analyticsLoading && (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <TeamMetrics analytics={analytics} isLoading={analyticsLoading} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="surface-elevated">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-secondary">
                        Credit Utilization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-tertiary">Used</span>
                          <span className="text-primary font-medium">
                            {analytics.credits_used.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-surface-elevated-2 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-normal"
                            style={{ 
                              width: `${Math.min(100, (analytics.credits_used / analytics.credits_available) * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-tertiary">
                          <span>0</span>
                          <span>{analytics.credits_available.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="surface-elevated">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-secondary">
                        Team Growth
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-2xl font-bold text-primary">
                          {analytics.total_members}
                        </div>
                        <div className="text-sm text-tertiary mt-1">
                          Total Members
                        </div>
                        <div className="text-xs text-success mt-2">
                          +{analytics.active_members} active
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="activity">
                <div className="text-center py-8">
                  <p className="text-tertiary">Activity analytics coming soon</p>
                </div>
              </TabsContent>
              
              <TabsContent value="performance">
                <div className="text-center py-8">
                  <p className="text-tertiary">Performance analytics coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};