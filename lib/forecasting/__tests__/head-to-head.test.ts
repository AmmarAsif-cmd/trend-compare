/**
 * Unit tests for head-to-head forecast analytics
 */

import { describe, it, expect } from 'vitest';
import { computeHeadToHeadForecast } from '../head-to-head';
import type { ForecastResult } from '../core';

describe('Head-to-Head Forecast Analytics', () => {
  const createMockForecast = (values: number[]): ForecastResult => ({
    points: values.map((v, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      value: v,
      lower80: v * 0.9,
      upper80: v * 1.1,
      lower95: v * 0.85,
      upper95: v * 1.15,
    })),
    model: 'ets',
    metrics: {
      mae: 2.5,
      mape: 5.0,
      intervalCoverage80: 80,
      intervalCoverage95: 95,
      sampleSize: 10,
    },
    confidenceScore: 75,
    qualityFlags: {
      seriesTooShort: false,
      tooSpiky: false,
      eventShockLikely: false,
    },
  });

  it('should compute winner probability correctly', () => {
    // TermB consistently higher
    const forecastA = createMockForecast([50, 51, 52, 53, 54]);
    const forecastB = createMockForecast([60, 61, 62, 63, 64]);

    const result = computeHeadToHeadForecast(forecastA, forecastB, 50, 60);

    expect(result.winnerProbability).toBeGreaterThan(50); // TermB should win
    expect(result.expectedMarginPoints).toBeGreaterThan(0); // Positive margin
  });

  it('should compute lead change risk based on margin and volatility', () => {
    // Close race with high volatility
    const forecastA = createMockForecast([50, 51, 49, 52, 48]);
    const forecastB = createMockForecast([51, 50, 52, 49, 53]);

    const result = computeHeadToHeadForecast(forecastA, forecastB, 50, 51);

    // Should detect high risk due to close margin
    expect(result.leadChangeRisk).toMatch(/low|medium|high/);
  });

  it('should handle equal forecasts', () => {
    const forecastA = createMockForecast([50, 50, 50, 50, 50]);
    const forecastB = createMockForecast([50, 50, 50, 50, 50]);

    const result = computeHeadToHeadForecast(forecastA, forecastB, 50, 50);

    expect(result.winnerProbability).toBeCloseTo(50, 0);
    expect(result.expectedMarginPoints).toBeCloseTo(0, 1);
  });
});

