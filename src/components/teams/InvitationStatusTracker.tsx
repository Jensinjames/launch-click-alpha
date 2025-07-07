import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationStatusTrackerProps {
  teamId: string;
}

export const InvitationStatusTracker = ({ teamId }: InvitationStatusTrackerProps) => {
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          created_at,
          profiles!team_invitations_invited_by_fkey(full_name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!teamId
  });

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setResendingInvite(invitationId);
    
    try {
      // Update invitation status and expiry
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ 
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Call the edge function to resend the email
      const { error: emailError } = await supabase.functions.invoke('invite-team-members', {
        body: {
          team_id: teamId,
          emails: [email],
          role: 'viewer' // Default role for resend
        }
      });

      if (emailError) throw emailError;

      toast.success('Invitation resent successfully');
      refetch();
    } catch (error: any) {
      console.error('Failed to resend invitation:', error);
      toast.error('Failed to resend invitation');
    } finally {
      setResendingInvite(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    const actualStatus = isExpired && status === 'pending' ? 'expired' : status;

    switch (actualStatus) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-700 border-green-300">Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-700 border-red-300">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-gray-700 border-gray-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No invitations sent yet. Invite team members to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Team Invitations</CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expires_at) < new Date();
            const canResend = invitation.status === 'pending' && !isExpired;
            
            return (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(isExpired && invitation.status === 'pending' ? 'expired' : invitation.status)}
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Role: {invitation.role}</span>
                      <span>•</span>
                      <span>
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusBadge(invitation.status, invitation.expires_at)}
                  
                  {(invitation.status === 'expired' || (invitation.status === 'pending' && isExpired)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                      disabled={resendingInvite === invitation.id}
                    >
                      {resendingInvite === invitation.id ? 'Sending...' : 'Resend'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};