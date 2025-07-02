import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { template_id, user_inputs, settings = {} } = await req.json();

    console.log(`Executing composite template ${template_id} for user ${user.id}`);

    // Get the composite template and its steps
    const { data: template, error: templateError } = await supabase
      .from('content_templates')
      .select(`
        *,
        composite_template_steps (
          *
        )
      `)
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found or access denied');
    }

    // Verify template is composite type
    if (template.output_format !== 'composite') {
      throw new Error('Template is not a composite template');
    }

    const compositeData = template.template_data;
    const steps = template.composite_template_steps || [];

    if (!compositeData.steps || compositeData.steps.length === 0) {
      throw new Error('No steps defined in composite template');
    }

    // Build execution graph and resolve dependencies
    const executionPlan = buildExecutionPlan(compositeData.steps);
    console.log('Execution plan:', executionPlan);

    // Initialize execution context
    const executionContext = {
      user_inputs,
      step_outputs: {},
      current_step: '',
      execution_order: executionPlan,
      variables: { ...user_inputs },
      template_id,
      user_id: user.id
    };

    // Execute steps in dependency order
    const finalOutputs = {};
    for (const stepBatch of executionPlan) {
      const stepPromises = stepBatch.map(stepId => 
        executeStep(stepId, compositeData.steps, executionContext, supabase, authHeader)
      );
      
      const batchResults = await Promise.all(stepPromises);
      
      // Update context with results
      batchResults.forEach(result => {
        executionContext.step_outputs[result.step_id] = result.output;
        finalOutputs[result.step_id] = result.output;
        updateVariables(executionContext, result.step_id, result.output);
      });
    }

    // Combine outputs according to final_output configuration
    const combinedOutput = combineOutputs(
      finalOutputs,
      compositeData.final_output,
      executionContext
    );

    // Save the composite result
    const { data: contentResult, error: contentError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        type: template.type,
        title: `${template.name} - ${new Date().toLocaleDateString()}`,
        content: combinedOutput,
        prompt: JSON.stringify({
          template_id,
          user_inputs,
          execution_context: {
            steps_executed: Object.keys(finalOutputs),
            total_execution_time: Date.now() - executionContext.start_time
          }
        }),
        metadata: {
          output_format: 'composite',
          template_used: true,
          step_outputs: finalOutputs,
          settings,
          execution_plan: executionPlan
        }
      })
      .select()
      .single();

    if (contentError) {
      console.error('Error saving composite content:', contentError);
      throw new Error('Failed to save generated content');
    }

    console.log(`Composite template executed successfully: ${contentResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        content: contentResult,
        step_outputs: finalOutputs,
        execution_plan: executionPlan,
        combined_output: combinedOutput
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in execute-composite-template:', error);
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

function buildExecutionPlan(steps: any[]): string[][] {
  const stepMap = new Map(steps.map(step => [step.id, step]));
  const completed = new Set<string>();
  const plan: string[][] = [];

  while (completed.size < steps.length) {
    const readySteps = steps
      .filter(step => !completed.has(step.id))
      .filter(step => step.depends_on.every((dep: string) => completed.has(dep)))
      .map(step => step.id);

    if (readySteps.length === 0) {
      throw new Error('Circular dependency detected in composite template');
    }

    plan.push(readySteps);
    readySteps.forEach(stepId => completed.add(stepId));
  }

  return plan;
}

async function executeStep(
  stepId: string, 
  steps: any[], 
  context: any, 
  supabase: any, 
  authHeader: string
): Promise<{ step_id: string; output: any }> {
  const step = steps.find(s => s.id === stepId);
  if (!step) {
    throw new Error(`Step ${stepId} not found`);
  }

  console.log(`Executing step: ${step.name} (${stepId})`);

  // Check conditional logic
  if (step.is_conditional && !evaluateCondition(step.condition_logic, context)) {
    console.log(`Skipping conditional step: ${stepId}`);
    return { step_id: stepId, output: { skipped: true, reason: 'condition_not_met' } };
  }

  // Prepare input for this step
  const stepInput = buildStepInput(step.input_mapping, context);

  // Determine template data to use
  let templateData = step.template_data;
  if (step.template_ref) {
    const { data: refTemplate, error } = await supabase
      .from('content_templates')
      .select('template_data, output_format')
      .eq('id', step.template_ref)
      .single();
    
    if (error) {
      throw new Error(`Failed to load referenced template: ${step.template_ref}`);
    }
    templateData = refTemplate.template_data;
  }

  // Execute the step using the existing content generation function
  const executionResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-content`,
    {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_data: templateData,
        ...stepInput,
        settings: {
          step_id: stepId,
          step_name: step.name,
          parent_template: context.template_id
        }
      }),
    }
  );

  if (!executionResponse.ok) {
    const errorText = await executionResponse.text();
    throw new Error(`Step ${stepId} execution failed: ${errorText}`);
  }

  const result = await executionResponse.json();
  
  // Extract relevant output based on output_mapping
  const stepOutput = extractStepOutput(result, step.output_mapping);

  console.log(`Step ${stepId} completed successfully`);
  return { step_id: stepId, output: stepOutput };
}

