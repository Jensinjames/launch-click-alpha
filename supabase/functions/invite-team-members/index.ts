import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  team_id: string;
  emails: string[];
  role: 'admin' | 'editor' | 'viewer';
}

interface EmailDeliveryLog {
  invitation_id: string;
  recipient_email: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed';
  provider_response: any;
  retry_count: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Exponential backoff helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const logEmailDelivery = async (log: EmailDeliveryLog) => {
  try {
    // Simplified logging - just use console for now since email_delivery_logs table may not exist
    console.log('Email delivery log:', {
      invitation_id: log.invitation_id,
      recipient_email: log.recipient_email,
      status: log.status,
      retry_count: log.retry_count
    });
  } catch (error) {
    console.error('Error logging email delivery:', error);
  }
};

const sendEmailSimple = async (
  emailData: any, 
  invitationId: string, 
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Sending email to ${email}`);
    
    const { data, error } = await resend.emails.send(emailData);
    
    if (error) {
      throw new Error(error.message || 'Email sending failed');
    }
    
    // Log successful email
    await logEmailDelivery({
      invitation_id: invitationId,
      recipient_email: email,
      status: 'sent',
      provider_response: data,
      retry_count: 0
    });
    
    return { success: true };
    
  } catch (error: any) {
    console.error(`Email failed for ${email}:`, error.message);
    
    // Log failed attempt
    await logEmailDelivery({
      invitation_id: invitationId,
      recipient_email: email,
      status: 'failed',
      provider_response: { error: error.message },
      retry_count: 0
    });
    
    return { 
      success: false, 
      error: error.message || 'Email sending failed' 
    };
  }
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { team_id, emails, role }: InviteRequest = await req.json();

    // Validate inputs
    if (!team_id || !emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error('Invalid request parameters');
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new Error('Invalid role specified');
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email format: ${email}`);
      }
    }

    // Check if user has permission to invite to this team
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberError || !memberData || !['owner', 'admin'].includes(memberData.role)) {
      throw new Error('Insufficient permissions to invite members');
    }

    // Get team information for email template
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('name')
      .eq('id', team_id)
      .single();

    if (teamError || !teamData) {
      throw new Error('Team not found');
    }

    // Get inviter profile for email template
    const { data: inviterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !inviterProfile) {
      throw new Error('Inviter profile not found');
    }

    const results = [];
    
    for (const email of emails) {
      try {
        // Note: Simplified flow - we'll check membership after invitation acceptance
        // This avoids using admin methods that may not be available

        // Check for existing pending invitation
        const { data: existingInvitation } = await supabase
          .from('team_invitations')
          .select('id, status, expires_at')
          .eq('team_id', team_id)
          .eq('email', email)
          .eq('status', 'pending')
          .single();

        if (existingInvitation && new Date(existingInvitation.expires_at) > new Date()) {
          results.push({
            email,
            status: 'already_invited',
            message: 'Invitation already pending'
          });
          continue;
        }

        // Create or update invitation
        const { data: invitation, error: inviteError } = await supabase
          .from('team_invitations')
          .upsert({
            team_id,
            email,
            role,
            invited_by: user.id,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })
          .select('token')
          .single();

        if (inviteError || !invitation) {
          throw new Error(`Failed to create invitation for ${email}`);
        }

        // Send invitation email - use dynamic origin
        const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/')[0] + '//' + req.headers.get('referer')?.split('/')[2] || `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}`;
        const inviteUrl = `${origin}/teams?invitation=${invitation.token}`;

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7c3aed; margin: 0;">Team Invitation</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #1e293b;">You're invited to join ${teamData.name}</h2>
              <p style="margin: 0 0 16px 0; color: #475569;">
                ${inviterProfile.full_name || inviterProfile.email} has invited you to join their team as a ${role}.
              </p>
              <p style="margin: 0; color: #475569;">
                Click the button below to accept this invitation.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Accept Invitation
              </a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                This invitation will expire in 7 days. If you don't want to receive these emails, you can ignore this message.
              </p>
            </div>
          </div>
        `;

        // Send email - simplified approach
        const emailResult = await sendEmailSimple({
          from: 'Team Invitations <noreply@resend.dev>',
          to: [email],
          subject: `You're invited to join ${teamData.name}`,
          html: emailHtml,
        }, invitation.id, email);

        if (!emailResult.success) {
          console.error('All email attempts failed:', emailResult.error);
          await supabase.rpc('log_security_event', {
            event_type: 'invitation_email_failed_all_retries',
            event_data: { email, team_id, error: emailResult.error }
          });
          
          results.push({
            email,
            status: 'error',
            message: `Email delivery failed: ${emailResult.error}`
          });
        } else {
          results.push({
            email,
            status: 'invited',
            message: 'Invitation sent successfully'
          });
        }

      } catch (error) {
        console.error(`Error inviting ${email}:`, error);
        results.push({
          email,
          status: 'error',
          message: error.message
        });
      }
    }

    // Log the invitation activity
    await supabase.rpc('log_security_event', {
      event_type: 'team_invitations_sent',
      event_data: { team_id, emails, role, inviter_id: user.id, results }
    });

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Invite members error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process invitations',
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});