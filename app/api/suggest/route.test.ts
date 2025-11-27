import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'

describe('GET /api/suggest', () => {
  let fetchSpy: any

  beforeEach(() => {
    // Mock global fetch
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful responses', () => {
    it('should return suggestions for valid query', async () => {
      const mockResponse = ['chatgpt', ['chatgpt', 'chatgpt 4', 'chatgpt login']]
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const req = new Request('http://localhost/api/suggest?q=chatgpt')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual(['chatgpt', 'chatgpt 4', 'chatgpt login'])
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('suggestqueries.google.com'),
        expect.any(Object)
      )
    })

    it('should limit suggestions to 8 items', async () => {
      const mockResponse = [
        'test',
        Array.from({ length: 20 }, (_, i) => `suggestion ${i}`),
      ]
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toHaveLength(8)
    })

    it('should set proper cache headers', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1', 'test2']],
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=60')
      expect(response.headers.get('Cache-Control')).toContain(
        'stale-while-revalidate=300'
      )
    })
  })

  describe('query parameter handling', () => {
    it('should return empty array for queries shorter than 2 chars', async () => {
      const req = new Request('http://localhost/api/suggest?q=a')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should return empty array for empty query', async () => {
      const req = new Request('http://localhost/api/suggest?q=')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should return empty array when no query param', async () => {
      const req = new Request('http://localhost/api/suggest')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should trim whitespace from query', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const req = new Request('http://localhost/api/suggest?q=%20%20test%20%20')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual(['test1'])
    })

    it('should clamp query to 64 characters', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const longQuery = 'a'.repeat(100)
      const req = new Request(`http://localhost/api/suggest?q=${longQuery}`)
      await GET(req)

      const calledUrl = fetchSpy.mock.calls[0][0]
      expect(calledUrl).toContain(encodeURIComponent('a'.repeat(64)))
      expect(calledUrl).not.toContain(encodeURIComponent('a'.repeat(65)))
    })

    it('should URL encode query parameter', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const req = new Request('http://localhost/api/suggest?q=hello%20world')
      await GET(req)

      const calledUrl = fetchSpy.mock.calls[0][0]
      expect(calledUrl).toContain('hello%20world')
    })
  })

  describe('error handling', () => {
    it('should return empty array on fetch failure', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'))

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
    })

    it('should return empty array on non-ok response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
    })

    it('should return empty array on invalid JSON response', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => null,
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
    })

    it('should return empty array when response is not an array', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
    })

    it('should handle timeout (abort signal)', async () => {
      // Mock a slow fetch that takes longer than 3 seconds
      fetchSpy.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Aborted')), 100)
          })
      )

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)
      const data = await response.json()

      expect(data.suggestions).toEqual([])
    })
  })

  describe('response format', () => {
    it('should always return object with suggestions array', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)
      const data = await response.json()

      expect(data).toHaveProperty('suggestions')
      expect(Array.isArray(data.suggestions)).toBe(true)
    })

    it('should return JSON response', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      const response = await GET(req)

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('Google API integration', () => {
    it('should call correct Google endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      await GET(req)

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://suggestqueries.google.com/complete/search?client=firefox&q=test',
        expect.any(Object)
      )
    })

    it('should pass abort signal to fetch', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      await GET(req)

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })

    it('should use revalidate option for caching', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ['test', ['test1']],
      })

      const req = new Request('http://localhost/api/suggest?q=test')
      await GET(req)

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 60 },
        })
      )
    })
  })
})
