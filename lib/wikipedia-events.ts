/**
 * Wikipedia Events API Integration
 * Fetches historical events that occurred on specific dates
 * Free, reliable, and well-documented
 */

export type WikipediaEvent = {
  text: string;
  year: number;
  pages?: Array<{
    title: string;
    extract: string;
    content_urls?: {
      desktop?: {
        page: string;
      };
    };
  }>;
};

export type WikipediaEventResult = {
  title: string;
  description: string;
  url: string;
  date: Date;
  source: 'Wikipedia';
  year: number;
};

/**
 * Fetch events that happened on a specific date from Wikipedia
 * API: https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day
 */
export async function fetchWikipediaEvents(
  date: Date
): Promise<WikipediaEventResult[]> {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

  console.log(`[Wikipedia] Fetching events for ${month}/${day}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrendCompare/1.0 (contact@trendcompare.com)',
      },
    });

    if (!response.ok) {
      console.error(`[Wikipedia] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events: WikipediaEventResult[] = [];

    // Process events from the response
    if (data.events) {
      for (const event of data.events) {
        // Focus on events from the same year or recent years
        const eventYear = event.year;
        const targetYear = date.getFullYear();

        // Include events from the target year or within 5 years
        if (Math.abs(eventYear - targetYear) <= 5) {
          const firstPage = event.pages?.[0];

          events.push({
            title: event.text,
            description: firstPage?.extract || event.text,
            url: firstPage?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(event.text)}`,
            date: new Date(eventYear, date.getMonth(), date.getDate()),
            source: 'Wikipedia',
            year: eventYear,
          });
        }
      }
    }

    // Process births, deaths, holidays if needed
    if (data.selected) {
      for (const selected of data.selected) {
        const firstPage = selected.pages?.[0];

        events.push({
          title: selected.text,
          description: firstPage?.extract || selected.text,
          url: firstPage?.content_urls?.desktop?.page || 'https://en.wikipedia.org',
          date: new Date(selected.year, date.getMonth(), date.getDate()),
          source: 'Wikipedia',
          year: selected.year,
        });
      }
    }

    console.log(`[Wikipedia] Found ${events.length} events for ${month}/${day}`);
    return events;

  } catch (error) {
    console.error('[Wikipedia] Error fetching events:', error);
    return [];
  }
}

/**
 * Filter Wikipedia events by keyword relevance
 */
export function filterWikipediaEventsByKeyword(
  events: WikipediaEventResult[],
  keyword: string
): WikipediaEventResult[] {
  const keywordLower = keyword.toLowerCase().replace(/-/g, ' ');

  return events.filter(event => {
    const titleLower = event.title.toLowerCase();
    const descLower = event.description.toLowerCase();

    // Check if keyword appears in title or description
    return titleLower.includes(keywordLower) || descLower.includes(keywordLower);
  });
}
