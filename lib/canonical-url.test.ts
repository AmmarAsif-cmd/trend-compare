/**
 * Tests for canonical URL utility
 * Ensures canonical URLs follow all requirements
 */

import { 
  getCanonicalUrl, 
  getComparisonCanonicalUrl, 
  getBlogCanonicalUrl,
  getPageCanonicalUrl 
} from './canonical-url';

describe('canonical-url', () => {
  describe('getCanonicalUrl', () => {
    it('should return absolute URL', () => {
      const url = getCanonicalUrl('compare/test-slug');
      expect(url).toMatch(/^https:\/\/trendarc\.net\//);
    });

    it('should be lowercase', () => {
      const url = getCanonicalUrl('COMPARE/TEST-SLUG');
      expect(url).toBe('https://trendarc.net/compare/test-slug');
    });

    it('should remove leading slash', () => {
      const url1 = getCanonicalUrl('/compare/test-slug');
      const url2 = getCanonicalUrl('compare/test-slug');
      expect(url1).toBe(url2);
    });

    it('should remove trailing slash', () => {
      const url1 = getCanonicalUrl('compare/test-slug/');
      const url2 = getCanonicalUrl('compare/test-slug');
      expect(url1).toBe(url2);
    });

    it('should handle paths without slashes', () => {
      const url = getCanonicalUrl('about');
      expect(url).toBe('https://trendarc.net/about');
    });
  });

  describe('getComparisonCanonicalUrl', () => {
    it('should generate correct comparison canonical URL', () => {
      const url = getComparisonCanonicalUrl('term-a-vs-term-b');
      expect(url).toBe('https://trendarc.net/compare/term-a-vs-term-b');
    });

    it('should be lowercase', () => {
      const url = getComparisonCanonicalUrl('TERM-A-VS-TERM-B');
      expect(url).toBe('https://trendarc.net/compare/term-a-vs-term-b');
    });

    it('should not include query parameters', () => {
      const url = getComparisonCanonicalUrl('term-a-vs-term-b?tf=12m');
      // Function doesn't strip query params, but slugs shouldn't contain them anyway
      // This is just to document the expected behavior
      expect(url).not.toContain('?');
    });
  });

  describe('getBlogCanonicalUrl', () => {
    it('should generate correct blog canonical URL', () => {
      const url = getBlogCanonicalUrl('test-post');
      expect(url).toBe('https://trendarc.net/blog/test-post');
    });

    it('should be lowercase', () => {
      const url = getBlogCanonicalUrl('TEST-POST');
      expect(url).toBe('https://trendarc.net/blog/test-post');
    });
  });

  describe('getPageCanonicalUrl', () => {
    it('should generate correct page canonical URL', () => {
      const url = getPageCanonicalUrl('about');
      expect(url).toBe('https://trendarc.net/about');
    });

    it('should handle home page', () => {
      const url = getPageCanonicalUrl('');
      expect(url).toBe('https://trendarc.net');
    });
  });

  describe('consistency with sitemap', () => {
    it('should match sitemap URL format for comparisons', () => {
      const slug = 'term-a-vs-term-b';
      const canonicalUrl = getComparisonCanonicalUrl(slug);
      // Sitemap format: https://trendarc.net/compare/{slug}
      expect(canonicalUrl).toBe(`https://trendarc.net/compare/${slug}`);
    });

    it('should match sitemap URL format for blog posts', () => {
      const slug = 'test-post';
      const canonicalUrl = getBlogCanonicalUrl(slug);
      // Sitemap format: https://trendarc.net/blog/{slug}
      expect(canonicalUrl).toBe(`https://trendarc.net/blog/${slug}`);
    });
  });
});

