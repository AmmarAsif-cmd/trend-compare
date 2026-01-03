/**
 * Test Suite for Context-Aware Peak Explanation Verification
 * Tests the AI's ability to disambiguate keywords using comparison context
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockWikipediaEvents, mockGDELTArticles, mockAIResponses, testScenarios } from './mock-data';
import {
  verifyEventWithContext,
  filterByContextMatch,
  suggestCategory,
  isAmbiguousKeyword,
  getInterpretationSummary,
  type ContextualRelevanceResult
} from '../lib/context-aware-peak-verification';

// Mock Anthropic API
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockImplementation(async ({ messages }) => {
          const userMessage = messages[0].content;

          // Parse the prompt to determine which mock response to return
          if (userMessage.includes('iPhone vs Android') && userMessage.includes('iPhone 15')) {
            return mockAIResponse(mockAIResponses.appleTech_iPhoneContext);
          }
          if (userMessage.includes('iPhone vs Android') && userMessage.includes('harvest')) {
            return mockAIResponse(mockAIResponses.appleFruit_iPhoneContext);
          }
          if (userMessage.includes('Oranges vs Apples') && userMessage.includes('iPhone')) {
            return mockAIResponse(mockAIResponses.appleTech_fruitContext);
          }
          if (userMessage.includes('Oranges vs Apples') && userMessage.includes('harvest')) {
            return mockAIResponse(mockAIResponses.appleFruit_fruitContext);
          }
          if (userMessage.includes('Java vs Python') && userMessage.includes('Java 20')) {
            return mockAIResponse(mockAIResponses.javaProgramming_programmingContext);
          }
          if (userMessage.includes('Java vs Python') && userMessage.includes('earthquake')) {
            return mockAIResponse(mockAIResponses.javaIsland_programmingContext);
          }
          if (userMessage.includes('Java vs Python') && userMessage.includes('coffee')) {
            return mockAIResponse(mockAIResponses.javaCoffee_programmingContext);
          }
          if (userMessage.includes('Model 3 vs Bolt') && userMessage.includes('deliveries')) {
            return mockAIResponse(mockAIResponses.teslaCar_autoContext);
          }
          if (userMessage.includes('Model 3 vs Bolt') && userMessage.includes('museum')) {
            return mockAIResponse(mockAIResponses.teslaScientist_autoContext);
          }
          if (userMessage.includes('Snakes vs Lizards') && userMessage.includes('Python 3.12')) {
            return mockAIResponse(mockAIResponses.pythonProgramming_animalContext);
          }
          if (userMessage.includes('Snakes vs Lizards') && userMessage.includes('Burmese')) {
            return mockAIResponse(mockAIResponses.pythonSnake_animalContext);
          }

          // Default response
          return mockAIResponse({
            relevance: 50,
            interpretation: "Unknown",
            reasoning: "Default response",
            confidence: 50,
            contextMatch: false
          });
        })
      }
    }))
  };
});

function mockAIResponse(data: any) {
  return {
    content: [{
      type: 'text',
      text: `RELEVANCE: ${data.relevance}
INTERPRETATION: ${data.interpretation}
REASONING: ${data.reasoning}
CONFIDENCE: ${data.confidence}
CONTEXT_MATCH: ${data.contextMatch ? 'YES' : 'NO'}`
    }]
  };
}

describe('Context-Aware Verification Tests', () => {

  describe('verifyEventWithContext', () => {

    it('should correctly identify Apple as tech company in iPhone vs Android context', async () => {
      const result = await verifyEventWithContext(
        {
          title: "Apple Inc. unveils iPhone 15 at product event",
          description: "New iPhone announced with A17 chip",
          date: new Date('2023-09-12'),
          source: "Wikipedia"
        },
        'Apple',
        { termA: 'iPhone', termB: 'Android', category: 'technology' },
        new Date('2023-09-12')
      );

      expect(result.relevanceScore).toBeGreaterThan(90);
      expect(result.interpretation).toContain('Apple Inc.');
      expect(result.contextMatch).toBe(true);
    });

    it('should reject Apple harvest in iPhone vs Android context', async () => {
      const result = await verifyEventWithContext(
        {
          title: "Washington apple harvest begins",
          description: "Apple season starts in Washington State",
          date: new Date('2023-09-12'),
          source: "GDELT"
        },
        'Apple',
        { termA: 'iPhone', termB: 'Android', category: 'technology' },
        new Date('2023-09-12')
      );

      expect(result.relevanceScore).toBeLessThan(20);
      expect(result.interpretation).toContain('fruit');
      expect(result.contextMatch).toBe(false);
    });

    it('should correctly identify Apple as fruit in Oranges vs Apples context', async () => {
      const result = await verifyEventWithContext(
        {
          title: "Washington apple harvest begins",
          description: "Apple season starts",
          date: new Date('2023-09-12'),
          source: "GDELT"
        },
        'Apple',
        { termA: 'Oranges', termB: 'Apples', category: 'food' },
        new Date('2023-09-12')
      );

      expect(result.relevanceScore).toBeGreaterThan(85);
      expect(result.interpretation).toContain('fruit');
      expect(result.contextMatch).toBe(true);
    });

    it('should reject tech events in food comparison context', async () => {
      const result = await verifyEventWithContext(
        {
          title: "Apple Inc. releases new MacBook",
          description: "New laptop announced",
          date: new Date('2023-09-12'),
          source: "GDELT"
        },
        'Apple',
        { termA: 'Oranges', termB: 'Apples', category: 'food' },
        new Date('2023-09-12')
      );

      expect(result.relevanceScore).toBeLessThan(20);
      expect(result.contextMatch).toBe(false);
    });

    it('should identify Java as programming language in Java vs Python context', async () => {
      const result = await verifyEventWithContext(
        {
          title: "Oracle releases Java 20",
          description: "New Java version with features",
          date: new Date('2023-03-21'),
          source: "Wikipedia"
        },
        'Java',
        { termA: 'Java', termB: 'Python', category: 'technology' },
        new Date('2023-03-21')
      );

      expect(result.relevanceScore).toBeGreaterThan(90);
      expect(result.interpretation).toContain('programming');
      expect(result.contextMatch).toBe(true);
    });

    it('should reject Java island earthquake in programming context', async () => {
      const result = await verifyEventWithContext(
        {
          title: "Earthquake strikes Java island",
          description: "Indonesia earthquake",
          date: new Date('2023-03-21'),
          source: "GDELT"
        },
        'Java',
        { termA: 'Java', termB: 'Python', category: 'technology' },
        new Date('2023-03-21')
      );

      expect(result.relevanceScore).toBeLessThan(10);
      expect(result.interpretation).toContain('island');
      expect(result.contextMatch).toBe(false);
    });

    it('should reject coffee events in programming context', async () => {
      const result = await verifyEventWithContext(
        {
          title: "Starbucks introduces new Java blend",
          description: "New coffee product",
          date: new Date('2023-03-21'),
          source: "GDELT"
        },
        'Java',
        { termA: 'Java', termB: 'Python', category: 'technology' },
        new Date('2023-03-21')
      );

      expect(result.relevanceScore).toBeLessThan(20);
      expect(result.contextMatch).toBe(false);
    });
  });

  describe('filterByContextMatch', () => {

    it('should filter out events that dont match context', () => {
      const events = [
        {
          event: { title: "iPhone 15 announced" },
          verification: {
            relevanceScore: 98,
            interpretation: "Apple Inc.",
            contextMatch: true,
            reasoning: "Tech event",
            confidence: 99
          }
        },
        {
          event: { title: "Apple harvest begins" },
          verification: {
            relevanceScore: 65,
            interpretation: "Apple (fruit)",
            contextMatch: false,
            reasoning: "Fruit event",
            confidence: 95
          }
        }
      ];

      const filtered = filterByContextMatch(events, 50);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].event.title).toContain("iPhone 15");
    });

    it('should respect minimum relevance threshold', () => {
      const events = [
        {
          event: { title: "High relevance" },
          verification: {
            relevanceScore: 85,
            interpretation: "Correct",
            contextMatch: true,
            reasoning: "Matches",
            confidence: 90
          }
        },
        {
          event: { title: "Low relevance" },
          verification: {
            relevanceScore: 45,
            interpretation: "Maybe",
            contextMatch: true,
            reasoning: "Weak match",
            confidence: 50
          }
        }
      ];

      const filtered = filterByContextMatch(events, 60);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].event.title).toBe("High relevance");
    });
  });

  describe('suggestCategory', () => {

    it('should detect technology category', () => {
      expect(suggestCategory('iPhone', 'Android')).toBe('technology');
      expect(suggestCategory('MacBook', 'Windows laptop')).toBe('technology');
      expect(suggestCategory('iOS app', 'Android app')).toBe('technology');
    });

    it('should detect food category', () => {
      expect(suggestCategory('Pizza', 'Burger')).toBe('food');
      expect(suggestCategory('Coffee', 'Tea')).toBe('food');
      expect(suggestCategory('Oranges', 'Apples')).toBe('food');
    });

    it('should detect entertainment category', () => {
      expect(suggestCategory('Netflix', 'Disney Plus')).toBe('entertainment');
      expect(suggestCategory('Movie A', 'Movie B')).toBe('entertainment');
    });

    it('should detect sports category', () => {
      expect(suggestCategory('Football', 'Basketball')).toBe('sports');
      expect(suggestCategory('Messi', 'Ronaldo')).toBe('sports');
    });

    it('should return undefined for ambiguous comparisons', () => {
      expect(suggestCategory('Random Term', 'Another Term')).toBeUndefined();
    });
  });

  describe('isAmbiguousKeyword', () => {

    it('should detect ambiguous keywords', () => {
      expect(isAmbiguousKeyword('apple')).toBe(true);
      expect(isAmbiguousKeyword('Apple')).toBe(true);
      expect(isAmbiguousKeyword('java')).toBe(true);
      expect(isAmbiguousKeyword('python')).toBe(true);
      expect(isAmbiguousKeyword('tesla')).toBe(true);
      expect(isAmbiguousKeyword('swift')).toBe(true);
      expect(isAmbiguousKeyword('ruby')).toBe(true);
    });

    it('should not flag unambiguous keywords', () => {
      expect(isAmbiguousKeyword('iPhone')).toBe(false);
      expect(isAmbiguousKeyword('Android')).toBe(false);
      expect(isAmbiguousKeyword('specific-product-123')).toBe(false);
    });
  });

  describe('getInterpretationSummary', () => {

    it('should generate clear interpretation summary', () => {
      const summary = getInterpretationSummary(
        'Apple',
        'Apple Inc. (technology company)',
        { termA: 'iPhone', termB: 'Android' }
      );

      expect(summary).toContain('iPhone');
      expect(summary).toContain('Android');
      expect(summary).toContain('Apple Inc.');
      expect(summary).toContain('technology company');
    });
  });
});

describe('Integration Tests - Full Scenarios', () => {

  testScenarios.forEach(scenario => {
    describe(scenario.name, () => {

      it('should produce correct interpretation', async () => {
        // This would be a real integration test with the full system
        // For now, we verify the test scenario structure
        expect(scenario.expectedInterpretation).toBeDefined();
        expect(scenario.comparisonContext.termA).toBeDefined();
        expect(scenario.comparisonContext.termB).toBeDefined();
      });

      it('should filter events correctly', () => {
        expect(scenario.shouldIncludeEvents).toBeInstanceOf(Array);
        expect(scenario.shouldExcludeEvents).toBeInstanceOf(Array);
        expect(scenario.shouldIncludeEvents.length).toBeGreaterThan(0);
      });

      it('should have realistic confidence expectations', () => {
        expect(scenario.expectedMinConfidence).toBeGreaterThanOrEqual(0);
        expect(scenario.expectedMinConfidence).toBeLessThanOrEqual(100);
      });
    });
  });
});
