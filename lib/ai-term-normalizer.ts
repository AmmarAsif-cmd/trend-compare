/**
 * AI-Powered Term Normalizer
 * Uses AI to normalize and format user input keywords for optimal search results
 * 
 * Benefits:
 * - Handles variations, synonyms, common misspellings
 * - Gets correct search terms for Google Trends
 * - Ensures better data matching across all APIs
 * - Solves term matching issues at the source
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ComparisonCategory } from './category-resolver';

export type NormalizedTerm = {
  original: string;
  normalized: string;
  confidence: number;
  reasoning: string;
  alternatives?: string[]; // Alternative search terms if primary doesn't work
  category?: ComparisonCategory; // Detected category (if available)
};

export type TermNormalizationResult = {
  termA: NormalizedTerm;
  termB: NormalizedTerm;
  success: boolean;
  cached: boolean;
};

// Memory cache for normalized terms (5 minutes TTL)
const memoryCache = new Map<string, { result: TermNormalizationResult; expires: number }>();
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expires <= now) {
      memoryCache.delete(key);
    }
  }
}

// Clean cache every 5 minutes
setInterval(cleanMemoryCache, 5 * 60 * 1000);

/**
 * Normalize terms using AI to get optimal search terms
 * This ensures we get the best possible data from Google Trends and other APIs
 */
