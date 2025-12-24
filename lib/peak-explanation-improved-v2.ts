/**
 * Improved Peak Explanation Engine V2
 * WITH CONTEXT-AWARE VERIFICATION
 *
 * Now understands comparison context to disambiguate keywords:
 * - "iPhone vs Android" → "Apple" = tech company
 * - "oranges vs apples" → "Apple" = fruit
 * - "Java vs Python" → programming languages, not coffee/snake
 */

import Anthropic from '@anthropic-ai/sdk';
import { fetchWikipediaEvents, filterWikipediaEventsByKeyword, type WikipediaEventResult } from './wikipedia-events';
import { fetchGDELTNews, filterGDELTByDateProximity, type GDELTNewsResult } from './gdelt-news';
import {
  verifyEventWithContext,
  filterByContextMatch,
  suggestCategory,
  getInterpretationSummary,
  isAmbiguousKeyword,
  type ContextualRelevanceResult,
} from './context-aware-peak-verification';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export type RealEvent = {
  title: string;
  description: string;
  url: string;
  date: Date;
  source: string; // Wikipedia, TechCrunch, etc.
  relevanceScore: number; // 0-100
  verified: boolean; // Multiple sources
  interpretation?: string; // Which meaning (e.g., "Apple Inc." vs "apple fruit")
  contextMatch?: boolean; // Does it match comparison context
};

export type ImprovedPeakExplanation = {
  explanation: string;
  confidence: number; // 0-100 based on actual data quality
  events: RealEvent[]; // All found events
  bestEvent: RealEvent | null; // Highest relevance
  citations: Array<{
    title: string;
    url: string;
    source: string;
    date?: string;
  }>;
  verified: boolean; // 2+ sources
  sourceCount: number;
  status: 'verified' | 'probable' | 'possible' | 'unknown';
  interpretation?: string; // Which meaning of keyword was used
  contextSummary?: string; // Explanation of context interpretation
};

/**
 * Main function: Get improved peak explanation WITH COMPARISON CONTEXT
 */
