// Shared utilities for consistent error handling and logging
export interface LogContext {
  userId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export function createErrorResponse(
  message: string, 
  statusCode: number = 400,
  metadata?: Record<string, unknown>
): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

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

export function createSuccessResponse(data: Record<string, unknown>): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

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

export function logRequest(context: LogContext): void {
  console.log(`[${context.action}] User: ${context.userId || 'anonymous'}`, 
    context.metadata ? JSON.stringify(context.metadata) : '');
}

export function logError(context: LogContext, error: Error): void {
  console.error(`[${context.action}] Error for user ${context.userId || 'anonymous'}:`, 
    error.message, context.metadata ? JSON.stringify(context.metadata) : '');
}

export function handleCorsPreflightRequest(): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  return new Response(null, { headers: corsHeaders });
}