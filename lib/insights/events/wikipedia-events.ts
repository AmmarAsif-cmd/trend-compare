/**
 * Wikipedia Current Events Integration
 * Wikipedia maintains daily event summaries - completely FREE and reliable
 * https://en.wikipedia.org/wiki/Portal:Current_events
 */

export interface WikipediaEvent {
  date: string;
  title: string;
  description: string;
  category: 'science-technology' | 'business' | 'politics' | 'sports' | 'disasters' | 'general';
  source: 'wikipedia';
  url: string;
}

/**
 * Fetch Wikipedia current events for a specific date
 * Uses Wikipedia's MediaWiki API
 */
export async function fetchWikipediaEvents(
  date: Date | string
): Promise<WikipediaEvent[]> {
  const targetDate = new Date(date);
  const year = targetDate.getFullYear();
  const month = targetDate.toLocaleString('en-US', { month: 'long' });
  const day = targetDate.getDate();

  // Wikipedia current events page format: "Portal:Current_events/2024_September_7"
  const pageTitle = `Portal:Current_events/${year}_${month}_${day}`;

  try {
    // Use Wikipedia API to get page content
    const apiUrl = `https://en.wikipedia.org/w/api.php?` +
      `action=parse&` +
      `page=${encodeURIComponent(pageTitle)}&` +
      `prop=text&` +
      `format=json&` +
      `origin=*`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'TrendCompare/1.0 (Trend Analysis Tool)',
      },
    });

    if (!response.ok) {
      console.warn(`Wikipedia API failed for ${pageTitle}`);
      return [];
    }

    const data = await response.json();

    if (data.error || !data.parse) {
      // Page doesn't exist or API error
      return [];
    }

    const htmlContent = data.parse.text['*'];

    // Parse events from HTML
    const events = parseWikipediaEventsHTML(htmlContent, targetDate.toISOString().split('T')[0]);

    return events;
  } catch (error) {
    console.error('Wikipedia events fetch error:', error);
    return [];
  }
}

/**
 * Parse Wikipedia current events HTML to extract structured events
 */
function parseWikipediaEventsHTML(html: string, date: string): WikipediaEvent[] {
  const events: WikipediaEvent[] = [];

  // Wikipedia structures events with headings for different categories
  // Look for <h3> tags for categories like "Science and technology", "Business and economy"
  const categoryRegex = /<h3>.*?<span[^>]*id="([^"]+)"[^>]*>([^<]+)<\/span>.*?<\/h3>/gi;
  const categories = [...html.matchAll(categoryRegex)];

  for (const [fullMatch, id, categoryName] of categories) {
    const category = mapWikipediaCategory(categoryName);

    // Find the <ul> list after this heading
    const startIndex = html.indexOf(fullMatch);
    const nextHeadingIndex = html.indexOf('<h3', startIndex + 1);
    const endIndex = nextHeadingIndex !== -1 ? nextHeadingIndex : html.length;
    const sectionHtml = html.slice(startIndex, endIndex);

    // Extract list items
    const itemRegex = /<li>([\s\S]*?)<\/li>/g;
    const items = [...sectionHtml.matchAll(itemRegex)];

    for (const [, itemHtml] of items) {
      // Remove HTML tags but keep the text
      const text = itemHtml
        .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/g, '$2') // Keep link text
        .replace(/<[^>]+>/g, '') // Remove other tags
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim();

      if (text.length > 10) { // Skip empty or very short items
        events.push({
          date,
          title: text.substring(0, 150), // First 150 chars as title
          description: text,
          category,
          source: 'wikipedia',
          url: `https://en.wikipedia.org/wiki/Portal:Current_events/${date.replace(/-/g, '_')}`,
        });
      }
    }
  }

  return events;
}

/**
 * Map Wikipedia category names to our standardized categories
 */
function mapWikipediaCategory(name: string): WikipediaEvent['category'] {
  const lower = name.toLowerCase();

  if (lower.includes('science') || lower.includes('technology')) {
    return 'science-technology';
  }
  if (lower.includes('business') || lower.includes('econom')) {
    return 'business';
  }
  if (lower.includes('politic') || lower.includes('law')) {
    return 'politics';
  }
  if (lower.includes('sport')) {
    return 'sports';
  }
  if (lower.includes('disaster') || lower.includes('accident')) {
    return 'disasters';
  }

  return 'general';
}

/**
 * Search Wikipedia events for keywords
 */
export async function searchWikipediaEvents(
  startDate: Date,
  endDate: Date,
  keywords: string[]
): Promise<WikipediaEvent[]> {
  const events: WikipediaEvent[] = [];
  const currentDate = new Date(startDate);

  // Fetch events for each day in the range (max 14 days to avoid too many requests)
  const maxDays = 14;
  let daysChecked = 0;

  while (currentDate <= endDate && daysChecked < maxDays) {
    const dayEvents = await fetchWikipediaEvents(currentDate);

    // Filter by keywords
    const relevantEvents = dayEvents.filter(event =>
      keywords.some(keyword =>
        event.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    events.push(...relevantEvents);

    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;

    // Rate limiting - don't hammer Wikipedia API
    await sleep(100); // 100ms between requests
  }

  return events;
}

/**
 * Get events near a specific date that match keywords
 */
export async function getWikipediaEventsNearDate(
  date: Date | string,
  keywords: string[],
  windowDays: number = 3
): Promise<WikipediaEvent[]> {
  const targetDate = new Date(date);
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - windowDays);
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + windowDays);

  return searchWikipediaEvents(startDate, endDate, keywords);
}

/**
 * Helper: Sleep function for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
