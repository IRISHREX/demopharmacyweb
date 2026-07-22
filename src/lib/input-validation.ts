/**
 * Centralized input validation and sanitization utilities
 * Provides consistent security measures across the application
 */

/**
 * Sanitizes general text input to prevent XSS and injection attacks
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 4000)
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength: number = 4000): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, maxLength); // Hard limit
}

/**
 * Sanitizes email addresses
 * @param email - Raw email input
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string, maxLength: number = 200): string {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .slice(0, maxLength);
}

/**
 * Sanitizes phone numbers
 * @param phone - Raw phone input
 * @returns Sanitized phone number (digits only)
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  return phone
    .replace(/\D/g, '') // Remove non-digit characters
    .slice(0, 15); // Reasonable max length for international numbers
}

/**
 * Sanitizes URLs to prevent javascript: and data: schemes
 * @param url - Raw URL input
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  
  // Block dangerous protocols
  if (/^(javascript:|data:|vbscript:|file:)/i.test(trimmed)) {
    return '';
  }
  
  // Only allow http, https, and relative URLs
  if (/^(https?:\/\/|\/)/i.test(trimmed)) {
    return trimmed.slice(0, 2000);
  }
  
  return '';
}

/**
 * Validates and sanitizes names
 * @param name - Raw name input
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') return '';
  
  return name
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s\-\'\.]/g, '') // Allow only letters, numbers, spaces, hyphens, apostrophes, periods
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 120);
}

/**
 * Sanitizes slugs for URLs
 * @param slug - Raw slug input
 * @returns Sanitized slug
 */
export function sanitizeSlug(slug: string): string {
  if (typeof slug !== 'string') return '';
  
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\-]/g, '') // Only allow alphanumeric, hyphens, underscores
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 200);
}

/**
 * Validates that input doesn't contain suspicious patterns
 * @param input - Input to check
 * @returns true if safe, false if suspicious
 */
export function isSuspiciousInput(input: string): boolean {
  if (typeof input !== 'string') return true;
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /expression\s*\(/i, // CSS expression
    /@import/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive validation for text fields
 * @param input - Input to validate
 * @param options - Validation options
 * @returns Object with isValid and sanitized value
 */
export function validateTextField(
  input: string,
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    fieldName?: string;
  } = {}
): { isValid: boolean; sanitized: string; error?: string } {
  const {
    minLength = 0,
    maxLength = 4000,
    required = false,
    fieldName = 'Field'
  } = options;
  
  const sanitized = sanitizeInput(input, maxLength);
  
  if (required && !sanitized) {
    return { isValid: false, sanitized: '', error: `${fieldName} is required` };
  }
  
  if (sanitized.length < minLength) {
    return { isValid: false, sanitized, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (isSuspiciousInput(input)) {
    return { isValid: false, sanitized: '', error: `${fieldName} contains invalid characters` };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Zod refinement for suspicious input detection
 * Can be used with z.refine()
 */
export function noSuspiciousContent(value: string): boolean {
  return !isSuspiciousInput(value);
}