import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const MODAL_API_URL = "https://jensinjames--flux-api-server-fastapi-server.modal.run";

async function generateMarketingImageSync(jobId: string, prompt: string, steps: number = 50, style: string = "none"): Promise<string> {
  console.log(`Generating marketing image for job ${jobId} with prompt: ${prompt}`);
  
  const payload = {
    prompt: prompt,
    num_inference_steps: steps,
    style: style
  };
  
  console.log(`Calling Modal.com API: ${MODAL_API_URL}/generate`);
  console.log(`Request payload: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await fetch(`${MODAL_API_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Modal API error: ${response.status} - ${errorText}`);
    throw new Error(`Modal API returned ${response.status}: ${errorText}`);
  }
  
  const result = await response.json();
  console.log(`Modal API generation completed`);
  
  // Return the image URL or base64 data
  return result.image_url || result.image || result.data;
}

serve(async (req) => {
  console.log(`[MarketingImageFunction] ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[MarketingImageFunction] Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[MarketingImageFunction] User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('[MarketingImageFunction] Processing POST request for user:', user.id);
    const requestBody = await req.text();
    console.log('[MarketingImageFunction] Raw request body:', requestBody);
    
    const { prompt, steps = 50, style = "none" } = JSON.parse(requestBody);
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a new job in the database
    const { data: job, error: jobError } = await supabase
      .from('marketing_image_jobs')
      .insert({
        user_id: user.id,
        prompt: prompt,
        style: style,
        steps: steps,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('[MarketingImageFunction] Job creation error:', jobError);
      return new Response(
        JSON.stringify({ error: "Failed to create generation job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[MarketingImageFunction] Created job ${job.id}`);

    // Start the generation job asynchronously (don't await)
    try {
      // Update job status to processing
      await supabase
        .from('marketing_image_jobs')
        .update({ status: 'processing' })
        .eq('id', job.id);

      // Generate the image synchronously
      generateMarketingImageSync(job.id, prompt, steps, style).then(async (imageUrl) => {
        console.log(`[MarketingImageFunction] Job ${job.id} completed successfully`);
        
        // Update job status to completed
        await supabase
          .from('marketing_image_jobs')
          .update({ 
            status: 'completed', 
            image_url: imageUrl,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Also save to image_assets table for user's library
        await supabase
          .from('image_assets')
          .insert({
            user_id: user.id,
            image_url: imageUrl,
            image_type: 'marketing',
            prompt: prompt,
            storage_path: `marketing_${job.id}.png`,
            generation_params: {
              style: style,
              steps: steps,
              generator: 'modal_sync'
            }
          });
          
      }).catch(async (error) => {
        console.error(`[MarketingImageFunction] Job ${job.id} failed:`, error);
        // Update job status to failed
        await supabase
          .from('marketing_image_jobs')
          .update({ 
            status: 'failed', 
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      });
    } catch (startError) {
      console.error('[MarketingImageFunction] Error starting job:', startError);
      // Update job status to failed
      await supabase
        .from('marketing_image_jobs')
        .update({ 
          status: 'failed', 
          error_message: startError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);
    }
    
    // Return job information immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id: job.id,
        status: 'processing',
        message: 'Image generation started. Use the job ID to check status.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in generate-marketing-image function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});