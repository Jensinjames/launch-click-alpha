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

    const { 
      type, 
      prompt, 
      title, 
      tone, 
      audience, 
      template_data,
      output_format = 'text',
      settings = {}
    } = await req.json();

    console.log(`Generating content for user ${user.id}:`, { type, title, tone, audience, output_format });

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

    // Calculate credits needed based on content type and output format
    let creditsCost = {
      'email_sequence': 15,
      'social_post': 5,
      'landing_page': 10,
      'blog_post': 8,
      'ad_copy': 6,
      'funnel': 20,
      'strategy_brief': 12
    }[type] || 10;

    // Adjust for output format
    if (output_format === 'image') {
      creditsCost = creditsCost * 3; // Images cost more
    }

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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Handle different output formats
    let generatedContent;
    let assets = [];

    if (output_format === 'image' || (template_data && template_data.output_type === 'image')) {
      // Generate image content
      const imagePrompt = template_data ? 
        buildPromptFromTemplate(template_data, { prompt, tone, audience, ...settings }) : 
        prompt;
      
      const imageResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: settings.style || 'natural',
          size: settings.size || '1024x1024',
          quality: settings.quality || 'standard'
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Image generation error:', errorText);
        throw new Error('Failed to generate image');
      }

      const imageData = await imageResponse.json();
      generatedContent = {
        type: 'image',
        url: imageData.image_url,
        filename: imageData.filename,
        prompt: imageData.prompt,
        revised_prompt: imageData.revised_prompt
      };
      assets.push({
        url: imageData.image_url,
        type: 'image',
        name: imageData.filename
      });
    } else {
      // Generate text content
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

      let userPrompt = prompt;
      if (template_data) {
        userPrompt = buildPromptFromTemplate(template_data, { prompt, tone, audience, ...settings });
      } else {
        userPrompt = `${prompt}

Additional context:
- Target audience: ${audience || 'general audience'}
- Tone of voice: ${tone || 'professional'}
- Content type: ${type.replace('_', ' ')}

Please structure the content with clear sections following this format: ${contentStructures[type as keyof typeof contentStructures]}

Make it actionable, engaging, and tailored to the specified audience and tone.`;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: systemPrompts[type as keyof typeof systemPrompts] || systemPrompts['blog_post']
            },
            { role: 'user', content: userPrompt }
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: settings.max_tokens || 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error('Failed to generate content');
      }

      const aiResponse = await response.json();
      const generatedText = aiResponse.choices[0].message.content;
      
      generatedContent = {
        type: 'text',
        text: generatedText,
        metadata: {
          model: settings.model || 'gpt-4o-mini',
          tokens_used: aiResponse.usage?.total_tokens || 0,
          generation_time: new Date().toISOString(),
          wordCount: generatedText.split(' ').length
        }
      };
    }

    // Save content to database
    const { data: contentResult, error: contentError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        type,
        title: title || `${type.replace('_', ' ')} - ${new Date().toLocaleDateString()}`,
        content: generatedContent,
        prompt: template_data ? JSON.stringify(template_data) : prompt,
        metadata: {
          output_format: output_format,
          template_used: !!template_data,
          assets: assets,
          settings: settings,
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
          output_format: output_format,
          credits_used: creditsCost,
          prompt_length: prompt?.length || 0,
          template_used: !!template_data
        }
      });

    console.log(`Content generated successfully for user ${user.id}, content ID: ${contentResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        content: contentResult,
        assets: assets,
        creditsUsed: creditsCost,
        creditsRemaining: creditsData.monthly_limit - (creditsData.credits_used + creditsCost),
        output_format: output_format
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

function buildPromptFromTemplate(templateData: any, inputs: any): string {
  // Handle different template types
  if (templateData.fields) {
    // Field-based template
    let prompt = templateData.prompts?.[0]?.input || '';
    
    // Replace variables in prompt with user inputs
    templateData.fields.forEach((field: any) => {
      const value = inputs[field.name] || '';
      prompt = prompt.replace(new RegExp(`{{${field.name}}}`, 'g'), value);
    });
    
    return prompt || inputs.prompt || '';
  } else if (templateData.prompt) {
    // Simple prompt template
    let prompt = templateData.prompt;
    
    // Replace variables
    templateData.variables?.forEach((variable: string) => {
      const value = inputs[variable] || '';
      prompt = prompt.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });
    
    return prompt;
  } else if (templateData.steps) {
    // Logic/workflow template
    return `Execute the following steps: ${JSON.stringify(templateData.steps)}. User context: ${inputs.prompt || ''}`;
  }
  
  return inputs.prompt || '';
}