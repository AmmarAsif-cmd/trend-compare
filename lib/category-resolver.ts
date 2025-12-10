/**
 * Category Resolver
 * Smart detection of what type of things are being compared
 * Uses heuristics + external API validation
 */

export type ComparisonCategory = 
  | 'movies'        // Films, TV shows
  | 'products'      // Consumer products, gadgets
  | 'tech'          // Software, programming languages
  | 'people'        // Celebrities, politicians, athletes
  | 'brands'        // Companies, services
  | 'games'         // Video games
  | 'places'        // Cities, countries, locations
  | 'general';      // Anything else

export type CategoryEvidence = {
  source: string;
  signal: string;
  confidence: number;
};

export type CategoryResult = {
  category: ComparisonCategory;
  confidence: number;
  evidence: CategoryEvidence[];
  subtype?: string;  // e.g., "smartphone" for products, "action" for movies
};

const MOVIE_PATTERNS = [
  /\b(movie|film|watch|streaming|netflix|prime|disney|hbo|trailer|actor|actress|director|oscar|imdb|rotten tomatoes)\b/i,
  /\b(vs|versus).*(watch|better|rating)/i,
  /\b(part|chapter|volume|episode|season)\s*\d+/i,
  /\b(marvel|dc|horror|comedy|action|thriller|drama|animation|animated)\b/i,
];

const MOVIE_TITLE_PATTERNS = [
  /\b(the|a)\s+\w+\s+(movie|film)$/i,
  /^\w+\s+(1|2|3|i|ii|iii|iv|v)$/i, // Sequels like "Avengers 2"
];

const PRODUCT_PATTERNS = [
  /\b(buy|price|review|specs|features|vs|compare|better|best|cheap|expensive|amazon|ebay|walmart)\b/i,
  /\b(iphone|samsung|pixel|galaxy|macbook|laptop|phone|tablet|headphones|earbuds|camera|tv|monitor)\b/i,
  /\b(gb|tb|mah|inch|hz|mp|megapixel)\b/i,
];

const TECH_PATTERNS = [
  /\b(programming|language|framework|library|api|sdk|database|server|cloud|github|npm|pypi)\b/i,
  /\b(react|angular|vue|svelte|next|node|python|javascript|typescript|rust|go|java|swift)\b/i,
  /\b(aws|azure|gcp|docker|kubernetes|linux|windows|mac|ios|android)\b/i,
];

const PEOPLE_PATTERNS = [
  /\b(singer|actor|actress|politician|athlete|player|celebrity|star|musician|artist|author)\b/i,
  /\b(net worth|age|height|wife|husband|married|dating|biography)\b/i,
];

const GAME_PATTERNS = [
  /\b(game|gaming|playstation|xbox|nintendo|steam|pc game|mobile game|fps|rpg|mmo)\b/i,
  /\b(call of duty|fortnite|minecraft|gta|fifa|pubg|valorant|league of legends)\b/i,
];

const BRAND_PATTERNS = [
  /\b(company|brand|service|subscription|platform|app|website)\b/i,
  /\b(inc|corp|llc|ltd|co)\b/i,
];

const KNOWN_MOVIES = new Set([
  'avengers', 'avatar', 'titanic', 'inception', 'interstellar', 'oppenheimer', 'barbie',
  'batman', 'superman', 'spiderman', 'ironman', 'thor', 'hulk', 'deadpool',
  'star wars', 'lord of the rings', 'harry potter', 'hunger games', 'twilight',
  'fast and furious', 'mission impossible', 'james bond', 'john wick',
  'jurassic park', 'jurassic world', 'toy story', 'frozen', 'lion king',
  'matrix', 'terminator', 'alien', 'predator', 'transformers',
  'shawshank', 'godfather', 'dark knight', 'fight club', 'pulp fiction',
  'forrest gump', 'gladiator', 'braveheart', 'saving private ryan',
]);

const KNOWN_PRODUCTS = new Set([
  'iphone', 'samsung', 'pixel', 'galaxy', 'oneplus', 'xiaomi', 'huawei',
  'macbook', 'thinkpad', 'surface', 'dell', 'hp', 'lenovo', 'asus',
  'playstation', 'xbox', 'nintendo', 'switch',
  'airpods', 'beats', 'bose', 'sony', 'jbl', 'sennheiser',
  'nike', 'adidas', 'puma', 'reebok', 'under armour',
]);

const KNOWN_PEOPLE = new Set([
  'elon musk', 'jeff bezos', 'bill gates', 'mark zuckerberg', 'tim cook',
  'taylor swift', 'beyonce', 'drake', 'kanye', 'rihanna', 'ariana grande',
  'tom cruise', 'leonardo dicaprio', 'brad pitt', 'johnny depp',
  'cristiano ronaldo', 'messi', 'lebron james', 'michael jordan',
  'trump', 'biden', 'obama', 'modi', 'putin',
]);

/**
 * Detect category for a pair of comparison terms
 */
