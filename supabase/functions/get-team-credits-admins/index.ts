import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for elevated permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get team_id from query params or request body
    const url = new URL(req.url)
    let teamId = url.searchParams.get('team_id')
    
    // If not in query params, try to get from request body
    if (!teamId && req.method === 'POST') {
      try {
        const requestBody = await req.json()
        teamId = requestBody.team_id
      } catch (error) {
        // Body parsing failed, continue with null teamId
      }
    }
    
    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'team_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is team admin or owner
    const { data: adminCheck, error: adminError } = await supabaseClient
      .rpc('is_team_admin', { team_uuid: teamId, uid: user.id })

    if (adminError || !adminCheck) {
      // Log unauthorized access attempt
      await supabaseClient.rpc('audit_sensitive_operation', {
        p_action: 'unauthorized_team_admin_access_attempt',
        p_table_name: 'team_members',
        p_new_values: { team_id: teamId, attempted_by: user.id }
      })

      return new Response(
        JSON.stringify({ error: 'Forbidden: You must be a team admin or owner to access this data' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Query team members with their profiles and credits - simplified approach
    const { data: teamMembers, error: membersError } = await supabaseClient
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        status,
        created_at,
        joined_at
      `)
      .eq('team_id', teamId)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch team members' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get profiles separately
    const userIds = teamMembers.map(m => m.user_id)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch member profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get credits separately
    const { data: credits, error: creditsError } = await supabaseClient
      .from('user_credits')
      .select('user_id, monthly_limit, credits_used, reset_at')
      .in('user_id', userIds)

    if (creditsError) {
      console.error('Error fetching credits:', creditsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch member credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get team information
    const { data: teamInfo, error: teamError } = await supabaseClient
      .from('teams')
      .select('id, name, owner_id')
      .eq('id', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team info:', teamError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch team information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform the data for frontend consumption
    const transformedMembers = teamMembers.map(member => {
      const profile = profiles.find(p => p.id === member.user_id)
      const credit = credits.find(c => c.user_id === member.user_id)
      
      return {
        id: member.id,
        user_id: member.user_id,
        name: profile?.full_name || 'Unknown',
        email: profile?.email || 'Unknown',
        avatar_url: profile?.avatar_url,
        role: member.role,
        status: member.status,
        created_at: member.created_at,
        joined_at: member.joined_at,
        credits: {
          monthly_limit: credit?.monthly_limit || 0,
          credits_used: credit?.credits_used || 0,
          credits_remaining: (credit?.monthly_limit || 0) - (credit?.credits_used || 0),
          reset_at: credit?.reset_at
        }
      }
    })

    // Calculate team statistics
    const totalMembers = transformedMembers.length
    const pendingInvites = transformedMembers.filter(m => m.status === 'pending').length
    const activeMembers = transformedMembers.filter(m => m.status === 'active').length
    const totalCreditsUsed = transformedMembers.reduce((sum, m) => sum + m.credits.credits_used, 0)
    const totalCreditsAvailable = transformedMembers.reduce((sum, m) => sum + m.credits.monthly_limit, 0)

    // Log the successful admin access
    await supabaseClient.rpc('audit_sensitive_operation', {
      p_action: 'team_admin_data_accessed',
      p_table_name: 'team_members',
      p_new_values: { 
        team_id: teamId, 
        accessed_by: user.id,
        members_count: totalMembers,
        timestamp: new Date().toISOString()
      }
    })

    // Return the complete team admin data
    const response = {
      team: {
        id: teamInfo.id,
        name: teamInfo.name,
        owner_id: teamInfo.owner_id
      },
      members: transformedMembers,
      statistics: {
        total_members: totalMembers,
        active_members: activeMembers,
        pending_invites: pendingInvites,
        total_credits_used: totalCreditsUsed,
        total_credits_available: totalCreditsAvailable,
        credits_utilization: totalCreditsAvailable > 0 ? (totalCreditsUsed / totalCreditsAvailable * 100).toFixed(1) : 0
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})