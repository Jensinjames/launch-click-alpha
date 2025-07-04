// Unified Authentication Types - Single Source of Truth
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  general?: string;
}

export interface SignupState {
  formData: SignUpData;
  errors: ValidationErrors;
  showPassword: boolean;
  showSuccess: boolean;
  isSubmitting: boolean;
}

export type SignupAction = 
  | { type: 'UPDATE_FIELD'; field: keyof SignUpData; value: string }
  | { type: 'SET_ERRORS'; errors: ValidationErrors }
  | { type: 'TOGGLE_PASSWORD_VISIBILITY' }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_SUCCESS'; showSuccess: boolean }
  | { type: 'RESET_FORM' };