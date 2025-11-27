import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import * as topThisWeekModule from '@/lib/topThisWeek'

// Mock the topThisWeek module
vi.mock('@/lib/topThisWeek', () => ({
  getTopThisWeek: vi.fn(),
}))

describe('GET /api/top-week', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful responses', () => {
    it('should return top trending comparisons', async () => {
      const mockData = [
        {
          slug: 'chatgpt-vs-gemini',
          title: 'chatgpt vs gemini',
          count: 5,
          tf: '30d',
          geo: 'US',
        },
        {
          slug: 'iphone-vs-android',
          title: 'iphone vs android',
          count: 3,
          tf: '7d',
        },
      ]

      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue(mockData)

      const response = await GET()
      const data = await response.json()

      expect(data.items).toEqual(mockData)
      expect(topThisWeekModule.getTopThisWeek).toHaveBeenCalledWith(8)
    })

    it('should limit results to 8 items', async () => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        slug: `term${i}-vs-test`,
        title: `term${i} vs test`,
        count: 20 - i,
      }))

      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue(
        mockData.slice(0, 8)
      )

      const response = await GET()
      const data = await response.json()

      expect(data.items).toHaveLength(8)
    })

    it('should set proper cache headers (10 minutes)', async () => {
      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue([])

      const response = await GET()

      expect(response.headers.get('Cache-Control')).toBe('s-maxage=600')
    })

    it('should return empty array when no trending data', async () => {
      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(data.items).toEqual([])
    })
  })

  describe('response format', () => {
    it('should return object with items array', async () => {
      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('items')
      expect(Array.isArray(data.items)).toBe(true)
    })

    it('should return JSON response', async () => {
      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue([])

      const response = await GET()

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should include all TopItem fields', async () => {
      const mockData = [
        {
          slug: 'test-vs-example',
          title: 'test vs example',
          count: 10,
          tf: '30d',
          geo: 'US',
        },
      ]

      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue(mockData)

      const response = await GET()
      const data = await response.json()

      expect(data.items[0]).toMatchObject({
        slug: 'test-vs-example',
        title: 'test vs example',
        count: 10,
        tf: '30d',
        geo: 'US',
      })
    })

    it('should handle items without optional fields', async () => {
      const mockData = [
        {
          slug: 'test-vs-example',
          title: 'test vs example',
          count: 5,
        },
      ]

      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue(mockData)

      const response = await GET()
      const data = await response.json()

      expect(data.items[0].slug).toBe('test-vs-example')
      expect(data.items[0].title).toBe('test vs example')
      expect(data.items[0].count).toBe(5)
    })
  })

  describe('sorting and ranking', () => {
    it('should return items sorted by count (descending)', async () => {
      const mockData = [
        { slug: 'a-vs-b', title: 'a vs b', count: 10 },
        { slug: 'c-vs-d', title: 'c vs d', count: 7 },
        { slug: 'e-vs-f', title: 'e vs f', count: 3 },
      ]

      vi.mocked(topThisWeekModule.getTopThisWeek).mockResolvedValue(mockData)

      const response = await GET()
      const data = await response.json()

      expect(data.items[0].count).toBeGreaterThanOrEqual(data.items[1].count)
      expect(data.items[1].count).toBeGreaterThanOrEqual(data.items[2].count)
    })
  })
})
