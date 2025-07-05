import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style = "none", num_steps = 50 } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Generating marketing image with prompt:', prompt);
    
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client for user authentication (uses anon key)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    
    // Client for storage operations (uses service role key)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Call HuggingFace MCP API
    const hfUrl = "https://jensin-ai-marketing-content-creator.hf.space/gradio_api/mcp/http/AI_Marketing_Content_Creator_single_image_generation";
    
    console.log('Calling HuggingFace MCP API:', hfUrl);
    
    const hfResponse = await fetch(hfUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: prompt, 
        num_steps: num_steps,
        style: style 
      })
    });

    if (!hfResponse.ok) {
      const error = await hfResponse.text();
      console.error('HuggingFace API error:', error);
      throw new Error(`Failed to generate image: ${error}`);
    }

    const resultJson = await hfResponse.text();
    console.log('HuggingFace API response:', resultJson);
    
    // The response should be the image file path
    const imagePath = resultJson.replace(/"/g, ''); // Remove quotes if present
    
    // Fetch the actual image file from Gradio
    const fileUrl = `https://jensin-ai-marketing-content-creator.hf.space/gradio_api/file=${imagePath}`;
    console.log('Fetching image from:', fileUrl);
    
    const fileRes = await fetch(fileUrl);
    
    if (!fileRes.ok) {
      throw new Error(`Failed to fetch generated image: ${fileRes.statusText}`);
    }

    const imageBuffer = await fileRes.arrayBuffer();
    const contentType = fileRes.headers.get('Content-Type') || 'image/png';
    
    // Generate unique filename for marketing images
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${user.id}/marketing-images/${timestamp}-${Math.random().toString(36).substring(7)}.png`;

    // Upload to Supabase Storage
    console.log('Uploading marketing image to storage:', filename);
    
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('generated-images')
      .upload(filename, new Blob([new Uint8Array(imageBuffer)], { type: contentType }), {
        contentType: contentType,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseService.storage
      .from('generated-images')
      .getPublicUrl(filename);

    console.log('Marketing image generated and stored successfully:', urlData.publicUrl);

    return new Response(JSON.stringify({
      success: true,
      image_url: urlData.publicUrl,
      filename: filename,
      prompt: prompt,
      revised_prompt: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-marketing-image function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});