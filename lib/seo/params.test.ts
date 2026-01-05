import { describe, it, expect } from 'vitest';
import {
  isNonIndexableParamKey,
  hasNonIndexableParams,
  stripNonIndexableParams,
  getCanonicalUrl,
  getRobotsForParams,
} from './params';

describe('SEO Params Utility', () => {
  describe('isNonIndexableParamKey', () => {
    it('should identify non-indexable params', () => {
      expect(isNonIndexableParamKey('q')).toBe(true);
      expect(isNonIndexableParamKey('s')).toBe(true);
      expect(isNonIndexableParamKey('query')).toBe(true);
      expect(isNonIndexableParamKey('search')).toBe(true);
      expect(isNonIndexableParamKey('gclid')).toBe(true);
      expect(isNonIndexableParamKey('fbclid')).toBe(true);
      expect(isNonIndexableParamKey('ref')).toBe(true);
      expect(isNonIndexableParamKey('source')).toBe(true);
      expect(isNonIndexableParamKey('campaign')).toBe(true);
    });

    it('should identify UTM parameters', () => {
      expect(isNonIndexableParamKey('utm_source')).toBe(true);
      expect(isNonIndexableParamKey('utm_medium')).toBe(true);
      expect(isNonIndexableParamKey('utm_campaign')).toBe(true);
      expect(isNonIndexableParamKey('utm_term')).toBe(true);
      expect(isNonIndexableParamKey('utm_content')).toBe(true);
      expect(isNonIndexableParamKey('UTM_SOURCE')).toBe(true); // case insensitive
    });

    it('should allow indexable params', () => {
      expect(isNonIndexableParamKey('tf')).toBe(false);
      expect(isNonIndexableParamKey('geo')).toBe(false);
      expect(isNonIndexableParamKey('page')).toBe(false);
      expect(isNonIndexableParamKey('limit')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isNonIndexableParamKey('')).toBe(false);
      expect(isNonIndexableParamKey(null as any)).toBe(false);
      expect(isNonIndexableParamKey(undefined as any)).toBe(false);
    });
  });

  describe('hasNonIndexableParams', () => {
    it('should detect non-indexable params in searchParams', () => {
      expect(hasNonIndexableParams({ q: 'test' })).toBe(true);
      expect(hasNonIndexableParams({ utm_source: 'google' })).toBe(true);
      expect(hasNonIndexableParams({ gclid: '123' })).toBe(true);
      expect(hasNonIndexableParams({ fbclid: '456' })).toBe(true);
      expect(hasNonIndexableParams({ ref: 'twitter' })).toBe(true);
    });

    it('should return false for indexable params only', () => {
      expect(hasNonIndexableParams({ tf: '12m' })).toBe(false);
      expect(hasNonIndexableParams({ geo: 'US' })).toBe(false);
      expect(hasNonIndexableParams({ tf: '12m', geo: 'US' })).toBe(false);
    });

    it('should detect mixed params', () => {
      expect(hasNonIndexableParams({ tf: '12m', q: 'test' })).toBe(true);
      expect(hasNonIndexableParams({ geo: 'US', utm_source: 'google' })).toBe(true);
    });

    it('should handle empty objects', () => {
      expect(hasNonIndexableParams({})).toBe(false);
      expect(hasNonIndexableParams(null as any)).toBe(false);
      expect(hasNonIndexableParams(undefined as any)).toBe(false);
    });

    it('should handle array values', () => {
      expect(hasNonIndexableParams({ q: ['test'] })).toBe(true);
      expect(hasNonIndexableParams({ utm_source: ['google', 'facebook'] })).toBe(true);
    });
  });

  describe('stripNonIndexableParams', () => {
    it('should remove non-indexable params from URL', () => {
      const url = new URL('https://trendarc.net/?q=test&tf=12m');
      const cleaned = stripNonIndexableParams(url);
      expect(cleaned.searchParams.has('q')).toBe(false);
      expect(cleaned.searchParams.get('tf')).toBe('12m');
    });

    it('should remove UTM parameters', () => {
      const url = new URL('https://trendarc.net/?utm_source=google&utm_medium=email&tf=12m');
      const cleaned = stripNonIndexableParams(url);
      expect(cleaned.searchParams.has('utm_source')).toBe(false);
      expect(cleaned.searchParams.has('utm_medium')).toBe(false);
      expect(cleaned.searchParams.get('tf')).toBe('12m');
    });

    it('should remove tracking parameters', () => {
      const url = new URL('https://trendarc.net/?gclid=123&fbclid=456&ref=twitter&geo=US');
      const cleaned = stripNonIndexableParams(url);
      expect(cleaned.searchParams.has('gclid')).toBe(false);
      expect(cleaned.searchParams.has('fbclid')).toBe(false);
      expect(cleaned.searchParams.has('ref')).toBe(false);
      expect(cleaned.searchParams.get('geo')).toBe('US');
    });

    it('should preserve indexable params', () => {
      const url = new URL('https://trendarc.net/compare/test-vs-example?tf=12m&geo=US');
      const cleaned = stripNonIndexableParams(url);
      expect(cleaned.searchParams.get('tf')).toBe('12m');
      expect(cleaned.searchParams.get('geo')).toBe('US');
    });

    it('should handle URLs with no params', () => {
      const url = new URL('https://trendarc.net/');
      const cleaned = stripNonIndexableParams(url);
      expect(cleaned.search).toBe('');
    });

    it('should handle URLs with only non-indexable params', () => {
      const url = new URL('https://trendarc.net/?q=test&utm_source=google');
      const cleaned = stripNonIndexableParams(url);
      expect(cleaned.search).toBe('');
    });
  });

  describe('getCanonicalUrl', () => {
    it('should generate clean canonical URL', () => {
      expect(getCanonicalUrl('https://trendarc.net', '/')).toBe('https://trendarc.net/');
      expect(getCanonicalUrl('https://trendarc.net', '/compare/test-vs-example')).toBe(
        'https://trendarc.net/compare/test-vs-example'
      );
    });

    it('should handle trailing slashes in base', () => {
      expect(getCanonicalUrl('https://trendarc.net/', '/')).toBe('https://trendarc.net/');
      expect(getCanonicalUrl('https://trendarc.net/', '/compare/test')).toBe(
        'https://trendarc.net/compare/test'
      );
    });

    it('should remove trailing slashes from pathname', () => {
      expect(getCanonicalUrl('https://trendarc.net', '/compare/test/')).toBe(
        'https://trendarc.net/compare/test'
      );
      expect(getCanonicalUrl('https://trendarc.net', 'compare/test/')).toBe(
        'https://trendarc.net/compare/test'
      );
    });

    it('should preserve root path trailing slash', () => {
      expect(getCanonicalUrl('https://trendarc.net', '/')).toBe('https://trendarc.net/');
    });

    it('should handle pathname without leading slash', () => {
      expect(getCanonicalUrl('https://trendarc.net', 'compare/test')).toBe(
        'https://trendarc.net/compare/test'
      );
    });
  });

  describe('getRobotsForParams', () => {
    it('should return noindex,follow for non-indexable params', () => {
      expect(getRobotsForParams({ q: 'test' })).toEqual({ index: false, follow: true });
      expect(getRobotsForParams({ utm_source: 'google' })).toEqual({ index: false, follow: true });
      expect(getRobotsForParams({ gclid: '123' })).toEqual({ index: false, follow: true });
    });

    it('should return index,follow for indexable params only', () => {
      expect(getRobotsForParams({ tf: '12m' })).toEqual({ index: true, follow: true });
      expect(getRobotsForParams({ geo: 'US' })).toEqual({ index: true, follow: true });
      expect(getRobotsForParams({ tf: '12m', geo: 'US' })).toEqual({ index: true, follow: true });
    });

    it('should return noindex for mixed params with non-indexable', () => {
      expect(getRobotsForParams({ tf: '12m', q: 'test' })).toEqual({ index: false, follow: true });
      expect(getRobotsForParams({ geo: 'US', utm_source: 'google' })).toEqual({
        index: false,
        follow: true,
      });
    });

    it('should return index,follow for empty params', () => {
      expect(getRobotsForParams({})).toEqual({ index: true, follow: true });
    });
  });
});

