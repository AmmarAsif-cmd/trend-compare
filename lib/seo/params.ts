/**
 * SEO Parameters Utility
 * 
 * Handles non-indexable query parameters and canonical URL generation
 * for Google Search Console indexing optimization.
 */

/**
 * List of non-indexable parameter keys that should trigger noindex
 * These are typically tracking, UTM, or user-specific parameters
 */
const NON_INDEXABLE_PARAMS = new Set([
  'q',           // Search query (homepage)
  's',           // Search
  'query',       // Query
  'search',      // Search
  'gclid',       // Google Click ID
  'fbclid',      // Facebook Click ID
  'ref',         // Referrer
  'source',      // Source
  'campaign',    // Campaign
]);

/**
 * Check if a parameter key is non-indexable
 * Handles UTM parameters with pattern matching
 */
export function isNonIndexableParamKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  const lowerKey = key.toLowerCase();
  
  // Check exact matches
  if (NON_INDEXABLE_PARAMS.has(lowerKey)) {
    return true;
  }
  
  // Check UTM pattern (utm_*)
  if (lowerKey.startsWith('utm_')) {
    return true;
  }
  
  return false;
}

/**
 * Check if searchParams contain any non-indexable parameters
 */
export function hasNonIndexableParams(
  searchParams: Record<string, string | string[] | undefined>
): boolean {
  if (!searchParams || typeof searchParams !== 'object') {
    return false;
  }
  
  return Object.keys(searchParams).some(key => isNonIndexableParamKey(key));
}

/**
 * Strip non-indexable parameters from a URL
 * Returns a new URL object with cleaned query string
 */
export function stripNonIndexableParams(url: URL): URL {
  const cleaned = new URL(url.toString());
  
  // Remove all non-indexable params
  for (const key of cleaned.searchParams.keys()) {
    if (isNonIndexableParamKey(key)) {
      cleaned.searchParams.delete(key);
    }
  }
  
  return cleaned;
}

/**
 * Get canonical URL for a path
 * Always returns clean canonical without query params
 */
export function getCanonicalUrl(base: string, pathname: string): string {
  // Ensure base doesn't have trailing slash
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  
  // Ensure pathname starts with /
  const cleanPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  
  // Remove trailing slash from pathname
  const noTrailingSlash = cleanPathname.endsWith('/') && cleanPathname !== '/'
    ? cleanPathname.slice(0, -1)
    : cleanPathname;
  
  // Combine base + pathname (no query params)
  return `${cleanBase}${noTrailingSlash}`;
}

/**
 * Get robots directive based on search params
 * Returns noindex,follow if non-indexable params exist, otherwise index,follow
 */
export function getRobotsForParams(
  searchParams: Record<string, string | string[] | undefined>
): { index: boolean; follow: boolean } {
  if (hasNonIndexableParams(searchParams)) {
    return { index: false, follow: true };
  }
  
  return { index: true, follow: true };
}

