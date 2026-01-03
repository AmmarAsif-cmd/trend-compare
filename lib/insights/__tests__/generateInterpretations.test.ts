/**
 * Unit tests for generateInterpretations
 * Tests deterministic interpretation generation from signals
 */

import { generateInterpretations, type GenerateInterpretationsInput } from '../generateInterpretations';
import type { Signal } from '../contracts/signals';

describe('generateInterpretations', () => {
  const baseInput: Omit<GenerateInterpretationsInput, 'signals' | 'scores'> = {
    termA: 'Term A',
    termB: 'Term B',
    seriesLength: 12,
    dataSource: 'test',
    lastUpdatedAt: new Date().toISOString(),
  };

  describe('Stable Growth Series', () => {
    it('should generate growth pattern interpretation', () => {
      const signals: Signal[] = [
        {
          id: 'momentum-1',
          type: 'momentum_shift',
          severity: 'medium',
          term: 'termA',
          description: 'Term A showing strong upward momentum (25.5% change)',
          detectedAt: '2024-12-01',
          confidence: 75,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 70,
            breakdown: { searchInterest: 70, socialBuzz: 60, authority: 65, momentum: 65 },
          },
          termB: {
            overall: 50,
            breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should have growth pattern interpretation
      const growthInterpretations = interpretations.filter(i => i.category === 'growth_pattern' && i.term === 'termA');
      expect(growthInterpretations.length).toBeGreaterThan(0);
      expect(growthInterpretations[0].text).toContain('growth pattern');
      expect(growthInterpretations[0].relatedSignals).toContain('momentum-1');
    });

    it('should classify as Stable pattern', () => {
      const signals: Signal[] = []; // No volatility or seasonal signals

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 60,
            breakdown: { searchInterest: 60, socialBuzz: 55, authority: 55, momentum: 55 },
          },
          termB: {
            overall: 50,
            breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should have stability interpretation
      const stabilityInterpretations = interpretations.filter(i => i.category === 'stability_analysis');
      expect(stabilityInterpretations.length).toBeGreaterThan(0);
      expect(stabilityInterpretations[0].text).toContain('stable pattern');
    });
  });

  describe('Event-Driven Spike Series', () => {
    it('should generate trend analysis for event-driven spikes', () => {
      const signals: Signal[] = [
        {
          id: 'anomaly-1',
          type: 'anomaly_detected',
          severity: 'medium',
          term: 'termA',
          description: 'Anomaly detected for Term A on 2024-07-01: spike',
          detectedAt: '2024-07-01',
          confidence: 75,
          dataPoints: [{ date: '2024-07-01', value: 100 }],
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 75,
            breakdown: { searchInterest: 75, socialBuzz: 70, authority: 65, momentum: 70 },
          },
          termB: {
            overall: 50,
            breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should have trend analysis
      const trendInterpretations = interpretations.filter(i => i.category === 'trend_analysis');
      expect(trendInterpretations.length).toBeGreaterThan(0);
    });

    it('should classify as EventDriven pattern', () => {
      const signals: Signal[] = [
        {
          id: 'anomaly-1',
          type: 'anomaly_detected',
          severity: 'medium',
          term: 'termA',
          description: 'Anomaly detected',
          detectedAt: '2024-07-01',
          confidence: 75,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 70,
            breakdown: { searchInterest: 70, socialBuzz: 60, authority: 65, momentum: 65 },
          },
          termB: {
            overall: 50,
            breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should reference event-driven pattern in interpretations
      const hasEventDriven = interpretations.some(i => 
        i.text.toLowerCase().includes('event') || 
        i.evidence?.some(e => e.toLowerCase().includes('anomaly'))
      );
      expect(hasEventDriven).toBe(true);
    });
  });

  describe('Seasonal Series', () => {
    it('should generate interpretations for seasonal patterns', () => {
      const signals: Signal[] = [
        {
          id: 'seasonal-1',
          type: 'seasonal_pattern',
          severity: 'high',
          term: 'termA',
          description: 'Term A shows seasonal pattern (strength: 0.65)',
          detectedAt: '2024-12-01',
          confidence: 80,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 60,
            breakdown: { searchInterest: 60, socialBuzz: 55, authority: 55, momentum: 55 },
          },
          termB: {
            overall: 50,
            breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should have trend analysis mentioning seasonal pattern
      const trendInterpretations = interpretations.filter(i => 
        i.category === 'trend_analysis' && 
        i.text.toLowerCase().includes('seasonal')
      );
      expect(trendInterpretations.length).toBeGreaterThan(0);
    });
  });

  describe('Competitive Dynamics', () => {
    it('should generate competitive dynamics interpretation for crossovers', () => {
      const signals: Signal[] = [
        {
          id: 'crossover-1',
          type: 'competitor_crossover',
          severity: 'high',
          term: 'both',
          description: 'Term B has overtaken Term A in recent trend',
          detectedAt: '2024-12-01',
          confidence: 70,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 45,
            breakdown: { searchInterest: 45, socialBuzz: 45, authority: 45, momentum: 40 },
          },
          termB: {
            overall: 55,
            breakdown: { searchInterest: 55, socialBuzz: 55, authority: 55, momentum: 60 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should have competitive dynamics interpretation
      const competitiveInterpretations = interpretations.filter(i => 
        i.category === 'competitive_dynamics'
      );
      expect(competitiveInterpretations.length).toBeGreaterThan(0);
      expect(competitiveInterpretations[0].text).toContain('Competitive shift');
      expect(competitiveInterpretations[0].relatedSignals).toContain('crossover-1');
    });

    it('should assess leader change risk correctly', () => {
      const signals: Signal[] = [
        {
          id: 'crossover-1',
          type: 'competitor_crossover',
          severity: 'high',
          term: 'both',
          description: 'Crossover detected',
          detectedAt: '2024-12-01',
          confidence: 70,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 48,
            breakdown: { searchInterest: 48, socialBuzz: 48, authority: 48, momentum: 48 },
          },
          termB: {
            overall: 52,
            breakdown: { searchInterest: 52, socialBuzz: 52, authority: 52, momentum: 52 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should have risk interpretation
      const riskInterpretations = interpretations.filter(i => 
        i.category === 'competitive_dynamics' && 
        i.text.toLowerCase().includes('risk')
      );
      expect(riskInterpretations.length).toBeGreaterThan(0);
      expect(riskInterpretations[0].text.toLowerCase()).toContain('high');
    });
  });

  describe('Market Positioning', () => {
    it('should generate market positioning interpretations', () => {
      const signals: Signal[] = [];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 70,
            breakdown: { searchInterest: 80, socialBuzz: 60, authority: 65, momentum: 65 },
          },
          termB: {
            overall: 50,
            breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 },
          },
        },
      };

      const interpretations = generateInterpretations(input);

      // Should have market positioning interpretation for search interest
      const positioningInterpretations = interpretations.filter(i => 
        i.category === 'market_positioning'
      );
      expect(positioningInterpretations.length).toBeGreaterThan(0);
      expect(positioningInterpretations[0].text).toContain('search interest');
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce same interpretations for same input', () => {
      const signals: Signal[] = [
        {
          id: 'momentum-1',
          type: 'momentum_shift',
          severity: 'medium',
          term: 'termA',
          description: 'Term A showing upward momentum (20% change)',
          detectedAt: '2024-12-01',
          confidence: 70,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateInterpretationsInput = {
        ...baseInput,
        signals,
        scores: {
          termA: {
            overall: 70,
            breakdown: { searchInterest: 70, socialBuzz: 60, authority: 65, momentum: 65 },
          },
          termB: {
            overall: 50,
            breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 },
          },
        },
      };

      const interpretations1 = generateInterpretations(input);
      const interpretations2 = generateInterpretations(input);

      // Should produce identical results
      expect(interpretations1.length).toBe(interpretations2.length);
      expect(interpretations1.map(i => i.id).sort()).toEqual(interpretations2.map(i => i.id).sort());
    });
  });
});

// Simple test runner for environments without Jest
if (typeof describe === 'undefined') {
  console.log('[generateInterpretations Tests] Test harness requires Jest. Run with: npm test');
}

