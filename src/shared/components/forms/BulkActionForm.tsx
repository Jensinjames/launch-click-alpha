import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Users, Settings, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { TeamRole, getAvailableRoles } from '@/shared/utils/permissionHelpers';
import { TeamMemberWithCredits } from '@/types/team';

const bulkActionSchema = z.object({
  action: z.enum(['update_role', 'update_credits', 'remove_members']),
  selectedMembers: z.array(z.string()).min(1, 'At least one member must be selected'),
  newRole: z.enum(['admin', 'editor', 'viewer']).optional(),
  creditsLimit: z.number().min(0).max(10000).optional(),
});

export type BulkActionFormData = z.infer<typeof bulkActionSchema>;

export interface BulkActionFormProps {
  members: TeamMemberWithCredits[];
  currentUserRole: TeamRole;
  onSubmit: (data: BulkActionFormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const BulkActionForm: React.FC<BulkActionFormProps> = ({
  members,
  currentUserRole,
  onSubmit,
  isLoading = false,
  className = ''
}) => {
  const availableRoles = getAvailableRoles(currentUserRole);
  const selectableMembers = members.filter(m => m.role !== 'owner');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<BulkActionFormData>({
    resolver: zodResolver(bulkActionSchema),
    defaultValues: {
      selectedMembers: [],
      action: 'update_role'
    },
    mode: 'onChange'
  });

  const selectedAction = watch('action');
  const selectedMembers = watch('selectedMembers');

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    const current = selectedMembers || [];
    const updated = checked 
      ? [...current, memberId]
      : current.filter(id => id !== memberId);
    setValue('selectedMembers', updated);
  };

  const handleSelectAll = (checked: boolean) => {
    const allIds = checked ? selectableMembers.map(m => m.id) : [];
    setValue('selectedMembers', allIds);
  };

  const selectedMemberObjects = selectableMembers.filter(m => 
    selectedMembers?.includes(m.id)
  );

  const handleFormSubmit = async (data: BulkActionFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Bulk action form submission error:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Bulk Member Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Action Selection */}
          <div className="space-y-2">
            <Label>Select Action</Label>
            <Select
              value={selectedAction}
              onValueChange={(value) => setValue('action', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update_role">Update Member Roles</SelectItem>
                <SelectItem value="update_credits">Update Credit Limits</SelectItem>
                <SelectItem value="remove_members">Remove Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action-specific inputs */}
          {selectedAction === 'update_role' && (
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select
                onValueChange={(value) => setValue('newRole', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.newRole && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.newRole.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {selectedAction === 'update_credits' && (
            <div className="space-y-2">
              <Label>New Credit Limit</Label>
              <Input
                type="number"
                {...register('creditsLimit', { valueAsNumber: true })}
                placeholder="Enter credit limit (0-10000)"
                min="0"
                max="10000"
                disabled={isLoading}
              />
              {errors.creditsLimit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.creditsLimit.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {selectedAction === 'remove_members' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: This action will permanently remove the selected members from the team.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Member Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Members</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMembers?.length === selectableMembers.length}
                  onCheckedChange={handleSelectAll}
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({selectableMembers.length})
                </span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
              {selectableMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedMembers?.includes(member.id) || false}
                      onCheckedChange={(checked) => handleMemberToggle(member.id, checked as boolean)}
                      disabled={isLoading}
                    />
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{member.role}</Badge>
                </div>
              ))}
            </div>

            {selectedMemberObjects.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedMemberObjects.length} member{selectedMemberObjects.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedMemberObjects.map(member => (
                    <Badge key={member.id} variant="outline" className="text-xs">
                      {member.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {errors.selectedMembers && (
            <Alert variant="destructive">
              <AlertDescription>{errors.selectedMembers.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              variant={selectedAction === 'remove_members' ? 'destructive' : 'default'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {selectedAction === 'remove_members' ? (
                    <Trash2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Execute Action
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};