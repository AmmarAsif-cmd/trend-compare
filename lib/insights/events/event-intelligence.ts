/**
 * Event Intelligence System
 * Learns from successful event detections to improve over time
 * Stores keyword-event mappings and keyword success patterns
 */

import type { UnifiedEvent } from './multi-source-detector';
import { getKeywordCategory, getRelatedKeywords, learnKeyword, type KeywordCategory } from '../../keyword-categories';

export interface EventMapping {
  id: string;
  keywords: string[]; // Original search keywords
  expandedKeywords: string[]; // Keywords that successfully found the event
  event: {
    date: string;
    title: string;
    description: string;
    sources: string[];
  };
  successfulKeyword: string; // Which specific keyword led to the match
  category?: KeywordCategory; // Category of the keyword for better learning
  timestamp: string;
  searchVolume?: number; // How big was the spike
}

export interface KeywordPattern {
  baseKeyword: string; // e.g., "honey-singh"
  successfulVariations: Map<string, number>; // e.g., {"honey singh documentary": 5, "honey singh netflix": 3}
  totalSearches: number;
  lastUpdated: string;
}

/**
 * In-memory storage (will be moved to database)
 * This simulates what will be in PostgreSQL
 */
class EventIntelligenceStore {
  private mappings: Map<string, EventMapping> = new Map();
  private patterns: Map<string, KeywordPattern> = new Map();

  /**
   * Record a successful event detection
   */
  recordSuccess(mapping: Omit<EventMapping, 'id' | 'timestamp'>): void {
    const id = `${mapping.keywords.join('-')}-${mapping.event.date}`;

    // Determine category from keywords
    const category = mapping.category || getKeywordCategory(mapping.keywords[0]);

    const fullMapping: EventMapping = {
      ...mapping,
      category,
      id,
      timestamp: new Date().toISOString(),
    };

    this.mappings.set(id, fullMapping);

    // Update keyword patterns
    this.updatePatterns(mapping.keywords[0], mapping.successfulKeyword, category);

    // Learn this keyword in the category system
    const relatedFromEvent = mapping.keywords.slice(1); // Use other keywords as related
    learnKeyword(mapping.keywords[0], category, relatedFromEvent);

    console.log(`[Intelligence] Recorded successful detection: ${mapping.event.title}`);
    console.log(`[Intelligence] Successful keyword: "${mapping.successfulKeyword}" in category: ${category}`);
  }

  /**
   * Update keyword success patterns
   */
  private updatePatterns(baseKeyword: string, successfulVariation: string, category?: KeywordCategory): void {
    const normalized = baseKeyword.toLowerCase();
    const pattern = this.patterns.get(normalized) || {
      baseKeyword: normalized,
      successfulVariations: new Map(),
      totalSearches: 0,
      lastUpdated: new Date().toISOString(),
    };

    const currentCount = pattern.successfulVariations.get(successfulVariation) || 0;
    pattern.successfulVariations.set(successfulVariation, currentCount + 1);
    pattern.totalSearches++;
    pattern.lastUpdated = new Date().toISOString();

    this.patterns.set(normalized, pattern);

    // Also learn from related keywords in same category
    if (category) {
      const related = getRelatedKeywords(normalized, 5);
      console.log(`[Intelligence] Cross-learning from ${related.length} related keywords in ${category}`);
    }
  }

  /**
   * Get smart keyword suggestions based on historical success
   */
  getSmartKeywords(baseKeyword: string): string[] {
    const normalized = baseKeyword.toLowerCase();
    const pattern = this.patterns.get(normalized);

    if (!pattern) {
      // No historical data for this specific keyword
      // But try to learn from similar keywords in same category
      const category = getKeywordCategory(normalized);
      const related = getRelatedKeywords(normalized, 3);

      const fromRelated: string[] = [];
      for (const relatedKw of related) {
        const relatedPattern = this.patterns.get(relatedKw);
        if (relatedPattern) {
          // Use successful patterns from related keywords
          const topFromRelated = Array.from(relatedPattern.successfulVariations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([kw]) => kw.replace(relatedKw, normalized)); // Adapt to current keyword
          fromRelated.push(...topFromRelated);
        }
      }

      if (fromRelated.length > 0) {
        console.log(`[Intelligence] Learning from related ${category} keywords:`, fromRelated.slice(0, 3));
      }

      return fromRelated;
    }

    // Return variations sorted by success rate
    const sorted = Array.from(pattern.successfulVariations.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([keyword]) => keyword);

    return sorted;
  }

