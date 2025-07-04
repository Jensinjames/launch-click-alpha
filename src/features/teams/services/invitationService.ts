import { supabase } from '@/integrations/supabase/client';

interface InvitationData {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  teamId: string;
}

export class InvitationService {
  static async sendTeamInvitations(
    teamId: string,
    invitations: InvitationData[]
  ) {
    const { data, error } = await supabase.functions.invoke('invite-team-members', {
      body: {
        teamId,
        invitations: invitations.map(inv => ({
          email: inv.email,
          role: inv.role
        }))
      }
    });

    if (error) throw error;
    return { data, error: null };
  }

  static async acceptInvitation(token: string) {
    const { data, error } = await supabase.functions.invoke('accept-team-invitation', {
      body: { token }
    });

    if (error) throw error;
    return { data, error: null };
  }

  static async declineInvitation(invitationId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId);

    return { data, error };
  }

  static async getPendingInvitations(email: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams!inner(name),
        profiles!team_invitations_invited_by_fkey(full_name, avatar_url)
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    return { data: data || [], error };
  }

  static async getTeamInvitations(teamId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  }

  static async cancelInvitation(invitationId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    return { data, error };
  }

  static async resendInvitation(invitationId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .update({ 
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      })
      .eq('id', invitationId);

    return { data, error };
  }
}