export async function normalizeTermsWithAI(
  termA: string,
  termB: string,
  category?: ComparisonCategory
): Promise<TermNormalizationResult> {
  // Create cache key (order-independent)
  const cacheKey = [termA.toLowerCase().trim(), termB.toLowerCase().trim()].sort().join('::');

  // Check memory cache first
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    console.log('[AITermNormalizer] 💨 Memory cache HIT:', cacheKey);
    return { ...cached.result, cached: true };
  }

  // Check if Anthropic API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[AITermNormalizer] Anthropic API key not configured, using original terms');
    return {
      termA: {
        original: termA,
        normalized: termA,
        confidence: 0,
        reasoning: 'AI normalization not available',
      },
      termB: {
        original: termB,
        normalized: termB,
        confidence: 0,
        reasoning: 'AI normalization not available',
      },
      success: false,
      cached: false,
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const categoryContext = category ? `\n\nDETECTED CATEGORY: ${category}` : '';
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast, cheap model
      max_tokens: 500,
      temperature: 0, // Deterministic
      system: `You are an expert search term normalizer for trend analysis. Your job is to normalize user input keywords to get the BEST possible search results from Google Trends and other APIs.

CRITICAL RULES:
1. Return the MOST COMMONLY SEARCHED version of each term
2. Use official names, proper capitalization, correct spelling
3. Handle variations, synonyms, and common misspellings
4. For brands/products: Use official brand names (e.g., "iPhone" not "iphone", "Samsung" not "samsung")
5. For people: Use full names or most common search format (e.g., "Taylor Swift" not "taylor swift")
6. For movies/songs: Use official titles with proper formatting
7. For tech: Use official names (e.g., "React" not "react", "JavaScript" not "javascript")
8. Keep terms concise - remove unnecessary words like "vs", "the", "a", etc.
9. If category is provided, use it to inform normalization (e.g., music category → prioritize artist/song names)

EXAMPLES:
- "taylor swift" → "Taylor Swift" (artist name)
- "iphone" → "iPhone" (brand name)
- "react js" → "React" (tech framework)
- "drake" → "Drake" (artist name)
- "jawan movie" → "Jawan" (movie title, remove "movie")
- "samsung phone" → "Samsung" (brand name, remove "phone")
- "python programming" → "Python" (tech, remove "programming")

RESPONSE FORMAT (MUST be ONLY valid JSON, nothing else):
{
  "termA": {
    "normalized": "Taylor Swift",
    "confidence": 95,
    "reasoning": "Standardized to official artist name with proper capitalization",
    "alternatives": ["taylor swift", "TSwift"]
  },
  "termB": {
    "normalized": "Beyoncé",
    "confidence": 95,
    "reasoning": "Standardized to official artist name with proper capitalization",
    "alternatives": ["beyonce", "Beyonce"]
  }
}

CRITICAL: 
- You MUST return a valid JSON object with EXACTLY this structure
- The keys MUST be "termA" and "termB" (not "term_a", "term1", "a", "b", etc.)
- Each term object MUST have "normalized", "confidence", and "reasoning" fields
- Return ONLY the JSON object, no markdown, no code blocks, no additional text!
- Confidence should be 90+ if you're certain, 70-89 if good, below 70 if uncertain
- Include alternatives only if they might be useful for fallback searches`,
      messages: [
        {
          role: 'user',
          content: `Normalize these search terms for optimal Google Trends results:${categoryContext}

Term A: "${termA}"
Term B: "${termB}"

Return the normalized versions that will give the BEST search results. Return ONLY valid JSON.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse AI response
    const responseText = content.text.trim();
    console.log('[AITermNormalizer] 📝 Raw AI response:', responseText);

    // Extract JSON if wrapped in markdown code blocks
    let jsonText = responseText;
    if (responseText.includes('```')) {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1];
      } else {
        // Try to extract JSON object directly
        const directJsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (directJsonMatch && directJsonMatch[0]) {
          jsonText = directJsonMatch[0];
        }
      }
    } else {
      // Try to find JSON object in response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        jsonText = jsonMatch[0];
      }
    }

    console.log('[AITermNormalizer] 📝 Extracted JSON text:', jsonText.substring(0, 500)); // Log first 500 chars

    let result: any;
    try {
      result = JSON.parse(jsonText);
      console.log('[AITermNormalizer] 📝 Parsed result keys:', Object.keys(result));
    } catch (parseError) {
      console.error('[AITermNormalizer] ❌ JSON parse error:', parseError);
      console.error('[AITermNormalizer] ❌ JSON text that failed:', jsonText.substring(0, 500));
      throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // Validate response structure
    if (!result || typeof result !== 'object') {
      console.error('[AITermNormalizer] ❌ Result is not an object:', result);
      throw new Error('AI response is not a valid object');
    }

    // Check if result has termA and termB at top level, or if they're nested differently
    if (!result.termA && !result.term_a) {
      // Maybe the AI returned a different structure - log it for debugging
      console.error('[AITermNormalizer] ❌ Result structure:', JSON.stringify(result, null, 2));
      console.error('[AITermNormalizer] ❌ Result keys:', Object.keys(result));
      
      // Try to find termA in different possible formats
      const termAKey = Object.keys(result).find(k => 
        k.toLowerCase().includes('terma') || 
        k.toLowerCase() === 'a' ||
        k.toLowerCase() === 'term1' ||
        k.toLowerCase() === 'first'
      );
      const termBKey = Object.keys(result).find(k => 
        k.toLowerCase().includes('termb') || 
        k.toLowerCase() === 'b' ||
        k.toLowerCase() === 'term2' ||
        k.toLowerCase() === 'second'
      );
      
      if (termAKey && termBKey) {
        result.termA = result[termAKey];
        result.termB = result[termBKey];
        console.log('[AITermNormalizer] ✅ Found terms with alternative keys:', { termAKey, termBKey });
      } else {
        throw new Error(`AI response missing termA object. Available keys: ${Object.keys(result).join(', ')}`);
      }
    }

    // Normalize key names (handle both termA/termB and term_a/term_b)
    if (result.term_a && !result.termA) {
      result.termA = result.term_a;
    }
    if (result.term_b && !result.termB) {
      result.termB = result.term_b;
    }

    if (!result.termA || typeof result.termA !== 'object') {
      console.error('[AITermNormalizer] ❌ termA is not an object:', result.termA);
      throw new Error(`AI response termA is not a valid object. Type: ${typeof result.termA}, Value: ${JSON.stringify(result.termA)}`);
    }

    if (!result.termB || typeof result.termB !== 'object') {
      console.error('[AITermNormalizer] ❌ termB is not an object:', result.termB);
      throw new Error(`AI response termB is not a valid object. Type: ${typeof result.termB}, Value: ${JSON.stringify(result.termB)}`);
    }

    // Validate and build result with safe property access
    const normalizedResult: TermNormalizationResult = {
      termA: {
        original: termA,
        normalized: result.termA?.normalized || termA,
        confidence: typeof result.termA?.confidence === 'number' ? result.termA.confidence : 0,
        reasoning: result.termA?.reasoning || 'Normalized by AI',
        alternatives: Array.isArray(result.termA?.alternatives) ? result.termA.alternatives : undefined,
        category,
      },
      termB: {
        original: termB,
        normalized: result.termB?.normalized || termB,
        confidence: typeof result.termB?.confidence === 'number' ? result.termB.confidence : 0,
        reasoning: result.termB?.reasoning || 'Normalized by AI',
        alternatives: Array.isArray(result.termB?.alternatives) ? result.termB.alternatives : undefined,
        category,
      },
      success: true,
      cached: false,
    };

    console.log('[AITermNormalizer] ✅ AI normalization successful:', {
      original: [termA, termB],
      normalized: [normalizedResult.termA.normalized, normalizedResult.termB.normalized],
      confidence: [normalizedResult.termA.confidence, normalizedResult.termB.confidence],
    });

    // Cache the result in memory
    memoryCache.set(cacheKey, {
      result: normalizedResult,
      expires: Date.now() + MEMORY_CACHE_TTL_MS,
    });
    console.log('[AITermNormalizer] 💾 Cached in memory:', cacheKey);

    return normalizedResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AITermNormalizer] ❌ Error normalizing terms:', errorMessage);

    // Fallback: return original terms
    return {
      termA: {
        original: termA,
        normalized: termA,
        confidence: 0,
        reasoning: `AI normalization failed: ${errorMessage}`,
      },
      termB: {
        original: termB,
        normalized: termB,
        confidence: 0,
        reasoning: `AI normalization failed: ${errorMessage}`,
      },
      success: false,
      cached: false,
    };
  }
}

/**
 * Quick normalization without AI (fallback)
 * Basic cleanup: trim, capitalize first letter, etc.
 */
export function normalizeTermsBasic(termA: string, termB: string): TermNormalizationResult {
  const normalize = (term: string): string => {
    return term
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return {
    termA: {
      original: termA,
      normalized: normalize(termA),
      confidence: 50,
      reasoning: 'Basic normalization (capitalization only)',
    },
    termB: {
      original: termB,
      normalized: normalize(termB),
      confidence: 50,
      reasoning: 'Basic normalization (capitalization only)',
    },
    success: true,
    cached: false,
  };
}

