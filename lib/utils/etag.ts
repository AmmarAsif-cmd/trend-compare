/**
 * ETag Generation Utilities
 * Generate ETags for cache validation (Layer 3: CDN/Edge caching)
 */

import { createHash } from 'crypto';

/**
 * Generate ETag from content
 */
export function generateETag(content: string | object): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  const hash = createHash('md5').update(str).digest('hex');
  return `"${hash.substring(0, 16)}"`;
}

/**
 * Check if request has matching ETag (304 Not Modified)
 */
export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  if (!ifNoneMatch) return false;
  
  // Handle multiple ETags (e.g., "tag1", "tag2")
  const etags = ifNoneMatch.split(',').map(e => e.trim());
  return etags.includes(etag) || etags.includes('*');
}

/**
 * Create cache headers for public GET responses
 */
export function createCacheHeaders(
  content: string | object,
  maxAge: number = 300, // 5 minutes
  staleWhileRevalidate: number = 600 // 10 minutes
): HeadersInit {
  const etag = generateETag(content);
  
  return {
    'ETag': etag,
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}, max-age=${maxAge}`,
    'Vary': 'Accept, Accept-Encoding',
  };
}

/**
 * Create cache headers for private/user-specific responses
 */
export function createPrivateCacheHeaders(
  maxAge: number = 60 // 1 minute
): HeadersInit {
  return {
    'Cache-Control': `private, max-age=${maxAge}, must-revalidate`,
    'Vary': 'Authorization, Cookie',
  };
}

