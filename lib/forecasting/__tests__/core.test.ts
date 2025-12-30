/**
 * Unit tests for forecasting core module
 */

import { describe, it, expect } from 'vitest';
import { forecast, walkForwardBacktest, type TimeSeriesPoint } from '../core';

describe('Forecasting Core', () => {
  describe('forecast', () => {
    it('should return naive forecast for insufficient data', async () => {
      const series: TimeSeriesPoint[] = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 12 },
      ];

      const result = await forecast(series, 7);

      expect(result.model).toBe('naive');
      expect(result.points).toHaveLength(7);
      expect(result.points[0].value).toBe(12); // Last value
      expect(result.confidenceScore).toBe(0);
      expect(result.qualityFlags.seriesTooShort).toBe(true);
    });

    it('should generate forecast for sufficient data', async () => {
      // Create a simple trend series
      const series: TimeSeriesPoint[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        series.push({
          date: date.toISOString().split('T')[0],
          value: 50 + i * 0.5 + Math.random() * 5, // Upward trend with noise
        });
      }

      const result = await forecast(series, 7);

      expect(result.points).toHaveLength(7);
      expect(result.model).toMatch(/ets|arima|naive/);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
      expect(result.metrics.mae).toBeGreaterThanOrEqual(0);
      expect(result.metrics.mape).toBeGreaterThanOrEqual(0);
    });

    it('should include prediction intervals', async () => {
      const series: TimeSeriesPoint[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        series.push({
          date: date.toISOString().split('T')[0],
          value: 50 + Math.random() * 10,
        });
      }

      const result = await forecast(series, 7);

      expect(result.points[0].lower80).toBeLessThan(result.points[0].value);
      expect(result.points[0].upper80).toBeGreaterThan(result.points[0].value);
      expect(result.points[0].lower95).toBeLessThan(result.points[0].lower80);
      expect(result.points[0].upper95).toBeGreaterThan(result.points[0].upper80);
    });
  });

  describe('walkForwardBacktest', () => {
    it('should return invalid metrics for insufficient data', () => {
      const series: TimeSeriesPoint[] = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 12 },
      ];

      const result = walkForwardBacktest(series, 'ets', 14, 7, 7);

      expect(result.sampleSize).toBe(0);
      expect(result.mae).toBe(Infinity);
      expect(result.mape).toBe(Infinity);
    });

    it('should compute backtest metrics for sufficient data', () => {
      const series: TimeSeriesPoint[] = [];
      for (let i = 0; i < 50; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        series.push({
          date: date.toISOString().split('T')[0],
          value: 50 + i * 0.3 + Math.random() * 5,
        });
      }

      const result = walkForwardBacktest(series, 'ets', 20, 7, 7);

      expect(result.sampleSize).toBeGreaterThan(0);
      expect(result.mae).toBeGreaterThanOrEqual(0);
      expect(result.mape).toBeGreaterThanOrEqual(0);
      expect(result.intervalCoverage80).toBeGreaterThanOrEqual(0);
      expect(result.intervalCoverage80).toBeLessThanOrEqual(100);
      expect(result.intervalCoverage95).toBeGreaterThanOrEqual(0);
      expect(result.intervalCoverage95).toBeLessThanOrEqual(100);
    });
  });
});

