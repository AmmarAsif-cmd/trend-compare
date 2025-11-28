/**
 * Keyword Category System
 * Categorizes keywords for better learning and related comparisons
 */

export type KeywordCategory =
  | 'technology'      // Tech products, gadgets, software
  | 'entertainment'   // Movies, TV shows, music, celebrities
  | 'sports'          // Sports teams, athletes, events
  | 'business'        // Companies, brands, products
  | 'politics'        // Politicians, parties, policies
  | 'lifestyle'       // Fashion, food, travel
  | 'health'          // Fitness, wellness, medical
  | 'education'       // Schools, courses, learning
  | 'gaming'          // Video games, consoles, esports
  | 'automotive'      // Cars, bikes, vehicles
  | 'finance'         // Stocks, crypto, investing
  | 'science'         // Research, discoveries
  | 'general';        // Uncategorized

export interface KeywordMetadata {
  keyword: string;
  category: KeywordCategory;
  aliases: string[];       // Alternative names (e.g., "iphone" → ["apple iphone", "iPhone"])
  relatedTerms: string[];  // Related keywords in same category
  popularity?: number;     // Search volume estimate
  trending?: boolean;      // Is it currently trending
}

/**
 * Keyword database with categories
 * This will eventually move to PostgreSQL
 */
const KEYWORD_DATABASE: Map<string, KeywordMetadata> = new Map([
  // Technology - Mobile
  ['iphone', {
    keyword: 'iphone',
    category: 'technology',
    aliases: ['apple iphone', 'iPhone', 'ios'],
    relatedTerms: ['android', 'samsung', 'pixel'],
  }],
  ['android', {
    keyword: 'android',
    category: 'technology',
    aliases: ['android phone', 'google android'],
    relatedTerms: ['iphone', 'pixel', 'samsung'],
  }],
  ['pixel', {
    keyword: 'pixel',
    category: 'technology',
    aliases: ['google pixel', 'pixel phone'],
    relatedTerms: ['iphone', 'android', 'samsung'],
  }],
  ['samsung', {
    keyword: 'samsung',
    category: 'technology',
    aliases: ['samsung galaxy', 'galaxy'],
    relatedTerms: ['iphone', 'android', 'pixel'],
  }],

  // Entertainment - Music/Artists (Punjabi/Indian)
  ['honey-singh', {
    keyword: 'honey-singh',
    category: 'entertainment',
    aliases: ['yo yo honey singh', 'honey singh', 'honey singh singer'],
    relatedTerms: ['badshah', 'ap-dhillon', 'sidhu-moose-wala', 'diljit-dosanjh'],
  }],
  ['badshah', {
    keyword: 'badshah',
    category: 'entertainment',
    aliases: ['badshah rapper', 'badshah singer'],
    relatedTerms: ['honey-singh', 'ap-dhillon', 'sidhu-moose-wala'],
  }],
  ['ap-dhillon', {
    keyword: 'ap-dhillon',
    category: 'entertainment',
    aliases: ['ap dhillon', 'amritpal dhillon'],
    relatedTerms: ['honey-singh', 'badshah', 'sidhu-moose-wala'],
  }],
  ['sidhu-moose-wala', {
    keyword: 'sidhu-moose-wala',
    category: 'entertainment',
    aliases: ['sidhu moose wala', 'moose wala'],
    relatedTerms: ['honey-singh', 'badshah', 'ap-dhillon'],
  }],
  ['diljit-dosanjh', {
    keyword: 'diljit-dosanjh',
    category: 'entertainment',
    aliases: ['diljit dosanjh', 'diljit'],
    relatedTerms: ['honey-singh', 'badshah', 'ap-dhillon'],
  }],

  // Sports - Cricket
  ['virat-kohli', {
    keyword: 'virat-kohli',
    category: 'sports',
    aliases: ['virat kohli', 'kohli'],
    relatedTerms: ['rohit-sharma', 'ms-dhoni', 'sachin-tendulkar'],
  }],
  ['rohit-sharma', {
    keyword: 'rohit-sharma',
    category: 'sports',
    aliases: ['rohit sharma', 'rohit'],
    relatedTerms: ['virat-kohli', 'ms-dhoni'],
  }],

  // Entertainment - Bollywood
  ['shah-rukh-khan', {
    keyword: 'shah-rukh-khan',
    category: 'entertainment',
    aliases: ['shahrukh khan', 'srk', 'shah rukh'],
    relatedTerms: ['salman-khan', 'aamir-khan', 'akshay-kumar'],
  }],
  ['salman-khan', {
    keyword: 'salman-khan',
    category: 'entertainment',
    aliases: ['salman khan', 'salman'],
    relatedTerms: ['shah-rukh-khan', 'aamir-khan'],
  }],

  // Business - Streaming
  ['netflix', {
    keyword: 'netflix',
    category: 'business',
    aliases: ['netflix streaming'],
    relatedTerms: ['amazon-prime', 'disney-plus', 'hotstar'],
  }],
  ['amazon-prime', {
    keyword: 'amazon-prime',
    category: 'business',
    aliases: ['prime video', 'amazon prime video'],
    relatedTerms: ['netflix', 'disney-plus', 'hotstar'],
  }],
]);

