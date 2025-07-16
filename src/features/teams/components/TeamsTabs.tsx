
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, Settings2, Shield } from "lucide-react";
import { TeamAdminData } from "@/hooks/useTeamMembersWithCredits";
import { OptimizedTeamMembersList } from "./OptimizedTeamMembersList";
import { TeamAnalytics } from "./TeamAnalytics";
import { BulkActions } from "./BulkActions";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { canUserPerformAction, getRoleDisplayName, getRoleDescription } from "@/shared/utils/permissionHelpers";
import type { TeamRole } from "@/shared/utils/permissionHelpers";

interface TeamsTabsProps {
  teamData: TeamAdminData;
  selectedTeamId: string;
  currentUserRole: string;
}

export const TeamsTabs = ({ teamData, selectedTeamId, currentUserRole }: TeamsTabsProps) => {
  const { members } = teamData;
  const role = currentUserRole as TeamRole;
  
  // Permission checks
  const canViewAnalytics = canUserPerformAction(role, 'canViewAnalytics');
  const canManageMembers = canUserPerformAction(role, 'canManageMembers');
  const canInviteMembers = canUserPerformAction(role, 'canInviteMembers');

  return (
    <div className="w-full space-y-6">
      {/* Role Information Banner */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold text-sm">Your Role: {getRoleDisplayName(role)}</h4>
                <p className="text-xs text-muted-foreground">{getRoleDescription(role)}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Members</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center space-x-2"
            disabled={!canViewAnalytics}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger 
            value="bulk" 
            className="flex items-center space-x-2"
            disabled={!canManageMembers}
          >
            <Settings2 className="h-4 w-4" />
            <span>Bulk Actions</span>
          </TabsTrigger>
        </TabsList>

      <TabsContent value="members" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Team Members</h3>
          {canInviteMembers ? (
            <InviteMembersDialog teamId={selectedTeamId} currentUserRole={currentUserRole} />
          ) : (
            <div className="text-xs text-muted-foreground">
              Admin access required to invite members
            </div>
          )}
        </div>
        <OptimizedTeamMembersList 
          members={members}
          teamId={selectedTeamId}
          currentUserRole={currentUserRole}
        />
      </TabsContent>

        <TabsContent value="analytics">
          {canViewAnalytics ? (
            <TeamAnalytics teamData={teamData} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Access Required</h3>
                  <p className="text-muted-foreground">
                    You need editor permissions or higher to view team analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk">
          {canManageMembers ? (
            <Card>
              <CardHeader>
                <CardTitle>Bulk Member Management</CardTitle>
              </CardHeader>
              <CardContent>
                <BulkActions 
                  members={members} 
                  teamId={selectedTeamId}
                  currentUserRole={currentUserRole}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Settings2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Management Access Required</h3>
                  <p className="text-muted-foreground">
                    You need administrator or owner permissions to access bulk management features.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
