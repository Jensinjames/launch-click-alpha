import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface N8nCredentials {
  instanceUrl: string;
  apiKey: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url);
    const path = url.pathname.replace('/n8n-integration', '');
    
    console.log(`n8n integration request: ${req.method} ${path}`);

    switch (path) {
      case '/connect':
        return await handleConnect(req, supabase);
      case '/workflows':
        return await handleWorkflows(req, supabase);
      case '/disconnect':
        return await handleDisconnect(req, supabase);
      default:
        if (path.startsWith('/workflows/') && path.endsWith('/execute')) {
          const workflowId = path.split('/')[2];
          return await handleExecuteWorkflow(req, supabase, workflowId);
        }
        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('n8n integration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleConnect(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const { instanceUrl, apiKey } = await req.json() as N8nCredentials;

  if (!instanceUrl || !apiKey) {
    return new Response(
      JSON.stringify({ error: 'Instance URL and API key are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Test the connection to n8n
  try {
    const testResponse = await fetch(`${instanceUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to connect to n8n instance. Please check your credentials.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the credentials securely
    const { error: insertError } = await supabase
      .from('integration_tokens')
      .upsert({
        user_id: user.id,
        provider: 'n8n',
        token_data: {
          instanceUrl,
          apiKey,
          connectedAt: new Date().toISOString(),
        },
        is_active: true,
      });

    if (insertError) {
      console.error('Error storing n8n credentials:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully connected to n8n' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('n8n connection test failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to connect to n8n instance' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleWorkflows(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get n8n credentials
  const { data: tokenData, error: tokenError } = await supabase
    .from('integration_tokens')
    .select('token_data')
    .eq('user_id', user.id)
    .eq('provider', 'n8n')
    .eq('is_active', true)
    .single();

  if (tokenError || !tokenData) {
    return new Response(
      JSON.stringify({ error: 'n8n integration not configured' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { instanceUrl, apiKey } = tokenData.token_data;

  try {
    const response = await fetch(`${instanceUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch workflows from n8n' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const workflows = await response.json();
    
    return new Response(
      JSON.stringify({ workflows }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching n8n workflows:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch workflows' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleExecuteWorkflow(req: Request, supabase: any, workflowId: string) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get n8n credentials
  const { data: tokenData, error: tokenError } = await supabase
    .from('integration_tokens')
    .select('token_data')
    .eq('user_id', user.id)
    .eq('provider', 'n8n')
    .eq('is_active', true)
    .single();

  if (tokenError || !tokenData) {
    return new Response(
      JSON.stringify({ error: 'n8n integration not configured' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { instanceUrl, apiKey } = tokenData.token_data;
  const { inputData = {} } = await req.json();

  try {
    const response = await fetch(`${instanceUrl}/api/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputData),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to execute workflow' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, execution: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error executing n8n workflow:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to execute workflow' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleDisconnect(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Deactivate the integration
  const { error: updateError } = await supabase
    .from('integration_tokens')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('provider', 'n8n');

  if (updateError) {
    console.error('Error disconnecting n8n:', updateError);
    return new Response(
      JSON.stringify({ error: 'Failed to disconnect n8n integration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Successfully disconnected n8n' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}