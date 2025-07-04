
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import AdminTableRow from './AdminTableRow';

interface Team {
  id: string;
  name: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  team_members: any[];
  created_at: string;
}

interface TeamsTableProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  deleteLoading: boolean;
}

export const TeamsTable = React.memo(({ 
  teams, 
  onEditTeam, 
  onDeleteTeam, 
  deleteLoading 
}: TeamsTableProps) => {
  if (teams.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
        <p className="text-gray-500">
          Try adjusting your search terms or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <AdminTableRow
              key={team.id}
              id={team.id}
              name={team.name}
              owner={team.profiles}
              memberCount={Array.isArray(team.team_members) ? team.team_members.length : 0}
              createdAt={team.created_at}
              onEdit={onEditTeam}
              onDelete={onDeleteTeam}
              deleteLoading={deleteLoading}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

TeamsTable.displayName = 'TeamsTable';
