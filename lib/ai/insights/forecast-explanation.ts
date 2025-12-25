/**
 * AI-Assisted Forecast Explanation
 * 
 * Explains 14/30 day forecasts with confidence and warnings
 * Structured input/output with caching and budget controls
 */

import Anthropic from '@anthropic-ai/sdk';
import { guardAICall, createForecastExplanationKey } from '../index';
import { PROMPT_VERSION } from '@/lib/insights/contracts/versions';
import { getCache } from '@/lib/cache';
import type { ForecastBundleSummary } from '@/lib/insights/contracts/forecast-bundle-summary';

export interface ForecastExplanationInput {
  term: string;
  forecast: ForecastBundleSummary;
  category?: string;
}

export interface ForecastExplanationOutput {
  summary: string; // Max 2 sentences
  keyPoints: string[]; // 5-7 bullets max
  warnings?: string[]; // Explicit warnings if any
  uncertainty?: string; // Explicit uncertainty if needed
  confidence: number;
  generatedAt: string;
  promptVersion: string;
}

/**
 * Get forecast explanation
 * 
 * Cache: 30d fresh, 180d stale
 */
export async function getForecastExplanation(
  input: ForecastExplanationInput
): Promise<ForecastExplanationOutput | null> {
  const cacheKey = createForecastExplanationKey(
    input.term,
    input.forecast.forecastHash,
    input.forecast.direction
  );

  // Check cache first
  const cache = getCache();
  const cached = await cache.get<ForecastExplanationOutput>(cacheKey);
  if (cached !== null) {
    console.log('[ForecastExplanation] 💨 Cache HIT');
    return cached;
  }

  // Use guard to check premium, budget, and call AI
  try {
    const { result } = await guardAICall(
      cacheKey,
      'forecastExplanation',
      async () => {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }

        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const forecastInfo = `Forecast for "${input.term}":
- Direction: ${input.forecast.direction}
- Overall confidence: ${input.forecast.overallConfidence}%
- 14-day: ${input.forecast.forecast14Day.averageValue.toFixed(1)} (confidence: ${input.forecast.forecast14Day.confidence}%)
- 30-day: ${input.forecast.forecast30Day.averageValue.toFixed(1)} (confidence: ${input.forecast.forecast30Day.confidence}%)
${input.forecast.warnings && input.forecast.warnings.length > 0 
  ? `- Warnings: ${input.forecast.warnings.join(', ')}`
  : ''}`;

        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 400,
          temperature: 0.3,
          system: `You are an expert at explaining trend forecasts. Explain what the forecast means in clear, actionable terms.

CRITICAL RULES:
- Summary: Maximum 2 sentences
- Key points: 5-7 bullets maximum
- Be explicit about uncertainty when confidence is low
- Highlight warnings if present
- Focus on actionable insights`,
          messages: [
            {
              role: 'user',
              content: `Explain this forecast:
${input.category ? `Category: ${input.category}\n` : ''}
${forecastInfo}

Return JSON with:
1. Brief summary (2 sentences max)
2. 5-7 key points about what the forecast means
3. Warnings if present
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

        const output: ForecastExplanationOutput = {
          summary: parsed.summary || `Forecast for ${input.term} shows ${input.forecast.direction} trend.`,
          keyPoints: Array.isArray(parsed.keyPoints)
            ? parsed.keyPoints.slice(0, 7)
            : [],
          warnings: Array.isArray(parsed.warnings) ? parsed.warnings : input.forecast.warnings,
          uncertainty: parsed.uncertainty || (input.forecast.overallConfidence < 70 ? 'Forecast confidence is below 70%, results should be interpreted with caution.' : undefined),
          confidence: input.forecast.overallConfidence,
          generatedAt: new Date().toISOString(),
          promptVersion: PROMPT_VERSION,
        };

        return output;
      }
    );

    // Cache with TTL: 30d fresh, 180d stale
    const ttl = 30 * 24 * 60 * 60; // 30 days
    const staleTtl = 180 * 24 * 60 * 60; // 180 days
    await cache.set(cacheKey, result, ttl, staleTtl, ['ai:forecastExplanation']);

    return result;
  } catch (error) {
    console.error('[ForecastExplanation] AI call failed:', error);
    return null; // Return null, rely on deterministic content
  }
}

