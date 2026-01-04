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
    // Step 1: Get ALL events from multi-source detection (not just best)
    const allEvents = await detectEventsMultiSource(targetDate, keywords, windowDays);
    
    console.log(`[PeakExplanation] Found ${allEvents.length} total events from all sources`);

    if (allEvents.length === 0) {
      console.log(`[PeakExplanation] ✗ No events found from any API`);
      return generateFallbackExplanation(keywords, peakDate, peakValue, category);
    }

    // Step 2: Calculate relevance for all events and find best match
    let bestEvent: UnifiedEvent | null = null;
    let maxRelevance = 0;
    
    for (const event of allEvents) {
      const relevanceScores = keywords.map(kw => calculateEventRelevance(event, kw));
      const eventRelevance = Math.max(...relevanceScores);
      
      if (eventRelevance > maxRelevance) {
        maxRelevance = eventRelevance;
        bestEvent = event;
      }
    }

    if (!bestEvent) {
      console.log(`[PeakExplanation] ✗ Could not determine best event`);
      return generateFallbackExplanation(keywords, peakDate, peakValue, category);
    }

    console.log(`[PeakExplanation] Best event: "${bestEvent.title}" (relevance: ${maxRelevance}/100, sources: ${bestEvent.sources.length}, verified: ${bestEvent.verified})`);

    // Step 3: Check if relevance is sufficient (lowered threshold for better detection)
    if (maxRelevance < minRelevance) {
      console.log(`[PeakExplanation] ⚠️ Event relevance low (${maxRelevance} < ${minRelevance}), but using it anyway with lower confidence`);
      // Continue anyway, but with lower confidence
    }

    // Step 4: Build comprehensive citations from event sources (ALWAYS generate citations)
    const citations = buildCitations(bestEvent, keywords);
    
    console.log(`[PeakExplanation] Built ${citations.length} citations`);

    // Step 5: Generate detailed explanation text (with optional AI enhancement)
    let explanation = generateExplanationText(bestEvent, keywords, peakValue, targetDate);
    
    // Try to enhance with AI if API key is available (optional, doesn't block)
    if (process.env.ANTHROPIC_API_KEY && bestEvent.description) {
      try {
        const enhanced = await enhanceExplanationWithAI(
          explanation,
          bestEvent,
          keywords[0],
          peakValue,
          targetDate
        );
        if (enhanced) {
          explanation = enhanced;
        }
      } catch (error) {
        console.warn('[PeakExplanation] AI enhancement failed, using base explanation:', error);
        // Continue with base explanation
      }
    }

    // Step 6: Calculate confidence based on:
    // - Relevance score (40%)
    // - Number of sources (30%)
    // - Verification status (30%)
    const confidence = calculateConfidence(maxRelevance, bestEvent.sources.length, bestEvent.verified);

    console.log(`[PeakExplanation] ✅ Generated explanation with ${citations.length} citations, confidence: ${confidence}%`);

    return {
      explanation,
      confidence,
      citations,
      event: bestEvent,
      relevanceScore: maxRelevance,
      sources: bestEvent.sources,
      verified: bestEvent.verified || false,
    };

  } catch (error) {
    console.error('[PeakExplanation] Error:', error);
    return generateFallbackExplanation(keywords, peakDate, peakValue, category);
  }
}

/**
 * Cached version of explainPeak - uses cache to avoid recalculating same peaks
 * Historical events never change, so we can cache forever!
 */
export async function explainPeakWithCache(options: PeakExplanationOptions): Promise<PeakExplanation | null> {
  const { keywords, peakDate, peakValue, category } = options;
  const targetDate = new Date(peakDate);
  const primaryKeyword = keywords[0] || '';
  
  // Create cache key: keyword:YYYY-MM-DD
  const dateStr = targetDate.toISOString().split('T')[0];
  const normalizedKeyword = primaryKeyword.toLowerCase().trim().replace(/\s+/g, '-');
  const cacheKey = `peak-explanation:${normalizedKeyword}:${dateStr}`;
  
  // Try cache first (using unified cache system)
  try {
    const { getCache, getOrSet } = await import('./cache');
    const cache = getCache();
    
    // Use getOrSet for request coalescing and stale-while-revalidate
    const explanation = await getOrSet(
      cacheKey,
      30 * 24 * 60 * 60, // 30 days TTL (historical events don't change)
      async () => {
        console.log(`[PeakExplanation] 🔍 Cache MISS for ${cacheKey}, generating...`);
        return await explainPeak(options);
      },
      {
        staleTtlSeconds: 90 * 24 * 60 * 60, // 90 days stale TTL
        tags: [`peak:${normalizedKeyword}`, `date:${dateStr}`],
      }
    );
    
    if (explanation) {
      console.log(`[PeakExplanation] ✅ Using explanation for ${cacheKey}`);
    }
    
    return explanation;
  } catch (error) {
    console.warn('[PeakExplanation] Cache error, falling back to direct call:', error);
    // Fallback to direct call if cache fails
    return explainPeak(options);
  }
}

