/**
 * AI-Assisted Peak Explanation
 * 
 * Explains top 1-3 peaks with structured input/output
 * Caching and budget controls
 */

import Anthropic from '@anthropic-ai/sdk';
import { guardAICall, createPeakExplanationKey } from '../index';
import { PROMPT_VERSION } from '@/lib/insights/contracts/versions';
import { getCache } from '@/lib/cache';
import type { PeakNote } from '@/lib/insights/contracts/peak-note';

export interface PeakExplanationInput {
  term: string;
  peaks: PeakNote[]; // Top 1-3 peaks
  category?: string;
}

export interface PeakExplanationOutput {
  peakExplanations: Array<{
    peakId: string;
    summary: string; // Max 2 sentences
    keyPoints: string[]; // 5-7 bullets max
    uncertainty?: string; // Explicit uncertainty if needed
    confidence: number;
    generatedAt: string;
    promptVersion: string;
  }>;
  generatedAt: string;
}

/**
 * Get peak explanations for top peaks
 * 
 * Cache: 30d fresh, 180d stale
 */
export async function getPeakExplanations(
  input: PeakExplanationInput
): Promise<PeakExplanationOutput | null> {
  // Limit to top 3 peaks
  const topPeaks = input.peaks.slice(0, 3);
  if (topPeaks.length === 0) {
    return null;
  }

  // Generate explanations for each peak
  const explanations = await Promise.all(
    topPeaks.map(async (peak) => {
      const cacheKey = createPeakExplanationKey(input.term, peak.peakDate, peak.peakHash);

      // Check cache first
      const cache = getCache();
      const cached = await cache.get<{
        summary: string;
        keyPoints: string[];
        uncertainty?: string;
        confidence: number;
        generatedAt: string;
        promptVersion: string;
      }>(cacheKey);

      if (cached !== null) {
        console.log(`[PeakExplanation] 💨 Cache HIT for peak ${peak.id}`);
        return {
          peakId: peak.id,
          ...cached,
        };
      }

      // Use guard to check premium, budget, and call AI
      try {
        const { result } = await guardAICall(
          cacheKey,
          'peakExplanation',
          async () => {
            if (!process.env.ANTHROPIC_API_KEY) {
              throw new Error('ANTHROPIC_API_KEY not configured');
            }

            const anthropic = new Anthropic({
              apiKey: process.env.ANTHROPIC_API_KEY,
            });

            const peakInfo = `Peak on ${peak.peakDate}:
- Magnitude: ${peak.magnitude}/100
- Duration: ${peak.duration} days
- Type: ${peak.type}
- Classification: ${peak.classification}
${peak.context ? `- Context: ${peak.context}` : ''}`;

            const response = await anthropic.messages.create({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 400,
              temperature: 0.3,
              system: `You are an expert at explaining trend peaks. Explain what likely caused this peak in search interest.

CRITICAL RULES:
- Summary: Maximum 2 sentences
- Key points: 5-7 bullets maximum
- Be explicit about uncertainty when confidence is low
- Focus on likely causes (events, releases, news)
- If uncertain, state it clearly`,
              messages: [
                {
                  role: 'user',
                  content: `Explain this peak for "${input.term}":
${input.category ? `Category: ${input.category}\n` : ''}
${peakInfo}

Return JSON with:
1. Brief summary (2 sentences max)
2. 5-7 key points about likely causes
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

            const explanation = {
              summary: parsed.summary || `Peak in interest for ${input.term} on ${peak.peakDate}.`,
              keyPoints: Array.isArray(parsed.keyPoints)
                ? parsed.keyPoints.slice(0, 7)
                : [],
              uncertainty: parsed.uncertainty,
              confidence: Math.max(0, Math.min(100, parsed.confidence || peak.magnitude)),
              generatedAt: new Date().toISOString(),
              promptVersion: PROMPT_VERSION,
            };

            // Cache with TTL: 30d fresh, 180d stale
            const ttl = 30 * 24 * 60 * 60; // 30 days
            const staleTtl = 180 * 24 * 60 * 60; // 180 days
            await cache.set(cacheKey, explanation, ttl, staleTtl, ['ai:peakExplanation']);

            return {
              peakId: peak.id,
              ...explanation,
            };
          }
        );

        return result;
      } catch (error) {
        console.error(`[PeakExplanation] AI call failed for peak ${peak.id}:`, error);
        // Return null for this peak, continue with others
        return null;
      }
    })
  );

  // Filter out null results
  const validExplanations = explanations.filter((e): e is NonNullable<typeof e> => e !== null);

  if (validExplanations.length === 0) {
    return null; // Return null, rely on deterministic content
  }

  return {
    peakExplanations: validExplanations,
    generatedAt: new Date().toISOString(),
  };
}

