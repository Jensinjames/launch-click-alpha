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

    // Get HF_TOKEN for authentication
    const hfToken = Deno.env.get('HF_TOKEN');
    if (!hfToken) {
      throw new Error('HF_TOKEN is not configured');
    }

    // Step 1: Call Gradio API to initiate generation and get event ID
    const gradioUrl = "https://jensin-ai-marketing-content-creator.hf.space/gradio_api/call/single_image_generation";
    
    console.log('Calling Gradio API:', gradioUrl);
    console.log('Request payload:', { data: [prompt, num_steps, style] });
    
    const initResponse = await fetch(gradioUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hfToken}`
      },
      body: JSON.stringify({ 
        data: [prompt, num_steps, style]
      })
    });

    if (!initResponse.ok) {
      const error = await initResponse.text();
      console.error('Gradio API init error:', error);
      throw new Error(`Failed to initiate image generation: ${error}`);
    }

    const initResult = await initResponse.text();
    console.log('Gradio API init response:', initResult);
    
    // Extract event ID from response
    const eventId = initResult.split('"')[3]; // Based on the cURL pattern provided
    if (!eventId) {
      throw new Error('Failed to get event ID from Gradio API');
    }
    
    console.log('Got event ID:', eventId);

    // Step 2: Poll for the result using the event ID
    const resultUrl = `https://jensin-ai-marketing-content-creator.hf.space/gradio_api/call/single_image_generation/${eventId}`;
    console.log('Polling for result:', resultUrl);
    
    const resultResponse = await fetch(resultUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${hfToken}`
      }
    });

    if (!resultResponse.ok) {
      const error = await resultResponse.text();
      console.error('Gradio API result error:', error);
      throw new Error(`Failed to get generation result: ${error}`);
    }

    const gradioResult = await resultResponse.json();
    console.log('Gradio API final response:', gradioResult);
    
    // Extract image and status from Gradio response
    if (!gradioResult.data || !Array.isArray(gradioResult.data)) {
      throw new Error('Invalid response format from Gradio API');
    }
    
    const imageData = gradioResult.data[0]; // Generated image
    const status = gradioResult.data[1]; // Status message
    
    console.log('Status:', status);
    console.log('Image data type:', typeof imageData);
    
    let imageBuffer;
    let contentType = 'image/png';
    
    // Handle different image data formats
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image/')) {
        // Base64 encoded image
        const base64Data = imageData.split(',')[1];
        imageBuffer = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));
        contentType = imageData.match(/data:([^;]+)/)?.[1] || 'image/png';
      } else if (imageData.startsWith('http')) {
        // URL to image
        const imageRes = await fetch(imageData);
        if (!imageRes.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageRes.statusText}`);
        }
        imageBuffer = new Uint8Array(await imageRes.arrayBuffer());
        contentType = imageRes.headers.get('Content-Type') || 'image/png';
      } else {
        // Assume it's a file path - try to fetch from Gradio
        const fileUrl = `https://jensin-ai-marketing-content-creator.hf.space/file=${imageData}`;
        console.log('Fetching image from Gradio file system:', fileUrl);
        
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) {
          throw new Error(`Failed to fetch generated image: ${fileRes.statusText}`);
        }
        imageBuffer = new Uint8Array(await fileRes.arrayBuffer());
        contentType = fileRes.headers.get('Content-Type') || 'image/png';
      }
    } else {
      throw new Error('Unexpected image data format');
    }
    
    // Generate unique filename for marketing images
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${user.id}/marketing-images/${timestamp}-${Math.random().toString(36).substring(7)}.png`;

    // Upload to Supabase Storage
    console.log('Uploading marketing image to storage:', filename);
    
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('generated-images')
      .upload(filename, new Blob([imageBuffer], { type: contentType }), {
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