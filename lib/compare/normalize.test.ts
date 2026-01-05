import { describe, it, expect } from 'vitest';
import { normalizeTermForSlug, buildCanonicalCompareSlug } from './normalize';

describe('Compare Normalize Utility', () => {
  describe('normalizeTermForSlug', () => {
    it('should trim whitespace', () => {
      expect(normalizeTermForSlug('  test  ')).toBe('test');
      expect(normalizeTermForSlug('  chatgpt  ')).toBe('chatgpt');
    });

    it('should convert to lowercase', () => {
      expect(normalizeTermForSlug('ChatGPT')).toBe('chatgpt');
      expect(normalizeTermForSlug('IPHONE')).toBe('iphone');
      expect(normalizeTermForSlug('Node.js')).toBe('nodejs');
    });

    it('should collapse spaces', () => {
      expect(normalizeTermForSlug('machine  learning')).toBe('machine-learning');
      expect(normalizeTermForSlug('deep   learning')).toBe('deep-learning');
    });

    it('should replace spaces with hyphens', () => {
      expect(normalizeTermForSlug('machine learning')).toBe('machine-learning');
      expect(normalizeTermForSlug('artificial intelligence')).toBe('artificial-intelligence');
    });

    it('should remove punctuation except hyphens', () => {
      expect(normalizeTermForSlug('C++')).toBe('c');
      expect(normalizeTermForSlug('Node.js')).toBe('nodejs');
      expect(normalizeTermForSlug('test-case')).toBe('test-case');
    });

    it('should collapse consecutive hyphens', () => {
      expect(normalizeTermForSlug('test---case')).toBe('test-case');
      expect(normalizeTermForSlug('example--test')).toBe('example-test');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(normalizeTermForSlug('-test')).toBe('test');
      expect(normalizeTermForSlug('test-')).toBe('test');
      expect(normalizeTermForSlug('-test-')).toBe('test');
    });

    it('should handle edge cases', () => {
      expect(normalizeTermForSlug('')).toBe('');
      expect(normalizeTermForSlug('   ')).toBe('');
      expect(normalizeTermForSlug('---')).toBe('');
    });

    it('should handle special characters', () => {
      expect(normalizeTermForSlug('test@example.com')).toBe('testexamplecom');
      expect(normalizeTermForSlug('test#123')).toBe('test123');
      expect(normalizeTermForSlug('test&example')).toBe('testexample');
    });
  });

  describe('buildCanonicalCompareSlug', () => {
    it('should build canonical slug from two terms', () => {
      expect(buildCanonicalCompareSlug('chatgpt', 'gemini')).toBe('chatgpt-vs-gemini');
      expect(buildCanonicalCompareSlug('react', 'vue')).toBe('react-vs-vue');
    });

    it('should sort terms alphabetically', () => {
      expect(buildCanonicalCompareSlug('zebra', 'apple')).toBe('apple-vs-zebra');
      expect(buildCanonicalCompareSlug('gemini', 'chatgpt')).toBe('chatgpt-vs-gemini');
      expect(buildCanonicalCompareSlug('python', 'java')).toBe('java-vs-python');
    });

    it('should ensure consistent order regardless of input order', () => {
      const slug1 = buildCanonicalCompareSlug('chatgpt', 'gemini');
      const slug2 = buildCanonicalCompareSlug('gemini', 'chatgpt');
      expect(slug1).toBe(slug2);
      expect(slug1).toBe('chatgpt-vs-gemini');
    });

    it('should normalize terms before building slug', () => {
      expect(buildCanonicalCompareSlug('ChatGPT', 'Gemini')).toBe('chatgpt-vs-gemini');
      expect(buildCanonicalCompareSlug('  machine learning  ', 'deep learning')).toBe(
        'deep-learning-vs-machine-learning'
      );
    });

    it('should handle multi-word terms', () => {
      expect(buildCanonicalCompareSlug('machine learning', 'deep learning')).toBe(
        'deep-learning-vs-machine-learning'
      );
      expect(buildCanonicalCompareSlug('artificial intelligence', 'human intelligence')).toBe(
        'artificial-intelligence-vs-human-intelligence'
      );
    });

    it('should handle special characters', () => {
      expect(buildCanonicalCompareSlug('C++', 'Python')).toBe('c-vs-python');
      expect(buildCanonicalCompareSlug('Node.js', 'Deno')).toBe('deno-vs-nodejs');
    });

    it('should throw error for empty terms', () => {
      expect(() => buildCanonicalCompareSlug('', 'test')).toThrow();
      expect(() => buildCanonicalCompareSlug('test', '')).toThrow();
      expect(() => buildCanonicalCompareSlug('   ', 'test')).toThrow();
    });

    it('should handle real-world examples', () => {
      expect(buildCanonicalCompareSlug('iPhone', 'Samsung')).toBe('iphone-vs-samsung');
      expect(buildCanonicalCompareSlug('Spotify', 'Apple Music')).toBe('apple-music-vs-spotify');
      expect(buildCanonicalCompareSlug('Netflix', 'Disney Plus')).toBe('disney-plus-vs-netflix');
    });
  });
});

