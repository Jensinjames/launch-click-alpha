import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamAnalyticsRequest {
  teamId: string;
  period: '7d' | '30d' | '90d';
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { teamId, period = '30d' }: TeamAnalyticsRequest = await req.json();

    // Verify user is team member
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      throw new Error('Access denied: Not a team member');
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    startDate.setDate(endDate.getDate() - days);

    // Get team member statistics
    const { data: teamStats, error: statsError } = await supabase
      .from('team_members')
      .select('id, status, created_at')
      .eq('team_id', teamId);

    if (statsError) throw statsError;

    // Get content generation statistics
    const { data: contentStats, error: contentError } = await supabase
      .from('generated_content')
      .select('id, created_at, metadata')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (contentError) throw contentError;

    // Get credit usage for team members
    const teamMemberIds = teamStats?.map(m => m.id) || [];
    const { data: creditStats, error: creditError } = await supabase
      .from('user_credits')
      .select('monthly_limit, credits_used')
      .in('user_id', teamMemberIds);

    if (creditError) throw creditError;

    // Calculate analytics
    const totalMembers = teamStats?.length || 0;
    const activeMembers = teamStats?.filter(m => m.status === 'active').length || 0;
    const contentGenerated = contentStats?.length || 0;
    const totalCreditsUsed = creditStats?.reduce((sum, c) => sum + (c.credits_used || 0), 0) || 0;
    const totalCreditsAvailable = creditStats?.reduce((sum, c) => sum + (c.monthly_limit || 0), 0) || 0;
    
    // Calculate activity score (0-100)
    const activityScore = Math.min(100, Math.round(
      (contentGenerated * 2) + 
      (activeMembers * 5) + 
      ((totalCreditsUsed / Math.max(totalCreditsAvailable, 1)) * 20)
    ));

    // Log analytics access
    await supabase.rpc('audit_sensitive_operation', {
      p_action: 'team_analytics_accessed',
      p_table_name: 'team_analytics',
      p_new_values: {
        team_id: teamId,
        accessed_by: user.id,
        period,
        timestamp: new Date().toISOString()
      }
    });

    const analytics = {
      team_id: teamId,
      total_members: totalMembers,
      active_members: activeMembers,
      content_generated: contentGenerated,
      credits_used: totalCreditsUsed,
      credits_available: totalCreditsAvailable,
      activity_score: activityScore,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString()
    };

    return new Response(
      JSON.stringify(analytics),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Team analytics error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch team analytics'
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