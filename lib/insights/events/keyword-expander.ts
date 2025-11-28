/**
 * Keyword Expansion for Better Event Detection
 * Expands search terms to catch related events
 */

/**
 * Expand keywords to improve search results
 * Examples:
 * - "honey-singh" → ["honey singh", "yo yo honey singh", "honey singh documentary", "honey singh netflix"]
 * - "iphone" → ["iphone", "apple iphone", "iphone launch"]
 */
export function expandKeywords(keywords: string[]): string[] {
  const expanded = new Set<string>();

  for (const keyword of keywords) {
    // Original keyword
    expanded.add(keyword);

    // Remove hyphens and underscores
    const normalized = keyword.replace(/[-_]/g, ' ');
    if (normalized !== keyword) {
      expanded.add(normalized);
    }

    // Common variations
    const lower = normalized.toLowerCase();

    // Artist/person name patterns
    if (lower.includes('singh') || lower.includes('kumar') || lower.includes('khan')) {
      expanded.add(`${normalized} singer`);
      expanded.add(`${normalized} documentary`);
      expanded.add(`${normalized} netflix`);
      expanded.add(`${normalized} news`);
    }

    // Tech product patterns
    if (lower.match(/iphone|pixel|galaxy|android|ios/)) {
      expanded.add(`${normalized} launch`);
      expanded.add(`${normalized} release`);
      expanded.add(`${normalized} announcement`);
      expanded.add(`apple ${normalized}`);
    }

    // Add quoted version for exact match
    expanded.add(`"${normalized}"`);
  }

  return Array.from(expanded);
}

/**
 * Clean and normalize search term for APIs
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Extract relevant keywords from a spike context
 * Used to improve search quality
 */
export function extractRelevantTerms(keywords: string[]): string[] {
  const relevant: string[] = [];

  for (const keyword of keywords) {
    const normalized = normalizeSearchTerm(keyword);

    // Split compound terms
    const parts = normalized.split(/\s+/);

    // Add full term
    relevant.push(normalized);

    // Add significant parts (>3 chars)
    for (const part of parts) {
      if (part.length > 3 && !isStopWord(part)) {
        relevant.push(part);
      }
    }
  }

  return Array.from(new Set(relevant));
}

/**
 * Check if word is a stop word (common, not useful for search)
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
    'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get',
    'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old',
    'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let',
    'put', 'say', 'she', 'too', 'use', 'will', 'with', 'from',
  ]);

  return stopWords.has(word.toLowerCase());
}
