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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { type, prompt, title, tone, audience } = await req.json();

    console.log(`Generating content for user ${user.id}:`, { type, title, tone, audience });

    // Check user credits
    const { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_used, monthly_limit')
      .eq('user_id', user.id)
      .single();

    if (creditsError) {
      console.error('Error fetching user credits:', creditsError);
      throw new Error('Failed to fetch user credits');
    }

    // Calculate credits needed based on content type
    const creditsCost = {
      'email_sequence': 15,
      'social_post': 5,
      'landing_page': 10,
      'blog_post': 8,
      'ad_copy': 6,
      'funnel': 20,
      'strategy_brief': 12
    }[type] || 10;

    if (creditsData.credits_used + creditsCost > creditsData.monthly_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          creditsNeeded: creditsCost,
          creditsAvailable: creditsData.monthly_limit - creditsData.credits_used
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate content using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create detailed prompt based on content type and user inputs
    const systemPrompts = {
      'email_sequence': 'You are an expert email marketing copywriter. Create engaging, conversion-focused email content that builds relationships and drives action.',
      'social_post': 'You are a social media expert. Create engaging, shareable content that resonates with the target audience and encourages interaction.',
      'landing_page': 'You are a conversion optimization expert. Create compelling landing page copy that clearly communicates value and drives conversions.',
      'blog_post': 'You are an expert content writer. Create informative, engaging blog content that provides value and establishes thought leadership.',
      'ad_copy': 'You are a direct response advertising expert. Create persuasive ad copy that captures attention and drives immediate action.',
      'funnel': 'You are a sales funnel expert. Create a complete funnel sequence that guides prospects from awareness to conversion.',
      'strategy_brief': 'You are a marketing strategist. Create comprehensive strategy documents that provide clear direction and actionable insights.'
    };

    const contentStructures = {
      'email_sequence': 'Subject line, preview text, opening, main content, call-to-action, closing',
      'social_post': 'Hook, main message, call-to-action, relevant hashtags',
      'landing_page': 'Headline, subheadline, value proposition, benefits, social proof, call-to-action',
      'blog_post': 'Title, introduction, main sections with subheadings, conclusion, call-to-action',
      'ad_copy': 'Headline, description, call-to-action, target audience considerations',
      'funnel': 'Awareness stage, consideration stage, decision stage, retention stage',
      'strategy_brief': 'Executive summary, objectives, target audience, strategy, tactics, metrics'
    };

    const detailedPrompt = `${prompt}

Additional context:
- Target audience: ${audience || 'general audience'}
- Tone of voice: ${tone || 'professional'}
- Content type: ${type.replace('_', ' ')}

Please structure the content with clear sections following this format: ${contentStructures[type as keyof typeof contentStructures]}

Make it actionable, engaging, and tailored to the specified audience and tone.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemPrompts[type as keyof typeof systemPrompts] || systemPrompts['blog_post']
          },
          { role: 'user', content: detailedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to generate content');
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;

    // Parse generated content into structured format
    const contentData = {
      text: generatedContent,
      metadata: {
        type,
        tone: tone || 'professional',
        audience: audience || 'general',
        creditsCost,
        generatedAt: new Date().toISOString(),
        wordCount: generatedContent.split(' ').length
      }
    };

    // Save content to database
    const { data: contentResult, error: contentError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        type,
        title: title || `${type.replace('_', ' ')} - ${new Date().toLocaleDateString()}`,
        content: contentData,
        prompt: detailedPrompt,
        metadata: {
          tone: tone || 'professional',
          audience: audience || 'general',
          creditsCost
        }
      })
      .select()
      .single();

    if (contentError) {
      console.error('Error saving content:', contentError);
      throw new Error('Failed to save generated content');
    }

    // Deduct credits
    const { error: creditsUpdateError } = await supabase
      .from('user_credits')
      .update({ 
        credits_used: creditsData.credits_used + creditsCost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (creditsUpdateError) {
      console.error('Error updating credits:', creditsUpdateError);
      // Content was saved but credits weren't deducted - log this for admin attention
      console.error('CRITICAL: Content saved but credits not deducted for user:', user.id);
    }

    // Log user activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        action: 'content_generated',
        resource_type: 'content',
        resource_id: contentResult.id,
        metadata: {
          content_type: type,
          credits_used: creditsCost,
          prompt_length: prompt.length
        }
      });

    console.log(`Content generated successfully for user ${user.id}, content ID: ${contentResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        content: contentResult,
        creditsUsed: creditsCost,
        creditsRemaining: creditsData.monthly_limit - (creditsData.credits_used + creditsCost)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});