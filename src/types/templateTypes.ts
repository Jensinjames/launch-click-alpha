/**
 * TypeScript interfaces for template schemas
 */

// Base field interface
export interface BaseField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

// Text content template field types
export interface TextContentField extends BaseField {
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'date' | 'dropdown';
}

// Image content template field types
export interface ImageContentField extends BaseField {
  type: 'text' | 'textarea' | 'dropdown' | 'image';
}

// Code content template field types
export interface CodeContentField extends BaseField {
  type: 'text' | 'dropdown' | 'code';
}

// Prompt interface
export interface Prompt {
  input: string;
  system: string;
}

// Step interface for logic/build flow
export interface Step {
  name: string;
  type: 'action' | 'condition' | 'input' | 'output';
  description?: string;
  params?: Record<string, any>;
}

// Template interfaces
export interface TextContentTemplate {
  fields: TextContentField[];
  prompts?: Prompt[];
  output_type: 'text';
}

export interface ImageContentTemplate {
  fields: ImageContentField[];
  prompts?: Prompt[];
  output_type: 'image';
}

export interface CodeContentTemplate {
  fields: CodeContentField[];
  prompts?: Prompt[];
  output_type: 'code';
}

export interface LogicBuildFlowTemplate {
  steps: Step[];
  output_type: 'logic' | 'build_flow';
}

export interface PromptTemplate {
  prompt: string;
  variables?: string[];
  output_type: 'text' | 'image' | 'code' | 'audio' | 'logic';
}

// Union type for all templates
export type ContentTemplate = 
  | TextContentTemplate 
  | ImageContentTemplate 
  | CodeContentTemplate 
  | LogicBuildFlowTemplate 
  | PromptTemplate;

// Enhanced template data type (for database storage)
export interface EnhancedTemplateData {
  id: string;
  name: string;
  description?: string;
  type: 'email_sequence' | 'social_post' | 'landing_page' | 'blog_post' | 'ad_copy' | 'funnel' | 'strategy_brief';
  template_data: ContentTemplate;
  validation_schema: Record<string, any>;
  schema_version: string;
  asset_references: string[];
  output_format: 'text' | 'image' | 'code' | 'logic' | 'build_flow';
  is_public: boolean;
  min_plan_type: 'starter' | 'pro' | 'growth' | 'elite';
  tags: string[];
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Form field configuration for dynamic rendering
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'richtext' | 'select' | 'multiselect' | 'file' | 'image' | 'date' | 'code';
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    fileTypes?: string[];
    maxFileSize?: number;
  };
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  };
}

// Template builder state
export interface TemplateBuilderState {
  schema: ContentTemplate;
  preview: any;
  validation: {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
  };
  assets: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

// Content generation request
export interface ContentGenerationRequest {
  template_id?: string;
  template_data?: ContentTemplate;
  user_inputs: Record<string, any>;
  output_format: 'text' | 'image' | 'code' | 'logic' | 'build_flow';
  settings?: {
    tone?: string;
    style?: string;
    length?: 'short' | 'medium' | 'long';
    audience?: string;
  };
}

// Content generation response
export interface ContentGenerationResponse {
  success: boolean;
  content?: {
    type: string;
    data: any;
    assets?: string[];
    metadata?: Record<string, any>;
  };
  assets?: Array<{
    url: string;
    type: string;
    name: string;
  }>;
  credits_used: number;
  error?: string;
}