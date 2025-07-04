
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";

import { CreateTeamDialog } from "./CreateTeamDialog";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSelection } from "../hooks/useTeamSelection";

export const TeamsHeader = () => {
  const { user } = useAuth();
  const { selectedTeamId, userTeams } = useTeamSelection();
  
  // Find current user's role in the selected team
  const currentTeam = userTeams?.find(team => team.id === selectedTeamId);
  const currentUserRole = currentTeam?.role || 'viewer';
  
  const canInviteMembers = selectedTeamId && ['owner', 'admin'].includes(currentUserRole);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage your team members, roles, and credit usage.
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <CreateTeamDialog 
          trigger={
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          }
          onSuccess={() => window.location.reload()}
        />
        
        {canInviteMembers && (
          <InviteMembersDialog 
            teamId={selectedTeamId!}
            currentUserRole={currentUserRole}
            trigger={
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};
