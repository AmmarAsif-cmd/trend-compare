import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTopThisWeek } from './topThisWeek'
import { prisma } from './db'

// Mock Prisma
vi.mock('./db', () => ({
  prisma: {
    comparison: {
      findMany: vi.fn(),
    },
  },
}))

describe('getTopThisWeek', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('should return top trending comparisons', async () => {
      const mockComparisons = [
        {
          slug: 'chatgpt-vs-gemini',
          terms: ['chatgpt', 'gemini'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'chatgpt-vs-gemini',
          terms: ['chatgpt', 'gemini'],
          timeframe: '7d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'iphone-vs-android',
          terms: ['iphone', 'android'],
          timeframe: '30d',
          geo: 'GB',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toHaveLength(2) // Two unique slugs
      expect(result[0].slug).toBe('chatgpt-vs-gemini')
      expect(result[0].count).toBe(2)
      expect(result[1].slug).toBe('android-vs-iphone')
      expect(result[1].count).toBe(1)
    })

    it('should query comparisons from past 7 days', async () => {
      vi.mocked(prisma.comparison.findMany).mockResolvedValue([])

      await getTopThisWeek(8)

      expect(prisma.comparison.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: expect.any(Date),
            },
          },
        })
      )

      // Check that the date is approximately 7 days ago
      const call = vi.mocked(prisma.comparison.findMany).mock.calls[0][0]
      const sinceDate = call.where.createdAt.gte
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      expect(sinceDate.getTime()).toBeGreaterThan(sevenDaysAgo - 1000)
      expect(sinceDate.getTime()).toBeLessThan(sevenDaysAgo + 1000)
    })

    it('should limit database query to 2000 rows', async () => {
      vi.mocked(prisma.comparison.findMany).mockResolvedValue([])

      await getTopThisWeek(8)

      expect(prisma.comparison.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2000,
        })
      )
    })

    it('should order by createdAt descending', async () => {
      vi.mocked(prisma.comparison.findMany).mockResolvedValue([])

      await getTopThisWeek(8)

      expect(prisma.comparison.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })
  })

  describe('aggregation and counting', () => {
    it('should aggregate duplicate slugs and count occurrences', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: ['test', 'example'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'test-vs-example',
          terms: ['test', 'example'],
          timeframe: '7d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'test-vs-example',
          terms: ['test', 'example'],
          timeframe: '30d',
          geo: 'GB',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toHaveLength(1)
      expect(result[0].count).toBe(3)
    })

    it('should canonicalize slugs before aggregating', async () => {
      const mockComparisons = [
        {
          slug: 'aa-vs-bb',
          terms: ['aa', 'bb'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'bb-vs-aa',
          terms: ['bb', 'aa'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      // Both should be counted as the same canonical slug
      expect(result).toHaveLength(1)
      expect(result[0].count).toBe(2)
    })
  })

  describe('sorting', () => {
    it('should sort by count descending', async () => {
      const mockComparisons = [
        {
          slug: 'aa-vs-bb',
          terms: ['aa', 'bb'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'cc-vs-dd',
          terms: ['cc', 'dd'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'cc-vs-dd',
          terms: ['cc', 'dd'],
          timeframe: '7d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'cc-vs-dd',
          terms: ['cc', 'dd'],
          timeframe: '30d',
          geo: 'GB',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result[0].slug).toBe('cc-vs-dd')
      expect(result[0].count).toBe(3)
      expect(result[1].slug).toBe('aa-vs-bb')
      expect(result[1].count).toBe(1)
    })

    it('should sort alphabetically when counts are equal', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-zebra',
          terms: ['test', 'zebra'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'apple-vs-test',
          terms: ['apple', 'test'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      // Both have count=1, should be sorted alphabetically by title
      // Canonical slug for first is 'test-vs-zebra', title is 'test vs zebra'
      // Canonical slug for second is 'apple-vs-test', title is 'apple vs test'
      expect(result[0].title).toBe('apple vs test')
      expect(result[1].title).toBe('test vs zebra')
    })
  })

  describe('limiting results', () => {
    it('should limit results to specified limit', async () => {
      const mockComparisons = Array.from({ length: 20 }, (_, i) => ({
        slug: `term${i}-vs-test`,
        terms: [`term${i}`, 'test'],
        timeframe: '30d',
        geo: 'US',
        createdAt: new Date(),
      }))

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(5)

      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should use default limit of 8 when not specified', async () => {
      const mockComparisons = Array.from({ length: 20 }, (_, i) => ({
        slug: `term${i}-vs-test`,
        terms: [`term${i}`, 'test'],
        timeframe: '30d',
        geo: 'US',
        createdAt: new Date(),
      }))

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek()

      expect(result.length).toBeLessThanOrEqual(8)
    })

    it('should return at least 1 item when limit is 0', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: ['test', 'example'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(0)

      expect(result).toHaveLength(1)
    })
  })

  describe('term validation', () => {
    it('should filter out invalid terms', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: ['x', 'example'], // 'x' is too short
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
        {
          slug: 'valid-vs-test',
          terms: ['valid', 'test'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      // First comparison should be filtered out
      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('test-vs-valid')
    })

    it('should filter out terms with length > 60', async () => {
      const longTerm = 'a'.repeat(61)
      const mockComparisons = [
        {
          slug: 'test-vs-long',
          terms: ['test', longTerm],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toHaveLength(0)
    })

    it('should filter out non-string terms', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-123',
          terms: ['test', 123],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toHaveLength(0)
    })

    it('should require at least 2 valid terms', async () => {
      const mockComparisons = [
        {
          slug: 'single',
          terms: ['single'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toHaveLength(0)
    })
  })

  describe('title generation', () => {
    it('should generate human-readable titles', async () => {
      const mockComparisons = [
        {
          slug: 'chatgpt-vs-gemini',
          terms: ['chatgpt', 'gemini'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result[0].title).toBe('chatgpt vs gemini')
    })

    it('should convert hyphens to spaces in titles', async () => {
      const mockComparisons = [
        {
          slug: 'machine-learning-vs-deep-learning',
          terms: ['machine-learning', 'deep-learning'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result[0].title).toBe('machine learning vs deep learning')
    })
  })

  describe('timeframe and geo tracking', () => {
    it('should include timeframe and geo from first non-empty value (DESC order)', async () => {
      // Rows are returned in DESC order by createdAt from Prisma
      // The ||= operator keeps the first non-empty value encountered
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: ['test', 'example'],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(), // Most recent (first in DESC order)
        },
        {
          slug: 'test-vs-example',
          terms: ['test', 'example'],
          timeframe: '7d',
          geo: 'GB',
          createdAt: new Date(Date.now() - 1000), // Older
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      // Should use values from first occurrence in the array
      expect(result[0].tf).toBe('30d')
      expect(result[0].geo).toBe('US')
    })

    it('should handle missing timeframe/geo', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: ['test', 'example'],
          timeframe: '',
          geo: '',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result[0].tf).toBeUndefined()
      expect(result[0].geo).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should return empty array when no comparisons found', async () => {
      vi.mocked(prisma.comparison.findMany).mockResolvedValue([])

      const result = await getTopThisWeek(8)

      expect(result).toEqual([])
    })

    it('should handle null terms field', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: null,
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toEqual([])
    })

    it('should handle empty terms array', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: [],
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toEqual([])
    })

    it('should handle malformed terms data', async () => {
      const mockComparisons = [
        {
          slug: 'test-vs-example',
          terms: { invalid: 'format' },
          timeframe: '30d',
          geo: 'US',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.comparison.findMany).mockResolvedValue(mockComparisons)

      const result = await getTopThisWeek(8)

      expect(result).toEqual([])
    })
  })
})
