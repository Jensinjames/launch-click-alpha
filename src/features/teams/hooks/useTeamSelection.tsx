
import { useState, useEffect } from 'react';
import { useUserTeams, UserTeam } from '@/hooks/useUserTeams';

export const useTeamSelection = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const { data: userTeams, isLoading: teamsLoading } = useUserTeams();

  // Auto-select the first team if none is selected
  useEffect(() => {
    if (userTeams && userTeams.length > 0 && selectedTeamId === "") {
      setSelectedTeamId(userTeams[0].id);
    }
  }, [userTeams, selectedTeamId]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
  };

  const selectedTeam = userTeams?.find(team => team.id === selectedTeamId);

  return {
    selectedTeamId,
    selectedTeam,
    userTeams: userTeams || [],
    teamsLoading,
    handleTeamChange,
    hasTeams: userTeams && userTeams.length > 0
  };
};
