import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting cleanup of expired invitations...');

    // Get expired invitations
    const { data: expiredInvitations, error: fetchError } = await supabase
      .from('team_invitations')
      .select('id, team_id, email, created_at')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch expired invitations: ${fetchError.message}`);
    }

    if (!expiredInvitations || expiredInvitations.length === 0) {
      console.log('No expired invitations found');
      return new Response(
        JSON.stringify({ 
          message: 'No expired invitations found',
          cleaned_count: 0
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log(`Found ${expiredInvitations.length} expired invitations`);

    // Update expired invitations status
    const { data: updatedInvitations, error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .in('id', expiredInvitations.map(inv => inv.id))
      .select();

    if (updateError) {
      throw new Error(`Failed to update invitations: ${updateError.message}`);
    }

    // Create notifications for team admins about expired invitations
    for (const invitation of expiredInvitations) {
      // Get team admins
      const { data: teamAdmins, error: adminError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', invitation.team_id)
        .in('role', ['owner', 'admin'])
        .eq('status', 'active');

      if (adminError) {
        console.error(`Failed to fetch team admins for team ${invitation.team_id}:`, adminError);
        continue;
      }

      // Create notifications for each admin
      if (teamAdmins && teamAdmins.length > 0) {
        const notifications = teamAdmins.map(admin => ({
          team_id: invitation.team_id,
          user_id: admin.user_id,
          type: 'invitation_expired',
          title: 'Team Invitation Expired',
          message: `Invitation for ${invitation.email} has expired`,
          data: {
            invitation_id: invitation.id,
            email: invitation.email,
            expired_at: new Date().toISOString()
          }
        }));

        const { error: notificationError } = await supabase
          .from('team_notifications')
          .insert(notifications);

        if (notificationError) {
          console.error(`Failed to create notifications for team ${invitation.team_id}:`, notificationError);
        }
      }
    }

    // Log the cleanup operation
    await supabase.rpc('audit_sensitive_operation', {
      p_action: 'invitations_cleanup',
      p_table_name: 'team_invitations',
      p_new_values: {
        cleaned_count: expiredInvitations.length,
        cleaned_at: new Date().toISOString(),
        invitation_ids: expiredInvitations.map(inv => inv.id)
      }
    });

    console.log(`Successfully cleaned up ${expiredInvitations.length} expired invitations`);

    return new Response(
      JSON.stringify({
        message: 'Cleanup completed successfully',
        cleaned_count: expiredInvitations.length,
        cleaned_invitations: updatedInvitations
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to cleanup expired invitations'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});