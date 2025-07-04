import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

// ===== TYPES =====
interface CreateTeamRequest {
  name: string;
  description?: string;
  templateId?: string;
}

interface CreateTeamResponse {
  success: boolean;
  team?: {
    id: string;
    name: string;
  };
  usage?: {
    teams_used: number;
    teams_limit: number;
  };
  template_applied?: boolean;
  error?: string;
  upgrade_required?: boolean;
  limit_reached?: boolean;
}

interface TeamValidationError {
  field: string;
  message: string;
}

// ===== VALIDATION CONSTANTS =====
const TEAM_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 200,
  NAME_PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
} as const;

// ===== VALIDATION FUNCTIONS =====
function validateTeamName(name: string): TeamValidationError | null {
  if (!name || typeof name !== 'string') {
    return { field: 'name', message: 'Team name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < TEAM_VALIDATION_RULES.NAME_MIN_LENGTH) {
    return { 
      field: 'name', 
      message: `Team name must be at least ${TEAM_VALIDATION_RULES.NAME_MIN_LENGTH} characters` 
    };
  }

  if (trimmed.length > TEAM_VALIDATION_RULES.NAME_MAX_LENGTH) {
    return { 
      field: 'name', 
      message: `Team name must be less than ${TEAM_VALIDATION_RULES.NAME_MAX_LENGTH} characters` 
    };
  }

  if (!TEAM_VALIDATION_RULES.NAME_PATTERN.test(trimmed)) {
    return { 
      field: 'name', 
      message: 'Team name can only contain letters, numbers, spaces, hyphens, and underscores' 
    };
  }

  return null;
}

function validateTeamDescription(description?: string): TeamValidationError | null {
  if (!description) return null;

  if (description.length > TEAM_VALIDATION_RULES.DESCRIPTION_MAX_LENGTH) {
    return { 
      field: 'description', 
      message: `Description must be less than ${TEAM_VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} characters` 
    };
  }

  return null;
}

function validateCreateTeamRequest(request: CreateTeamRequest): TeamValidationError[] {
  const errors: TeamValidationError[] = [];

  const nameError = validateTeamName(request.name);
  if (nameError) errors.push(nameError);

  const descriptionError = validateTeamDescription(request.description);
  if (descriptionError) errors.push(descriptionError);

  return errors;
}

function sanitizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function sanitizeTeamDescription(description?: string): string | undefined {
  return description?.trim();
}

// ===== UTILITY FUNCTIONS =====
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function createErrorResponse(
  message: string, 
  statusCode: number = 400,
  metadata?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      ...metadata
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

function createSuccessResponse(data: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

function logRequest(action: string, userId?: string, metadata?: Record<string, unknown>): void {
  console.log(`[${action}] User: ${userId || 'anonymous'}`, 
    metadata ? JSON.stringify(metadata) : '');
}

function logError(action: string, userId: string | undefined, error: Error, metadata?: Record<string, unknown>): void {
  console.error(`[${action}] Error for user ${userId || 'anonymous'}:`, 
    error.message, metadata ? JSON.stringify(metadata) : '');
}

function handleCorsPreflightRequest(): Response {
  return new Response(null, { headers: corsHeaders });
}

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
      logError('create-team', 'unknown', new Error('Authentication failed'));
      return createErrorResponse('Unauthorized', 401);
    }

    userId = user.id;
    logRequest('create-team', userId, { timestamp: new Date().toISOString() });

    // Parse and validate request body
    let requestBody: CreateTeamRequest;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      logError('create-team', userId, new Error('Invalid JSON in request body'));
      return createErrorResponse('Invalid request format', 400);
    }

    // Validate request using shared validation
    const validationErrors = validateCreateTeamRequest(requestBody);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
      logError('create-team', userId, new Error(`Validation failed: ${errorMessage}`));
      return createErrorResponse(`Validation failed: ${errorMessage}`, 400);
    }

    // Sanitize inputs
    const sanitizedName = sanitizeTeamName(requestBody.name);
    const sanitizedDescription = sanitizeTeamDescription(requestBody.description);

    // Use the secure database function for team creation
    logRequest('create-team-db-call', userId, { teamName: sanitizedName });

    const { data: result, error: createError } = await supabase.rpc(
      'create_team_with_access_control',
      {
        p_team_name: sanitizedName,
        p_user_id: user.id,
        p_description: sanitizedDescription || null
      }
    );

    if (createError) {
      logError('create-team-db-call', userId, createError);
      return createErrorResponse('Failed to create team due to database error', 500);
    }

    // Check if the function returned an error
    if (!result || !result.success) {
      const errorMsg = result?.error || 'Unknown database error';
      const statusCode = result?.upgrade_required ? 402 : 
                        result?.limit_reached ? 429 : 400;
      
      logError('create-team-business-logic', userId, new Error(errorMsg));
      
      return createErrorResponse(errorMsg, statusCode, {
        upgrade_required: result?.upgrade_required || false,
        limit_reached: result?.limit_reached || false
      });
    }

    // Apply team template if provided
    if (requestBody.templateId) {
      try {
        logRequest('apply-team-template', userId, { templateId: requestBody.templateId, teamId: result.team_id });

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

          logRequest('template-applied-success', userId, { templateId: requestBody.templateId });
        } else {
          logError('apply-team-template', userId, new Error(`Template not found: ${requestBody.templateId}`));
        }
      } catch (templateError) {
        logError('apply-team-template', userId, templateError as Error);
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
      logError('create-welcome-notification', userId, notificationError as Error);
      // Don't fail team creation if notification fails
    }

    // Log successful team creation
    logRequest('create-team-success', userId, { 
      teamId: result.team_id, 
      teamName: result.team_name,
      teamsUsed: result.teams_used,
      teamsLimit: result.teams_limit
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
    logError('create-team-fatal', userId, error as Error);
    return createErrorResponse(
      (error as Error).message || 'Failed to create team', 
      500
    );
  }
});