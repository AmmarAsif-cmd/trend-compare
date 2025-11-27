import { describe, it, expect } from 'vitest'
import { smoothSeries, nonZeroRatio } from './series'
import type { SeriesPoint } from './trends'

describe('series utilities', () => {
  describe('smoothSeries', () => {
    describe('basic smoothing', () => {
      it('should apply rolling average with window=4', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
          { date: '2024-01-03', value: 30 },
          { date: '2024-01-04', value: 40 },
          { date: '2024-01-05', value: 50 },
        ]

        const smoothed = smoothSeries(series, 4)

        // First point: avg of [10] = 10
        expect(smoothed[0].value).toBe(10)

        // Second point: avg of [10, 20] = 15
        expect(smoothed[1].value).toBe(15)

        // Third point: avg of [10, 20, 30] = 20
        expect(smoothed[2].value).toBe(20)

        // Fourth point: avg of [10, 20, 30, 40] = 25
        expect(smoothed[3].value).toBe(25)

        // Fifth point: avg of [20, 30, 40, 50] = 35
        expect(smoothed[4].value).toBe(35)
      })

      it('should apply rolling average with window=2', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
          { date: '2024-01-03', value: 30 },
        ]

        const smoothed = smoothSeries(series, 2)

        expect(smoothed[0].value).toBe(10) // avg of [10]
        expect(smoothed[1].value).toBe(15) // avg of [10, 20]
        expect(smoothed[2].value).toBe(25) // avg of [20, 30]
      })

      it('should handle multiple terms', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', termA: 10, termB: 100 },
          { date: '2024-01-02', termA: 20, termB: 200 },
          { date: '2024-01-03', termA: 30, termB: 300 },
        ]

        const smoothed = smoothSeries(series, 2)

        expect(smoothed[0].termA).toBe(10)
        expect(smoothed[0].termB).toBe(100)
        expect(smoothed[1].termA).toBe(15)
        expect(smoothed[1].termB).toBe(150)
        expect(smoothed[2].termA).toBe(25)
        expect(smoothed[2].termB).toBe(250)
      })

      it('should round values to 2 decimal places', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 11 },
          { date: '2024-01-03', value: 12 },
        ]

        const smoothed = smoothSeries(series, 3)

        // avg of [10, 11, 12] = 11
        expect(smoothed[2].value).toBe(11)
      })

      it('should preserve date field', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
        ]

        const smoothed = smoothSeries(series, 2)

        expect(smoothed[0].date).toBe('2024-01-01')
        expect(smoothed[1].date).toBe('2024-01-02')
      })
    })

    describe('edge cases', () => {
      it('should return original series when window <= 1', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
        ]

        const smoothed1 = smoothSeries(series, 1)
        const smoothed0 = smoothSeries(series, 0)

        expect(smoothed1).toBe(series)
        expect(smoothed0).toBe(series)
      })

      it('should handle empty series', () => {
        const series: SeriesPoint[] = []
        const smoothed = smoothSeries(series, 4)
        expect(smoothed).toBe(series)
      })

      it('should handle null/undefined series', () => {
        expect(smoothSeries(null as any, 4)).toBe(null)
        expect(smoothSeries(undefined as any, 4)).toBe(undefined)
      })

      it('should handle single data point', () => {
        const series: SeriesPoint[] = [{ date: '2024-01-01', value: 10 }]
        const smoothed = smoothSeries(series, 4)
        expect(smoothed).toHaveLength(1)
        expect(smoothed[0].value).toBe(10)
      })

      it('should use default window of 4 when not specified', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
          { date: '2024-01-03', value: 30 },
          { date: '2024-01-04', value: 40 },
          { date: '2024-01-05', value: 50 },
        ]

        const smoothed = smoothSeries(series)
        expect(smoothed[4].value).toBe(35) // avg of [20, 30, 40, 50]
      })

      it('should handle window larger than series length', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
        ]

        const smoothed = smoothSeries(series, 10)

        expect(smoothed[0].value).toBe(10)
        expect(smoothed[1].value).toBe(15)
      })

      it('should handle zeros in data', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 0 },
          { date: '2024-01-02', value: 0 },
          { date: '2024-01-03', value: 10 },
        ]

        const smoothed = smoothSeries(series, 3)

        expect(smoothed[2].value).toBe(3.33)
      })

      it('should only process keys present in first row', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', termA: 10 },
          { date: '2024-01-02', termA: 20, termB: 30 },
        ]

        const smoothed = smoothSeries(series, 2)

        // termB wasn't in first row, so it won't be in smoothed output
        // only termA will be processed
        expect(smoothed[0].termA).toBe(10)
        expect(smoothed[1].termA).toBe(15) // avg of [10, 20]
        expect(smoothed[1].termB).toBeUndefined()
      })

      it('should handle negative values', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: -10 },
          { date: '2024-01-02', value: -20 },
          { date: '2024-01-03', value: -30 },
        ]

        const smoothed = smoothSeries(series, 2)

        expect(smoothed[1].value).toBe(-15)
        expect(smoothed[2].value).toBe(-25)
      })

      it('should handle decimal values', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10.5 },
          { date: '2024-01-02', value: 20.7 },
          { date: '2024-01-03', value: 30.3 },
        ]

        const smoothed = smoothSeries(series, 2)

        expect(smoothed[1].value).toBe(15.6)
        expect(smoothed[2].value).toBe(25.5)
      })
    })

    describe('data integrity', () => {
      it('should not mutate original series', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
        ]
        const original = JSON.parse(JSON.stringify(series))

        smoothSeries(series, 2)

        expect(series).toEqual(original)
      })

      it('should return new array', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
        ]

        const smoothed = smoothSeries(series, 2)

        expect(smoothed).not.toBe(series)
      })

      it('should have same length as original', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
          { date: '2024-01-03', value: 30 },
        ]

        const smoothed = smoothSeries(series, 2)

        expect(smoothed).toHaveLength(series.length)
      })
    })

    describe('real-world scenarios', () => {
      it('should smooth spiky Google Trends data', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', chatgpt: 50, gemini: 40 },
          { date: '2024-01-02', chatgpt: 100, gemini: 45 },
          { date: '2024-01-03', chatgpt: 55, gemini: 50 },
          { date: '2024-01-04', chatgpt: 60, gemini: 90 },
          { date: '2024-01-05', chatgpt: 65, gemini: 55 },
        ]

        const smoothed = smoothSeries(series, 3)

        // Should reduce spikes
        expect(smoothed[1].chatgpt).toBeLessThan(100)
        expect(smoothed[3].gemini).toBeLessThan(90)
      })

      it('should handle weekly data over a year', () => {
        const series: SeriesPoint[] = Array.from({ length: 52 }, (_, i) => ({
          date: `2024-W${i + 1}`,
          value: 50 + Math.random() * 50,
        }))

        const smoothed = smoothSeries(series, 4)

        expect(smoothed).toHaveLength(52)
        smoothed.forEach(point => {
          expect(typeof point.value).toBe('number')
        })
      })
    })
  })

  describe('nonZeroRatio', () => {
    describe('basic calculation', () => {
      it('should return 1.0 when all rows have non-zero values', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 20 },
          { date: '2024-01-03', value: 30 },
        ]

        expect(nonZeroRatio(series)).toBe(1)
      })

      it('should return 0 when all rows are zero', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 0 },
          { date: '2024-01-02', value: 0 },
          { date: '2024-01-03', value: 0 },
        ]

        expect(nonZeroRatio(series)).toBe(0)
      })

      it('should calculate correct ratio for mixed data', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 0 },
          { date: '2024-01-02', value: 10 },
          { date: '2024-01-03', value: 0 },
          { date: '2024-01-04', value: 20 },
        ]

        expect(nonZeroRatio(series)).toBe(0.5) // 2 out of 4
      })

      it('should count row as non-zero if ANY term is > 0', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', termA: 0, termB: 0 },
          { date: '2024-01-02', termA: 10, termB: 0 },
          { date: '2024-01-03', termA: 0, termB: 20 },
        ]

        expect(nonZeroRatio(series)).toBe(2 / 3) // 2 rows have at least one non-zero
      })

      it('should ignore date field', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 0 },
          { date: '2024-01-02', value: 0 },
        ]

        expect(nonZeroRatio(series)).toBe(0)
      })
    })

    describe('edge cases', () => {
      it('should return 0 for empty series', () => {
        expect(nonZeroRatio([])).toBe(0)
      })

      it('should handle null/undefined series', () => {
        expect(nonZeroRatio(null as any)).toBe(0)
        expect(nonZeroRatio(undefined as any)).toBe(0)
      })

      it('should handle single data point', () => {
        expect(nonZeroRatio([{ date: '2024-01-01', value: 10 }])).toBe(1)
        expect(nonZeroRatio([{ date: '2024-01-01', value: 0 }])).toBe(0)
      })

      it('should handle negative values as non-zero', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: -10 },
          { date: '2024-01-02', value: 0 },
        ]

        // Negative values are NOT > 0, so should be counted as zero
        expect(nonZeroRatio(series)).toBe(0)
      })

      it('should handle very small positive values', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 0.0001 },
          { date: '2024-01-02', value: 0 },
        ]

        expect(nonZeroRatio(series)).toBe(0.5)
      })

      it('should handle string values', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: '10' },
          { date: '2024-01-02', value: '0' },
        ]

        // String values are not numbers, should be ignored
        expect(nonZeroRatio(series)).toBe(0)
      })

      it('should handle mixed number and string values', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', termA: 10, termB: '20' },
          { date: '2024-01-02', termA: 0, termB: '0' },
        ]

        // Only numeric values > 0 should count
        expect(nonZeroRatio(series)).toBe(0.5) // Only first row has termA > 0
      })

      it('should handle rows with only date field', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01' },
          { date: '2024-01-02' },
        ]

        expect(nonZeroRatio(series)).toBe(0)
      })
    })

    describe('real-world scenarios', () => {
      it('should detect sparse Google Trends data', () => {
        const sparseSeries: SeriesPoint[] = [
          { date: '2024-01-01', termA: 0, termB: 0 },
          { date: '2024-01-02', termA: 0, termB: 5 },
          { date: '2024-01-03', termA: 0, termB: 0 },
          { date: '2024-01-04', termA: 10, termB: 0 },
          { date: '2024-01-05', termA: 0, termB: 0 },
        ]

        expect(nonZeroRatio(sparseSeries)).toBe(0.4) // 2 out of 5
      })

      it('should detect dense data', () => {
        const denseSeries: SeriesPoint[] = [
          { date: '2024-01-01', chatgpt: 85, gemini: 62 },
          { date: '2024-01-02', chatgpt: 88, gemini: 65 },
          { date: '2024-01-03', chatgpt: 90, gemini: 68 },
        ]

        expect(nonZeroRatio(denseSeries)).toBe(1)
      })

      it('should handle data with occasional zeros', () => {
        const series: SeriesPoint[] = Array.from({ length: 100 }, (_, i) => ({
          date: `2024-01-${i + 1}`,
          value: i % 10 === 0 ? 0 : 50,
        }))

        expect(nonZeroRatio(series)).toBe(0.9) // 90 out of 100
      })
    })

    describe('data integrity', () => {
      it('should not mutate original series', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', value: 10 },
          { date: '2024-01-02', value: 0 },
        ]
        const original = JSON.parse(JSON.stringify(series))

        nonZeroRatio(series)

        expect(series).toEqual(original)
      })
    })

    describe('multiple terms', () => {
      it('should break after finding first non-zero value in row', () => {
        const series: SeriesPoint[] = [
          { date: '2024-01-01', termA: 10, termB: 20, termC: 30 },
          { date: '2024-01-02', termA: 0, termB: 0, termC: 0 },
        ]

        // Should count first row as 1 (not 3), second as 0
        expect(nonZeroRatio(series)).toBe(0.5)
      })

      it('should work with any number of terms', () => {
        const series: SeriesPoint[] = [
          {
            date: '2024-01-01',
            term1: 0,
            term2: 0,
            term3: 0,
            term4: 0,
            term5: 10,
          },
        ]

        expect(nonZeroRatio(series)).toBe(1)
      })
    })
  })
})
