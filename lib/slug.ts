/**
 * Custom slug function that preserves special characters like ., +, #, &, '
 * Uses reversible encoding to keep URLs readable while preserving characters
 * 
 * Special characters are encoded as:
 * - . (dot) -> kept as-is (safe in URLs)
 * - + (plus) -> encoded as -plus-
 * - # (hash) -> encoded as -hash-
 * - & (ampersand) -> encoded as -and-
 */
const s = (t: string): string => {
  if (!t || typeof t !== 'string') return '';
  
  // Trim whitespace
  let result = t.trim();
  
  // Step 1: Replace spaces with hyphens
  result = result.replace(/\s+/g, '-');
  
  // Step 2: Encode special characters BEFORE lowercasing and removing other chars
  // Use unique lowercase markers that won't conflict with normal text
  // IMPORTANT: Do this before lowercasing so we can use case-sensitive markers
  result = result.replace(/\+/g, '~plus~');
  result = result.replace(/#/g, '~hash~');
  result = result.replace(/&/g, '~amp~');
  
  // Step 3: Convert to lowercase (after encoding markers)
  result = result.toLowerCase();
  
  // Step 4: Remove unsafe characters, but keep:
  // - a-z, 0-9 (alphanumeric)
  // - . (dot) - safe in URLs
  // - - (hyphen) - safe in URLs
  // - _ (underscore) - safe in URLs
  // - ' (apostrophe) - safe in URLs
  // - ~ (tilde) - used for our markers
  result = result.replace(/[^a-z0-9.\-_'~]/g, '');
  
  // Step 5: Convert markers to readable form
  result = result.replace(/~plus~/g, '-plus-');
  result = result.replace(/~hash~/g, '-hash-');
  result = result.replace(/~amp~/g, '-and-');
  
  // Step 6: Clean up consecutive hyphens
  result = result.replace(/-{2,}/g, '-');
  
  // Step 7: Remove leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, '');
  
  // Step 8: Limit length
  result = result.slice(0, 80);
  
  return result;
};

/**
 * Reverse the slug encoding to get back the original term
 * Note: This cannot perfectly reconstruct the original (spaces vs hyphens),
 * but it reconstructs special characters correctly
 */
function unslug(t: string): string {
  if (!t) return '';
  
  // Reverse the special character encodings
  let result = t
    .replace(/-hash-/g, '#')
    .replace(/-plus-/g, '+')
    .replace(/-and-/g, '&');
  
  return result;
}

export function toCanonicalSlug(inputs: string[]): string | null {
  const cleaned = inputs.map(x => s(x)).filter(Boolean);
  const unique = Array.from(new Set(cleaned)).slice(0, 3);
  unique.sort(); // a-vs-b === b-vs-a
  if (unique.length < 2) return null;
  return unique.join("-vs-");
}

export function fromSlug(slug?: string | string[]): string[] {
  if (!slug) return [];
  const value = Array.isArray(slug) ? slug[0] : slug;
  return value.split("-vs-").filter(Boolean).map(unslug);
}

function prettyTerm(t: string) {
  // show "open-ai" as "open ai" in UI without breaking slugs
  return t.replace(/-/g, " ");
}
