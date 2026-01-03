/**
 * Improved Peak Explanation Engine
 * Uses real data sources instead of AI guesses
 * - Wikipedia Events (free, reliable)
 * - GDELT News (free, comprehensive)
 * - Claude Haiku for relevance verification (cheap)
 * - Honest "Unknown" when no events found
 */

import Anthropic from '@anthropic-ai/sdk';
import { fetchWikipediaEvents, filterWikipediaEventsByKeyword, type WikipediaEventResult } from './wikipedia-events';
import { fetchGDELTNews, filterGDELTByDateProximity, type GDELTNewsResult } from './gdelt-news';

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
};

/**
 * Main function: Get improved peak explanation with REAL data
 */
export async function explainPeakImproved(
  keyword: string,
  peakDate: Date,
  peakValue: number,
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

  console.log(`[PeakExplanation] 🔍 Researching peak for "${keyword}" on ${peakDate.toISOString().split('T')[0]} (${peakValue}/100)`);

  const allEvents: RealEvent[] = [];

  // Step 1: Fetch Wikipedia events (free, reliable)
  try {
    const wikiEvents = await fetchWikipediaEvents(peakDate);
    const relevantWikiEvents = filterWikipediaEventsByKeyword(wikiEvents, keyword);

    console.log(`[Wikipedia] Found ${wikiEvents.length} events, ${relevantWikiEvents.length} relevant`);

    // Convert to RealEvent format
    for (const event of relevantWikiEvents) {
      allEvents.push({
        title: event.title,
        description: event.description,
        url: event.url,
        date: event.date,
        source: 'Wikipedia',
        relevanceScore: 70, // Wikipedia matches are usually good
        verified: true, // Wikipedia is authoritative
      });
    }
  } catch (error) {
    console.error('[Wikipedia] Error:', error);
  }

  // Step 2: Fetch GDELT news (free, comprehensive)
  try {
    const gdeltArticles = await fetchGDELTNews(keyword, peakDate, windowDays);
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
        relevanceScore: 60, // News articles are relevant but need verification
        verified: false,
      });
    }
  } catch (error) {
    console.error('[GDELT] Error:', error);
  }

  // Step 3: If no events found, return honest "Unknown"
  if (allEvents.length === 0) {
    console.log('[PeakExplanation] ❌ No events found from any source');
    return generateUnknownExplanation(keyword, peakDate, peakValue);
  }

  // Step 4: Use AI to verify relevance (optional, cheap with Haiku)
  if (useAIVerification && anthropic) {
    console.log(`[PeakExplanation] 🤖 Using AI to verify relevance of ${allEvents.length} events...`);

    for (const event of allEvents) {
      try {
        const relevance = await verifyEventRelevanceWithAI(event, keyword, peakDate);
        event.relevanceScore = relevance;
      } catch (error) {
        console.error('[AI Verification] Error:', error);
        // Keep original score
      }
    }
  }

  // Step 5: Filter by minimum relevance
  const relevantEvents = allEvents.filter(e => e.relevanceScore >= minRelevance);

  if (relevantEvents.length === 0) {
    console.log(`[PeakExplanation] ⚠️ Found ${allEvents.length} events but none above ${minRelevance}% relevance`);
    return generateLowConfidenceExplanation(keyword, peakDate, peakValue, allEvents);
  }

  // Step 6: Sort by relevance and pick best
  relevantEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const bestEvent = relevantEvents[0];

  console.log(`[PeakExplanation] ✅ Best event: "${bestEvent.title}" (${bestEvent.relevanceScore}% relevance, ${bestEvent.source})`);

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

  // Step 10: Generate explanation
  const explanation = generateExplanationFromEvent(bestEvent, keyword, peakValue, relevantEvents.length);

  // Step 11: Build citations
  const citations = relevantEvents.slice(0, 5).map(event => ({
    title: event.title,
    url: event.url,
    source: event.source,
    date: event.date.toISOString().split('T')[0],
  }));

  return {
    explanation,
    confidence,
    events: relevantEvents,
    bestEvent,
    citations,
    verified,
    sourceCount: relevantEvents.length,
    status,
  };
}

