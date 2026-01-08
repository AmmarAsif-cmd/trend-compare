/**
 * Product Input Validation and Sanitization
 */

import { PRODUCT_NAME_MIN_LENGTH, PRODUCT_NAME_MAX_LENGTH } from '@/lib/config/product-research';

/**
 * Sanitize product name input
 */
export function sanitizeProductName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove special characters that could cause issues
  // Keep: letters, numbers, spaces, hyphens, apostrophes
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-']/g, '');

  // Normalize multiple spaces to single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Limit length
  if (sanitized.length > PRODUCT_NAME_MAX_LENGTH) {
    sanitized = sanitized.substring(0, PRODUCT_NAME_MAX_LENGTH).trim();
  }

  return sanitized;
}

/**
 * Validate product name
 */
export function validateProductName(input: string): {
  valid: boolean;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      error: 'Product name is required',
    };
  }

  const sanitized = sanitizeProductName(input);

  if (sanitized.length < PRODUCT_NAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Product name must be at least ${PRODUCT_NAME_MIN_LENGTH} characters`,
    };
  }

  if (sanitized.length > PRODUCT_NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Product name must be less than ${PRODUCT_NAME_MAX_LENGTH} characters`,
    };
  }

  // Check for valid characters (at least some letters or numbers)
  if (!/[a-zA-Z0-9]/.test(sanitized)) {
    return {
      valid: false,
      error: 'Product name must contain at least one letter or number',
    };
  }

  return { valid: true };
}

/**
 * Convert product name to URL slug
 */
export function productNameToSlug(name: string): string {
  const sanitized = sanitizeProductName(name);
  
  return sanitized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Convert slug back to product name
 */
export function slugToProductName(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