/**
 * Generate explanation text from event with detailed information
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

  // Build detailed explanation
  let explanation = `This ${magnitudeDesc} peak (${peakValue}/100) occurred on ${formattedDate} because `;

  // Add specific event title
  explanation += `${event.title}. `;

  // Add detailed description if available
  if (event.description && event.description.trim()) {
    const desc = event.description.length > 300 
      ? event.description.substring(0, 300) + '...' 
      : event.description;
    explanation += desc + ' ';
  }

  // Add source information
  const sourceNames = event.sources.map(s => {
    if (s === 'wikipedia') return 'Wikipedia';
    if (s === 'gdelt') return 'GDELT';
    if (s === 'newsapi') return 'NewsAPI';
    if (s === 'tech-db') return 'Tech Events Database';
    return s;
  }).join(', ');

  if (event.sources.length > 0) {
    explanation += `This event was reported by ${sourceNames}. `;
  }

  // Add verification note if applicable
  if (event.verified) {
    explanation += `The event was verified by multiple independent sources, confirming its connection to the search interest spike.`;
  }

  // Add impact statement
  explanation += ` The media coverage and public attention around this event directly drove search interest for "${keyword}" to reach ${peakValue}/100.`;

  return explanation;
}

/**
 * Build citations array from event with proper URLs
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

  // Add all URLs from the event
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

  // If no URLs but we have sources, ALWAYS generate search URLs for each source
  if (citations.length === 0 && event.sources.length > 0) {
    const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
    const searchQuery = `${keywords[0]} ${event.title}`;
    
    // For Wikipedia, create a search URL
    if (event.sources.includes('wikipedia')) {
      const searchTerm = encodeURIComponent(event.title);
      citations.push({
        title: `${event.title} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/Special:Search/${searchTerm}`,
        source: 'Wikipedia',
        date: eventDate,
      });
    }

    // For GDELT, create a search URL
    if (event.sources.includes('gdelt')) {
      const searchTerm = encodeURIComponent(keywords[0]);
      citations.push({
        title: `${event.title} - GDELT`,
        url: `https://www.gdeltproject.org/search.html?query=${searchTerm}&startdatetime=${eventDate}&enddatetime=${eventDate}`,
        source: 'GDELT',
        date: eventDate,
      });
    }

    // For NewsAPI, create a Google News search
    if (event.sources.includes('newsapi')) {
      const searchTerm = encodeURIComponent(searchQuery);
      citations.push({
        title: `${event.title} - News`,
        url: `https://news.google.com/search?q=${searchTerm}&hl=en&gl=US&ceid=US:en`,
        source: 'Google News',
        date: eventDate,
      });
    }

    // For tech-db, create a Google search
    if (event.sources.includes('tech-db')) {
      const searchTerm = encodeURIComponent(searchQuery);
      citations.push({
        title: `${event.title} - Tech News`,
        url: `https://www.google.com/search?q=${searchTerm}&tbm=nws`,
        source: 'Tech News',
        date: eventDate,
      });
    }

    // Always add at least one Google search as fallback
    if (citations.length === 0) {
      const searchTerm = encodeURIComponent(searchQuery);
      citations.push({
        title: event.title,
        url: `https://www.google.com/search?q=${searchTerm}&tbm=nws`,
        source: event.sources.join(', '),
        date: eventDate,
      });
    }
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

  // Generate search URLs as citations even for fallback
  const searchQuery = `${keyword} ${formattedDate}`;
  const citations = [
    {
      title: `Search for "${keyword}" on ${formattedDate}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws`,
      source: 'Google News',
      date: date.toISOString().split('T')[0],
    },
    {
      title: `Wikipedia events on ${formattedDate}`,
      url: `https://en.wikipedia.org/wiki/${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}`,
      source: 'Wikipedia',
      date: date.toISOString().split('T')[0],
    },
  ];

  return {
    explanation,
    confidence: 40, // Lower confidence for fallback
    citations, // Always include citations, even for fallback
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

/**
 * Enhance explanation with AI to provide more specific details and context
 */
async function enhanceExplanationWithAI(
  baseExplanation: string,
  event: UnifiedEvent,
  keyword: string,
  peakValue: number,
  date: Date
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  try {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const prompt = `You are analyzing why the search term "${keyword}" peaked on ${formattedDate} with a value of ${peakValue}/100.

REAL EVENT DATA FOUND:
- Event Title: ${event.title}
- Event Description: ${event.description}
- Event Date: ${event.date}
- Sources: ${event.sources.join(', ')}
- Verified: ${event.verified ? 'Yes (confirmed by multiple sources)' : 'No'}

CURRENT EXPLANATION:
${baseExplanation}

TASK: Enhance this explanation to be MORE SPECIFIC and DETAILED. You must:
1. Use the EXACT event title and details from the real event data above
2. Explain SPECIFICALLY why this event caused the search spike for "${keyword}"
3. Mention the exact date (${formattedDate}) when the event occurred
4. Include the peak value (${peakValue}/100) to show magnitude
5. Reference the sources that confirmed this event (${event.sources.join(', ')})
6. Be concrete and factual - avoid vague phrases like "increased interest" or "gained attention"
7. If the event description provides specific details, include them

IMPORTANT: 
- DO NOT make up information not in the event data
- DO NOT use generic explanations
- DO reference the specific event title and description
- DO explain the direct connection between the event and the search spike

Return ONLY the enhanced explanation text, nothing else.`;

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    return null;
  } catch (error) {
    console.error('[PeakExplanation] AI enhancement error:', error);
    return null;
  }
}


