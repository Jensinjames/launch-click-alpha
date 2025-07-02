import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Mail, Loader2, Upload } from 'lucide-react';
import { TeamRole, getAvailableRoles } from '@/shared/utils/permissionHelpers';

const invitationSchema = z.object({
  invitations: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      role: z.enum(['admin', 'editor', 'viewer'] as const)
    })
  ).min(1, 'At least one invitation is required')
});

export type InvitationFormData = z.infer<typeof invitationSchema>;

export interface InvitationFormProps {
  teamId: string;
  currentUserRole: TeamRole;
  onSubmit: (data: InvitationFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({
  teamId,
  currentUserRole,
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [bulkEmails, setBulkEmails] = useState('');
  
  const availableRoles = getAvailableRoles(currentUserRole);
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      invitations: [{ email: '', role: 'viewer' }]
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invitations'
  });

  const watchedInvitations = watch('invitations');

  const handleBulkAdd = () => {
    if (!bulkEmails.trim()) return;
    
    const emails = bulkEmails
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    
    emails.forEach(email => {
      // Check if email already exists
      if (!watchedInvitations.some(inv => inv.email === email)) {
        append({ email, role: 'viewer' });
      }
    });
    
    setBulkEmails('');
  };

  const handleFormSubmit = async (data: InvitationFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Invitation form submission error:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invite Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bulk Email Input */}
        <div className="space-y-2">
          <Label htmlFor="bulk-emails">Bulk Add Emails</Label>
          <div className="flex gap-2">
            <Input
              id="bulk-emails"
              placeholder="Enter emails separated by commas or new lines"
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleBulkAdd}
              disabled={!bulkEmails.trim() || isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Individual Invitations */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Individual Invitations</Label>
              <Badge variant="secondary">
                {fields.length} invitation{fields.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    {...register(`invitations.${index}.email`)}
                    placeholder="email@example.com"
                    disabled={isLoading}
                    className={errors.invitations?.[index]?.email ? 'border-destructive' : ''}
                  />
                  {errors.invitations?.[index]?.email && (
                    <Alert variant="destructive" className="mt-1">
                      <AlertDescription>
                        {errors.invitations[index]?.email?.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <Select
                  value={watchedInvitations[index]?.role}
                  onValueChange={(value) => setValue(`invitations.${index}.role`, value as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1 || isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ email: '', role: 'viewer' })}
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Invitation
            </Button>
          </div>

          {errors.invitations && (
            <Alert variant="destructive">
              <AlertDescription>
                {errors.invitations.message || 'Please fix the errors above'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !isValid || fields.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Invitations...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send {fields.length} Invitation{fields.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};