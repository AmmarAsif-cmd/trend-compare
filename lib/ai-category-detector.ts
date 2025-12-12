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
      max_tokens: 200,
      temperature: 0, // Deterministic
      system: `You are a category classification system. Your ONLY job is to classify comparisons into exactly ONE category.

STRICT RULES:
1. You MUST respond with ONLY valid JSON - no markdown, no explanation outside JSON
2. You MUST choose EXACTLY ONE category from this list:
   - "music" (artists, singers, bands, albums, songs)
   - "movies" (films, TV shows, actors, directors)
   - "games" (video games - PC, console, mobile)
   - "products" (physical products, gadgets, electronics, consumer goods)
   - "tech" (programming languages, frameworks, software tools, cloud services)
   - "people" (politicians, athletes, celebrities who are NOT musicians)
   - "brands" (companies, services, platforms)
   - "places" (cities, countries, locations)
   - "general" (anything else that doesn't fit above categories)

3. Your confidence must be 0-100 (how certain you are)
4. If even ONE term is clearly in a category, choose that category
5. Prioritize specificity: music > people, tech > brands, games > products

RESPONSE FORMAT (exact JSON only):
{
  "category": "one_of_the_categories_above",
  "confidence": 85,
  "reasoning": "Brief 1-sentence explanation"
}`,
      messages: [
        {
          role: 'user',
          content: `Classify this comparison: "${termA}" vs "${termB}"`,
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
