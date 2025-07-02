import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTeamRequest {
  name: string;
  description?: string;
  templateId?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

    const { name, description, templateId }: CreateTeamRequest = await req.json();

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('Team name must be at least 2 characters');
    }

    if (name.trim().length > 50) {
      throw new Error('Team name must be less than 50 characters');
    }

    // Use the secure database function for team creation
    const { data: result, error: createError } = await supabase.rpc(
      'create_team_with_access_control',
      {
        p_team_name: name.trim(),
        p_description: description?.trim() || null
      }
    );

    if (createError) {
      console.error('Database function error:', createError);
      throw new Error('Failed to create team');
    }

    // Check if the function returned an error
    if (!result.success) {
      const statusCode = result.upgrade_required ? 402 : 
                        result.limit_reached ? 429 : 400;
      
      return new Response(
        JSON.stringify({
          error: result.error,
          upgrade_required: result.upgrade_required || false,
          limit_reached: result.limit_reached || false
        }),
        { 
          status: statusCode,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Apply team template if provided
    if (templateId) {
      try {
        const { data: template, error: templateError } = await supabase
          .from('team_templates')
          .select('template_data')
          .eq('id', templateId)
          .single();

        if (template && !templateError) {
          // Create team settings based on template
          await supabase
            .from('team_settings')
            .insert({
              team_id: result.team_id,
              settings: template.template_data
            });

          // Update template usage count
          await supabase
            .from('team_templates')
            .update({ usage_count: supabase.rpc('increment') })
            .eq('id', templateId);
        }
      } catch (templateError) {
        console.error('Template application error:', templateError);
        // Continue without template - don't fail team creation
      }
    }

    // Create welcome notification
    await supabase
      .from('team_notifications')
      .insert({
        team_id: result.team_id,
        user_id: user.id,
        type: 'team_created',
        title: 'Welcome to your new team!',
        message: `Team "${result.team_name}" has been successfully created.`,
        data: {
          team_id: result.team_id,
          team_name: result.team_name,
          template_used: !!templateId
        }
      });

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        team: {
          id: result.team_id,
          name: result.team_name
        },
        usage: {
          teams_used: result.teams_used,
          teams_limit: result.teams_limit
        },
        template_applied: !!templateId
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Create team error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create team',
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