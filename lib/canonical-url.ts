/**
 * Canonical URL Utility
 * 
 * Ensures all canonical URLs follow consistent rules:
 * - Absolute URL (https://trendarc.net/...)
 * - Lowercase
 * - No query parameters
 * - No trailing slash
 * - Matches sitemap URLs exactly
 */

const BASE_URL = 'https://trendarc.net';

/**
 * Generate a canonical URL for a path
 * 
 * @param path - Path without leading slash (e.g., 'compare/term-a-vs-term-b')
 * @returns Absolute canonical URL
 */
export function getCanonicalUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Ensure lowercase
  const lowercasePath = cleanPath.toLowerCase();
  
  // Remove trailing slash
  const noTrailingSlash = lowercasePath.endsWith('/') 
    ? lowercasePath.slice(0, -1) 
    : lowercasePath;
  
  // Build absolute URL
  return `${BASE_URL}/${noTrailingSlash}`;
}

/**
 * Generate canonical URL for comparison page
 * 
 * @param slug - Canonical slug (e.g., 'term-a-vs-term-b')
 * @returns Absolute canonical URL
 */
export function getComparisonCanonicalUrl(slug: string): string {
  return getCanonicalUrl(`compare/${slug}`);
}

/**
 * Generate canonical URL for blog post
 * 
 * @param slug - Blog post slug
 * @returns Absolute canonical URL
 */
export function getBlogCanonicalUrl(slug: string): string {
  return getCanonicalUrl(`blog/${slug}`);
}

/**
 * Generate canonical URL for static pages
 * 
 * @param path - Page path (e.g., 'about', 'privacy', 'trending')
 * @returns Absolute canonical URL
 */
export function getPageCanonicalUrl(path: string): string {
  return getCanonicalUrl(path);
}

