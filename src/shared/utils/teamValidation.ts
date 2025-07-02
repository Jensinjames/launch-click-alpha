import { z } from 'zod';

// Team validation schemas
export const teamNameSchema = z.string()
  .min(2, 'Team name must be at least 2 characters')
  .max(50, 'Team name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Team name can only contain letters, numbers, spaces, hyphens, and underscores');

export const teamDescriptionSchema = z.string()
  .max(200, 'Description must be less than 200 characters')
  .optional();

export const emailSchema = z.string()
  .email('Invalid email address')
  .max(320, 'Email address too long');

export const roleSchema = z.enum(['owner', 'admin', 'editor', 'viewer']);

export const creditsSchema = z.number()
  .int('Credits must be a whole number')
  .min(0, 'Credits cannot be negative')
  .max(10000, 'Credits cannot exceed 10,000');

// Validation functions
export const validateTeamName = (name: string): { valid: boolean; error?: string } => {
  try {
    teamNameSchema.parse(name);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid team name' };
  }
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid email' };
  }
};

export const validateEmailList = (emails: string[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const seenEmails = new Set<string>();
  
  emails.forEach((email, index) => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.push(`Email ${index + 1}: ${emailValidation.error}`);
    } else if (seenEmails.has(email.toLowerCase())) {
      errors.push(`Email ${index + 1}: Duplicate email address`);
    } else {
      seenEmails.add(email.toLowerCase());
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateCredits = (credits: number): { valid: boolean; error?: string } => {
  try {
    creditsSchema.parse(credits);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid credits value' };
  }
};

// Business logic validations
export const validateTeamSize = (
  currentMemberCount: number,
  maxSeats: number,
  newInvitations: number = 0
): { valid: boolean; error?: string } => {
  const totalAfterInvites = currentMemberCount + newInvitations;
  
  if (totalAfterInvites > maxSeats) {
    return {
      valid: false,
      error: `Team size would exceed limit. Current: ${currentMemberCount}, Max: ${maxSeats}, Adding: ${newInvitations}`
    };
  }
  
  return { valid: true };
};

export const validateInvitationQuota = (
  pendingInvitations: number,
  maxPendingInvitations: number = 50
): { valid: boolean; error?: string } => {
  if (pendingInvitations >= maxPendingInvitations) {
    return {
      valid: false,
      error: `Too many pending invitations. Maximum allowed: ${maxPendingInvitations}`
    };
  }
  
  return { valid: true };
};

export const validateTeamCreationLimit = (
  currentTeamCount: number,
  maxTeams: number
): { valid: boolean; error?: string } => {
  if (currentTeamCount >= maxTeams) {
    return {
      valid: false,
      error: `Team creation limit reached. Maximum allowed: ${maxTeams}`
    };
  }
  
  return { valid: true };
};

// Sanitization functions
export const sanitizeTeamName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

export const sanitizeDescription = (description: string): string => {
  return description.trim();
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const parseEmailList = (emailText: string): string[] => {
  return emailText
    .split(/[,\n;]/)
    .map(email => sanitizeEmail(email))
    .filter(email => email.length > 0);
};