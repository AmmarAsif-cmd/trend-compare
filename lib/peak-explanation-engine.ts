/**
 * Peak Explanation Engine
 * Comprehensive system for explaining why keywords peaked at specific times
 * Uses multiple APIs, scoring system, and provides citations
 */

import { getBestEventExplanation, detectEventsMultiSource, type UnifiedEvent } from './insights/events/multi-source-detector';
import { calculateEventRelevance } from './insights/patterns/spikes';

export type PeakExplanation = {
  explanation: string;
  confidence: number; // 0-100
  citations: Array<{
    title: string;
    url: string;
    source: string;
    date?: string;
  }>;
  event?: UnifiedEvent;
  relevanceScore: number; // 0-100
  sources: string[]; // Which APIs found this
  verified: boolean; // Confirmed by multiple sources
};

export type PeakExplanationOptions = {
  keywords: string[];
  peakDate: string | Date;
  peakValue: number; // 0-100
  windowDays?: number; // How many days before/after to search (default: 7)
  minRelevance?: number; // Minimum relevance score (default: 30)
  category?: string; // e.g., 'games', 'movies', 'tech'
};

/**
 * Main function: Get comprehensive peak explanation with citations
 */
export async function explainPeak(options: PeakExplanationOptions): Promise<PeakExplanation | null> {
  const {
    keywords,
    peakDate,
    peakValue,
    windowDays = 7,
    minRelevance = 30,
    category,
  } = options;

  const targetDate = new Date(peakDate);
  const now = new Date();

  // Skip future dates
  if (targetDate > now) {
    console.log(`[PeakExplanation] Skipping future date: ${peakDate}`);
    return null;
  }

  console.log(`[PeakExplanation] 🔍 Explaining peak for "${keywords.join(', ')}" on ${targetDate.toISOString().split('T')[0]} (value: ${peakValue}/100)`);

  try {
    // Step 1: Get best event from multi-source detection
    const event = await getBestEventExplanation(targetDate, keywords, windowDays);

    if (!event) {
      console.log(`[PeakExplanation] ✗ No events found from APIs`);
      return generateFallbackExplanation(keywords, peakDate, peakValue, category);
    }

    // Step 2: Calculate relevance score
    const relevanceScores = keywords.map(kw => calculateEventRelevance(event, kw));
    const maxRelevance = Math.max(...relevanceScores);
    const avgRelevance = relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length;

    console.log(`[PeakExplanation] Event relevance: ${maxRelevance}/100 (avg: ${avgRelevance.toFixed(1)})`);

    // Step 3: Check if relevance is sufficient
    if (maxRelevance < minRelevance) {
      console.log(`[PeakExplanation] ✗ Event relevance too low (${maxRelevance} < ${minRelevance})`);
      return generateFallbackExplanation(keywords, peakDate, peakValue, category);
    }

    // Step 4: Build citations from event sources
    const citations = buildCitations(event, keywords);

    // Step 5: Generate explanation text
    const explanation = generateExplanationText(event, keywords, peakValue, targetDate);

    // Step 6: Calculate confidence based on:
    // - Relevance score (40%)
    // - Number of sources (30%)
    // - Verification status (30%)
    const confidence = calculateConfidence(maxRelevance, event.sources.length, event.verified);

    return {
      explanation,
      confidence,
      citations,
      event,
      relevanceScore: maxRelevance,
      sources: event.sources,
      verified: event.verified || false,
    };

  } catch (error) {
    console.error('[PeakExplanation] Error:', error);
    return generateFallbackExplanation(keywords, peakDate, peakValue, category);
  }
}

/**
 * Generate explanation text from event
 */
function generateExplanationText(
  event: UnifiedEvent,
  keywords: string[],
  peakValue: number,
  date: Date
): string {
  const keyword = keywords[0].replace(/-/g, ' ');
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Determine peak magnitude
  let magnitudeDesc = '';
  if (peakValue >= 80) {
    magnitudeDesc = 'massive';
  } else if (peakValue >= 60) {
    magnitudeDesc = 'significant';
  } else if (peakValue >= 40) {
    magnitudeDesc = 'notable';
  } else {
    magnitudeDesc = 'moderate';
  }

  // Build explanation
  let explanation = `This ${magnitudeDesc} peak (${peakValue}/100) occurred because `;

  // Add event-specific context
  if (event.title.toLowerCase().includes(keyword.toLowerCase())) {
    explanation += `${event.title} happened on ${formattedDate}. `;
  } else {
    explanation += `${event.title} occurred on or around ${formattedDate}. `;
  }

  // Add description if available
  if (event.description) {
    const desc = event.description.length > 200 
      ? event.description.substring(0, 200) + '...' 
      : event.description;
    explanation += desc;
  } else {
    explanation += `This event generated significant media coverage and public interest, driving search volume for "${keyword}".`;
  }

  // Add verification note if applicable
  if (event.verified) {
    explanation += ` This event was confirmed by multiple independent sources.`;
  }

  return explanation;
}

/**
 * Build citations array from event
 */
