/**
 * Context-Aware Peak Explanation Verification
 *
 * Problem: Keywords can have multiple meanings
 * - "Apple" = fruit OR tech company
 * - "Java" = coffee OR programming language
 * - "Tesla" = scientist OR car company
 *
 * Solution: Use BOTH comparison keywords for context
 * - Comparing "iPhone vs Android" → "Apple" peak = tech company
 * - Comparing "oranges vs apples" → "Apple" peak = fruit
 * - Comparing "Java vs Python" → "Java" peak = programming
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export type ContextualRelevanceResult = {
  relevanceScore: number; // 0-100
  interpretation: string; // Which meaning was used
  reasoning: string; // Why this interpretation
  confidence: number; // How confident in the interpretation
  contextMatch: boolean; // Does event match comparison context
};

/**
 * Verify event relevance WITH CONTEXT from both comparison terms
 */
export async function verifyEventWithContext(
  event: {
    title: string;
    description: string;
    date: Date;
    source: string;
  },
  peakKeyword: string,
  comparisonContext: {
    termA: string;
    termB: string;
    category?: string; // e.g., 'tech', 'food', 'entertainment'
  },
  peakDate: Date
): Promise<ContextualRelevanceResult> {
  if (!anthropic) {
    console.warn('[Context Verification] No API key, using basic scoring');
    return {
      relevanceScore: 50,
      interpretation: 'Unknown',
      reasoning: 'AI verification not available',
      confidence: 50,
      contextMatch: true,
    };
  }

  try {
    const prompt = buildContextAwarePrompt(event, peakKeyword, comparisonContext, peakDate);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      temperature: 0, // Deterministic for consistency
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = parseContextualResponse(responseText);

    console.log(`[Context Verification] "${event.title}" → ${result.relevanceScore}% (${result.interpretation})`);

    return result;

  } catch (error) {
    console.error('[Context Verification] Error:', error);
    return {
      relevanceScore: 50,
      interpretation: 'Unknown',
      reasoning: 'Verification failed',
      confidence: 50,
      contextMatch: false,
    };
  }
}

/**
 * Build context-aware prompt for AI
 */
function buildContextAwarePrompt(
  event: { title: string; description: string; date: Date; source: string },
  peakKeyword: string,
  context: { termA: string; termB: string; category?: string },
  peakDate: Date
): string {
  const eventDateStr = event.date.toISOString().split('T')[0];
  const peakDateStr = peakDate.toISOString().split('T')[0];

  return `You are analyzing whether an event is relevant to a search trend peak in a specific context.

COMPARISON CONTEXT:
The user is comparing: "${context.termA}" vs "${context.termB}"
${context.category ? `Category: ${context.category}` : ''}

This comparison tells you WHICH MEANING of ambiguous words to consider.

Examples:
- If comparing "iPhone vs Android" → "Apple" means Apple Inc. (tech), not fruit
- If comparing "oranges vs apples" → "Apple" means fruit, not tech company
- If comparing "Java vs Python" → Both mean programming languages, not coffee/snake
- If comparing "Tesla Model 3 vs Chevy Bolt" → "Tesla" means car company, not scientist
- If comparing "Messi vs Ronaldo" → Context is soccer/football players

PEAK KEYWORD: "${peakKeyword}"
PEAK DATE: ${peakDateStr}

EVENT FOUND:
Title: ${event.title}
Description: ${event.description}
Event Date: ${eventDateStr}
Source: ${event.source}

TASK:
1. Determine which interpretation of "${peakKeyword}" makes sense given the comparison context
2. Verify if this event relates to that specific interpretation
3. Rate relevance considering:
   - Does the event match the comparison context? (most important!)
   - Is the timing aligned (event date ≈ peak date)?
   - Would this event cause searches for "${peakKeyword}" in THIS context?

RESPOND IN THIS EXACT FORMAT:
RELEVANCE: [0-100]
INTERPRETATION: [Which meaning of the keyword - be specific]
REASONING: [One sentence explaining why this event does/doesn't match the comparison context]
CONFIDENCE: [0-100, how sure you are about the interpretation]
CONTEXT_MATCH: [YES/NO - does this event fit the comparison context?]

Example response:
RELEVANCE: 95
INTERPRETATION: Apple Inc. (technology company)
REASONING: iPhone launch event clearly relates to tech comparison context of "iPhone vs Android"
CONFIDENCE: 98
CONTEXT_MATCH: YES

Now analyze the event above:`;
}

/**
 * Parse AI response into structured result
 */
