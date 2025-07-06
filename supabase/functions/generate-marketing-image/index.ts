import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const MODAL_API_URL = "https://jensinjames--flux-api-server-fastapi-server.modal.run";

async function generateMarketingImage(prompt: string, steps: number = 50, style: string = "none"): Promise<string> {
  console.log(`Generating marketing image with prompt: ${prompt}`);
  
  // Call Modal.com FastAPI backend directly
  console.log(`Calling Modal.com API: ${MODAL_API_URL}/generate`);
  const payload = {
    prompt: prompt,
    num_inference_steps: steps,
    style: style
  };
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
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded - please try again later");
    } else if (response.status === 500) {
      throw new Error("Backend server error - the AI model may be busy");
    } else {
      throw new Error(`Modal API returned ${response.status}: ${errorText}`);
    }
  }
  
  const result = await response.json();
  console.log(`Modal API response received`);
  
  if (!result.image) {
    throw new Error("No image returned from Modal API");
  }
  
  console.log("Successfully generated image via Modal.com");
  return result.image;
}

serve(async (req) => {
  console.log(`[MarketingImageFunction] ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[MarketingImageFunction] Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[MarketingImageFunction] Processing POST request');
    const requestBody = await req.text();
    console.log('[MarketingImageFunction] Raw request body:', requestBody);
    
    const { prompt, steps = 50, style = "none" } = JSON.parse(requestBody);
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const imageBase64 = await generateMarketingImage(prompt, steps, style);
    
    // Generate filename based on prompt and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safePrompt = prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `marketing_${safePrompt}_${timestamp}.png`;
    
    // Ensure base64 is properly formatted as data URL
    const imageDataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: imageDataUrl,
        filename: filename,
        prompt: prompt,
        generation_params: {
          steps: steps,
          style: style,
          generator: 'modal_fastapi'
        }
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