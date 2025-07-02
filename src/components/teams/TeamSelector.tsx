
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserTeam } from "@/hooks/useUserTeams";

interface TeamSelectorProps {
  userTeams: UserTeam[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
}

export const TeamSelector = ({ userTeams, selectedTeamId, onTeamChange }: TeamSelectorProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <label htmlFor="team-select" className="text-sm font-medium text-gray-700">
            Select Team:
          </label>
          <Select value={selectedTeamId} onValueChange={onTeamChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a team..." />
            </SelectTrigger>
            <SelectContent>
              {userTeams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name} ({team.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