/**
 * Get category for a keyword
 */
export function getKeywordCategory(keyword: string): KeywordCategory {
  const normalized = keyword.toLowerCase().replace(/\s+/g, '-');
  const metadata = KEYWORD_DATABASE.get(normalized);

  if (metadata) {
    return metadata.category;
  }

  // Auto-detect category based on patterns
  return detectCategoryFromKeyword(normalized);
}

/**
 * Auto-detect category from keyword patterns
 */
function detectCategoryFromKeyword(keyword: string): KeywordCategory {
  const lower = keyword.toLowerCase();

  // Technology patterns
  if (lower.match(/iphone|android|ios|pixel|samsung|galaxy|mac|windows|linux|tech|software|app|computer/)) {
    return 'technology';
  }

  // Entertainment patterns
  if (lower.match(/singer|actor|actress|movie|film|show|music|album|concert|documentary|netflix|series/)) {
    return 'entertainment';
  }

  // Sports patterns
  if (lower.match(/cricket|football|basketball|player|team|league|sport|fifa|nba|ipl/)) {
    return 'sports';
  }

  // Gaming patterns
  if (lower.match(/game|gaming|console|xbox|playstation|ps5|nintendo|pc gaming|esports/)) {
    return 'gaming';
  }

  // Business/Brand patterns
  if (lower.match(/brand|company|corp|inc|ltd|market|business|startup/)) {
    return 'business';
  }

  return 'general';
}

/**
 * Get related keywords in the same category
 */
export function getRelatedKeywords(keyword: string, limit: number = 10): string[] {
  const normalized = keyword.toLowerCase().replace(/\s+/g, '-');
  const metadata = KEYWORD_DATABASE.get(normalized);

  if (metadata && metadata.relatedTerms.length > 0) {
    return metadata.relatedTerms.slice(0, limit);
  }

  // If not in database, find others in same category
  const category = getKeywordCategory(normalized);
  const related: string[] = [];

  for (const [key, meta] of KEYWORD_DATABASE.entries()) {
    if (meta.category === category && key !== normalized) {
      related.push(key);
      if (related.length >= limit) break;
    }
  }

  return related;
}

/**
 * Add keyword to database (for learning)
 */
export function learnKeyword(
  keyword: string,
  category: KeywordCategory,
  relatedTerms: string[] = []
): void {
  const normalized = keyword.toLowerCase().replace(/\s+/g, '-');

  if (KEYWORD_DATABASE.has(normalized)) {
    // Update existing
    const existing = KEYWORD_DATABASE.get(normalized)!;
    existing.relatedTerms = Array.from(new Set([...existing.relatedTerms, ...relatedTerms]));
  } else {
    // Add new
    KEYWORD_DATABASE.set(normalized, {
      keyword: normalized,
      category,
      aliases: [keyword, normalized],
      relatedTerms,
    });
  }

  console.log(`[Categories] Learned keyword: ${normalized} in category ${category}`);
}

/**
 * Get all keywords in a category
 */
export function getKeywordsByCategory(category: KeywordCategory): string[] {
  const keywords: string[] = [];

  for (const [key, meta] of KEYWORD_DATABASE.entries()) {
    if (meta.category === category) {
      keywords.push(key);
    }
  }

  return keywords;
}

/**
 * Get metadata for a keyword
 */
export function getKeywordMetadata(keyword: string): KeywordMetadata | undefined {
  const normalized = keyword.toLowerCase().replace(/\s+/g, '-');
  return KEYWORD_DATABASE.get(normalized);
}

/**
 * Export database for persistence
 */
export function exportKeywordDatabase() {
  return Array.from(KEYWORD_DATABASE.entries()).map(([_, value]) => value);
}

/**
 * Import database from persistence
 */
export function importKeywordDatabase(data: Array<{ keyword: string } & KeywordMetadata>) {
  KEYWORD_DATABASE.clear();
  data.forEach(item => {
    KEYWORD_DATABASE.set(item.keyword, item);
  });
}