function parseContextualResponse(responseText: string): ContextualRelevanceResult {
  const lines = responseText.trim().split('\n');
  const result: ContextualRelevanceResult = {
    relevanceScore: 50,
    interpretation: 'Unknown',
    reasoning: 'Could not parse response',
    confidence: 50,
    contextMatch: false,
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('RELEVANCE:')) {
      const score = parseInt(trimmed.split(':')[1].trim());
      if (!isNaN(score)) result.relevanceScore = Math.max(0, Math.min(100, score));
    }

    if (trimmed.startsWith('INTERPRETATION:')) {
      result.interpretation = trimmed.split(':')[1].trim();
    }

    if (trimmed.startsWith('REASONING:')) {
      result.reasoning = trimmed.split(':')[1].trim();
    }

    if (trimmed.startsWith('CONFIDENCE:')) {
      const conf = parseInt(trimmed.split(':')[1].trim());
      if (!isNaN(conf)) result.confidence = Math.max(0, Math.min(100, conf));
    }

    if (trimmed.startsWith('CONTEXT_MATCH:')) {
      const match = trimmed.split(':')[1].trim().toUpperCase();
      result.contextMatch = match === 'YES' || match === 'TRUE';
    }
  }

  return result;
}

/**
 * Batch verify multiple events with shared context
 */
export async function batchVerifyWithContext(
  events: Array<{
    event: { title: string; description: string; date: Date; source: string };
    peakKeyword: string;
    peakDate: Date;
  }>,
  comparisonContext: { termA: string; termB: string; category?: string }
): Promise<Map<string, ContextualRelevanceResult>> {
  const results = new Map<string, ContextualRelevanceResult>();

  // Process in batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    const batchPromises = batch.map(({ event, peakKeyword, peakDate }) =>
      verifyEventWithContext(event, peakKeyword, comparisonContext, peakDate)
        .then(result => ({
          key: `${peakKeyword}-${event.title}`,
          result,
        }))
    );

    const batchResults = await Promise.all(batchPromises);

    for (const { key, result } of batchResults) {
      results.set(key, result);
    }

    // Small delay between batches
    if (i + batchSize < events.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Filter events by context match
 * Remove events that don't fit the comparison context
 */
export function filterByContextMatch(
  events: Array<{
    event: any;
    verification: ContextualRelevanceResult;
  }>,
  minRelevance: number = 60
): Array<{ event: any; verification: ContextualRelevanceResult }> {
  return events.filter(({ verification }) => {
    // Must match context AND meet minimum relevance
    return verification.contextMatch && verification.relevanceScore >= minRelevance;
  });
}

/**
 * Get interpretation summary for user display
 */
export function getInterpretationSummary(
  peakKeyword: string,
  interpretation: string,
  comparisonContext: { termA: string; termB: string }
): string {
  return `In the context of comparing "${comparisonContext.termA}" vs "${comparisonContext.termB}", "${peakKeyword}" refers to ${interpretation}.`;
}

/**
 * Detect ambiguous keywords that need context
 */
export function isAmbiguousKeyword(keyword: string): boolean {
  const ambiguousTerms = [
    'apple', 'java', 'python', 'tesla', 'amazon', 'mercury', 'mars',
    'ruby', 'swift', 'go', 'rust', 'oracle', 'spark', 'delta',
    'pearl', 'crystal', 'mint', 'iris', 'olive', 'sage', 'basil',
  ];

  return ambiguousTerms.some(term =>
    keyword.toLowerCase().includes(term)
  );
}

/**
 * Suggest category based on comparison context
 */
export function suggestCategory(termA: string, termB: string): string | undefined {
  const lowerA = termA.toLowerCase();
  const lowerB = termB.toLowerCase();

  // Tech indicators
  const techTerms = ['iphone', 'android', 'windows', 'mac', 'linux', 'ios', 'app', 'software', 'code', 'programming'];
  if (techTerms.some(t => lowerA.includes(t) || lowerB.includes(t))) {
    return 'technology';
  }

  // Food indicators
  const foodTerms = ['pizza', 'burger', 'coffee', 'tea', 'chocolate', 'fruit', 'vegetable'];
  if (foodTerms.some(t => lowerA.includes(t) || lowerB.includes(t))) {
    return 'food';
  }

  // Entertainment indicators
  const entertainmentTerms = ['movie', 'film', 'show', 'series', 'actor', 'netflix', 'disney'];
  if (entertainmentTerms.some(t => lowerA.includes(t) || lowerB.includes(t))) {
    return 'entertainment';
  }

  // Sports indicators
  const sportsTerms = ['football', 'basketball', 'soccer', 'tennis', 'player', 'team', 'league'];
  if (sportsTerms.some(t => lowerA.includes(t) || lowerB.includes(t))) {
    return 'sports';
  }

  // Business/Brands
  const brandTerms = ['vs', 'compare', 'vs.', 'versus'];
  if (brandTerms.some(t => lowerA.includes(t) || lowerB.includes(t))) {
    return 'brands';
  }

  return undefined;
}
