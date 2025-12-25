/**
 * AI-Assisted Keyword Context + Category Detection
 * 
 * Structured input/output with caching and budget controls
 */

import Anthropic from '@anthropic-ai/sdk';
import { guardAICall, createKeywordContextKey } from '../index';
import { PROMPT_VERSION } from '@/lib/insights/contracts/versions';
import { getCache } from '@/lib/cache';
import type { ComparisonCategory } from '@/lib/trendarc-score';

export interface KeywordContextInput {
  termA: string;
  termB: string;
  category?: ComparisonCategory;
}

export interface KeywordContextOutput {
  category: ComparisonCategory;
  categoryConfidence: number;
  categoryReasoning: string;
  context: {
    summary: string; // Max 2 sentences
    keyPoints: string[]; // 5-7 bullets max
    uncertainty?: string; // Explicit uncertainty if needed
  };
  confidence: number;
  generatedAt: string;
  promptVersion: string;
}

/**
 * Get keyword context and category detection with AI
 * 
 * Cache: 180d fresh, 365d stale
 */
export async function getKeywordContext(
  input: KeywordContextInput
): Promise<KeywordContextOutput | null> {
  const cacheKey = createKeywordContextKey(input.termA, input.termB, input.category);

  // Check cache first (long TTL)
  const cache = getCache();
  const cached = await cache.get<KeywordContextOutput>(cacheKey);
  if (cached !== null) {
    console.log('[KeywordContext] 💨 Cache HIT');
    return cached;
  }

  // Use guard to check premium, budget, and call AI
  try {
    const { result } = await guardAICall(
      cacheKey,
      'keywordContext',
      async () => {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }

        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          temperature: 0.3,
          system: `You are an expert at analyzing keyword comparisons and detecting categories. Return ONLY valid JSON matching the exact structure specified.

CRITICAL RULES:
- Summary: Maximum 2 sentences
- Key points: 5-7 bullets maximum
- Be explicit about uncertainty when confidence is low
- Category must be one of: music, movies, games, products, tech, people, brands, places, general
- Confidence: 90+ if certain, 70-89 if good, below 70 if uncertain`,
          messages: [
            {
              role: 'user',
              content: `Analyze these keywords: "${input.termA}" vs "${input.termB}"
${input.category ? `\nDetected category: ${input.category}` : ''}

Return JSON with:
1. Category classification
2. Brief context summary (2 sentences max)
3. 5-7 key points about what these terms represent
4. Explicit uncertainty if confidence is low`,
            },
          ],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
          throw new Error('Unexpected response type');
        }

        // Extract JSON
        let jsonText = content.text.trim();
        if (jsonText.includes('```')) {
          const match = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (match) jsonText = match[1];
        }

        const parsed = JSON.parse(jsonText);

        // Validate and structure output
        const validCategories: ComparisonCategory[] = [
          'music', 'movies', 'games', 'products', 'tech', 'people', 'brands', 'places', 'general',
        ];

        const category = validCategories.includes(parsed.category) 
          ? parsed.category 
          : 'general';

        const output: KeywordContextOutput = {
          category,
          categoryConfidence: Math.max(0, Math.min(100, parsed.categoryConfidence || 70)),
          categoryReasoning: parsed.categoryReasoning || 'AI classification',
          context: {
            summary: parsed.context?.summary || `${input.termA} and ${input.termB} comparison`,
            keyPoints: Array.isArray(parsed.context?.keyPoints) 
              ? parsed.context.keyPoints.slice(0, 7)
              : [],
            uncertainty: parsed.context?.uncertainty,
          },
          confidence: Math.max(0, Math.min(100, parsed.confidence || 70)),
          generatedAt: new Date().toISOString(),
          promptVersion: PROMPT_VERSION,
        };

        return output;
      }
    );

    // Cache with long TTL: 180d fresh, 365d stale
    const ttl = 180 * 24 * 60 * 60; // 180 days
    const staleTtl = 365 * 24 * 60 * 60; // 365 days
    await cache.set(cacheKey, result, ttl, staleTtl, ['ai:keywordContext']);

    return result;
  } catch (error) {
    console.error('[KeywordContext] AI call failed:', error);
    return null; // Return null, rely on deterministic content
  }
}

