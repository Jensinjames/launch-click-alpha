import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

// Import shared schemas and utilities
import { CreateTeamRequest, CreateTeamResponse, UserPlanInfo } from '../shared/types.ts';
import { validateCreateTeamRequest, sanitizeTeamName, sanitizeTeamDescription } from '../shared/validation.ts';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  logRequest, 
  logError, 
  handleCorsPreflightRequest 
} from '../shared/utils.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  let userId: string | undefined;

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Missing authorization header', 401);
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logError({ action: 'create-team', userId: 'unknown' }, new Error('Authentication failed'));
      return createErrorResponse('Unauthorized', 401);
    }

    userId = user.id;
    logRequest({ 
      action: 'create-team', 
      userId, 
      metadata: { timestamp: new Date().toISOString() } 
    });

    // Parse and validate request body
    let requestBody: CreateTeamRequest;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      logError({ action: 'create-team', userId }, new Error('Invalid JSON in request body'));
      return createErrorResponse('Invalid request format', 400);
    }

    // Validate request using shared validation
    const validationErrors = validateCreateTeamRequest(requestBody);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
      logError({ action: 'create-team', userId }, new Error(`Validation failed: ${errorMessage}`));
      return createErrorResponse(`Validation failed: ${errorMessage}`, 400);
    }

    // Sanitize inputs
    const sanitizedName = sanitizeTeamName(requestBody.name);
    const sanitizedDescription = sanitizeTeamDescription(requestBody.description);

    // Use the secure database function for team creation
    logRequest({ 
      action: 'create-team-db-call', 
      userId, 
      metadata: { teamName: sanitizedName } 
    });

    const { data: result, error: createError } = await supabase.rpc(
      'create_team_with_access_control',
      {
        p_team_name: sanitizedName,
        p_description: sanitizedDescription || null
      }
    );

    if (createError) {
      logError({ action: 'create-team-db-call', userId }, createError);
      return createErrorResponse('Failed to create team due to database error', 500);
    }

    // Check if the function returned an error
    if (!result || !result.success) {
      const errorMsg = result?.error || 'Unknown database error';
      const statusCode = result?.upgrade_required ? 402 : 
                        result?.limit_reached ? 429 : 400;
      
      logError({ action: 'create-team-business-logic', userId }, new Error(errorMsg));
      
      return createErrorResponse(errorMsg, statusCode, {
        upgrade_required: result?.upgrade_required || false,
        limit_reached: result?.limit_reached || false
      });
    }

    // Apply team template if provided
    if (requestBody.templateId) {
      try {
        logRequest({ 
          action: 'apply-team-template', 
          userId, 
          metadata: { templateId: requestBody.templateId, teamId: result.team_id } 
        });

        const { data: template, error: templateError } = await supabase
          .from('team_templates')
          .select('template_data')
          .eq('id', requestBody.templateId)
          .maybeSingle();

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
            .eq('id', requestBody.templateId);

          logRequest({ 
            action: 'template-applied-success', 
            userId, 
            metadata: { templateId: requestBody.templateId } 
          });
        } else {
          logError({ action: 'apply-team-template', userId }, 
            new Error(`Template not found: ${requestBody.templateId}`));
        }
      } catch (templateError) {
        logError({ action: 'apply-team-template', userId }, templateError as Error);
        // Continue without template - don't fail team creation
      }
    }

    // Create welcome notification
    try {
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
            template_used: !!requestBody.templateId
          }
        });
    } catch (notificationError) {
      logError({ action: 'create-welcome-notification', userId }, notificationError as Error);
      // Don't fail team creation if notification fails
    }

    // Log successful team creation
    logRequest({ 
      action: 'create-team-success', 
      userId, 
      metadata: { 
        teamId: result.team_id, 
        teamName: result.team_name,
        teamsUsed: result.teams_used,
        teamsLimit: result.teams_limit
      } 
    });

    // Success response
    return createSuccessResponse({
      team: {
        id: result.team_id,
        name: result.team_name
      },
      usage: {
        teams_used: result.teams_used,
        teams_limit: result.teams_limit
      },
      template_applied: !!requestBody.templateId
    });

  } catch (error) {
    logError({ action: 'create-team-fatal', userId }, error as Error);
    return createErrorResponse(
      (error as Error).message || 'Failed to create team', 
      500
    );
  }
});