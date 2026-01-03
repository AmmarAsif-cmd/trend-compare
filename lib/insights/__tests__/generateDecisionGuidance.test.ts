/**
 * Unit tests for generateDecisionGuidance
 * Tests deterministic decision guidance generation for various scenarios
 */

import { generateDecisionGuidance, type GenerateDecisionGuidanceInput } from '../generateDecisionGuidance';
import type { Signal } from '../contracts/signals';
import type { Interpretation } from '../contracts/interpretations';

describe('generateDecisionGuidance', () => {
  const baseInput: Omit<GenerateDecisionGuidanceInput, 'signals' | 'interpretations' | 'scores'> = {
    termA: 'Term A',
    termB: 'Term B',
    dataSource: 'test',
    lastUpdatedAt: new Date().toISOString(),
  };

  describe('Stable Winner Scenario', () => {
    it('should generate appropriate guidance for stable winner', () => {
      const signals: Signal[] = [];
      const interpretations: Interpretation[] = [
        {
          id: 'trend-1',
          category: 'trend_analysis',
          term: 'termA',
          text: 'Term A shows stable growth pattern',
          confidence: 75,
          generatedAt: new Date().toISOString(),
          dataFreshness: { lastUpdatedAt: new Date().toISOString(), source: 'test' },
        },
      ];

      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals,
        interpretations,
        scores: {
          termA: {
            overall: 75,
            breakdown: { momentum: 60 },
          },
          termB: {
            overall: 50,
            breakdown: { momentum: 50 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // Should have marketer guidance
      expect(result.marketer.length).toBeGreaterThanOrEqual(2);
      expect(result.marketer.length).toBeLessThanOrEqual(3);
      
      // Should have founder guidance
      expect(result.founder.length).toBeGreaterThanOrEqual(2);
      expect(result.founder.length).toBeLessThanOrEqual(3);

      // Marketer should recommend focusing on winner
      const focusGuidance = result.marketer.find(g => g.action === 'invest_more' || g.action === 'maintain');
      expect(focusGuidance).toBeDefined();
      expect(focusGuidance?.recommendation).toContain('Term A');
      expect(focusGuidance?.timeframe).toBeDefined();

      // Founder should have strategic guidance
      const strategicGuidance = result.founder.find(g => g.action === 'invest_more' || g.action === 'maintain');
      expect(strategicGuidance).toBeDefined();
      expect(strategicGuidance?.recommendation).toContain('Term A');
    });

    it('should include risk levels and notes', () => {
      const signals: Signal[] = [];
      const interpretations: Interpretation[] = [];

      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals,
        interpretations,
        scores: {
          termA: {
            overall: 70,
            breakdown: { momentum: 55 },
          },
          termB: {
            overall: 45,
            breakdown: { momentum: 45 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // All guidance should have priority (which indicates risk consideration)
      result.marketer.forEach(g => {
        expect(g.priority).toBeGreaterThanOrEqual(1);
        expect(g.priority).toBeLessThanOrEqual(5);
        expect(g.timeframe).toBeDefined();
        expect(g.rationale).toBeDefined();
      });

      result.founder.forEach(g => {
        expect(g.priority).toBeGreaterThanOrEqual(1);
        expect(g.priority).toBeLessThanOrEqual(5);
        expect(g.timeframe).toBeDefined();
        expect(g.rationale).toBeDefined();
      });
    });
  });

  describe('Volatile Hype Scenario', () => {
    it('should generate volatility-focused guidance', () => {
      const signals: Signal[] = [
        {
          id: 'volatility-1',
          type: 'volatility_spike',
          severity: 'high',
          term: 'termA',
          description: 'Term A showing high volatility (CV: 1.2)',
          detectedAt: '2024-12-01',
          confidence: 85,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
        {
          id: 'volatility-2',
          type: 'volatility_spike',
          severity: 'high',
          term: 'termB',
          description: 'Term B showing high volatility (CV: 1.1)',
          detectedAt: '2024-12-01',
          confidence: 80,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const interpretations: Interpretation[] = [
        {
          id: 'stability-1',
          category: 'stability_analysis',
          term: 'termA',
          text: 'Term A shows high volatility with noisy pattern',
          confidence: 80,
          generatedAt: new Date().toISOString(),
          dataFreshness: { lastUpdatedAt: new Date().toISOString(), source: 'test' },
        },
      ];

      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals,
        interpretations,
        scores: {
          termA: {
            overall: 65,
            breakdown: { momentum: 55 },
          },
          termB: {
            overall: 60,
            breakdown: { momentum: 50 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // Marketer should have optimize recommendation
      const optimizeGuidance = result.marketer.find(g => g.action === 'optimize');
      expect(optimizeGuidance).toBeDefined();
      expect(optimizeGuidance?.recommendation.toLowerCase()).toContain('volatility');
      expect(optimizeGuidance?.relatedInterpretations).toBeDefined();

      // Founder should have risk management recommendation
      const riskGuidance = result.founder.find(g => 
        g.action === 'monitor' && 
        g.recommendation.toLowerCase().includes('volatility')
      );
      expect(riskGuidance).toBeDefined();
      expect(riskGuidance?.priority).toBeGreaterThanOrEqual(4);
    });

    it('should handle multiple high-volatility signals', () => {
      const signals: Signal[] = Array.from({ length: 3 }, (_, i) => ({
        id: `volatility-${i}`,
        type: 'volatility_spike',
        severity: 'high',
        term: i % 2 === 0 ? 'termA' : 'termB',
        description: `High volatility detected`,
        detectedAt: '2024-12-01',
        confidence: 80,
        source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
        generatedAt: new Date().toISOString(),
      }));

      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals,
        interpretations: [],
        scores: {
          termA: {
            overall: 60,
            breakdown: { momentum: 50 },
          },
          termB: {
            overall: 55,
            breakdown: { momentum: 48 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // Founder should prioritize risk management
      const riskGuidance = result.founder.find(g => 
        g.recommendation.toLowerCase().includes('volatility') ||
        g.recommendation.toLowerCase().includes('risk')
      );
      expect(riskGuidance).toBeDefined();
      expect(riskGuidance?.priority).toBe(5); // High priority for multiple volatility signals
    });
  });

  describe('Regime Shift Scenario', () => {
    it('should generate pivot guidance for regime shifts', () => {
      const signals: Signal[] = [
        {
          id: 'momentum-divergence',
          type: 'momentum_shift',
          severity: 'high',
          term: 'both',
          description: 'Momentum divergence: Term A rising while Term B falling',
          detectedAt: '2024-12-01',
          confidence: 80,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
        {
          id: 'correlation-change',
          type: 'correlation_change',
          severity: 'high',
          term: 'both',
          description: 'Correlation between Term A and Term B changed by 0.6',
          detectedAt: '2024-12-01',
          confidence: 85,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
        {
          id: 'crossover',
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

      const interpretations: Interpretation[] = [
        {
          id: 'competitive-1',
          category: 'competitive_dynamics',
          term: 'comparison',
          text: 'Competitive shift detected: market dynamics are changing',
          confidence: 75,
          generatedAt: new Date().toISOString(),
          dataFreshness: { lastUpdatedAt: new Date().toISOString(), source: 'test' },
        },
      ];

      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals,
        interpretations,
        scores: {
          termA: {
            overall: 48,
            breakdown: { momentum: 40 },
          },
          termB: {
            overall: 52,
            breakdown: { momentum: 60 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // Founder should have pivot recommendation
      const pivotGuidance = result.founder.find(g => g.action === 'pivot');
      expect(pivotGuidance).toBeDefined();
      expect(pivotGuidance?.recommendation.toLowerCase()).toContain('shift');
      expect(pivotGuidance?.priority).toBe(5); // High priority for regime shift
      expect(pivotGuidance?.relatedInterpretations).toBeDefined();

      // Marketer should have monitor recommendation
      const monitorGuidance = result.marketer.find(g => g.action === 'monitor');
      expect(monitorGuidance).toBeDefined();
      expect(monitorGuidance?.recommendation.toLowerCase()).toContain('competitive');
    });

    it('should handle crossover with narrow margin', () => {
      const signals: Signal[] = [
        {
          id: 'crossover',
          type: 'competitor_crossover',
          severity: 'high',
          term: 'both',
          description: 'Term B has overtaken Term A',
          detectedAt: '2024-12-01',
          confidence: 70,
          source: { provider: 'test', lastUpdatedAt: new Date().toISOString() },
          generatedAt: new Date().toISOString(),
        },
      ];

      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals,
        interpretations: [],
        scores: {
          termA: {
            overall: 49,
            breakdown: { momentum: 45 },
          },
          termB: {
            overall: 51,
            breakdown: { momentum: 55 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // Should generate pivot guidance for founder
      const pivotGuidance = result.founder.find(g => g.action === 'pivot');
      expect(pivotGuidance).toBeDefined();
    });
  });

  describe('Bounded Language', () => {
    it('should avoid financial advice language', () => {
      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals: [],
        interpretations: [],
        scores: {
          termA: {
            overall: 70,
            breakdown: { momentum: 60 },
          },
          termB: {
            overall: 50,
            breakdown: { momentum: 50 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // Check all recommendations for prohibited language
      const allGuidance = [...result.marketer, ...result.founder];
      const prohibitedTerms = ['buy', 'sell', 'investment', 'return', 'profit', 'loss', 'revenue', 'earnings'];

      allGuidance.forEach(g => {
        const text = (g.recommendation + ' ' + g.rationale).toLowerCase();
        prohibitedTerms.forEach(term => {
          expect(text).not.toContain(term);
        });
      });
    });

    it('should use clear, specific wording', () => {
      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals: [],
        interpretations: [],
        scores: {
          termA: {
            overall: 70,
            breakdown: { momentum: 60 },
          },
          termB: {
            overall: 50,
            breakdown: { momentum: 50 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      const allGuidance = [...result.marketer, ...result.founder];

      allGuidance.forEach(g => {
        // Should have specific action
        expect(['invest_more', 'invest_less', 'maintain', 'monitor', 'pivot', 'scale', 'optimize']).toContain(g.action);
        
        // Should have timeframe
        expect(g.timeframe).toBeDefined();
        expect(g.timeframe.length).toBeGreaterThan(0);
        
        // Should have clear recommendation
        expect(g.recommendation.length).toBeGreaterThan(50);
        expect(g.recommendation.length).toBeLessThan(500);
        
        // Should have rationale
        expect(g.rationale.length).toBeGreaterThan(50);
      });
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce same guidance for same input', () => {
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

      const interpretations: Interpretation[] = [];

      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals,
        interpretations,
        scores: {
          termA: {
            overall: 70,
            breakdown: { momentum: 65 },
          },
          termB: {
            overall: 50,
            breakdown: { momentum: 50 },
          },
        },
      };

      const result1 = generateDecisionGuidance(input);
      const result2 = generateDecisionGuidance(input);

      // Should produce identical results
      expect(result1.marketer.length).toBe(result2.marketer.length);
      expect(result1.founder.length).toBe(result2.founder.length);
      expect(result1.marketer.map(g => g.id).sort()).toEqual(result2.marketer.map(g => g.id).sort());
      expect(result1.founder.map(g => g.id).sort()).toEqual(result2.founder.map(g => g.id).sort());
    });
  });

  describe('Role-Specific Guidance', () => {
    it('should generate different guidance for marketer vs founder', () => {
      const input: GenerateDecisionGuidanceInput = {
        ...baseInput,
        signals: [],
        interpretations: [],
        scores: {
          termA: {
            overall: 70,
            breakdown: { momentum: 60 },
          },
          termB: {
            overall: 50,
            breakdown: { momentum: 50 },
          },
        },
      };

      const result = generateDecisionGuidance(input);

      // Marketer and founder should have different recommendations
      expect(result.marketer.length).toBeGreaterThan(0);
      expect(result.founder.length).toBeGreaterThan(0);

      // Actions should be role-appropriate
      const marketerActions = result.marketer.map(g => g.action);
      const founderActions = result.founder.map(g => g.action);

      // Both should have valid actions
      marketerActions.forEach(action => {
        expect(['invest_more', 'invest_less', 'maintain', 'monitor', 'pivot', 'scale', 'optimize']).toContain(action);
      });

      founderActions.forEach(action => {
        expect(['invest_more', 'invest_less', 'maintain', 'monitor', 'pivot', 'scale', 'optimize']).toContain(action);
      });
    });
  });
});

// Simple test runner for environments without Jest
if (typeof describe === 'undefined') {
  console.log('[generateDecisionGuidance Tests] Test harness requires Jest. Run with: npm test');
}

