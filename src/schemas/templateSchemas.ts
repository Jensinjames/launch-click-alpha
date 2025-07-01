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

export const CompositeTemplateSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CompositeTemplate",
  type: "object",
  required: ["steps", "global_inputs", "final_output", "output_type"],
  properties: {
    steps: {
      type: "array",
      items: { $ref: "#/definitions/CompositeStep" },
      minItems: 1
    },
    global_inputs: {
      type: "array",
      items: { $ref: "#/definitions/Field" }
    },
    final_output: {
      type: "object",
      required: ["combine_outputs", "output_format"],
      properties: {
        combine_outputs: {
          type: "array",
          items: { type: "string" }
        },
        output_format: {
          type: "string",
          enum: ["multi_part", "single", "collection"]
        }
      }
    },
    output_type: {
      type: "string",
      enum: ["composite"]
    }
  },
  definitions: {
    CompositeStep: {
      type: "object",
      required: ["id", "name", "step_order", "input_mapping", "output_mapping"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        step_order: { type: "number" },
        template_ref: { type: "string" },
        template_data: { type: "object" },
        input_mapping: { type: "object" },
        output_mapping: { type: "object" },
        depends_on: {
          type: "array",
          items: { type: "string" }
        },
        is_conditional: { type: "boolean" },
        condition_logic: { type: "object" }
      }
    },
    Field: {
      type: "object",
      required: ["name", "label", "type"],
      properties: {
        name: { type: "string" },
        label: { type: "string" },
        type: { type: "string" },
        required: { type: "boolean" },
        options: {
          type: "array",
          items: { type: "string" }
        }
      }
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
  prompt: PromptTemplateSchema,
  composite: CompositeTemplateSchema
} as const;

export type TemplateSchemaType = keyof typeof TemplateSchemas;