import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { prisma } from '@/lib/db'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

describe('GET /api/health/db', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('healthy database', () => {
    it('should return ok:true when database is healthy', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      const response = await GET()
      const data = await response.json()

      expect(data).toEqual({ ok: true })
      expect(response.status).toBe(200)
    })

    it('should execute SELECT 1 query', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      await GET()

      expect(prisma.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining(['SELECT 1'])
      )
    })

    it('should return JSON response', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      const response = await GET()

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('unhealthy database', () => {
    it('should return ok:false when database query fails', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error('Connection refused')
      )

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(data).toHaveProperty('error')
    })

    it('should include error message in response', async () => {
      const errorMessage = 'Database connection timeout'
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error(errorMessage))

      const response = await GET()
      const data = await response.json()

      expect(data.error).toBe(errorMessage)
    })

    it('should return 500 status code on error', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB Error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })

    it('should handle error objects without message property', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue('string error')

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(typeof data.error).toBe('string')
    })

    it('should handle null/undefined errors', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('error handling edge cases', () => {
    it('should handle connection timeout', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error('Connection timeout')
      )

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(data.error).toContain('timeout')
    })

    it('should handle authentication errors', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error('Authentication failed')
      )

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(data.error).toContain('Authentication')
    })

    it('should handle database not found errors', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error('Database does not exist')
      )

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(data.error).toContain('Database')
    })

    it('should handle network errors', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error('ECONNREFUSED')
      )

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(data.error).toContain('ECONNREFUSED')
    })
  })

  describe('response consistency', () => {
    it('should always return an object with ok property', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('ok')
      expect(typeof data.ok).toBe('boolean')
    })

    it('should only include error property on failure', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      const response = await GET()
      const data = await response.json()

      expect(data).not.toHaveProperty('error')
    })

    it('should always include error property on failure', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Test error'))

      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })
  })

  describe('monitoring and observability', () => {
    it('should be suitable for health check polling', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      // Simulate multiple health checks
      const responses = await Promise.all([GET(), GET(), GET()])

      responses.forEach(async response => {
        const data = await response.json()
        expect(data.ok).toBe(true)
      })
    })

    it('should respond quickly to health checks', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      const start = Date.now()
      await GET()
      const duration = Date.now() - start

      // Should respond in under 100ms (in mock environment)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('real-world scenarios', () => {
    it('should detect when database is down', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error('Cannot reach database server')
      )

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it('should detect when database is overloaded', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error('Too many connections')
      )

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(false)
      expect(data.error).toContain('connections')
    })

    it('should work when database is healthy', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      const response = await GET()
      const data = await response.json()

      expect(data.ok).toBe(true)
      expect(response.status).toBe(200)
    })
  })
})