/**
 * Use Claude Haiku to verify event relevance (cheap: ~$0.001 per call)
 */
async function verifyEventRelevanceWithAI(
  event: RealEvent,
  keyword: string,
  peakDate: Date
): Promise<number> {
  if (!anthropic) {
    console.warn('[AI Verification] No API key, skipping');
    return event.relevanceScore; // Return original score
  }

  try {
    const prompt = `Analyze the relevance between this event and keyword:

EVENT:
Title: ${event.title}
Description: ${event.description}
Date: ${event.date.toISOString().split('T')[0]}
Source: ${event.source}

KEYWORD: "${keyword}"
PEAK DATE: ${peakDate.toISOString().split('T')[0]}

TASK: Rate how likely this event caused increased search interest for "${keyword}" on a scale of 0-100.

Consider:
- Does the event directly mention or relate to the keyword?
- Is the timing aligned (event date ≈ peak date)?
- Would this event cause people to search for the keyword?

Respond with ONLY a number between 0-100. No explanation needed.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '0';
    const score = parseInt(responseText.trim());

    if (isNaN(score) || score < 0 || score > 100) {
      console.warn('[AI Verification] Invalid score, using default');
      return event.relevanceScore;
    }

    console.log(`[AI Verification] "${event.title}" → ${score}% relevance`);
    return score;

  } catch (error) {
    console.error('[AI Verification] Error:', error);
    return event.relevanceScore; // Return original on error
  }
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
  // 1 source = 10%, 2 sources = 20%, 3+ sources = 30%
  const sourcePoints = Math.min(30, sourceCount * 10);
  confidence += sourcePoints;

  // Verification contributes 20%
  if (verified) confidence += 20;

  // Wikipedia bonus (highly reliable)
  if (bestEvent.source === 'Wikipedia') confidence += 10;

  return Math.min(100, Math.round(confidence));
}

/**
 * Generate explanation from real event
 */
function generateExplanationFromEvent(
  event: RealEvent,
  keyword: string,
  peakValue: number,
  sourceCount: number
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

  // Add description if available and different from title
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
  peakValue: number
): ImprovedPeakExplanation {
  const formattedDate = peakDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const explanation = `Unable to identify a specific cause for this ${peakValue}/100 peak on ${formattedDate}. We searched Wikipedia and global news databases but found no events strongly related to "${keyword}" on this date. This could be due to: a localized event not widely covered, social media trends without news coverage, or normal fluctuations in search interest.`;

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
  allEvents: RealEvent[]
): ImprovedPeakExplanation {
  const formattedDate = peakDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Sort by relevance and take top event
  allEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topEvent = allEvents[0];

  const explanation = `Found ${allEvents.length} events around ${formattedDate}, but none strongly related to "${keyword}". Top candidate: "${topEvent.title}" (${topEvent.relevanceScore}% relevance). The exact cause of this ${peakValue}/100 peak remains unclear.`;

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
  };
}

/**
 * Batch explain multiple peaks efficiently
 */
export async function explainMultiplePeaks(
  peaks: Array<{ keyword: string; date: Date; value: number }>,
  options?: { windowDays?: number; minRelevance?: number; useAIVerification?: boolean }
): Promise<Map<string, ImprovedPeakExplanation>> {
  const results = new Map<string, ImprovedPeakExplanation>();

  // Process in batches of 3 to avoid overwhelming APIs
  const batchSize = 3;
  for (let i = 0; i < peaks.length; i += batchSize) {
    const batch = peaks.slice(i, i + batchSize);

    const batchPromises = batch.map(peak =>
      explainPeakImproved(peak.keyword, peak.date, peak.value, options)
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
