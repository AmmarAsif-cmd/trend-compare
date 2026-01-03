/**
 * Unit tests for comparison metrics functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVolatility,
  calculateAgreementIndex,
  classifyStability,
  calculateChangeMetrics,
  extractTopDrivers,
  generateRiskFlags,
  computeComparisonMetrics,
} from './comparison-metrics';
import type { SeriesPoint } from './trends';

describe('Comparison Metrics', () => {
  describe('calculateVolatility', () => {
    it('should calculate volatility for stable series', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', term: 50 },
        { date: '2024-01-02', term: 51 },
        { date: '2024-01-03', term: 49 },
        { date: '2024-01-04', term: 52 },
        { date: '2024-01-05', term: 50 },
      ] as any[];

      const volatility = calculateVolatility(series, 'term');
      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(10); // Low volatility
    });

    it('should calculate high volatility for spiky series', () => {
      const series: SeriesPoint[] = [
        { date: '2024-01-01', term: 10 },
        { date: '2024-01-02', term: 90 },
        { date: '2024-01-03', term: 15 },
        { date: '2024-01-04', term: 85 },
        { date: '2024-01-05', term: 12 },
      ] as any[];

      const volatility = calculateVolatility(series, 'term');
      expect(volatility).toBeGreaterThan(50); // High volatility
    });

    it('should return 0 for empty or single-point series', () => {
      expect(calculateVolatility([], 'term')).toBe(0);
      expect(calculateVolatility([{ date: '2024-01-01', term: 50 }] as any[], 'term')).toBe(0);
    });
  });

  describe('calculateAgreementIndex', () => {
    it('should calculate high agreement when sources agree', () => {
      const breakdownA = {
        searchInterest: 80,
        socialBuzz: 75,
        authority: 70,
        momentum: 65,
      };
      const breakdownB = {
        searchInterest: 20,
        socialBuzz: 25,
        authority: 30,
        momentum: 35,
      };

      const agreement = calculateAgreementIndex(breakdownA, breakdownB);
      expect(agreement).toBeGreaterThan(80); // High agreement
    });

    it('should calculate low agreement when sources disagree', () => {
      const breakdownA = {
        searchInterest: 50,
        socialBuzz: 50,
        authority: 50,
        momentum: 50,
      };
      const breakdownB = {
        searchInterest: 50,
        socialBuzz: 50,
        authority: 50,
        momentum: 50,
      };

      const agreement = calculateAgreementIndex(breakdownA, breakdownB);
      expect(agreement).toBeGreaterThanOrEqual(50);
    });

    it('should handle missing breakdowns', () => {
      const agreement = calculateAgreementIndex({}, {});
      expect(agreement).toBe(50); // Default neutral
    });
  });

  describe('classifyStability', () => {
    it('should classify stable series', () => {
      const series: SeriesPoint[] = Array.from({ length: 20 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        term: 50 + Math.random() * 5, // Small variance
      })) as any[];

      const stability = classifyStability(series, 'term', 15);
      expect(stability).toBe('stable');
    });

    it('should classify hype series with extreme spike', () => {
      const series: SeriesPoint[] = Array.from({ length: 20 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        term: i === 15 ? 200 : 50, // Extreme spike
      })) as any[];

      const stability = classifyStability(series, 'term', 30);
      expect(stability).toBe('hype');
    });

    it('should classify volatile series', () => {
      const series: SeriesPoint[] = Array.from({ length: 20 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        term: 30 + Math.random() * 40, // High variance
      })) as any[];

      const stability = classifyStability(series, 'term', 50);
      expect(stability).toBe('volatile');
    });
  });

  describe('calculateChangeMetrics', () => {
    it('should calculate positive changes', () => {
      const current = {
        marginPoints: 20,
        confidence: 80,
        volatility: 30,
        agreementIndex: 75,
      };
      const previous = {
        marginPoints: 15,
        confidence: 70,
        volatility: 35,
        agreementIndex: 70,
      };

      const changes = calculateChangeMetrics(current, previous);
      expect(changes.gapChangePoints).toBe(5);
      expect(changes.confidenceChange).toBe(10);
      expect(changes.volatilityDelta).toBe(-5);
      expect(changes.agreementChange).toBe(5);
    });

    it('should calculate negative changes', () => {
      const current = {
        marginPoints: 10,
        confidence: 60,
        volatility: 40,
        agreementIndex: 65,
      };
      const previous = {
        marginPoints: 15,
        confidence: 70,
        volatility: 30,
        agreementIndex: 75,
      };

      const changes = calculateChangeMetrics(current, previous);
      expect(changes.gapChangePoints).toBe(-5);
      expect(changes.confidenceChange).toBe(-10);
      expect(changes.volatilityDelta).toBe(10);
      expect(changes.agreementChange).toBe(-10);
    });
  });

  describe('extractTopDrivers', () => {
    it('should extract top drivers sorted by impact', () => {
      const breakdownA = {
        searchInterest: 80,
        socialBuzz: 60,
        authority: 50,
        momentum: 40,
      };
      const breakdownB = {
        searchInterest: 20,
        socialBuzz: 40,
        authority: 50,
        momentum: 60,
      };

      const drivers = extractTopDrivers(breakdownA, breakdownB, 2);
      expect(drivers).toHaveLength(2);
      expect(drivers[0].impact).toBeGreaterThanOrEqual(drivers[1].impact);
      expect(drivers[0].name).toBe('Search Interest'); // Highest impact
    });

    it('should handle empty breakdowns', () => {
      const drivers = extractTopDrivers({}, {}, 2);
      expect(drivers).toHaveLength(0);
    });
  });

  describe('generateRiskFlags', () => {
    it('should flag high volatility', () => {
      const flags = generateRiskFlags(55, 70, 'stable', false);
      expect(flags).toContain('High volatility detected');
    });

    it('should flag low agreement', () => {
      const flags = generateRiskFlags(30, 55, 'stable', false);
      expect(flags).toContain('Source disagreement');
    });

    it('should flag hype pattern', () => {
      const flags = generateRiskFlags(30, 70, 'hype', false);
      expect(flags).toContain('Potential hype pattern');
    });

    it('should flag recent spike', () => {
      const flags = generateRiskFlags(30, 70, 'stable', true);
      expect(flags).toContain('Recent spike detected');
    });

    it('should return empty array for low-risk metrics', () => {
      const flags = generateRiskFlags(20, 80, 'stable', false);
      expect(flags).toHaveLength(0);
    });
  });

  describe('computeComparisonMetrics', () => {
    it('should compute all metrics correctly', () => {
      const series: SeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        termA: 50 + i * 0.5,
        termB: 45 + i * 0.3,
      })) as any[];

      const verdict = {
        winner: 'termA',
        loser: 'termB',
        winnerScore: 65,
        loserScore: 54,
        margin: 11,
        confidence: 75,
      };

      const breakdownA = {
        searchInterest: 70,
        socialBuzz: 60,
        authority: 65,
        momentum: 70,
      };

      const breakdownB = {
        searchInterest: 50,
        socialBuzz: 55,
        authority: 50,
        momentum: 60,
      };

      const metrics = computeComparisonMetrics(
        series,
        'termA',
        'termB',
        verdict,
        breakdownA,
        breakdownB,
        null
      );

      expect(metrics.marginPoints).toBe(11);
      expect(metrics.confidence).toBe(75);
      expect(metrics.volatility).toBeGreaterThan(0);
      expect(metrics.agreementIndex).toBeGreaterThan(0);
      expect(metrics.stability).toMatch(/stable|hype|volatile/);
      expect(metrics.topDrivers.length).toBeGreaterThan(0);
      expect(Array.isArray(metrics.riskFlags)).toBe(true);
    });

    it('should compute change metrics with previous snapshot', () => {
      const series: SeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        termA: 50,
        termB: 45,
      })) as any[];

      const verdict = {
        winner: 'termA',
        loser: 'termB',
        winnerScore: 65,
        loserScore: 54,
        margin: 11,
        confidence: 80,
      };

      const breakdownA = { searchInterest: 70, socialBuzz: 60, authority: 65, momentum: 70 };
      const breakdownB = { searchInterest: 50, socialBuzz: 55, authority: 50, momentum: 60 };

      const previousSnapshot = {
        id: 'test',
        userId: 'test',
        slug: 'test',
        termA: 'termA',
        termB: 'termB',
        timeframe: '12m',
        geo: '',
        computedAt: new Date('2024-01-01'),
        marginPoints: 8,
        confidence: 70,
        volatility: 25,
        agreementIndex: 70,
        winner: 'termA',
        winnerScore: 60,
        loserScore: 52,
        category: null,
      };

      const metrics = computeComparisonMetrics(
        series,
        'termA',
        'termB',
        verdict,
        breakdownA,
        breakdownB,
        previousSnapshot
      );

      expect(metrics.gapChangePoints).toBe(3); // 11 - 8
      expect(metrics.confidenceChange).toBe(10); // 80 - 70
      expect(metrics.volatilityDelta).toBeDefined();
      expect(metrics.agreementChange).toBeDefined();
    });
  });
});

