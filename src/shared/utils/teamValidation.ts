// Client-side team validation utilities matching server-side validation
export const TEAM_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 200,
  NAME_PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTeamName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Team name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < TEAM_VALIDATION_RULES.NAME_MIN_LENGTH) {
    return { 
      valid: false, 
      error: `Team name must be at least ${TEAM_VALIDATION_RULES.NAME_MIN_LENGTH} characters` 
    };
  }

  if (trimmed.length > TEAM_VALIDATION_RULES.NAME_MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Team name must be less than ${TEAM_VALIDATION_RULES.NAME_MAX_LENGTH} characters` 
    };
  }

  if (!TEAM_VALIDATION_RULES.NAME_PATTERN.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Team name can only contain letters, numbers, spaces, hyphens, and underscores' 
    };
  }

  return { valid: true };
}

export function validateTeamDescription(description?: string): ValidationResult {
  if (!description) return { valid: true };

  if (description.length > TEAM_VALIDATION_RULES.DESCRIPTION_MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Description must be less than ${TEAM_VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} characters` 
    };
  }

  return { valid: true };
}

export function sanitizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function sanitizeTeamDescription(description?: string): string | undefined {
  return description?.trim();
}