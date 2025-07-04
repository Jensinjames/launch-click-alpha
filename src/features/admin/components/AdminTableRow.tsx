
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2 } from 'lucide-react';

interface AdminTableRowProps {
  id: string;
  name: string;
  owner?: {
    full_name?: string;
    email?: string;
  };
  memberCount?: number;
  createdAt: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  deleteLoading?: boolean;
}

const AdminTableRow = React.memo(({
  id,
  name,
  owner,
  memberCount,
  createdAt,
  onEdit,
  onDelete,
  deleteLoading = false
}: AdminTableRowProps) => {
  const handleEdit = React.useCallback(() => {
    onEdit?.(id);
  }, [id, onEdit]);

  const handleDelete = React.useCallback(() => {
    onDelete?.(id);
  }, [id, onDelete]);

  const formattedDate = React.useMemo(() => 
    new Date(createdAt).toLocaleDateString(), 
    [createdAt]
  );

  return (
    <TableRow>
      <TableCell className="font-medium">{name}</TableCell>
      {owner && (
        <TableCell>
          <div>
            <div className="font-medium">{owner.full_name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">{owner.email}</div>
          </div>
        </TableCell>
      )}
      {memberCount !== undefined && (
        <TableCell>
          <Badge variant="secondary">
            {memberCount} members
          </Badge>
        </TableCell>
      )}
      <TableCell>{formattedDate}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

AdminTableRow.displayName = 'AdminTableRow';

export default AdminTableRow;
