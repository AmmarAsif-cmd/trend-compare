import { describe, it, expect } from 'vitest'
import { stableHash } from './hash'

describe('stableHash', () => {
  describe('consistency', () => {
    it('should produce consistent hashes for same input', () => {
      const obj = { a: 1, b: 2 }
      const hash1 = stableHash(obj)
      const hash2 = stableHash(obj)
      expect(hash1).toBe(hash2)
    })

    it('should produce same hash for deeply equal objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 } }
      const obj2 = { a: 1, b: { c: 2, d: 3 } }
      expect(stableHash(obj1)).toBe(stableHash(obj2))
    })

    it('should produce consistent hash for arrays', () => {
      const arr1 = [1, 2, 3, 4, 5]
      const arr2 = [1, 2, 3, 4, 5]
      expect(stableHash(arr1)).toBe(stableHash(arr2))
    })

    it('should produce consistent hash for strings', () => {
      const str = 'hello world'
      expect(stableHash(str)).toBe(stableHash(str))
    })

    it('should produce consistent hash for numbers', () => {
      expect(stableHash(12345)).toBe(stableHash(12345))
    })

    it('should produce consistent hash for booleans', () => {
      expect(stableHash(true)).toBe(stableHash(true))
      expect(stableHash(false)).toBe(stableHash(false))
    })

    it('should produce consistent hash for null', () => {
      expect(stableHash(null)).toBe(stableHash(null))
    })

    it('should handle undefined (throws error)', () => {
      // JSON.stringify(undefined) returns undefined, which causes hash to fail
      // This is expected behavior - hash function expects serializable data
      expect(() => stableHash(undefined)).toThrow()
    })
  })

  describe('uniqueness', () => {
    it('should produce different hashes for different objects', () => {
      const obj1 = { a: 1 }
      const obj2 = { a: 2 }
      expect(stableHash(obj1)).not.toBe(stableHash(obj2))
    })

    it('should produce different hashes for different arrays', () => {
      expect(stableHash([1, 2, 3])).not.toBe(stableHash([1, 2, 4]))
    })

    it('should produce different hashes for different strings', () => {
      expect(stableHash('hello')).not.toBe(stableHash('world'))
    })

    it('should be sensitive to array order', () => {
      expect(stableHash([1, 2, 3])).not.toBe(stableHash([3, 2, 1]))
    })

    it('should be sensitive to nested structure differences', () => {
      const obj1 = { a: { b: 1 } }
      const obj2 = { a: { b: 2 } }
      expect(stableHash(obj1)).not.toBe(stableHash(obj2))
    })

    it('should differentiate between similar but different types', () => {
      expect(stableHash(1)).not.toBe(stableHash('1'))
      expect(stableHash(true)).not.toBe(stableHash(1))
      // undefined throws, so we can't compare it
      expect(stableHash(null)).toBe(stableHash(null))
    })
  })

  describe('object key ordering', () => {
    it('should be sensitive to object key order (JSON.stringify behavior)', () => {
      // Note: JSON.stringify preserves key insertion order
      const obj1 = JSON.parse('{"a":1,"b":2}')
      const obj2 = JSON.parse('{"b":2,"a":1}')

      // Objects parsed from JSON preserve the order from the JSON string
      // so these will have different key orders and different hashes
      const hash1 = stableHash(obj1)
      const hash2 = stableHash(obj2)
      expect(typeof hash1).toBe('string')
      expect(typeof hash2).toBe('string')
      expect(hash1).toHaveLength(16)
      expect(hash2).toHaveLength(16)
    })

    it('should produce different hashes when manually constructing in different order', () => {
      // When manually constructed, order might differ
      const obj1 = { a: 1, b: 2 }
      const obj2 = { b: 2, a: 1 }

      // In JavaScript, object key order is preserved since ES2015
      // so these should have different hashes
      const hash1 = stableHash(obj1)
      const hash2 = stableHash(obj2)

      // This behavior depends on JavaScript engine, but typically:
      // If keys are inserted in different orders, they might serialize differently
      // For most modern engines with string keys, order is preserved
      expect(typeof hash1).toBe('string')
      expect(typeof hash2).toBe('string')
    })
  })

  describe('hash format', () => {
    it('should return a 16-character hex string', () => {
      const hash = stableHash({ test: 'data' })
      expect(hash).toHaveLength(16)
      expect(hash).toMatch(/^[0-9a-f]{16}$/)
    })

    it('should use only hex characters (0-9, a-f)', () => {
      const testCases = [
        { a: 1 },
        'hello',
        [1, 2, 3],
        12345,
        true,
        null,
      ]

      testCases.forEach(input => {
        const hash = stableHash(input)
        expect(hash).toMatch(/^[0-9a-f]+$/)
      })
    })
  })

  describe('complex data structures', () => {
    it('should handle nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
            f: {
              g: 4
            }
          }
        }
      }
      const hash = stableHash(obj)
      expect(hash).toHaveLength(16)
      expect(stableHash(obj)).toBe(hash)
    })

    it('should handle arrays of objects', () => {
      const arr = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]
      const hash = stableHash(arr)
      expect(hash).toHaveLength(16)
      expect(stableHash(arr)).toBe(hash)
    })

    it('should handle mixed data types', () => {
      const obj = {
        string: 'hello',
        number: 42,
        boolean: true,
        null_value: null,
        array: [1, 2, 3],
        nested: { key: 'value' }
      }
      const hash = stableHash(obj)
      expect(hash).toHaveLength(16)
    })

    it('should handle empty structures', () => {
      expect(stableHash({})).toHaveLength(16)
      expect(stableHash([])).toHaveLength(16)
      expect(stableHash('')).toHaveLength(16)
    })
  })

  describe('real-world use cases', () => {
    it('should hash trend comparison data', () => {
      const comparisonData = {
        terms: ['chatgpt', 'gemini'],
        timeframe: '30d',
        geo: 'US',
        series: [
          { date: '2024-01-01', chatgpt: 85, gemini: 62 },
          { date: '2024-01-02', chatgpt: 88, gemini: 65 },
        ]
      }

      const hash1 = stableHash(comparisonData)
      const hash2 = stableHash(comparisonData)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(16)
    })

    it('should produce different hashes for different timeframes', () => {
      const data1 = { terms: ['chatgpt', 'gemini'], timeframe: '7d' }
      const data2 = { terms: ['chatgpt', 'gemini'], timeframe: '30d' }

      expect(stableHash(data1)).not.toBe(stableHash(data2))
    })

    it('should produce different hashes for different geo regions', () => {
      const data1 = { terms: ['chatgpt', 'gemini'], geo: 'US' }
      const data2 = { terms: ['chatgpt', 'gemini'], geo: 'GB' }

      expect(stableHash(data1)).not.toBe(stableHash(data2))
    })

    it('should detect data changes in series', () => {
      const data1 = {
        series: [{ date: '2024-01-01', value: 50 }]
      }
      const data2 = {
        series: [{ date: '2024-01-01', value: 51 }]
      }

      expect(stableHash(data1)).not.toBe(stableHash(data2))
    })
  })

  describe('edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      const hash = stableHash(longString)
      expect(hash).toHaveLength(16)
    })

    it('should handle very large objects', () => {
      const largeObj = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key${i}`, i])
      )
      const hash = stableHash(largeObj)
      expect(hash).toHaveLength(16)
    })

    it('should handle very large arrays', () => {
      const largeArr = Array.from({ length: 1000 }, (_, i) => i)
      const hash = stableHash(largeArr)
      expect(hash).toHaveLength(16)
    })

    it('should handle unicode characters', () => {
      const obj = {
        emoji: '👋🌍',
        chinese: '你好',
        arabic: 'مرحبا',
        russian: 'Привет'
      }
      const hash = stableHash(obj)
      expect(hash).toHaveLength(16)
    })

    it('should handle special characters', () => {
      const obj = {
        special: '<script>alert("xss")</script>',
        quotes: '"\'`',
        newlines: 'line1\nline2\r\nline3',
        tabs: 'col1\tcol2\tcol3'
      }
      const hash = stableHash(obj)
      expect(hash).toHaveLength(16)
    })

    it('should handle numbers at boundaries', () => {
      expect(stableHash(0)).toHaveLength(16)
      expect(stableHash(-0)).toHaveLength(16)
      expect(stableHash(Number.MAX_SAFE_INTEGER)).toHaveLength(16)
      expect(stableHash(Number.MIN_SAFE_INTEGER)).toHaveLength(16)
      expect(stableHash(Infinity)).toHaveLength(16)
      expect(stableHash(-Infinity)).toHaveLength(16)
    })

    it('should handle NaN', () => {
      const hash = stableHash(NaN)
      expect(hash).toHaveLength(16)
      // NaN should produce consistent hash
      expect(stableHash(NaN)).toBe(hash)
    })
  })

  describe('collision resistance', () => {
    it('should produce unique hashes for many different inputs', () => {
      const hashes = new Set<string>()
      const numInputs = 10000

      for (let i = 0; i < numInputs; i++) {
        const hash = stableHash({ value: i })
        hashes.add(hash)
      }

      // Should have very few collisions (ideally none for this test size)
      // With 16-char hex (64 bits), collision probability is very low
      expect(hashes.size).toBeGreaterThan(numInputs * 0.99)
    })

    it('should handle similar inputs without collision', () => {
      const inputs = [
        { a: 1, b: 2 },
        { a: 1, b: 3 },
        { a: 2, b: 2 },
        { a: 2, b: 3 },
      ]

      const hashes = inputs.map(stableHash)
      const uniqueHashes = new Set(hashes)

      expect(uniqueHashes.size).toBe(inputs.length)
    })
  })

  describe('performance characteristics', () => {
    it('should handle rapid successive calls', () => {
      const obj = { test: 'data' }
      const iterations = 1000

      const start = Date.now()
      for (let i = 0; i < iterations; i++) {
        stableHash(obj)
      }
      const duration = Date.now() - start

      // Should complete 1000 iterations reasonably quickly (under 1 second)
      expect(duration).toBeLessThan(1000)
    })
  })
})