function buildStepInput(inputMapping: Record<string, string>, context: any): Record<string, any> {
  const input: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(inputMapping)) {
    input[key] = substituteVariables(value, context);
  }
  
  return input;
}

function substituteVariables(template: string, context: any): any {
  if (typeof template !== 'string') return template;
  
  // Handle variable substitution: ${variable_name} or ${step_id.output.field}
  return template.replace(/\${([^}]+)}/g, (match, path) => {
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (part === 'user_input' || part === 'user_inputs') {
        value = context.user_inputs;
      } else if (part === 'variables') {
        value = context.variables;
      } else if (context.step_outputs[part]) {
        value = context.step_outputs[part];
      } else if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.warn(`Variable path not found: ${path}`);
        return match; // Return original if not found
      }
    }
    
    return value;
  });
}

function extractStepOutput(result: any, outputMapping: Record<string, string>): any {
  if (!outputMapping || Object.keys(outputMapping).length === 0) {
    return result.content || result;
  }
  
  const output: Record<string, any> = {};
  for (const [key, path] of Object.entries(outputMapping)) {
    output[key] = extractValueByPath(result, path);
  }
  
  return output;
}

function extractValueByPath(obj: any, path: string): any {
  const parts = path.replace(/\$\{/g, '').replace(/\}/g, '').split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}

function updateVariables(context: any, stepId: string, output: any): void {
  // Add step output to variables for future reference
  context.variables[stepId] = output;
  
  // Also add flattened access patterns
  if (typeof output === 'object' && output !== null) {
    for (const [key, value] of Object.entries(output)) {
      context.variables[`${stepId}.${key}`] = value;
    }
  }
}

function evaluateCondition(conditionLogic: any, context: any): boolean {
  if (!conditionLogic) return true;
  
  // Simple condition evaluation - can be extended
  const { field, operator, value } = conditionLogic;
  const actualValue = substituteVariables(`\${${field}}`, context);
  
  switch (operator) {
    case 'equals':
      return actualValue === value;
    case 'not_equals':
      return actualValue !== value;
    case 'contains':
      return String(actualValue).includes(String(value));
    case 'not_contains':
      return !String(actualValue).includes(String(value));
    case 'exists':
      return actualValue !== undefined && actualValue !== null;
    case 'not_exists':
      return actualValue === undefined || actualValue === null;
    default:
      return true;
  }
}

function combineOutputs(outputs: Record<string, any>, finalConfig: any, context: any): any {
  const { combine_outputs, output_format } = finalConfig;
  
  switch (output_format) {
    case 'multi_part':
      return {
        type: 'multi_part',
        parts: combine_outputs.map((stepId: string) => ({
          step_id: stepId,
          step_name: context.variables[`${stepId}.name`] || stepId,
          content: outputs[stepId]
        }))
      };
      
    case 'single':
      // Concatenate or merge outputs
      const combined = combine_outputs.map((stepId: string) => outputs[stepId]);
      return {
        type: 'single',
        content: combined
      };
      
    case 'collection':
      return {
        type: 'collection',
        items: outputs,
        metadata: {
          execution_order: combine_outputs,
          total_steps: Object.keys(outputs).length
        }
      };
      
    default:
      return outputs;
  }
}