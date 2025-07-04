// Shared validation rules for team operations
import { CreateTeamRequest, TeamValidationError } from './types.ts';

export const TEAM_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 200,
  NAME_PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
} as const;

export const PLAN_LIMITS = {
  starter: { teams: 0, seats: 1 },
  pro: { teams: 1, seats: 3 },
  growth: { teams: 3, seats: 10 },
  elite: { teams: 10, seats: 25 },
} as const;

export function validateTeamName(name: string): TeamValidationError | null {
  if (!name || typeof name !== 'string') {
    return { field: 'name', message: 'Team name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < TEAM_VALIDATION_RULES.NAME_MIN_LENGTH) {
    return { 
      field: 'name', 
      message: `Team name must be at least ${TEAM_VALIDATION_RULES.NAME_MIN_LENGTH} characters` 
    };
  }

  if (trimmed.length > TEAM_VALIDATION_RULES.NAME_MAX_LENGTH) {
    return { 
      field: 'name', 
      message: `Team name must be less than ${TEAM_VALIDATION_RULES.NAME_MAX_LENGTH} characters` 
    };
  }

  if (!TEAM_VALIDATION_RULES.NAME_PATTERN.test(trimmed)) {
    return { 
      field: 'name', 
      message: 'Team name can only contain letters, numbers, spaces, hyphens, and underscores' 
    };
  }

  return null;
}

export function validateTeamDescription(description?: string): TeamValidationError | null {
  if (!description) return null;

  if (description.length > TEAM_VALIDATION_RULES.DESCRIPTION_MAX_LENGTH) {
    return { 
      field: 'description', 
      message: `Description must be less than ${TEAM_VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} characters` 
    };
  }

  return null;
}

export function validateCreateTeamRequest(request: CreateTeamRequest): TeamValidationError[] {
  const errors: TeamValidationError[] = [];

  const nameError = validateTeamName(request.name);
  if (nameError) errors.push(nameError);

  const descriptionError = validateTeamDescription(request.description);
  if (descriptionError) errors.push(descriptionError);

  return errors;
}

export function sanitizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function sanitizeTeamDescription(description?: string): string | undefined {
  return description?.trim();
}