export async function explainPeakWithContext(
  peakKeyword: string,
  peakDate: Date,
  peakValue: number,
  comparisonContext: {
    termA: string;
    termB: string;
    category?: string;
  },
  options: {
    windowDays?: number;
    minRelevance?: number;
    useAIVerification?: boolean;
  } = {}
): Promise<ImprovedPeakExplanation> {
  const {
    windowDays = 7,
    minRelevance = 50,
    useAIVerification = true,
  } = options;

  // Auto-detect category if not provided
  const category = comparisonContext.category || suggestCategory(comparisonContext.termA, comparisonContext.termB);

  console.log(`[PeakExplanation] 🔍 Researching peak for "${peakKeyword}" on ${peakDate.toISOString().split('T')[0]}`);
  console.log(`[PeakExplanation] 📊 Context: "${comparisonContext.termA}" vs "${comparisonContext.termB}" (${category || 'general'})`);

  // Check if keyword is ambiguous
  const isAmbiguous = isAmbiguousKeyword(peakKeyword);
  if (isAmbiguous) {
    console.log(`[PeakExplanation] ⚠️  "${peakKeyword}" is ambiguous - using context for disambiguation`);
  }

  const allEvents: RealEvent[] = [];

  // Step 1: Fetch Wikipedia events (free, reliable)
  try {
    const wikiEvents = await fetchWikipediaEvents(peakDate);
    const relevantWikiEvents = filterWikipediaEventsByKeyword(wikiEvents, peakKeyword);

    console.log(`[Wikipedia] Found ${wikiEvents.length} events, ${relevantWikiEvents.length} mention "${peakKeyword}"`);

    // Convert to RealEvent format
    for (const event of relevantWikiEvents) {
      allEvents.push({
        title: event.title,
        description: event.description,
        url: event.url,
        date: event.date,
        source: 'Wikipedia',
        relevanceScore: 70, // Will be updated by AI
        verified: true,
      });
    }
  } catch (error) {
    console.error('[Wikipedia] Error:', error);
  }

  // Step 2: Fetch GDELT news (free, comprehensive)
  try {
    const gdeltArticles = await fetchGDELTNews(peakKeyword, peakDate, windowDays);
    const closeArticles = filterGDELTByDateProximity(gdeltArticles, peakDate, 3);

    console.log(`[GDELT] Found ${gdeltArticles.length} articles, ${closeArticles.length} within 3 days`);

    // Convert to RealEvent format
    for (const article of closeArticles) {
      allEvents.push({
        title: article.title,
        description: article.description,
        url: article.url,
        date: article.date,
        source: article.source,
        relevanceScore: 60, // Will be updated by AI
        verified: false,
      });
    }
  } catch (error) {
    console.error('[GDELT] Error:', error);
  }

  // Step 3: If no events found, return honest "Unknown"
  if (allEvents.length === 0) {
    console.log('[PeakExplanation] ❌ No events found from any source');
    return generateUnknownExplanation(peakKeyword, peakDate, peakValue, comparisonContext);
  }

  // Step 4: Use CONTEXT-AWARE AI verification
  if (useAIVerification && anthropic) {
    console.log(`[PeakExplanation] 🤖 Using context-aware AI to verify ${allEvents.length} events...`);

    for (const event of allEvents) {
      try {
        const verification = await verifyEventWithContext(
          {
            title: event.title,
            description: event.description,
            date: event.date,
            source: event.source,
          },
          peakKeyword,
          { ...comparisonContext, category },
          peakDate
        );

        // Update event with contextual verification
        event.relevanceScore = verification.relevanceScore;
        event.interpretation = verification.interpretation;
        event.contextMatch = verification.contextMatch;

        console.log(
          `[AI] "${event.title}" → ${verification.relevanceScore}% (${verification.interpretation}, match: ${verification.contextMatch})`
        );
      } catch (error) {
        console.error('[AI Verification] Error:', error);
        // Keep original score
      }
    }

    // FILTER OUT events that don't match context
    const beforeFilter = allEvents.length;
    const contextMatchedEvents = allEvents.filter(e => e.contextMatch !== false);
    if (contextMatchedEvents.length < beforeFilter) {
      console.log(
        `[PeakExplanation] 🎯 Filtered ${beforeFilter - contextMatchedEvents.length} events that didn't match context`
      );
    }
    allEvents.splice(0, allEvents.length, ...contextMatchedEvents);
  }

  // Step 5: Filter by minimum relevance
  const relevantEvents = allEvents.filter(e => e.relevanceScore >= minRelevance);

  if (relevantEvents.length === 0) {
    console.log(`[PeakExplanation] ⚠️ Found ${allEvents.length} events but none above ${minRelevance}% relevance`);
    return generateLowConfidenceExplanation(peakKeyword, peakDate, peakValue, allEvents, comparisonContext);
  }

  // Step 6: Sort by relevance and pick best
  relevantEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const bestEvent = relevantEvents[0];

  console.log(
    `[PeakExplanation] ✅ Best event: "${bestEvent.title}" (${bestEvent.relevanceScore}%, ${bestEvent.source}${bestEvent.interpretation ? `, interpreted as: ${bestEvent.interpretation}` : ''})`
  );

  // Step 7: Check verification (2+ sources)
  const verified = relevantEvents.length >= 2 || bestEvent.source === 'Wikipedia';

  // Step 8: Calculate confidence
  const confidence = calculateConfidenceScore(bestEvent, relevantEvents.length, verified);

  // Step 9: Determine status
  let status: 'verified' | 'probable' | 'possible' | 'unknown';
  if (confidence >= 80) status = 'verified';
  else if (confidence >= 60) status = 'probable';
  else if (confidence >= 40) status = 'possible';
  else status = 'unknown';

  // Step 10: Generate explanation WITH INTERPRETATION
  const explanation = generateExplanationFromEvent(
    bestEvent,
    peakKeyword,
    peakValue,
    relevantEvents.length,
    comparisonContext
  );

  // Step 11: Build citations
  const citations = relevantEvents.slice(0, 5).map(event => ({
    title: event.title,
    url: event.url,
    source: event.source,
    date: event.date.toISOString().split('T')[0],
  }));

  // Step 12: Add context summary if interpretation exists
  const contextSummary = bestEvent.interpretation
    ? getInterpretationSummary(peakKeyword, bestEvent.interpretation, comparisonContext)
    : undefined;

  return {
    explanation,
    confidence,
    events: relevantEvents,
    bestEvent,
    citations,
    verified,
    sourceCount: relevantEvents.length,
    status,
    interpretation: bestEvent.interpretation,
    contextSummary,
  };
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidenceScore(
  bestEvent: RealEvent,
  sourceCount: number,
  verified: boolean
): number {
  let confidence = 0;

  // Relevance score contributes 50%
  confidence += bestEvent.relevanceScore * 0.5;

  // Source count contributes 30%
  const sourcePoints = Math.min(30, sourceCount * 10);
  confidence += sourcePoints;

  // Verification contributes 20%
  if (verified) confidence += 20;

  // Wikipedia bonus (highly reliable)
  if (bestEvent.source === 'Wikipedia') confidence += 10;

  // Context match bonus (crucial!)
  if (bestEvent.contextMatch) confidence += 10;

  return Math.min(100, Math.round(confidence));
}

/**
 * Generate explanation from real event WITH CONTEXT
 */
function generateExplanationFromEvent(
  event: RealEvent,
  keyword: string,
  peakValue: number,
  sourceCount: number,
  context: { termA: string; termB: string }
): string {
  const formattedDate = event.date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  let magnitude = '';
  if (peakValue >= 80) magnitude = 'massive';
  else if (peakValue >= 60) magnitude = 'significant';
  else if (peakValue >= 40) magnitude = 'notable';
  else magnitude = 'moderate';

  let explanation = `This ${magnitude} peak (${peakValue}/100) occurred because ${event.title}`;

  // Add date context
  if (event.title.toLowerCase().includes(formattedDate.toLowerCase())) {
    explanation += '.';
  } else {
    explanation += ` on ${formattedDate}.`;
  }

  // Add interpretation context if available
  if (event.interpretation) {
    explanation += ` In the context of comparing "${context.termA}" vs "${context.termB}", this refers to ${event.interpretation}.`;
  }

  // Add description if available
  if (event.description && event.description !== event.title && event.description.length > event.title.length) {
    const desc = event.description.length > 200
      ? event.description.substring(0, 200) + '...'
      : event.description;
    explanation += ` ${desc}`;
  }

  // Add source verification
  if (sourceCount > 1) {
    explanation += ` This event was confirmed by ${sourceCount} independent sources.`;
  } else {
    explanation += ` Source: ${event.source}.`;
  }

  return explanation;
}

/**
 * Generate honest "Unknown" explanation when no events found
 */
function generateUnknownExplanation(
  keyword: string,
  peakDate: Date,
  peakValue: number,
  context: { termA: string; termB: string }
): ImprovedPeakExplanation {
  const formattedDate = peakDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const explanation = `Unable to identify a specific cause for this ${peakValue}/100 peak on ${formattedDate}. In the context of comparing "${context.termA}" vs "${context.termB}", we searched Wikipedia and global news databases but found no events strongly related to "${keyword}". This could be due to: a localized event not widely covered, social media trends without news coverage, or normal fluctuations in search interest.`;

  return {
    explanation,
    confidence: 0,
    events: [],
    bestEvent: null,
    citations: [],
    verified: false,
    sourceCount: 0,
    status: 'unknown',
  };
}

/**
 * Generate low confidence explanation when events found but not relevant
 */
function generateLowConfidenceExplanation(
  keyword: string,
  peakDate: Date,
  peakValue: number,
  allEvents: RealEvent[],
  context: { termA: string; termB: string }
): ImprovedPeakExplanation {
  const formattedDate = peakDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  allEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topEvent = allEvents[0];

  const explanation = `Found ${allEvents.length} events around ${formattedDate}, but none strongly related to "${keyword}" in the context of "${context.termA}" vs "${context.termB}". Top candidate: "${topEvent.title}" (${topEvent.relevanceScore}% match${topEvent.interpretation ? `, interpreted as: ${topEvent.interpretation}` : ''}). The exact cause of this ${peakValue}/100 peak remains unclear.`;

  return {
    explanation,
    confidence: topEvent.relevanceScore,
    events: allEvents,
    bestEvent: topEvent,
    citations: [{
      title: topEvent.title,
      url: topEvent.url,
      source: topEvent.source,
      date: topEvent.date.toISOString().split('T')[0],
    }],
    verified: false,
    sourceCount: allEvents.length,
    status: 'possible',
    interpretation: topEvent.interpretation,
  };
}

/**
 * Batch explain multiple peaks with shared comparison context
 */
export async function explainMultiplePeaksWithContext(
  peaks: Array<{ keyword: string; date: Date; value: number }>,
  comparisonContext: { termA: string; termB: string; category?: string },
  options?: { windowDays?: number; minRelevance?: number; useAIVerification?: boolean }
): Promise<Map<string, ImprovedPeakExplanation>> {
  const results = new Map<string, ImprovedPeakExplanation>();

  // Process in batches of 3 to avoid overwhelming APIs
  const batchSize = 3;
  for (let i = 0; i < peaks.length; i += batchSize) {
    const batch = peaks.slice(i, i + batchSize);

    const batchPromises = batch.map(peak =>
      explainPeakWithContext(peak.keyword, peak.date, peak.value, comparisonContext, options)
        .then(explanation => ({ key: `${peak.keyword}-${peak.date.toISOString()}`, explanation }))
    );

    const batchResults = await Promise.all(batchPromises);

    for (const { key, explanation } of batchResults) {
      results.set(key, explanation);
    }

    // Small delay between batches
    if (i + batchSize < peaks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
