/**
 * Slug Verification Utility
 * 
 * Verifies that a slug is canonical (matches the expected canonical form)
 * Used to ensure sitemap only includes canonical URLs that return 200
 */

import { fromSlug, toCanonicalSlug } from './slug';
import { validateTopic } from './validateTermsServer';

/**
 * Check if a slug is canonical
 * 
 * A slug is canonical if:
 * 1. It can be parsed into valid terms
 * 2. The canonical slug generated from those terms matches the input slug exactly
 * 
 * @param slug - The slug to verify
 * @returns true if the slug is canonical, false otherwise
 */
export function isCanonicalSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  try {
    // Parse slug to get terms
    const raw = fromSlug(slug);
    if (raw.length < 2) {
      return false;
    }

    // Validate terms
    const checked = raw.map(validateTopic);
    const valid = checked.filter((r) => r.ok);
    
    // All terms must be valid
    if (valid.length !== checked.length || valid.length < 2) {
      return false;
    }

    // Extract valid terms
    const terms = valid.map((c) => c.term);

    // Generate canonical slug from terms
    const canonical = toCanonicalSlug(terms);
    
    // Slug is canonical if it matches the generated canonical slug exactly
    return canonical !== null && canonical === slug;
  } catch (error) {
    // If any error occurs during verification, consider it non-canonical
    console.warn(`[isCanonicalSlug] Error verifying slug "${slug}":`, error);
    return false;
  }
}

/**
 * Get the canonical slug for a given slug
 * 
 * @param slug - The slug (canonical or non-canonical)
 * @returns The canonical slug, or null if invalid
 */
export function getCanonicalSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  try {
    const raw = fromSlug(slug);
    if (raw.length < 2) {
      return null;
    }

    const checked = raw.map(validateTopic);
    const valid = checked.filter((r) => r.ok);
    
    if (valid.length !== checked.length || valid.length < 2) {
      return null;
    }

    const terms = valid.map((c) => c.term);
    return toCanonicalSlug(terms);
  } catch (error) {
    console.warn(`[getCanonicalSlug] Error getting canonical for "${slug}":`, error);
    return null;
  }
}

