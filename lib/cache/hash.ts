/**
 * Stable hashing utility for cache keys
 * Produces consistent hash strings from objects
 */

import crypto from 'crypto';

/**
 * Create a stable hash from an object
 * Same input always produces same output
 */
export function stableHash(obj: unknown): string {
  // Handle primitives
  if (obj === null || obj === undefined) {
    return crypto.createHash('sha256').update(String(obj)).digest('hex').substring(0, 16);
  }

  if (typeof obj === 'string') {
    return crypto.createHash('sha256').update(obj).digest('hex').substring(0, 16);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return crypto.createHash('sha256').update(String(obj)).digest('hex').substring(0, 16);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    const arrayStr = JSON.stringify(obj.map(item => normalizeForHash(item)));
    return crypto.createHash('sha256').update(arrayStr).digest('hex').substring(0, 16);
  }

  // Handle objects - sort keys for stability
  if (typeof obj === 'object') {
    const sorted = sortObjectKeys(obj as Record<string, unknown>);
    const objStr = JSON.stringify(sorted);
    return crypto.createHash('sha256').update(objStr).digest('hex').substring(0, 16);
  }

  // Fallback
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').substring(0, 16);
}

/**
 * Normalize value for hashing
 */
function normalizeForHash(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return sortObjectKeys(value as Record<string, unknown>);
  }

  return value;
}

/**
 * Sort object keys recursively for stable hashing
 */
function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sorted[key] = sortObjectKeys(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sorted[key] = value.map(item => 
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? sortObjectKeys(item as Record<string, unknown>)
          : item
      );
    } else {
      sorted[key] = value;
    }
  }

  return sorted;
}

/**
 * Create a cache key from parts
 */
export function createCacheKey(...parts: (string | number | unknown)[]): string {
  return parts
    .map(part => {
      if (typeof part === 'string' || typeof part === 'number') {
        return String(part);
      }
      return stableHash(part);
    })
    .join(':');
}

