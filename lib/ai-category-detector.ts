/**
 * AI-Powered Category Detection
 * Uses Claude to intelligently classify comparisons
 * Fast, accurate, context-aware - no hard-coded lists needed
 *
 * Implements 3-tier caching:
 * 1. Memory cache (in-process, 10 min TTL)
 * 2. Database cache (persistent, 90 day TTL) - via category-cache.ts
 * 3. AI detection (fallback, ~$0.0001 per call)
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ComparisonCategory } from './category-resolver';

export type AICategoryResult = {
  category: ComparisonCategory;
  confidence: number; // 0-100
  reasoning: string;
  success: boolean;
  cached?: boolean; // Whether result came from cache
};

// In-memory cache for request-level caching (Tier 1)
// Prevents duplicate AI calls within the same server process
const memoryCache = new Map<string, { result: AICategoryResult; expires: number }>();
const MEMORY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Clean up expired entries from memory cache
 */
function cleanMemoryCache(): void {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expires < now) {
      memoryCache.delete(key);
    }
  }
}

// Clean cache every 5 minutes
setInterval(cleanMemoryCache, 5 * 60 * 1000);

/**
 * Use AI to detect category - STRICT classification
 * AI MUST choose exactly one category, no ambiguity allowed
 */
export async function detectCategoryWithAI(
  termA: string,
  termB: string
): Promise<AICategoryResult> {
  // Create cache key (order-independent)
  const cacheKey = [termA.toLowerCase(), termB.toLowerCase()].sort().join('::');

  // Check memory cache first (Tier 1)
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    console.log('[AICategoryDetector] 💨 Memory cache HIT:', cacheKey);
    return { ...cached.result, cached: true };
  }

  // Check if Anthropic API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      category: 'general',
      confidence: 0,
      reasoning: 'Anthropic API key not configured',
      success: false,
      cached: false,
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast, cheap model for classification
      max_tokens: 250,
      temperature: 0, // Deterministic
      system: `You are an expert category classification system for trend comparisons. Your job is to classify what type of things are being compared by analyzing BOTH terms together.

CRITICAL RULES:
1. CONTEXT MATTERS - analyze BOTH terms together
2. When comparing 2 films → ALWAYS return "movies" (even if one name sounds like a song)
3. When comparing 2 songs/artists → ALWAYS return "music"
4. Regional content (Bollywood, K-pop, anime) follows same rules as English content
5. You MUST return valid JSON with the exact format specified below

CATEGORY DEFINITIONS (choose EXACTLY ONE from these 9 categories):

1. "movies" - ANY comparison of:
   • Film titles (Hollywood, Bollywood, Tollywood, Korean, anime, etc.)
   • TV shows, web series, streaming content
   • Movie franchises
   • Actors/directors when compared in movie context

   Examples:
   - "jawan vs pathaan" → movies (Bollywood films)
   - "homebound vs tery ishq mein" → movies (films)
   - "avatar vs inception" → movies
   - "squid game vs money heist" → movies (TV series)
   - ANY film-like titles, even if you don't recognize them → movies

   IMPORTANT: If both terms look like film/show titles → "movies" (confidence 90+)

2. "music" - ANY comparison of:
   • Artists, singers, bands, rappers, DJs
   • Albums, songs, music tracks
   • Music genres

   Examples:
   - "drake vs kanye" → music (artists)
   - "kesariya vs tery ishq mein song" → music (songs)
   - "BTS vs blackpink" → music (K-pop)
   - "arijit singh vs sonu nigam" → music (Bollywood singers)

3. "games" - Video games, gaming platforms, esports
   Examples: fortnite vs minecraft, playstation vs xbox, valorant vs cs2

4. "products" - Physical consumer products
   Examples: iphone vs samsung, nike vs adidas, cola vs pepsi
   NOT software/frameworks

5. "tech" - Programming, software, cloud, dev tools
   Examples: react vs vue, python vs javascript, aws vs azure
   NOT physical electronics

6. "people" - Politicians, athletes, public figures (NOT musicians/actors in entertainment context)
   Examples: trump vs biden, messi vs ronaldo, elon vs bezos

7. "brands" - Companies, corporations, platforms
   Examples: apple vs microsoft, google vs facebook, uber vs lyft

8. "places" - Locations, cities, countries, regions
   Examples: paris vs london, india vs china, beach vs mountain

9. "general" - ONLY use when:
   • Abstract concepts that don't fit above
   • Mixed/unclear categories
   • NOT for movies you don't recognize - unknown film titles should still be "movies"

DECISION PROCESS:
Step 1: Look at BOTH terms - what do they appear to be?
Step 2: Are they both the same type? (both films, both songs, both games, etc.)
Step 3: If yes → choose that specific category
Step 4: If unsure but they look like films → "movies" (not "general")

CONFIDENCE SCORING:
- 95-100: Both terms clearly identifiable as same category type
- 80-94: Strong evidence, minor uncertainty about one term
- 70-79: Good evidence but some ambiguity
- Below 70: High uncertainty (system will use API fallback)

RESPONSE FORMAT (MUST be ONLY valid JSON, nothing else):
{
  "category": "movies",
  "confidence": 95,
  "reasoning": "Both terms appear to be film titles"
}

EXAMPLES OF CORRECT RESPONSES:
• "jawan vs pathaan" → {"category": "movies", "confidence": 95, "reasoning": "Both are Bollywood film titles"}
• "drake vs kanye" → {"category": "music", "confidence": 100, "reasoning": "Both are well-known music artists"}
• "unknown1 vs unknown2" → {"category": "general", "confidence": 40, "reasoning": "Cannot determine what is being compared"}

IMPORTANT: Return ONLY the JSON object, no additional text!`,
      messages: [
        {
          role: 'user',
          content: `Classify: "${termA}" vs "${termB}"

What type of things are being compared? Return ONLY valid JSON.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse AI response
    const responseText = content.text.trim();
    console.log('[AICategoryDetector] 📝 Raw AI response:', responseText);

    // Extract JSON if wrapped in markdown code blocks
    let jsonText = responseText;
    if (responseText.includes('```')) {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    }

    const result = JSON.parse(jsonText);

    // Validate category
    const validCategories: ComparisonCategory[] = [
      'music',
      'movies',
      'games',
      'products',
      'tech',
      'people',
      'brands',
      'places',
      'general',
    ];

    if (!validCategories.includes(result.category)) {
      throw new Error(`Invalid category: ${result.category}`);
    }

    console.log('[AICategoryDetector] ✅ AI classification:', {
      terms: [termA, termB],
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
    });

    const aiResult: AICategoryResult = {
      category: result.category as ComparisonCategory,
      confidence: result.confidence,
      reasoning: result.reasoning,
      success: true,
      cached: false,
    };

    // Cache the result in memory for future requests (Tier 1)
    memoryCache.set(cacheKey, {
      result: aiResult,
      expires: Date.now() + MEMORY_CACHE_TTL_MS,
    });
    console.log('[AICategoryDetector] 💾 Cached in memory:', cacheKey);

    return aiResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('[AICategoryDetector] ❌ AI detection failed:', {
      error: errorMessage,
      termA,
      termB,
    });

    return {
      category: 'general',
      confidence: 0,
      reasoning: `AI classification failed: ${errorMessage}`,
      success: false,
      cached: false,
    };
  }
}

/**
 * Get data sources to query based on AI-detected category
 */
export function getAPIsForCategory(category: ComparisonCategory): {
  spotify: boolean;
  tmdb: boolean;
  steam: boolean;
  bestbuy: boolean;
  github: boolean;
} {
  switch (category) {
    case 'music':
      return { spotify: true, tmdb: false, steam: false, bestbuy: false, github: false };

    case 'movies':
      return { spotify: false, tmdb: true, steam: false, bestbuy: false, github: false };

    case 'games':
      return { spotify: false, tmdb: false, steam: true, bestbuy: false, github: false };

    case 'products':
      return { spotify: false, tmdb: false, steam: false, bestbuy: true, github: false };

    case 'tech':
      return { spotify: false, tmdb: false, steam: false, bestbuy: false, github: true };

    case 'people':
    case 'brands':
    case 'places':
    case 'general':
    default:
      // For general categories, don't query specialized APIs
      return { spotify: false, tmdb: false, steam: false, bestbuy: false, github: false };
  }
}
