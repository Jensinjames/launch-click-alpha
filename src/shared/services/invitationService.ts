import { supabase } from '@/integrations/supabase/client';

export interface InvitationData {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface BulkInvitationResult {
  successful: string[];
  failed: { email: string; error: string; }[];
  total: number;
}

export class InvitationService {
  static async sendTeamInvitations(
    teamId: string, 
    invitations: InvitationData[]
  ): Promise<BulkInvitationResult> {
    const { data, error } = await supabase.functions.invoke('invite-team-members', {
      body: { 
        teamId, 
        invitations 
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to send invitations');
    }

    return data;
  }

  static async resendInvitation(invitationId: string) {
    const { data, error } = await supabase.functions.invoke('resend-team-invitation', {
      body: { invitationId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to resend invitation');
    }

    return data;
  }

  static async cancelInvitation(invitationId: string) {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) {
      throw new Error(error.message || 'Failed to cancel invitation');
    }

    return { success: true };
  }

  static async getTeamInvitations(teamId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        invited_by_profile:profiles!team_invitations_invited_by_fkey(full_name, email)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch invitations');
    }

    return data;
  }

  static async getPendingInvitations(teamId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch pending invitations');
    }

    return data;
  }

  static async acceptInvitation(token: string) {
    const { data, error } = await supabase.functions.invoke('accept-team-invitation', {
      body: { token }
    });

    if (error) {
      throw new Error(error.message || 'Failed to accept invitation');
    }

    return data;
  }

  static async declineInvitation(invitationId: string) {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId);

    if (error) {
      throw new Error(error.message || 'Failed to decline invitation');
    }

    return { success: true };
  }

  static async validateInvitationToken(token: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams(name, owner_id),
        invited_by_profile:profiles!team_invitations_invited_by_fkey(full_name, email)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Invitation not found or has expired');
      }
      throw new Error(error.message || 'Failed to validate invitation');
    }

    return data;
  }

  static async getInvitationStats(teamId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('status')
      .eq('team_id', teamId);

    if (error) {
      throw new Error(error.message || 'Failed to fetch invitation stats');
    }

    const stats = data.reduce((acc, invitation) => {
      acc[invitation.status] = (acc[invitation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: data.length,
      pending: stats.pending || 0,
      accepted: stats.accepted || 0,
      declined: stats.declined || 0,
      expired: stats.expired || 0,
      cancelled: stats.cancelled || 0,
    };
  }

  static async cleanupExpiredInvitations(teamId?: string) {
    const { data, error } = await supabase.functions.invoke('cleanup-expired-invitations', {
      body: { teamId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to cleanup expired invitations');
    }

    return data;
  }

  static async getInvitationsByEmail(email: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams(name, owner_id),
        invited_by_profile:profiles!team_invitations_invited_by_fkey(full_name, email)
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch user invitations');
    }

    return data;
  }

  static async validateBulkInvitations(
    teamId: string,
    invitations: InvitationData[],
    currentMemberCount: number,
    maxSeats: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check team capacity
    const totalAfterInvites = currentMemberCount + invitations.length;
    if (totalAfterInvites > maxSeats) {
      errors.push(`Team capacity exceeded. Current: ${currentMemberCount}, Max: ${maxSeats}, Adding: ${invitations.length}`);
    }

    // Check for duplicate emails within the batch
    const emailSet = new Set();
    invitations.forEach((inv, index) => {
      if (emailSet.has(inv.email.toLowerCase())) {
        errors.push(`Duplicate email at position ${index + 1}: ${inv.email}`);
      }
      emailSet.add(inv.email.toLowerCase());
    });

    // Check for existing team members
    if (invitations.length > 0) {
      const emails = invitations.map(inv => inv.email.toLowerCase());
      const { data: existingMembers, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profiles!inner(email)
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error) {
        errors.push('Failed to validate existing members');
      } else {
        const existingEmails = new Set(
          existingMembers
            .map(member => member.profiles?.email?.toLowerCase())
            .filter(Boolean)
        );

        emails.forEach(email => {
          if (existingEmails.has(email)) {
            errors.push(`User already a team member: ${email}`);
          }
        });
      }
    }

    // Check for pending invitations
    if (invitations.length > 0) {
      const emails = invitations.map(inv => inv.email.toLowerCase());
      const { data: pendingInvitations, error } = await supabase
        .from('team_invitations')
        .select('email')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .in('email', emails);

      if (error) {
        errors.push('Failed to validate pending invitations');
      } else {
        pendingInvitations.forEach(invitation => {
          errors.push(`Invitation already pending: ${invitation.email}`);
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}