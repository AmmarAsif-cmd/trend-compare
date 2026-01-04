/**
 * Tests for confidence calculator
 * Ensures confidence scores are continuous and not bucketed
 */

import { calculateConfidenceScore, calculateComparisonConfidence, getConfidenceLabel } from './confidence-calculator';

describe('confidence-calculator', () => {
  describe('calculateConfidenceScore', () => {
    it('should return continuous scores, not bucketed values', () => {
      // Test various combinations to ensure we get a wide range of values
      const testCases = [
        { agreementIndex: 80, volatility: 10, dataPoints: 100, sourceCount: 3, margin: 20, leaderChangeRisk: 10 },
        { agreementIndex: 60, volatility: 30, dataPoints: 50, sourceCount: 2, margin: 10, leaderChangeRisk: 30 },
        { agreementIndex: 50, volatility: 50, dataPoints: 25, sourceCount: 1, margin: 5, leaderChangeRisk: 50 },
        { agreementIndex: 90, volatility: 5, dataPoints: 200, sourceCount: 4, margin: 30, leaderChangeRisk: 5 },
        { agreementIndex: 40, volatility: 70, dataPoints: 10, sourceCount: 1, margin: 2, leaderChangeRisk: 70 },
      ];

      const scores = testCases.map(tc => calculateConfidenceScore(tc));
      
      // Verify we get different scores (not all 55 or 70)
      const uniqueScores = new Set(scores.map(s => Math.round(s)));
      expect(uniqueScores.size).toBeGreaterThan(2); // Should have at least 3 different values
      
      // Verify scores are in valid range
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle missing optional parameters', () => {
      const score = calculateConfidenceScore({
        agreementIndex: 50,
        volatility: 0,
        dataPoints: 50,
        sourceCount: 1,
      });
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should increase confidence with higher agreement index', () => {
      const lowAgreement = calculateConfidenceScore({
        agreementIndex: 30,
        volatility: 30,
        dataPoints: 50,
        sourceCount: 2,
      });
      
      const highAgreement = calculateConfidenceScore({
        agreementIndex: 90,
        volatility: 30,
        dataPoints: 50,
        sourceCount: 2,
      });
      
      expect(highAgreement).toBeGreaterThan(lowAgreement);
    });

    it('should decrease confidence with higher volatility', () => {
      const lowVolatility = calculateConfidenceScore({
        agreementIndex: 70,
        volatility: 10,
        dataPoints: 50,
        sourceCount: 2,
      });
      
      const highVolatility = calculateConfidenceScore({
        agreementIndex: 70,
        volatility: 80,
        dataPoints: 50,
        sourceCount: 2,
      });
      
      expect(highVolatility).toBeLessThan(lowVolatility);
    });

    it('should increase confidence with more data points', () => {
      const fewPoints = calculateConfidenceScore({
        agreementIndex: 70,
        volatility: 30,
        dataPoints: 10,
        sourceCount: 2,
      });
      
      const manyPoints = calculateConfidenceScore({
        agreementIndex: 70,
        volatility: 30,
        dataPoints: 100,
        sourceCount: 2,
      });
      
      expect(manyPoints).toBeGreaterThan(fewPoints);
    });

    it('should increase confidence with more sources', () => {
      const oneSource = calculateConfidenceScore({
        agreementIndex: 70,
        volatility: 30,
        dataPoints: 50,
        sourceCount: 1,
      });
      
      const threeSources = calculateConfidenceScore({
        agreementIndex: 70,
        volatility: 30,
        dataPoints: 50,
        sourceCount: 3,
      });
      
      expect(threeSources).toBeGreaterThan(oneSource);
    });

    it('should clamp scores to 0-100 range', () => {
      // Extreme case: very low confidence
      const veryLow = calculateConfidenceScore({
        agreementIndex: 0,
        volatility: 100,
        dataPoints: 1,
        sourceCount: 1,
        leaderChangeRisk: 100,
      });
      
      expect(veryLow).toBeGreaterThanOrEqual(0);
      
      // Extreme case: very high confidence
      const veryHigh = calculateConfidenceScore({
        agreementIndex: 100,
        volatility: 0,
        dataPoints: 200,
        sourceCount: 5,
        margin: 50,
        leaderChangeRisk: 0,
      });
      
      expect(veryHigh).toBeLessThanOrEqual(100);
    });
  });

  describe('getConfidenceLabel', () => {
    it('should return "high" for scores >= 70', () => {
      expect(getConfidenceLabel(70)).toBe('high');
      expect(getConfidenceLabel(85)).toBe('high');
      expect(getConfidenceLabel(100)).toBe('high');
    });

    it('should return "medium" for scores 50-69', () => {
      expect(getConfidenceLabel(50)).toBe('medium');
      expect(getConfidenceLabel(60)).toBe('medium');
      expect(getConfidenceLabel(69)).toBe('medium');
    });

    it('should return "low" for scores < 50', () => {
      expect(getConfidenceLabel(49)).toBe('low');
      expect(getConfidenceLabel(30)).toBe('low');
      expect(getConfidenceLabel(0)).toBe('low');
    });
  });

  describe('calculateComparisonConfidence', () => {
    it('should return both score and label', () => {
      const result = calculateComparisonConfidence(70, 30, 50, 2, 15, 20);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('label');
      expect(typeof result.score).toBe('number');
      expect(['low', 'medium', 'high']).toContain(result.label);
    });

    it('should produce varied scores across different inputs', () => {
      const results = [
        calculateComparisonConfidence(80, 10, 100, 3, 20, 5),
        calculateComparisonConfidence(60, 40, 30, 1, 5, 50),
        calculateComparisonConfidence(50, 60, 20, 1, 2, 70),
        calculateComparisonConfidence(90, 5, 200, 4, 30, 0),
      ];
      
      const scores = results.map(r => Math.round(r.score));
      const uniqueScores = new Set(scores);
      
      // Should have variety, not all the same
      expect(uniqueScores.size).toBeGreaterThan(1);
    });
  });
});

