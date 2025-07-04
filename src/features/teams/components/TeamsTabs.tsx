
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, Settings2 } from "lucide-react";
import { TeamAdminData } from "@/hooks/useTeamMembersWithCredits";
import { OptimizedTeamMembersList } from "./OptimizedTeamMembersList";
import { TeamAnalytics } from "./TeamAnalytics";
import { BulkActions } from "./BulkActions";
import { InviteMembersDialog } from "./InviteMembersDialog";

interface TeamsTabsProps {
  teamData: TeamAdminData;
  selectedTeamId: string;
  currentUserRole: string;
}

export const TeamsTabs = ({ teamData, selectedTeamId, currentUserRole }: TeamsTabsProps) => {
  const { members } = teamData;

  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="members" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Members</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span>Analytics</span>
        </TabsTrigger>
        <TabsTrigger value="bulk" className="flex items-center space-x-2">
          <Settings2 className="h-4 w-4" />
          <span>Bulk Actions</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <InviteMembersDialog teamId={selectedTeamId} currentUserRole={currentUserRole} />
        </div>
        <OptimizedTeamMembersList 
          members={members}
          teamId={selectedTeamId}
          currentUserRole={currentUserRole}
        />
      </TabsContent>

      <TabsContent value="analytics">
        <TeamAnalytics teamData={teamData} />
      </TabsContent>

      <TabsContent value="bulk">
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
      </TabsContent>
    </Tabs>
  );
};
