/**
 * AI-Powered Category Detection
 * Uses Claude to intelligently classify comparisons
 * Fast, accurate, context-aware - no hard-coded lists needed
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ComparisonCategory } from './category-resolver';

export type AICategoryResult = {
  category: ComparisonCategory;
  confidence: number; // 0-100
  reasoning: string;
  success: boolean;
};

/**
 * Use AI to detect category - STRICT classification
 * AI MUST choose exactly one category, no ambiguity allowed
 */
export async function detectCategoryWithAI(
  termA: string,
  termB: string
): Promise<AICategoryResult> {
  // Check if Anthropic API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      category: 'general',
      confidence: 0,
      reasoning: 'Anthropic API key not configured',
      success: false,
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
      system: `You are an expert category classification system for trend comparisons. Your job is to classify what type of things are being compared by analyzing BOTH terms together and understanding the context.

CRITICAL: CONTEXT MATTERS
- "tery ishq mein" vs "jawan" = BOTH are Bollywood films → "movies"
- "tery ishq mein" (song) vs "kesariya" (song) = BOTH are songs → "music"
- Look at BOTH terms to understand the comparison context
- A term can mean different things in different contexts

CATEGORY DEFINITIONS (choose EXACTLY ONE):

1. "music" - Music artists, singers, bands, rappers, albums, songs, music genres
   Examples: drake vs kanye, taylor swift vs beyonce, rap vs pop, album names, song titles
   Regional: K-pop artists, Bollywood singers, regional music

2. "movies" - Films, TV shows, web series, movie franchises, actors (in movie context), directors
   Examples: avatar vs inception, netflix vs hbo, bollywood films, korean dramas
   Regional: Bollywood, Tollywood, K-dramas, anime

3. "games" - Video games, gaming platforms, game franchises, esports
   Examples: fortnite vs minecraft, playstation vs xbox, cod vs pubg
   Includes: PC games, console games, mobile games

4. "products" - Physical consumer products, electronics, gadgets, food items, consumer goods
   Examples: iphone vs samsung, nike vs adidas, coca cola vs pepsi
   NOT tech frameworks (those are "tech")

5. "tech" - Programming languages, frameworks, software tools, cloud platforms, developer tools
   Examples: react vs vue, python vs javascript, aws vs azure, vscode vs intellij
   NOT physical products (those are "products")

6. "people" - Politicians, athletes, celebrities, public figures (who are NOT primarily musicians or actors)
   Examples: trump vs biden, messi vs ronaldo, elon musk vs jeff bezos
   NOT musicians (use "music") or actors in movie comparisons (use "movies")

7. "brands" - Companies, corporations, business services, platforms, organizations
   Examples: apple vs microsoft (as companies), google vs facebook, startups

8. "places" - Cities, countries, regions, tourist destinations, locations
   Examples: new york vs los angeles, india vs china, beach vs mountain

9. "general" - Anything that doesn't clearly fit above categories
   Examples: abstract concepts, mixed categories, unclear comparisons

DISAMBIGUATION RULES:
1. If BOTH terms are clearly in the same specific category → choose that category
2. If terms are in different categories BUT one is more specific → choose the more specific one
3. If you see film titles, movie names, or "vs" between movies → "movies" (even if one word could be a song)
4. If you see artist names with "vs" → likely "music" unless context suggests otherwise
5. Regional content:
   - Bollywood/Tollywood film names → "movies"
   - Indian/Korean/Latin music artists → "music"
   - Recognize non-English content correctly

PRIORITY ORDER (when ambiguous):
music > people (if person is known musician)
movies > people (if person is known actor)
tech > brands (if comparing software/frameworks)
games > products (if comparing gaming-related items)

CONFIDENCE SCORING:
- 90-100: Both terms clearly in same category, no ambiguity
- 70-89: Strong indicators for category, minor ambiguity
- 50-69: Moderate confidence, some ambiguity
- Below 50: High uncertainty (return this if very unsure)

RESPONSE FORMAT (MUST be valid JSON):
{
  "category": "one_of_the_nine_categories",
  "confidence": 85,
  "reasoning": "Brief explanation of why this category (1 sentence)"
}

IMPORTANT: Analyze BOTH terms together to understand comparison context!`,
      messages: [
        {
          role: 'user',
          content: `Classify this comparison: "${termA}" vs "${termB}"

Analyze both terms together and determine what is being compared. Consider:
- What do both terms represent?
- Is this comparing movies, music, games, products, tech, people, brands, places, or something else?
- Are these regional/non-English terms? (Bollywood films, K-pop, etc.)
- What is the most specific category that applies to BOTH terms?`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse AI response
    const result = JSON.parse(content.text.trim());

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

    return {
      category: result.category as ComparisonCategory,
      confidence: result.confidence,
      reasoning: result.reasoning,
      success: true,
    };
  } catch (error) {
    console.warn('[AICategoryDetector] ❌ AI detection failed:', error);
    return {
      category: 'general',
      confidence: 0,
      reasoning: 'AI classification failed',
      success: false,
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