export function detectCategory(terms: string[]): CategoryResult {
  const combined = terms.join(' ').toLowerCase();
  const evidence: CategoryEvidence[] = [];
  const scores: Record<ComparisonCategory, number> = {
    movies: 0,
    products: 0,
    tech: 0,
    people: 0,
    brands: 0,
    games: 0,
    places: 0,
    general: 10, // Base score for general
  };

  // Check known entities
  for (const term of terms) {
    const lower = term.toLowerCase();
    
    if (KNOWN_MOVIES.has(lower) || [...KNOWN_MOVIES].some(m => lower.includes(m))) {
      scores.movies += 40;
      evidence.push({ source: 'known_entity', signal: `${term} is a known movie/franchise`, confidence: 80 });
    }
    
    if (KNOWN_PRODUCTS.has(lower) || [...KNOWN_PRODUCTS].some(p => lower.includes(p))) {
      scores.products += 40;
      evidence.push({ source: 'known_entity', signal: `${term} is a known product/brand`, confidence: 80 });
    }
    
    if (KNOWN_PEOPLE.has(lower) || [...KNOWN_PEOPLE].some(p => lower.includes(p))) {
      scores.people += 40;
      evidence.push({ source: 'known_entity', signal: `${term} is a known person`, confidence: 80 });
    }
  }

  // Pattern matching
  for (const pattern of MOVIE_PATTERNS) {
    if (pattern.test(combined)) {
      scores.movies += 20;
      evidence.push({ source: 'pattern', signal: `Matched movie pattern: ${pattern.source}`, confidence: 60 });
    }
  }

  for (const pattern of PRODUCT_PATTERNS) {
    if (pattern.test(combined)) {
      scores.products += 20;
      evidence.push({ source: 'pattern', signal: `Matched product pattern`, confidence: 60 });
    }
  }

  for (const pattern of TECH_PATTERNS) {
    if (pattern.test(combined)) {
      scores.tech += 25;
      evidence.push({ source: 'pattern', signal: `Matched tech pattern`, confidence: 65 });
    }
  }

  for (const pattern of PEOPLE_PATTERNS) {
    if (pattern.test(combined)) {
      scores.people += 20;
      evidence.push({ source: 'pattern', signal: `Matched people pattern`, confidence: 60 });
    }
  }

  for (const pattern of GAME_PATTERNS) {
    if (pattern.test(combined)) {
      scores.games += 25;
      evidence.push({ source: 'pattern', signal: `Matched gaming pattern`, confidence: 65 });
    }
  }

  for (const pattern of BRAND_PATTERNS) {
    if (pattern.test(combined)) {
      scores.brands += 15;
      evidence.push({ source: 'pattern', signal: `Matched brand pattern`, confidence: 50 });
    }
  }

  // Find highest scoring category
  let maxCategory: ComparisonCategory = 'general';
  let maxScore = scores.general;

  for (const [category, score] of Object.entries(scores) as [ComparisonCategory, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category;
    }
  }

  // Calculate confidence (normalize to 0-100)
  const confidence = Math.min(95, Math.max(20, maxScore));

  return {
    category: maxCategory,
    confidence,
    evidence,
  };
}

/**
 * Get category-specific data sources to query
 */
export function getDataSourcesForCategory(category: ComparisonCategory): string[] {
  switch (category) {
    case 'movies':
      return ['google-trends', 'tmdb', 'omdb', 'youtube', 'wikipedia'];
    case 'products':
      return ['google-trends', 'youtube', 'reddit', 'wikipedia'];
    case 'tech':
      return ['google-trends', 'github', 'reddit', 'youtube'];
    case 'people':
      return ['google-trends', 'youtube', 'wikipedia', 'reddit'];
    case 'games':
      return ['google-trends', 'youtube', 'reddit', 'twitch'];
    case 'brands':
      return ['google-trends', 'youtube', 'reddit', 'wikipedia'];
    default:
      return ['google-trends', 'youtube', 'wikipedia'];
  }
}

/**
 * Get recommendation template for category
 */
export function getRecommendationTemplate(category: ComparisonCategory): {
  action: string;
  comparison: string;
  suggestion: string;
} {
  switch (category) {
    case 'movies':
      return {
        action: 'watch',
        comparison: 'more popular film',
        suggestion: 'Based on ratings and audience interest, you should watch',
      };
    case 'products':
      return {
        action: 'consider',
        comparison: 'more popular choice',
        suggestion: 'Based on search trends and user interest, the better choice is',
      };
    case 'tech':
      return {
        action: 'use',
        comparison: 'more widely adopted',
        suggestion: 'Based on developer adoption and community activity,',
      };
    case 'people':
      return {
        action: 'follow',
        comparison: 'more trending',
        suggestion: 'Currently generating more interest:',
      };
    case 'games':
      return {
        action: 'play',
        comparison: 'more popular game',
        suggestion: 'Based on player interest and engagement,',
      };
    case 'brands':
      return {
        action: 'explore',
        comparison: 'more popular brand',
        suggestion: 'Based on search trends and user preference,',
      };
    default:
      return {
        action: 'explore',
        comparison: 'more popular',
        suggestion: 'Based on our analysis,',
      };
  }
}
