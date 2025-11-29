/**
 * GDELT (Global Database of Events, Language, and Tone) Integration
 * Real-time global news event database - completely FREE
 * Updated every 15 minutes with events from worldwide news sources
 * https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */

export interface GDELTEvent {
  date: string;
  title: string;
  description: string;
  url: string;
  source: string;
  domain: string;
  language: string;
  tone: number; // -10 to +10, negative = negative sentiment
  relevance: number;
  source_type: 'gdelt';
}

/**
 * Search GDELT for events matching keywords
 * Uses GDELT DOC 2.0 API
 */
export async function searchGDELTEvents(
  keywords: string[],
  startDate: Date,
  endDate: Date,
  maxResults: number = 20
): Promise<GDELTEvent[]> {
  try {
    // Format dates for GDELT (YYYYMMDDHHMMSS)
    const formatGDELTDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}000000`;
    };

    const starttime = formatGDELTDate(startDate);
    const endtime = formatGDELTDate(endDate);

    // Build query
    const query = keywords.join(' OR ');

    // GDELT DOC API v2
    const apiUrl = `https://api.gdeltproject.org/api/v2/doc/doc?` +
      `query=${encodeURIComponent(query)}&` +
      `mode=artlist&` + // Article list mode
      `maxrecords=${maxResults}&` +
      `startdatetime=${starttime}&` +
      `enddatetime=${endtime}&` +
      `format=json&` +
      `sort=hybridrel`; // Sort by relevance

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'TrendCompare/1.0 (Trend Analysis Tool)',
      },
    });

    if (!response.ok) {
      // GDELT API occasionally fails or has rate limits - fallback handles this
      if (process.env.NODE_ENV === 'development') {
        console.warn('GDELT API unavailable:', response.status);
      }
      return [];
    }

    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      return [];
    }

    // Parse and normalize events
    const events: GDELTEvent[] = data.articles.map((article: any) => ({
      date: parseGDELTDate(article.seendate),
      title: article.title || '',
      description: article.socialimage ? `${article.title} [Image available]` : article.title,
      url: article.url,
      source: article.domain,
      domain: article.domain,
      language: article.language || 'en',
      tone: parseTone(article.tone),
      relevance: 1, // GDELT sorts by relevance, so first results are most relevant
      source_type: 'gdelt',
    }));

    return events;
  } catch (error) {
    // GDELT sometimes returns malformed JSON - fallback system handles this gracefully
    if (process.env.NODE_ENV === 'development') {
      console.warn('GDELT API parsing error:', error instanceof Error ? error.message : 'Unknown error');
    }
    return [];
  }
}

/**
 * Get GDELT events near a specific date
 */
export async function getGDELTEventsNearDate(
  date: Date | string,
  keywords: string[],
  windowDays: number = 3,
  maxResults: number = 10
): Promise<GDELTEvent[]> {
  const targetDate = new Date(date);
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - windowDays);
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + windowDays);

  return searchGDELTEvents(keywords, startDate, endDate, maxResults);
}

/**
 * Parse GDELT date format (YYYYMMDDHHMMSS) to ISO date
 */
function parseGDELTDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return new Date().toISOString().split('T')[0];

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Parse GDELT tone value
 */
function parseTone(toneStr: string | number | undefined): number {
  if (typeof toneStr === 'number') return toneStr;
  if (typeof toneStr === 'string') {
    const parsed = parseFloat(toneStr);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Get trending topics from GDELT for a keyword
 * Helps understand what people are talking about related to a search term
 */
export async function getGDELTTrendingTopics(
  keyword: string,
  date: Date,
  windowDays: number = 7
): Promise<string[]> {
  const events = await getGDELTEventsNearDate(date, [keyword], windowDays, 50);

  // Extract common themes from titles
  const themes = new Map<string, number>();

  for (const event of events) {
    const words = event.title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !isCommonWord(w));

    for (const word of words) {
      themes.set(word, (themes.get(word) || 0) + 1);
    }
  }

  // Return top themes
  return Array.from(themes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Filter out common/stop words
 */
function isCommonWord(word: string): boolean {
  const stopWords = new Set([
    'about', 'after', 'before', 'being', 'could', 'during',
    'every', 'first', 'their', 'there', 'these', 'those',
    'where', 'which', 'while', 'would', 'should', 'other',
  ]);

  return stopWords.has(word);
}

/**
 * Get news sentiment for a keyword over time
 * Useful for understanding if news coverage is positive/negative
 */
export async function getGDELTSentiment(
  keyword: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; tone: number; articles: number }[]> {
  const events = await searchGDELTEvents([keyword], startDate, endDate, 100);

  // Group by date and calculate average tone
  const byDate = new Map<string, { tones: number[]; count: number }>();

  for (const event of events) {
    const existing = byDate.get(event.date) || { tones: [], count: 0 };
    existing.tones.push(event.tone);
    existing.count++;
    byDate.set(event.date, existing);
  }

  return Array.from(byDate.entries())
    .map(([date, data]) => ({
      date,
      tone: data.tones.reduce((a, b) => a + b, 0) / data.tones.length,
      articles: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