function buildCitations(event: UnifiedEvent, keywords: string[]): Array<{
  title: string;
  url: string;
  source: string;
  date?: string;
}> {
  const citations: Array<{
    title: string;
    url: string;
    source: string;
    date?: string;
  }> = [];

  // Add Wikipedia citation if available
  if (event.urls && event.urls.length > 0) {
    event.urls.forEach((url, index) => {
      // Determine source from URL
      let source = 'Unknown';
      if (url.includes('wikipedia.org')) {
        source = 'Wikipedia';
      } else if (url.includes('newsapi.org') || url.includes('news')) {
        source = 'News';
      } else if (url.includes('gdelt')) {
        source = 'GDELT';
      } else {
        // Try to extract domain
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          source = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        } catch {
          source = 'External Source';
        }
      }

      citations.push({
        title: index === 0 ? event.title : `${event.title} (Source ${index + 1})`,
        url,
        source,
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : undefined,
      });
    });
  }

  // If no URLs, create a placeholder citation
  if (citations.length === 0 && event.sources.length > 0) {
    citations.push({
      title: event.title,
      url: `#`, // Placeholder
      source: event.sources.join(', '),
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : undefined,
    });
  }

  return citations;
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  relevanceScore: number,
  sourceCount: number,
  verified: boolean
): number {
  // Relevance contributes 40% (0-40 points)
  const relevancePoints = (relevanceScore / 100) * 40;

  // Source count contributes 30% (0-30 points)
  // 1 source = 10 points, 2 sources = 20 points, 3+ sources = 30 points
  const sourcePoints = Math.min(30, sourceCount * 10);

  // Verification contributes 30% (0 or 30 points)
  const verificationPoints = verified ? 30 : 0;

  const total = relevancePoints + sourcePoints + verificationPoints;
  return Math.round(Math.min(100, total));
}

/**
 * Generate fallback explanation when no events found
 */
function generateFallbackExplanation(
  keywords: string[],
  peakDate: string | Date,
  peakValue: number,
  category?: string
): PeakExplanation | null {
  const keyword = keywords[0].replace(/-/g, ' ');
  const date = new Date(peakDate);
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Determine peak magnitude
  let magnitudeDesc = '';
  let possibleReasons: string[] = [];

  if (peakValue >= 80) {
    magnitudeDesc = 'very high';
    possibleReasons = [
      'a major product launch or announcement',
      'significant news coverage or viral moment',
      'a major event or release',
    ];
  } else if (peakValue >= 60) {
    magnitudeDesc = 'significant';
    possibleReasons = [
      'a product update or feature release',
      'news coverage or media attention',
      'a seasonal trend or event',
    ];
  } else if (peakValue >= 40) {
    magnitudeDesc = 'moderate';
    possibleReasons = [
      'increased media coverage',
      'a minor product update',
      'seasonal interest',
    ];
  } else {
    magnitudeDesc = 'minor';
    possibleReasons = [
      'normal fluctuations in search interest',
      'minor news coverage',
      'seasonal patterns',
    ];
  }

  // Category-specific reasons
  if (category === 'games') {
    possibleReasons = [
      'a game update or DLC release',
      'a sale or promotional event',
      'streamer or influencer coverage',
      'a major patch or content update',
    ];
  } else if (category === 'movies') {
    possibleReasons = [
      'a movie release or premiere',
      'trailer release or marketing campaign',
      'awards or nominations',
      'streaming platform availability',
    ];
  } else if (category === 'tech') {
    possibleReasons = [
      'a product launch or announcement',
      'software update or feature release',
      'news coverage or reviews',
      'a security update or bug fix',
    ];
  }

  const explanation = `This ${magnitudeDesc} peak (${peakValue}/100) on ${formattedDate} may have been caused by ${possibleReasons[0]}, ${possibleReasons[1]}, or ${possibleReasons[2]}. The exact cause is unclear, but these are the most likely scenarios based on typical patterns for "${keyword}".`;

  return {
    explanation,
    confidence: 40, // Lower confidence for fallback
    citations: [],
    relevanceScore: 0,
    sources: [],
    verified: false,
  };
}

/**
 * Batch explain multiple peaks
 */
export async function explainPeaks(
  peaks: Array<{ date: string | Date; value: number; term: string }>,
  keywords: string[],
  category?: string
): Promise<Map<string, PeakExplanation | null>> {
  const results = new Map<string, PeakExplanation | null>();

  // Process peaks in parallel (but limit concurrency to avoid API rate limits)
  const batchSize = 3;
  for (let i = 0; i < peaks.length; i += batchSize) {
    const batch = peaks.slice(i, i + batchSize);
    const batchPromises = batch.map(peak =>
      explainPeak({
        keywords: [...keywords, peak.term],
        peakDate: peak.date,
        peakValue: peak.value,
        category,
      }).then(explanation => ({ term: peak.term, date: peak.date.toString(), explanation }))
    );

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ term, date, explanation }) => {
      results.set(`${term}-${date}`, explanation);
    });

    // Small delay between batches to respect rate limits
    if (i + batchSize < peaks.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}


