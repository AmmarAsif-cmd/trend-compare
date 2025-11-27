import { describe, it, expect } from 'vitest'
import { toCanonicalSlug, fromSlug } from './slug'

describe('slug utilities', () => {
  describe('toCanonicalSlug', () => {
    it('should create slugs from two terms', () => {
      expect(toCanonicalSlug(['chatgpt', 'gemini'])).toBe('chatgpt-vs-gemini')
      expect(toCanonicalSlug(['iPhone', 'Android'])).toBe('android-vs-iphone')
    })

    it('should sort terms alphabetically', () => {
      expect(toCanonicalSlug(['zebra', 'apple'])).toBe('apple-vs-zebra')
      expect(toCanonicalSlug(['python', 'java'])).toBe('java-vs-python')
      expect(toCanonicalSlug(['gemini', 'chatgpt'])).toBe('chatgpt-vs-gemini')
    })

    it('should ensure consistent slugs regardless of input order', () => {
      const slug1 = toCanonicalSlug(['chatgpt', 'gemini'])
      const slug2 = toCanonicalSlug(['gemini', 'chatgpt'])
      expect(slug1).toBe(slug2)
      expect(slug1).toBe('chatgpt-vs-gemini')
    })

    it('should convert to lowercase', () => {
      expect(toCanonicalSlug(['ChatGPT', 'Gemini'])).toBe('chatgpt-vs-gemini')
      expect(toCanonicalSlug(['IPHONE', 'ANDROID'])).toBe('android-vs-iphone')
    })

    it('should handle special characters and spaces', () => {
      expect(toCanonicalSlug(['C++', 'Python'])).toBe('c-vs-python')
      expect(toCanonicalSlug(['Node.js', 'Deno'])).toBe('deno-vs-nodejs')
      expect(toCanonicalSlug(['machine learning', 'deep learning'])).toBe(
        'deep-learning-vs-machine-learning'
      )
    })

    it('should remove accents and diacritics', () => {
      expect(toCanonicalSlug(['café', 'tea'])).toBe('cafe-vs-tea')
      expect(toCanonicalSlug(['São Paulo', 'Rio'])).toBe('rio-vs-sao-paulo')
    })

    it('should truncate terms to 40 characters', () => {
      const longTerm = 'a'.repeat(50)
      const result = toCanonicalSlug([longTerm, 'short'])
      expect(result).toBeTruthy()
      if (result) {
        const terms = result.split('-vs-')
        expect(terms[0].length).toBeLessThanOrEqual(40)
      }
    })

    it('should collapse multiple hyphens', () => {
      expect(toCanonicalSlug(['test---case', 'example'])).toBe(
        'example-vs-test-case'
      )
    })

    it('should remove duplicates', () => {
      expect(toCanonicalSlug(['chatgpt', 'chatgpt'])).toBe(null)
      expect(toCanonicalSlug(['test', 'test', 'example'])).toBe(
        'example-vs-test'
      )
    })

    it('should handle up to 3 unique terms', () => {
      const result = toCanonicalSlug(['a', 'b', 'c', 'd'])
      expect(result).toBeTruthy()
      if (result) {
        const terms = result.split('-vs-')
        expect(terms.length).toBe(3)
      }
    })

    it('should return null for fewer than 2 unique terms', () => {
      expect(toCanonicalSlug([])).toBe(null)
      expect(toCanonicalSlug(['single'])).toBe(null)
      expect(toCanonicalSlug(['same', 'same'])).toBe(null)
    })

    it('should filter out empty strings', () => {
      expect(toCanonicalSlug(['', 'test'])).toBe(null)
      expect(toCanonicalSlug(['test', ''])).toBe(null)
      expect(toCanonicalSlug(['test', '', 'example'])).toBe('example-vs-test')
    })

    it('should handle whitespace-only strings', () => {
      expect(toCanonicalSlug(['   ', 'test'])).toBe(null)
      expect(toCanonicalSlug(['test', '   '])).toBe(null)
    })

    it('should strip leading/trailing whitespace', () => {
      expect(toCanonicalSlug(['  chatgpt  ', '  gemini  '])).toBe(
        'chatgpt-vs-gemini'
      )
    })

    describe('real-world examples', () => {
      it('should handle common comparison terms', () => {
        expect(toCanonicalSlug(['React', 'Vue'])).toBe('react-vs-vue')
        expect(toCanonicalSlug(['coffee', 'tea'])).toBe('coffee-vs-tea')
        expect(toCanonicalSlug(['cats', 'dogs'])).toBe('cats-vs-dogs')
      })

      it('should handle programming languages', () => {
        expect(toCanonicalSlug(['JavaScript', 'TypeScript'])).toBe(
          'javascript-vs-typescript'
        )
        expect(toCanonicalSlug(['C#', 'Java'])).toBe('c-vs-java')
        expect(toCanonicalSlug(['Python 3', 'Python 2'])).toBe(
          'python-2-vs-python-3'
        )
      })

      it('should handle product names', () => {
        expect(toCanonicalSlug(['iPhone 15', 'Samsung S24'])).toBe(
          'iphone-15-vs-samsung-s24'
        )
        expect(toCanonicalSlug(['PS5', 'Xbox Series X'])).toBe(
          'ps5-vs-xbox-series-x'
        )
      })

      it('should handle multi-word terms', () => {
        expect(toCanonicalSlug(['machine learning', 'deep learning'])).toBe(
          'deep-learning-vs-machine-learning'
        )
        expect(
          toCanonicalSlug(['artificial intelligence', 'human intelligence'])
        ).toBe('artificial-intelligence-vs-human-intelligence')
      })
    })
  })

  describe('fromSlug', () => {
    it('should parse slugs back to terms', () => {
      expect(fromSlug('chatgpt-vs-gemini')).toEqual(['chatgpt', 'gemini'])
      expect(fromSlug('react-vs-vue')).toEqual(['react', 'vue'])
    })

    it('should handle slugs with 3 terms', () => {
      expect(fromSlug('a-vs-b-vs-c')).toEqual(['a', 'b', 'c'])
    })

    it('should handle empty or undefined input', () => {
      expect(fromSlug(undefined)).toEqual([])
      expect(fromSlug('')).toEqual([])
      expect(fromSlug(null as any)).toEqual([])
    })

    it('should handle array input (take first element)', () => {
      expect(fromSlug(['chatgpt-vs-gemini', 'other'])).toEqual([
        'chatgpt',
        'gemini',
      ])
    })

    it('should filter out empty parts', () => {
      expect(fromSlug('-vs-')).toEqual([])
      expect(fromSlug('test-vs-')).toEqual(['test'])
      expect(fromSlug('-vs-test')).toEqual(['test'])
    })

    it('should handle malformed slugs gracefully', () => {
      expect(fromSlug('invalid')).toEqual(['invalid'])
      expect(fromSlug('no-separator-here')).toEqual(['no-separator-here'])
    })

    describe('real-world examples', () => {
      it('should parse common comparison slugs', () => {
        expect(fromSlug('react-vs-vue')).toEqual(['react', 'vue'])
        expect(fromSlug('coffee-vs-tea')).toEqual(['coffee', 'tea'])
        expect(fromSlug('iphone-15-vs-samsung-s24')).toEqual([
          'iphone-15',
          'samsung-s24',
        ])
      })

      it('should handle complex multi-word slugs', () => {
        expect(fromSlug('machine-learning-vs-deep-learning')).toEqual([
          'machine-learning',
          'deep-learning',
        ])
        expect(
          fromSlug('artificial-intelligence-vs-human-intelligence')
        ).toEqual(['artificial-intelligence', 'human-intelligence'])
      })
    })
  })

  describe('roundtrip conversion', () => {
    it('should convert back and forth consistently', () => {
      const originalTerms = ['chatgpt', 'gemini']
      const slug = toCanonicalSlug(originalTerms)
      expect(slug).toBe('chatgpt-vs-gemini')

      const parsedTerms = fromSlug(slug!)
      expect(parsedTerms).toEqual(['chatgpt', 'gemini'])
    })

    it('should preserve term order after roundtrip (sorted)', () => {
      const originalTerms = ['zebra', 'apple']
      const slug = toCanonicalSlug(originalTerms)
      const parsedTerms = fromSlug(slug!)
      // After roundtrip, should be sorted
      expect(parsedTerms).toEqual(['apple', 'zebra'])
    })

    it('should handle terms that get slugified', () => {
      const originalTerms = ['Node.js', 'Deno']
      const slug = toCanonicalSlug(originalTerms)
      expect(slug).toBe('deno-vs-nodejs')

      const parsedTerms = fromSlug(slug!)
      expect(parsedTerms).toEqual(['deno', 'nodejs'])
    })

    it('should handle multi-word terms', () => {
      const originalTerms = ['machine learning', 'deep learning']
      const slug = toCanonicalSlug(originalTerms)
      const parsedTerms = fromSlug(slug!)
      expect(parsedTerms).toEqual(['deep-learning', 'machine-learning'])
    })
  })

  describe('edge cases and security', () => {
    it('should handle XSS attempts safely', () => {
      const result = toCanonicalSlug(['<script>alert("xss")</script>', 'test'])
      expect(result).toBeTruthy()
      if (result) {
        // Dangerous characters should be removed/converted
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
        expect(result).not.toContain('"')
        expect(result).not.toContain("'")
        // The word 'alert' itself is not dangerous when not in a script tag
      }
    })

    it('should handle SQL injection attempts safely', () => {
      const result = toCanonicalSlug(["'; DROP TABLE users--", 'test'])
      expect(result).toBeTruthy()
      if (result) {
        expect(result).not.toContain(';')
        expect(result).not.toContain('DROP')
        expect(result).not.toContain('--')
      }
    })

    it('should handle path traversal attempts', () => {
      const result = toCanonicalSlug(['../../etc/passwd', 'test'])
      expect(result).toBeTruthy()
      if (result) {
        expect(result).not.toContain('..')
        expect(result).not.toContain('/')
      }
    })

    it('should handle very long inputs', () => {
      const longTerm = 'a'.repeat(1000)
      const result = toCanonicalSlug([longTerm, 'test'])
      expect(result).toBeTruthy()
      if (result) {
        // Should be truncated
        expect(result.length).toBeLessThan(100)
      }
    })

    it('should handle unicode and emoji', () => {
      const result = toCanonicalSlug(['test 👋', 'example'])
      expect(result).toBeTruthy()
      if (result) {
        // Emoji should be stripped or converted
        expect(result).not.toContain('👋')
      }
    })

    it('should throw error when processing null/undefined (type safety)', () => {
      // The s() function expects string, so null/undefined will cause an error
      // This is expected behavior - the function has a string type constraint
      expect(() => toCanonicalSlug([null as any, 'test'])).toThrow()
      expect(() => toCanonicalSlug(['test', undefined as any])).toThrow()
    })
  })
})
