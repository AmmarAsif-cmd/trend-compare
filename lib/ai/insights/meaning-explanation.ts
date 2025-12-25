/**
 * AI-Assisted Meaning Explanation
 * 
 * Converts Interpretations into user-friendly text
 * Structured input/output with caching and budget controls
 */

import Anthropic from '@anthropic-ai/sdk';
import { guardAICall } from '../index';
import { PROMPT_VERSION } from '@/lib/insights/contracts/versions';
import { getCache } from '@/lib/cache';
import { stableHash } from '@/lib/cache/hash';
import { createCacheKey } from '@/lib/cache/hash';
import type { Interpretation } from '@/lib/insights/contracts/interpretations';

export interface MeaningExplanationInput {
  termA: string;
  termB: string;
  interpretations: Interpretation[];
  category?: string;
}

export interface MeaningExplanationOutput {
  summary: string; // Max 2 sentences
  keyInsights: string[]; // 5-7 bullets max
  uncertainty?: string; // Explicit uncertainty if needed
  confidence: number;
  generatedAt: string;
  promptVersion: string;
}

/**
 * Create cache key for meaning explanation
 */
function createMeaningExplanationKey(input: MeaningExplanationInput): string {
  const hash = stableHash({
    termA: input.termA.toLowerCase().trim(),
    termB: input.termB.toLowerCase().trim(),
    interpretationIds: input.interpretations.map(i => i.id).sort(),
  });
  
  return createCacheKey(
    'ai',
    'meaning-explanation',
    PROMPT_VERSION,
    hash
  );
}

/**
 * Get meaning explanation from interpretations
 * 
 * Cache: 30d fresh, 180d stale
 */
export async function getMeaningExplanation(
  input: MeaningExplanationInput
): Promise<MeaningExplanationOutput | null> {
  const cacheKey = createMeaningExplanationKey(input);

  // Check cache first
  const cache = getCache();
  const cached = await cache.get<MeaningExplanationOutput>(cacheKey);
  if (cached !== null) {
    console.log('[MeaningExplanation] 💨 Cache HIT');
    return cached;
  }

  // Use guard to check premium, budget, and call AI
  try {
    const { result } = await guardAICall(
      cacheKey,
      'insightSynthesis',
      async () => {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }

        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Format interpretations for prompt
        const interpretationsText = input.interpretations
          .map(i => `[${i.category}] ${i.text}${i.evidence ? ` (Evidence: ${i.evidence.join(', ')})` : ''}`)
          .join('\n');

        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 400,
          temperature: 0.3,
          system: `You are an expert at explaining data insights in user-friendly language. Convert technical interpretations into clear, actionable insights.

CRITICAL RULES:
- Summary: Maximum 2 sentences
- Key insights: 5-7 bullets maximum
- Be explicit about uncertainty when confidence is low
- Use plain language, avoid jargon
- Focus on actionable insights`,
          messages: [
            {
              role: 'user',
              content: `Explain what these insights mean for "${input.termA}" vs "${input.termB}":
${input.category ? `Category: ${input.category}\n` : ''}

Interpretations:
${interpretationsText}

Return JSON with:
1. Brief summary (2 sentences max)
2. 5-7 key insights (bullets)
3. Explicit uncertainty if confidence is low`,
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

        // Calculate average confidence from interpretations
        const avgConfidence = input.interpretations.length > 0
          ? input.interpretations.reduce((sum, i) => sum + i.confidence, 0) / input.interpretations.length
          : 70;

        const output: MeaningExplanationOutput = {
          summary: parsed.summary || `Comparison between ${input.termA} and ${input.termB} shows interesting patterns.`,
          keyInsights: Array.isArray(parsed.keyInsights)
            ? parsed.keyInsights.slice(0, 7)
            : [],
          uncertainty: parsed.uncertainty,
          confidence: Math.max(0, Math.min(100, parsed.confidence || avgConfidence)),
          generatedAt: new Date().toISOString(),
          promptVersion: PROMPT_VERSION,
        };

        return output;
      }
    );

    // Cache with TTL: 30d fresh, 180d stale
    const ttl = 30 * 24 * 60 * 60; // 30 days
    const staleTtl = 180 * 24 * 60 * 60; // 180 days
    await cache.set(cacheKey, result, ttl, staleTtl, ['ai:meaningExplanation']);

    return result;
  } catch (error) {
    console.error('[MeaningExplanation] AI call failed:', error);
    return null; // Return null, rely on deterministic content
  }
}

