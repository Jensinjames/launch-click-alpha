
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import FeatureGate from "@/components/shared/FeatureGate";
import { useTeamMembersWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { useTeamSelection } from "@/hooks/team/useTeamSelection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateTeamDialog } from "@/features/teams/components/CreateTeamDialog";
import { TeamsHeader } from "@/features/teams/components/TeamsHeader";
import { TeamSelector } from "@/features/teams/components/TeamSelector";
import { TeamStats } from "@/features/teams/components/TeamStats";
import { TeamsTabs } from "@/features/teams/components/TeamsTabs";
import { TeamPermissions } from "@/utils/teamPermissions";

const Teams = () => {
  const { user } = useAuth();
  const {
    selectedTeamId,
    userTeams,
    teamsLoading,
    handleTeamChange,
    hasTeams
  } = useTeamSelection();

  const {
    data: teamData,
    isLoading,
    error,
    refetch
  } = useTeamMembersWithCredits(selectedTeamId);

  // Get current user's role in the team
  const currentUserRole = teamData?.members.find(m => m.user_id === user?.id)?.role || 'viewer';

  return (
    <AuthGuard requireAuth={true}>
      <FeatureGate featureName="page_access_teams" mode="page">
        <Layout>
          <div className="max-w-7xl mx-auto space-y-8">
            {teamsLoading || isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted rounded"></div>
                  ))}
                </div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            ) : !hasTeams ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
                    <p className="mb-4 text-muted-foreground">
                      You're not a member of any teams yet. Create a new team or ask to be invited to an existing one.
                    </p>
                    <FeatureGate featureName="team_create_basic" mode="component" graceful={true} fallback={
                      <p className="text-sm text-muted-foreground">
                        Basic team creation available to all users.
                      </p>
                    }>
                      <CreateTeamDialog onSuccess={() => window.location.reload()} />
                    </FeatureGate>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-destructive mb-2">Access Denied</h3>
                    <p className="text-destructive/80 mb-4">
                      {error.message || 'You do not have permission to access this team\'s data.'}
                    </p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : !teamData ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No Team Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Please select a team to manage.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <TeamsHeader />
                <TeamSelector 
                  userTeams={userTeams} 
                  selectedTeamId={selectedTeamId} 
                  onTeamChange={handleTeamChange} 
                />
                <TeamStats statistics={teamData.statistics} />
                <TeamsTabs 
                  teamData={teamData} 
                  selectedTeamId={selectedTeamId!} 
                  currentUserRole={currentUserRole}
                />
              </>
            )}
          </div>
        </Layout>
      </FeatureGate>
    </AuthGuard>
  );
};

export default Teams;
