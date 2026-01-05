/**
 * Canonical Slug Generation and Normalization
 * 
 * Ensures consistent slug generation for comparison pages,
 * preventing duplicate URLs (A vs B vs B vs A).
 */

/**
 * Normalize a term for use in a slug
 * - Trim whitespace
 * - Convert to lowercase
 * - Collapse spaces
 * - Remove punctuation except hyphens
 * - Replace spaces with hyphens
 */
export function normalizeTermForSlug(term: string): string {
  if (!term || typeof term !== 'string') return '';
  
  // Trim whitespace
  let result = term.trim();
  
  // Convert to lowercase
  result = result.toLowerCase();
  
  // Collapse multiple spaces into single space
  result = result.replace(/\s+/g, ' ');
  
  // Replace spaces with hyphens
  result = result.replace(/\s/g, '-');
  
  // Remove punctuation except hyphens
  // Keep: a-z, 0-9, hyphens
  result = result.replace(/[^a-z0-9-]/g, '');
  
  // Collapse consecutive hyphens
  result = result.replace(/-{2,}/g, '-');
  
  // Remove leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, '');
  
  return result;
}

/**
 * Build canonical compare slug from two terms
 * - Normalizes both terms
 * - Sorts alphabetically to ensure A vs B === B vs A
 * - Returns format: ${a}-vs-${b}
 */
export function buildCanonicalCompareSlug(termA: string, termB: string): string {
  const normalizedA = normalizeTermForSlug(termA);
  const normalizedB = normalizeTermForSlug(termB);
  
  if (!normalizedA || !normalizedB) {
    throw new Error('Both terms must be non-empty after normalization');
  }
  
  // Sort alphabetically to ensure canonical order
  const [a, b] = [normalizedA, normalizedB].sort();
  
  return `${a}-vs-${b}`;
}

