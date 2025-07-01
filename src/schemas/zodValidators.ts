/**
 * Zod validators for runtime validation of template schemas
 */
import { z } from 'zod';

// Base field schema
const BaseFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional()
});

// Prompt schema
const PromptSchema = z.object({
  input: z.string().min(1, 'Input prompt is required'),
  system: z.string().min(1, 'System prompt is required')
});

// Step schema for logic/build flow
const StepSchema = z.object({
  name: z.string().min(1, 'Step name is required'),
  type: z.enum(['action', 'condition', 'input', 'output']),
  description: z.string().optional(),
  params: z.record(z.any()).optional()
});

// Text content field schema
const TextContentFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['text', 'textarea', 'richtext', 'image', 'date', 'dropdown'])
});

// Image content field schema
const ImageContentFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['text', 'textarea', 'dropdown', 'image'])
});

// Code content field schema
const CodeContentFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['text', 'dropdown', 'code'])
});

// Template validators
export const TextContentTemplateValidator = z.object({
  fields: z.array(TextContentFieldSchema).min(1, 'At least one field is required'),
  prompts: z.array(PromptSchema).optional(),
  output_type: z.literal('text')
});

export const ImageContentTemplateValidator = z.object({
  fields: z.array(ImageContentFieldSchema).min(1, 'At least one field is required'),
  prompts: z.array(PromptSchema).optional(),
  output_type: z.literal('image')
});

export const CodeContentTemplateValidator = z.object({
  fields: z.array(CodeContentFieldSchema).min(1, 'At least one field is required'),
  prompts: z.array(PromptSchema).optional(),
  output_type: z.literal('code')
});

export const LogicBuildFlowTemplateValidator = z.object({
  steps: z.array(StepSchema).min(1, 'At least one step is required'),
  output_type: z.enum(['logic', 'build_flow'])
});

export const PromptTemplateValidator = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  variables: z.array(z.string()).optional(),
  output_type: z.enum(['text', 'image', 'code', 'audio', 'logic'])
});

// Union validator for all templates
export const ContentTemplateValidator = z.discriminatedUnion('output_type', [
  TextContentTemplateValidator,
  ImageContentTemplateValidator,
  CodeContentTemplateValidator,
  LogicBuildFlowTemplateValidator,
  PromptTemplateValidator
]);

// Enhanced template data validator
export const EnhancedTemplateDataValidator = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['email_sequence', 'social_post', 'landing_page', 'blog_post', 'ad_copy', 'funnel', 'strategy_brief']),
  template_data: ContentTemplateValidator,
  validation_schema: z.record(z.any()),
  schema_version: z.string().default('1.0'),
  asset_references: z.array(z.string()).default([]),
  output_format: z.enum(['text', 'image', 'code', 'logic', 'build_flow']),
  is_public: z.boolean().default(false),
  min_plan_type: z.enum(['starter', 'pro', 'growth', 'elite']).default('starter'),
  tags: z.array(z.string()).default([]),
  usage_count: z.number().min(0).default(0),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string()
});

// Form field configuration validator
export const FormFieldConfigValidator = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'richtext', 'select', 'multiselect', 'file', 'image', 'date', 'code']),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    fileTypes: z.array(z.string()).optional(),
    maxFileSize: z.number().optional()
  }).optional(),
  conditional: z.object({
    field: z.string(),
    value: z.any(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains'])
  }).optional()
});

// Content generation request validator
export const ContentGenerationRequestValidator = z.object({
  template_id: z.string().uuid().optional(),
  template_data: ContentTemplateValidator.optional(),
  user_inputs: z.record(z.any()),
  output_format: z.enum(['text', 'image', 'code', 'logic', 'build_flow']),
  settings: z.object({
    tone: z.string().optional(),
    style: z.string().optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    audience: z.string().optional()
  }).optional()
}).refine(data => data.template_id || data.template_data, {
  message: 'Either template_id or template_data must be provided'
});

// Template validation utility
export const validateTemplate = (template: unknown, outputType: string) => {
  try {
    switch (outputType) {
      case 'text':
        return TextContentTemplateValidator.parse(template);
      case 'image':
        return ImageContentTemplateValidator.parse(template);
      case 'code':
        return CodeContentTemplateValidator.parse(template);
      case 'logic':
      case 'build_flow':
        return LogicBuildFlowTemplateValidator.parse(template);
      default:
        return PromptTemplateValidator.parse(template);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Template validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    throw error;
  }
};

// Asset reference validator
export const AssetReferenceValidator = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  url: z.string().url(),
  type: z.string(),
  size: z.number().min(0),
  bucket: z.enum(['template-assets', 'generated-images', 'user-uploads', 'content-exports']),
  path: z.string().min(1)
});

export type AssetReference = z.infer<typeof AssetReferenceValidator>;