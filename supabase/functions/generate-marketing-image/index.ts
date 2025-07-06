import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRADIO_API_URL = "https://jensin-ai-marketing-content-creator.hf.space/gradio_api/call/single_image_generation";
const HF_TOKEN = Deno.env.get('HF_TOKEN');

// Helper function to parse SSE responses
async function parseSSEResponse(response: Response): Promise<any> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is null");
  }

  let result = null;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // Convert the Uint8Array to a string and add it to our buffer
    buffer += new TextDecoder().decode(value);
    
    // Look for complete JSON objects in the SSE stream
    // Gradio typically sends data in format: data: {"data":["base64image"]}\n\n
    const dataMatches = buffer.match(/data: ({.*?})\n\n/g);
    if (dataMatches && dataMatches.length > 0) {
      for (const match of dataMatches) {
        try {
          // Extract the JSON part from "data: {json}\n\n"
          const jsonStr = match.replace(/^data: /, "").trim();
          const data = JSON.parse(jsonStr);
          if (data.data && data.data.length > 0) {
            result = data;
            break;
          }
        } catch (e) {
          console.log("Error parsing SSE data chunk:", e);
        }
      }
      
      if (result) break;
    }
  }

  return result;
}

async function generateMarketingImage(prompt: string, steps: number = 50, style: string = "none"): Promise<string> {
  console.log(`Generating marketing image with prompt: ${prompt}`);
  
  // Check if HF_TOKEN is available
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is required but not configured");
  }
  
  // Initial API call to start the generation
  console.log(`Calling Gradio API: ${GRADIO_API_URL}`);
  const payload = {
    data: [prompt, steps, style]
  };
  console.log(`Request payload: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await fetch(GRADIO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HF_TOKEN}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gradio API error: ${response.status} - ${errorText}`);
    
    if (response.status === 401) {
      throw new Error("Authentication failed - check HF_TOKEN");
    } else if (response.status === 429) {
      throw new Error("Rate limit exceeded - please try again later");
    } else {
      throw new Error(`Gradio API returned ${response.status}: ${errorText}`);
    }
  }
  
  const initData = await response.json();
  console.log(`Gradio API init response: ${JSON.stringify(initData)}`);
  
  if (!initData.event_id) {
    throw new Error("No event ID returned from Gradio API");
  }
  
  const eventId = initData.event_id;
  console.log(`Got event ID: ${eventId}`);
  
  // Poll for results with optimized timing
  const pollUrl = `${GRADIO_API_URL}/${eventId}`;
  console.log(`Polling for result: ${pollUrl}`);
  
  // Reduced attempts and progressive backoff
  const maxAttempts = 15;
  let pollInterval = 1000; // Start with 1 second
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const pollResponse = await fetch(pollUrl, {
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`
        }
      });
      
      if (!pollResponse.ok) {
        console.log(`Poll attempt ${attempt + 1} failed: ${pollResponse.status}`);
        
        if (pollResponse.status === 401) {
          throw new Error("Authentication failed during polling");
        }
        
        // Progressive backoff - increase interval for retries
        pollInterval = Math.min(pollInterval * 1.5, 4000);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      
      // Check if the response is SSE format
      const contentType = pollResponse.headers.get("content-type");
      if (contentType && contentType.includes("text/event-stream")) {
        // Handle SSE response
        const result = await parseSSEResponse(pollResponse);
        if (result && result.data && result.data[0]) {
          console.log("Successfully generated image via SSE");
          return result.data[0];
        }
      } else {
        // Try regular JSON parsing
        const result = await pollResponse.json();
        if (result && result.data && result.data[0]) {
          console.log("Successfully generated image via JSON");
          return result.data[0];
        }
      }
      
      // If we get here, the result wasn't ready yet
      console.log(`Poll attempt ${attempt + 1}: Result not ready yet`);
      
      // Progressive backoff - increase interval
      pollInterval = Math.min(pollInterval * 1.2, 3000);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(`Error during poll attempt ${attempt + 1}:`, error);
      
      // Don't retry on authentication errors
      if (error.message.includes("Authentication failed")) {
        throw error;
      }
      
      // Progressive backoff for other errors
      pollInterval = Math.min(pollInterval * 1.5, 4000);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error(`Image generation timed out after ${maxAttempts} attempts`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, steps = 50, style = "none" } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const imageBase64 = await generateMarketingImage(prompt, steps, style);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: imageBase64,
        prompt: prompt
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