import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log(`[MarketingImageWebhook] ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[MarketingImageWebhook] Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.text();
    console.log('[MarketingImageWebhook] Raw request body:', requestBody);
    
    const { job_id, status, image_url, error_message, generation_params } = JSON.parse(requestBody);
    
    if (!job_id) {
      console.error('[MarketingImageWebhook] Missing job_id in webhook payload');
      return new Response(
        JSON.stringify({ error: "Missing job_id in webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[MarketingImageWebhook] Processing job ${job_id} with status: ${status}`);

    // Update the job in the database
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.image_url = image_url;
      updateData.completed_at = new Date().toISOString();
      updateData.generation_params = generation_params || {};
    } else if (status === 'failed') {
      updateData.error_message = error_message;
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('marketing_image_jobs')
      .update(updateData)
      .eq('id', job_id)
      .select()
      .single();

    if (error) {
      console.error('[MarketingImageWebhook] Database update error:', error);
      return new Response(
        JSON.stringify({ error: `Database update failed: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[MarketingImageWebhook] Successfully updated job ${job_id}`);

    // If completed, also save to image_assets table for user's library
    if (status === 'completed' && image_url && data?.user_id) {
      const { error: assetError } = await supabase
        .from('image_assets')
        .insert({
          user_id: data.user_id,
          image_url: image_url,
          image_type: 'marketing',
          prompt: data.prompt,
          storage_path: `marketing_${job_id}.png`,
          generation_params: generation_params || {
            style: data.style,
            steps: data.steps,
            generator: 'modal_webhook'
          }
        });

      if (assetError) {
        console.error('[MarketingImageWebhook] Error saving to image_assets:', assetError);
        // Don't fail the webhook for this
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id: job_id,
        status: status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in marketing-image-webhook function:", error);
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