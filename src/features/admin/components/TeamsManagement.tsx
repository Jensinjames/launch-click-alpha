
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounced } from '@/hooks/useDebounced';
import { SearchInput } from './SearchInput';
import { TeamsManagementHeader } from './TeamsManagementHeader';
import { TeamsTable } from './TeamsTable';
import { useAdminMutations } from '@/hooks/useAdminMutations';

export const TeamsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounced(searchTerm, 300);
  
  const { deleteTeam, isLoading: adminLoading } = useAdminMutations();

  // Fetch all teams with member counts and owner info - optimized query
  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          profiles!fk_teams_profiles(full_name, email),
          team_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for admin data
  });

  // Memoized filtered teams to avoid re-computation on every render
  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    
    if (!debouncedSearchTerm) return teams;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return teams.filter(team =>
      team.name.toLowerCase().includes(searchLower) ||
      team.profiles?.email?.toLowerCase().includes(searchLower) ||
      team.profiles?.full_name?.toLowerCase().includes(searchLower)
    );
  }, [teams, debouncedSearchTerm]);

  const handleEditTeam = (teamId: string) => {
    // Navigate to team details - we'll implement this later
    console.log('View team details:', teamId);
  };

  const handleDeleteTeam = (teamId: string) => {
    deleteTeam.mutate(teamId);
  };

  if (isLoading) {
    return (
      <Card>
        <TeamsManagementHeader />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <TeamsManagementHeader />
      <CardContent className="space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search teams or owners..."
        />

        <TeamsTable
          teams={filteredTeams}
          onEditTeam={handleEditTeam}
          onDeleteTeam={handleDeleteTeam}
          deleteLoading={adminLoading}
        />
      </CardContent>
    </Card>
  );
};