  /**
   * Get all successful mappings for a keyword
   */
  getMappings(keyword: string): EventMapping[] {
    const normalized = keyword.toLowerCase();
    return Array.from(this.mappings.values()).filter(m =>
      m.keywords.some(k => k.toLowerCase().includes(normalized))
    );
  }

  /**
   * Get keyword success statistics
   */
  getStats(keyword: string): KeywordPattern | undefined {
    return this.patterns.get(keyword.toLowerCase());
  }

  /**
   * Export data for persistence (to database)
   */
  export(): { mappings: EventMapping[]; patterns: KeywordPattern[] } {
    return {
      mappings: Array.from(this.mappings.values()),
      patterns: Array.from(this.patterns.values()).map(p => ({
        ...p,
        successfulVariations: Array.from(p.successfulVariations.entries()).reduce(
          (obj, [key, val]) => ({ ...obj, [key]: val }),
          {} as any
        ),
      })),
    };
  }

  /**
   * Import data from persistence (from database)
   */
  import(data: { mappings: EventMapping[]; patterns: any[] }): void {
    this.mappings.clear();
    this.patterns.clear();

    data.mappings.forEach(m => this.mappings.set(m.id, m));
    data.patterns.forEach((p: any) => {
      this.patterns.set(p.baseKeyword, {
        ...p,
        successfulVariations: new Map(Object.entries(p.successfulVariations)),
      });
    });
  }
}

// Global singleton instance
const intelligenceStore = new EventIntelligenceStore();

/**
 * Smart keyword expander that learns from history
 */
export function getIntelligentKeywords(
  baseKeywords: string[],
  defaultExpansion: string[]
): string[] {
  const intelligent: string[] = [];

  for (const keyword of baseKeywords) {
    const learned = intelligenceStore.getSmartKeywords(keyword);
    if (learned.length > 0) {
      console.log(`[Intelligence] Using learned keywords for "${keyword}":`, learned.slice(0, 5));
      intelligent.push(...learned.slice(0, 10)); // Top 10 from history
    }
  }

  // Combine learned + default, deduplicate
  const combined = [...new Set([...intelligent, ...defaultExpansion])];
  return combined;
}

/**
 * Record when an event is successfully detected
 */
export function recordEventDetection(
  keywords: string[],
  expandedKeywords: string[],
  event: UnifiedEvent,
  successfulKeyword: string
): void {
  intelligenceStore.recordSuccess({
    keywords,
    expandedKeywords,
    event: {
      date: event.date,
      title: event.title,
      description: event.description,
      sources: event.sources,
    },
    successfulKeyword,
  });
}

/**
 * Get historical data for a keyword
 */
export function getKeywordHistory(keyword: string): EventMapping[] {
  return intelligenceStore.getMappings(keyword);
}

/**
 * Get keyword success statistics
 */
export function getKeywordStats(keyword: string): KeywordPattern | undefined {
  return intelligenceStore.getStats(keyword);
}

/**
 * Get all intelligence data (for admin dashboard)
 */
export function getIntelligenceData() {
  return intelligenceStore.export();
}

/**
 * Load intelligence data (from database on startup)
 */
export function loadIntelligenceData(data: any) {
  intelligenceStore.import(data);
}

/**
 * Get success rate for a keyword pattern
 */
export function getSuccessRate(keyword: string): number {
  const stats = intelligenceStore.getStats(keyword);
  if (!stats) return 0;

  const totalVariations = stats.successfulVariations.size;
  return stats.totalSearches / Math.max(totalVariations, 1);
}

export { intelligenceStore };
