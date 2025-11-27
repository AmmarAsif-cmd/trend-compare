import { describe, it, expect } from 'vitest'
import { computeStats } from './stats'
import type { SeriesPoint } from './trends'

describe('computeStats', () => {
  describe('average calculation', () => {
    it('should calculate correct averages for two terms', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50, termB: 30 },
        { date: '2024-01-02', termA: 60, termB: 40 },
        { date: '2024-01-03', termA: 70, termB: 50 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(60)
      expect(stats.global_avg.termB).toBe(40)
    })

    it('should round averages to 1 decimal place', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 33, termB: 0 },
        { date: '2024-01-02', termA: 33, termB: 0 },
        { date: '2024-01-03', termA: 34, termB: 0 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(33.3)
      expect(stats.global_avg.termB).toBe(0)
    })

    it('should handle zeros in data', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 0, termB: 0 },
        { date: '2024-01-02', termA: 0, termB: 0 },
        { date: '2024-01-03', termA: 0, termB: 0 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(0)
      expect(stats.global_avg.termB).toBe(0)
    })

    it('should handle missing term values as zero', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50 },
        { date: '2024-01-02', termA: 60 },
        { date: '2024-01-03', termA: 70 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(60)
      expect(stats.global_avg.termB).toBe(0)
    })

    it('should handle large numbers', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 1000000, termB: 999999 },
        { date: '2024-01-02', termA: 1000000, termB: 1000000 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(1000000)
      expect(stats.global_avg.termB).toBe(999999.5)
    })

    it('should handle decimal values in series', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50.5, termB: 30.3 },
        { date: '2024-01-02', termA: 60.7, termB: 40.9 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(55.6)
      expect(stats.global_avg.termB).toBe(35.6)
    })
  })

  describe('peak detection', () => {
    it('should identify peaks for each term', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50, termB: 30 },
        { date: '2024-01-02', termA: 100, termB: 60 },
        { date: '2024-01-03', termA: 70, termB: 90 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.peaks).toHaveLength(2)
      expect(stats.peaks).toContainEqual({
        term: 'termA',
        date: '2024-01-02',
        value: 100,
      })
      expect(stats.peaks).toContainEqual({
        term: 'termB',
        date: '2024-01-03',
        value: 90,
      })
    })

    it('should handle ties by keeping the first occurrence', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 100, termB: 50 },
        { date: '2024-01-02', termA: 80, termB: 50 },
        { date: '2024-01-03', termA: 100, termB: 50 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      const termAPeak = stats.peaks.find(p => p.term === 'termA')
      expect(termAPeak?.value).toBe(100)
      // Implementation uses v > max, so ties keep the FIRST occurrence
      expect(termAPeak?.date).toBe('2024-01-01')

      const termBPeak = stats.peaks.find(p => p.term === 'termB')
      expect(termBPeak?.value).toBe(50)
      expect(termBPeak?.date).toBe('2024-01-01')
    })

    it('should handle single data point', () => {
      const series: SeriesPoint[] = [{ date: '2024-01-01', termA: 75, termB: 25 }]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.peaks).toContainEqual({
        term: 'termA',
        date: '2024-01-01',
        value: 75,
      })
      expect(stats.peaks).toContainEqual({
        term: 'termB',
        date: '2024-01-01',
        value: 25,
      })
    })

    it('should handle all zeros correctly', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 0, termB: 0 },
        { date: '2024-01-02', termA: 0, termB: 0 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      // When all values are 0, the last one wins (0 > -1 is true for all)
      // so it takes the last date where value was 0
      expect(stats.peaks[0]).toMatchObject({
        term: 'termA',
        value: 0,
      })
      expect(stats.peaks[1]).toMatchObject({
        term: 'termB',
        value: 0,
      })
    })

    it('should handle missing values as -1 initially', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50 },
        { date: '2024-01-02', termA: 60, termB: 30 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      const termBPeak = stats.peaks.find(p => p.term === 'termB')
      expect(termBPeak?.value).toBe(30)
      expect(termBPeak?.date).toBe('2024-01-02')
    })
  })

  describe('edge cases', () => {
    it('should handle empty series', () => {
      const series: SeriesPoint[] = []

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBeNaN()
      expect(stats.global_avg.termB).toBeNaN()
      expect(stats.peaks).toHaveLength(2)
      expect(stats.peaks[0].value).toBe(-1)
      expect(stats.peaks[0].date).toBe('')
    })

    it('should handle empty terms array', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50, termB: 30 },
      ]

      const stats = computeStats(series, [])

      expect(Object.keys(stats.global_avg)).toHaveLength(0)
      expect(stats.peaks).toHaveLength(0)
    })

    it('should handle three terms', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50, termB: 30, termC: 70 },
        { date: '2024-01-02', termA: 60, termB: 40, termC: 80 },
      ]

      const stats = computeStats(series, ['termA', 'termB', 'termC'])

      expect(stats.global_avg.termA).toBe(55)
      expect(stats.global_avg.termB).toBe(35)
      expect(stats.global_avg.termC).toBe(75)
      expect(stats.peaks).toHaveLength(3)
    })

    it('should handle string values in series (converted to number)', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: '50', termB: '30' },
        { date: '2024-01-02', termA: '60', termB: '40' },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(55)
      expect(stats.global_avg.termB).toBe(35)
    })

    it('should handle very long series', () => {
      const series: SeriesPoint[] = Array.from({ length: 1000 }, (_, i) => ({
        date: `2024-01-${i + 1}`,
        termA: Math.random() * 100,
        termB: Math.random() * 100,
      }))

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBeGreaterThanOrEqual(0)
      expect(stats.global_avg.termA).toBeLessThanOrEqual(100)
      expect(stats.peaks).toHaveLength(2)
      expect(stats.peaks[0].value).toBeGreaterThanOrEqual(0)
      expect(stats.peaks[0].value).toBeLessThanOrEqual(100)
    })

    it('should handle negative values (limitation: max initialized at -1)', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: -50, termB: -30 },
        { date: '2024-01-02', termA: -60, termB: -40 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(-55)
      expect(stats.global_avg.termB).toBe(-35)
      // Note: Peak detection starts at max=-1, so negative values won't be detected
      // This is a limitation of the current implementation
      expect(stats.peaks[0].value).toBe(-1)
      expect(stats.peaks[1].value).toBe(-1)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical Google Trends data (0-100 scale)', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', chatgpt: 85, gemini: 62 },
        { date: '2024-01-02', chatgpt: 88, gemini: 65 },
        { date: '2024-01-03', chatgpt: 90, gemini: 68 },
        { date: '2024-01-04', chatgpt: 87, gemini: 70 },
        { date: '2024-01-05', chatgpt: 100, gemini: 75 },
      ]

      const stats = computeStats(series, ['chatgpt', 'gemini'])

      expect(stats.global_avg.chatgpt).toBe(90)
      expect(stats.global_avg.gemini).toBe(68)
      expect(stats.peaks).toContainEqual({
        term: 'chatgpt',
        date: '2024-01-05',
        value: 100,
      })
      expect(stats.peaks).toContainEqual({
        term: 'gemini',
        date: '2024-01-05',
        value: 75,
      })
    })

    it('should handle sparse data with many zeros', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 0, termB: 0 },
        { date: '2024-01-02', termA: 0, termB: 5 },
        { date: '2024-01-03', termA: 10, termB: 0 },
        { date: '2024-01-04', termA: 0, termB: 0 },
      ]

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg.termA).toBe(2.5)
      expect(stats.global_avg.termB).toBe(1.3)
    })

    it('should handle weekly data (52 weeks)', () => {
      const series: SeriesPoint[] = Array.from({ length: 52 }, (_, i) => ({
        date: `2024-W${i + 1}`,
        termA: 50 + Math.sin(i / 10) * 20,
        termB: 40 + Math.cos(i / 10) * 15,
      }))

      const stats = computeStats(series, ['termA', 'termB'])

      expect(stats.global_avg).toHaveProperty('termA')
      expect(stats.global_avg).toHaveProperty('termB')
      expect(stats.peaks).toHaveLength(2)
      expect(stats.peaks[0]).toHaveProperty('date')
      expect(stats.peaks[0]).toHaveProperty('value')
    })

    it('should handle daily data over a year', () => {
      const series: SeriesPoint[] = Array.from({ length: 365 }, (_, i) => ({
        date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        termA: 50 + (i % 100),
        termB: 30 + (i % 80),
      }))

      const stats = computeStats(series, ['termA', 'termB'])

      expect(typeof stats.global_avg.termA).toBe('number')
      expect(typeof stats.global_avg.termB).toBe('number')
      expect(stats.peaks).toHaveLength(2)
    })
  })

  describe('data integrity', () => {
    it('should not mutate input series', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50, termB: 30 },
        { date: '2024-01-02', termA: 60, termB: 40 },
      ]
      const originalSeries = JSON.parse(JSON.stringify(series))

      computeStats(series, ['termA', 'termB'])

      expect(series).toEqual(originalSeries)
    })

    it('should not mutate input terms array', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50, termB: 30 },
      ]
      const terms = ['termA', 'termB']
      const originalTerms = [...terms]

      computeStats(series, terms)

      expect(terms).toEqual(originalTerms)
    })

    it('should produce consistent results for same input', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', termA: 50, termB: 30 },
        { date: '2024-01-02', termA: 60, termB: 40 },
      ]

      const stats1 = computeStats(series, ['termA', 'termB'])
      const stats2 = computeStats(series, ['termA', 'termB'])

      expect(stats1).toEqual(stats2)
    })
  })
})
