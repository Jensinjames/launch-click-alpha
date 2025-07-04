
// Security utility functions

// Rate limiting for client-side protection
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isLimited(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key);
    
    if (!attempts) return false;
    
    // Reset if window has passed
    if (now - attempts.lastAttempt > this.windowMs) {
      this.attempts.delete(key);
      return false;
    }
    
    return attempts.count >= this.maxAttempts;
  }
  
  recordAttempt(key: string, success: boolean = false): void {
    const now = Date.now();
    
    if (success) {
      this.attempts.delete(key);
      return;
    }
    
    const attempts = this.attempts.get(key) || { count: 0, lastAttempt: now };
    attempts.count += 1;
    attempts.lastAttempt = now;
    this.attempts.set(key, attempts);
  }
  
  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key);
    if (!attempts) return 0;
    
    const elapsed = Date.now() - attempts.lastAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }
}

// Input sanitization
import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input).trim();
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

// Password strength validation
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Content Security Policy helpers
export const getCSPNonce = (): string => {
  const meta = document.querySelector('meta[name="csp-nonce"]');
  return meta?.getAttribute('content') || '';
};

// Secure logging for production
export const secureLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console[level](`[Security] ${message}`, data);
  } else {
    // In production, only log errors and warnings
    if (level === 'error' || level === 'warn') {
      console[level](message);
      // You would send this to your monitoring service here
    }
  }
};

// Browser security checks
export const performSecurityChecks = (): { 
  secure: boolean; 
  warnings: string[] 
} => {
  const warnings: string[] = [];
  
  // Check for HTTPS
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    warnings.push('Application should be served over HTTPS');
  }
  
  // Check for secure cookies support
  if (!window.isSecureContext) {
    warnings.push('Secure context required for full security features');
  }
  
  // Check for modern browser features
  if (!window.crypto || !window.crypto.getRandomValues) {
    warnings.push('Browser lacks secure random number generation');
  }
  
  return {
    secure: warnings.length === 0,
    warnings
  };
};

// Data encryption helpers (for client-side sensitive data)
export const encryptSensitiveData = async (data: string, password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(data)
  );
  
  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...combined));
};
