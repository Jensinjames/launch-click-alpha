/**
 * Production-ready JSON Schemas for template types
 * These schemas provide validation, dynamic form rendering, and reliable backend processing
 */

export const TextContentTemplateSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "TextContentTemplate",
  type: "object",
  required: ["fields", "output_type"],
  properties: {
    fields: {
      type: "array",
      items: { $ref: "#/definitions/Field" },
      minItems: 1
    },
    prompts: {
      type: "array",
      items: { $ref: "#/definitions/Prompt" }
    },
    output_type: {
      type: "string",
      enum: ["text"]
    }
  },
  definitions: {
    Field: {
      type: "object",
      required: ["name", "label", "type"],
      properties: {
        name: { type: "string" },
        label: { type: "string" },
        type: {
          type: "string",
          enum: ["text", "textarea", "richtext", "image", "date", "dropdown"]
        },
        required: { type: "boolean" },
        options: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    Prompt: {
      type: "object",
      required: ["input", "system"],
      properties: {
        input: { type: "string" },
        system: { type: "string" }
      }
    }
  }
} as const;

export const ImageContentTemplateSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ImageContentTemplate",
  type: "object",
  required: ["fields", "output_type"],
  properties: {
    fields: {
      type: "array",
      items: { $ref: "#/definitions/Field" },
      minItems: 1
    },
    prompts: {
      type: "array",
      items: { $ref: "#/definitions/Prompt" }
    },
    output_type: {
      type: "string",
      enum: ["image"]
    }
  },
  definitions: {
    Field: {
      type: "object",
      required: ["name", "label", "type"],
      properties: {
        name: { type: "string" },
        label: { type: "string" },
        type: {
          type: "string",
          enum: ["text", "textarea", "dropdown", "image"]
        },
        required: { type: "boolean" },
        options: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    Prompt: {
      type: "object",
      required: ["input", "system"],
      properties: {
        input: { type: "string" },
        system: { type: "string" }
      }
    }
  }
} as const;

export const CodeContentTemplateSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CodeContentTemplate",
  type: "object",
  required: ["fields", "output_type"],
  properties: {
    fields: {
      type: "array",
      items: { $ref: "#/definitions/Field" },
      minItems: 1
    },
    prompts: {
      type: "array",
      items: { $ref: "#/definitions/Prompt" }
    },
    output_type: {
      type: "string",
      enum: ["code"]
    }
  },
  definitions: {
    Field: {
      type: "object",
      required: ["name", "label", "type"],
      properties: {
        name: { type: "string" },
        label: { type: "string" },
        type: {
          type: "string",
          enum: ["text", "dropdown", "code"]
        },
        required: { type: "boolean" },
        options: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    Prompt: {
      type: "object",
      required: ["input", "system"],
      properties: {
        input: { type: "string" },
        system: { type: "string" }
      }
    }
  }
} as const;

export const LogicBuildFlowTemplateSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "LogicBuildFlowTemplate",
  type: "object",
  required: ["steps", "output_type"],
  properties: {
    steps: {
      type: "array",
      items: { $ref: "#/definitions/Step" },
      minItems: 1
    },
    output_type: {
      type: "string",
      enum: ["logic", "build_flow"]
    }
  },
  definitions: {
    Step: {
      type: "object",
      required: ["name", "type"],
      properties: {
        name: { type: "string" },
        type: {
          type: "string",
          enum: ["action", "condition", "input", "output"]
        },
        description: { type: "string" },
        params: {
          type: "object",
          additionalProperties: true
        }
      }
    }
  }
} as const;

export const PromptTemplateSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PromptTemplate",
  type: "object",
  required: ["prompt", "output_type"],
  properties: {
    prompt: { type: "string" },
    variables: {
      type: "array",
      items: { type: "string" }
    },
    output_type: {
      type: "string",
      enum: ["text", "image", "code", "audio", "logic"]
    }
  }
} as const;

// Schema registry for easy access
export const TemplateSchemas = {
  text: TextContentTemplateSchema,
  image: ImageContentTemplateSchema,
  code: CodeContentTemplateSchema,
  logic: LogicBuildFlowTemplateSchema,
  build_flow: LogicBuildFlowTemplateSchema,
  prompt: PromptTemplateSchema
} as const;

export type TemplateSchemaType = keyof typeof TemplateSchemas;