import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import FeatureGate from "@/components/shared/FeatureGate";

import { CreateTeamDialog } from "@/features/teams/components/CreateTeamDialog";
import { TeamsHeader } from "@/features/teams/components/TeamsHeader";
import { TeamSelector } from "@/features/teams/components/TeamSelector";
import { TeamStats } from "@/features/teams/components/TeamStats";
import { TeamsTabs } from "@/features/teams/components/TeamsTabs";

import { useAuth } from "@/hooks/useAuth";
import { useTeamMembersWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { useTeamSelection } from "@/features/teams/hooks/useTeamSelection";
import { TeamsBusinessLogicService } from "@/services/TeamsBusinessLogicService";

const Teams = () => {
  const { user } = useAuth();
  const {
    selectedTeamId,
    userTeams,
    teamsLoading,
    handleTeamChange,
    hasTeams
  } = useTeamSelection();

  // Use business logic service for all team access calculations
  const teamAccessResult = React.useMemo(() => {
    if (!user?.id) return null;
    
    return TeamsBusinessLogicService.calculateTeamAccess({
      userTeams,
      selectedTeamId,
      userId: user.id
    });
  }, [selectedTeamId, userTeams, user?.id]);

  // Get current user's role and permissions
  const currentUserRole = teamAccessResult?.userRole || 'viewer';
  const teamIdForQuery = teamAccessResult?.teamIdForQuery || null;

  const {
    data: teamData,
    isLoading,
    error,
    refetch
  } = useTeamMembersWithCredits(teamIdForQuery);

  // Use business logic service for validation
  const validationResult = React.useMemo(() => {
    if (!teamAccessResult) return { isValid: false, errorType: 'data_error' as const };
    
    return TeamsBusinessLogicService.validateTeamState(
      hasTeams,
      selectedTeamId,
      teamData,
      error,
      teamAccessResult
    );
  }, [hasTeams, selectedTeamId, teamData, error, teamAccessResult]);

  const renderContent = () => {
    if (teamsLoading || isLoading) {
      return (
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
      );
    }

    if (!validationResult.isValid) {
      return (
        <Card className={validationResult.errorType === 'access_denied' ? 'border-destructive/20 bg-destructive/5' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className={`text-lg font-semibold mb-2 ${validationResult.errorType === 'access_denied' ? 'text-destructive' : ''}`}>
                {validationResult.errorType === 'no_teams' ? 'No Teams Found' :
                 validationResult.errorType === 'access_denied' ? 'Access Denied' :
                 validationResult.errorType === 'no_selection' ? 'No Team Selected' :
                 'Error'}
              </h3>
              <p className={`mb-4 ${validationResult.errorType === 'access_denied' ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                {validationResult.errorMessage}
              </p>
              
              {validationResult.shouldShowCreateTeam && (
                <FeatureGate featureName="team_create_basic" mode="component" graceful={true} fallback={
                  <p className="text-sm text-muted-foreground">
                    Basic team creation available to all users.
                  </p>
                }>
                  <CreateTeamDialog onSuccess={() => window.location.reload()} />
                </FeatureGate>
              )}
              
              {validationResult.errorType === 'access_denied' && (
                <Button variant="outline" onClick={() => refetch()}>
                  Try Again
                </Button>
              )}
              
              {validationResult.errorType === 'no_selection' && (
                <>
                  <TeamsHeader />
                  <TeamSelector 
                    userTeams={userTeams} 
                    selectedTeamId={selectedTeamId} 
                    onTeamChange={handleTeamChange} 
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <TeamsHeader />
        <TeamSelector 
          userTeams={userTeams} 
          selectedTeamId={selectedTeamId} 
          onTeamChange={handleTeamChange} 
        />
        <TeamStats statistics={teamData!.statistics} />
        <TeamsTabs 
          teamData={teamData!} 
          selectedTeamId={selectedTeamId!} 
          currentUserRole={currentUserRole}
        />
      </>
    );
  };

  return (
    <AuthGuard requireAuth={true}>
      <FeatureGate featureName="page_access_teams" mode="page">
        <Layout>
          <div className="max-w-7xl mx-auto space-y-8">
            {renderContent()}
          </div>
        </Layout>
      </FeatureGate>
    </AuthGuard>
  );
};

export default Teams;