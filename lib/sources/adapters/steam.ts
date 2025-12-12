/**
 * Steam Adapter
 * Fetches game data including player counts, reviews, and ratings
 */

import type { DataSourceAdapter, SourceConfig, SourceResult, SourceDataPoint } from '../types';

const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_STORE_BASE = 'https://store.steampowered.com/api';

export type SteamGame = {
  appId: number;
  name: string;
  description: string;
  headerImage: string;
  developers: string[];
  publishers: string[];
  price: number;
  isFree: boolean;
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic: {
    score: number;
    url: string;
  } | null;
  categories: string[];
  genres: string[];
  releaseDate: string;
  currentPlayers: number;
  peakPlayers: number;
  reviewScore: number; // 0-100 based on positive percentage
  totalReviews: number;
};

export type SteamSearchResult = {
  games: SteamGame[];
  total: number;
};

export class SteamAdapter implements DataSourceAdapter {
  name: 'steam' = 'steam' as const;
  config: SourceConfig;
  private apiKey: string | null;
  private requestCount = 0;
  private resetTime: Date | null = null;

  constructor(config: Partial<SourceConfig> = {}) {
    this.apiKey = process.env.STEAM_API_KEY || null;
    this.config = {
      enabled: true, // Most Steam APIs work without a key
      priority: 3,
      timeout: 10000,
      retries: 2,
      rateLimit: { requests: 200, period: 300000 }, // 200 per 5 minutes
      ...config,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${STEAM_STORE_BASE}/appdetails?appids=730`, // CS:GO as test
        { method: 'GET' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchTimeSeries(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<SourceResult> {
    try {
      const game = await this.searchGame(term);

      if (!game) {
        return this.createFailedResult(term, startDate, endDate, 'Game not found');
      }

      // Calculate composite score from reviews and player count
      const reviewScore = game.reviewScore;
      const playerPopularity = Math.min(100, (game.currentPlayers / 10000) * 50);
      const compositeScore = Math.round((reviewScore * 0.7) + (playerPopularity * 0.3));

      const dataPoints: SourceDataPoint[] = [{
        date: new Date().toISOString().split('T')[0],
        value: compositeScore,
        rawValue: game.currentPlayers,
        source: 'steam' as const,
      }];

      return {
        source: 'steam' as const,
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: 1,
          confidence: game.totalReviews > 1000 ? 85 : 70,
          notes: `${game.name}: ${game.reviewScore}% positive (${game.currentPlayers.toLocaleString()} current players)`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Steam] Fetch error:', error);
      return this.createFailedResult(
        term,
        startDate,
        endDate,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async searchGame(query: string): Promise<SteamGame | null> {
    // First, search for the game to get its app ID
    const appId = await this.findAppId(query);

    if (!appId) {
      return null;
    }

    // Get detailed game information
    const detailsResponse = await fetch(
      `${STEAM_STORE_BASE}/appdetails?appids=${appId}&cc=us`
    );

    if (!detailsResponse.ok) {
      throw new Error(`Steam details fetch failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    if (!detailsData[appId] || !detailsData[appId].success) {
      return null;
    }

    const gameData = detailsData[appId].data;

    // Get current player count
    let currentPlayers = 0;
    let peakPlayers = 0;

    if (this.apiKey) {
      try {
        const playersResponse = await fetch(
          `${STEAM_API_BASE}/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`
        );
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          currentPlayers = playersData.response?.player_count || 0;
        }
      } catch (error) {
        console.warn('[Steam] Failed to fetch player count:', error);
      }
    }

    // Calculate review score from Steam's recommendation data
    let reviewScore = 0;
    let totalReviews = 0;

    try {
      const reviewsResponse = await fetch(
        `${STEAM_STORE_BASE}/appreviews/${appId}?json=1&purchase_type=all&num_per_page=0`
      );
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        const summary = reviewsData.query_summary;
        if (summary) {
          totalReviews = summary.total_reviews || 0;
          const positiveReviews = summary.total_positive || 0;
          reviewScore = totalReviews > 0
            ? Math.round((positiveReviews / totalReviews) * 100)
            : 0;
        }
      }
    } catch (error) {
      console.warn('[Steam] Failed to fetch reviews:', error);
    }

    return this.normalizeGame(gameData, appId, currentPlayers, peakPlayers, reviewScore, totalReviews);
  }

  private async findAppId(query: string): Promise<number | null> {
    // Use the Steam store search API
    const searchUrl = `${STEAM_STORE_BASE}/storesearch/?term=${encodeURIComponent(query)}&cc=us`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Steam search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Return the first result's app ID
    return data.items[0].id;
  }

  async compareGames(termA: string, termB: string): Promise<{
    gameA: SteamGame | null;
    gameB: SteamGame | null;
    winner: 'A' | 'B' | 'tie' | null;
    comparison: {
      reviews: { winner: string; diff: number };
      players: { winner: string; diff: number };
      price: { winner: string; diff: number };
    } | null;
  }> {
    const [gameA, gameB] = await Promise.all([
      this.searchGame(termA),
      this.searchGame(termB),
    ]);

    if (!gameA || !gameB) {
      return { gameA, gameB, winner: null, comparison: null };
    }

    const reviewsDiff = gameA.reviewScore - gameB.reviewScore;
    const playersDiff = gameA.currentPlayers - gameB.currentPlayers;
    const priceDiff = gameA.price - gameB.price;

    let score = 0;
    // Better review score
    if (reviewsDiff > 5) score++;
    else if (reviewsDiff < -5) score--;

    // More current players
    if (playersDiff > 1000) score++;
    else if (playersDiff < -1000) score--;

    // Lower price is better (unless one is free)
    if (!gameA.isFree && !gameB.isFree) {
      if (priceDiff < -5) score++;
      else if (priceDiff > 5) score--;
    }

    const winner = score > 0 ? 'A' : score < 0 ? 'B' : 'tie';

    return {
      gameA,
      gameB,
      winner,
      comparison: {
        reviews: {
          winner: reviewsDiff >= 0 ? termA : termB,
          diff: Math.abs(reviewsDiff),
        },
        players: {
          winner: playersDiff >= 0 ? termA : termB,
          diff: Math.abs(playersDiff),
        },
        price: {
          winner: priceDiff <= 0 ? termA : termB,
          diff: Math.abs(priceDiff),
        },
      },
    };
  }

  private normalizeGame(
    raw: {
      name?: string;
      short_description?: string;
      header_image?: string;
      developers?: string[];
      publishers?: string[];
      price_overview?: {
        final: number;
        discount_percent: number;
      };
      is_free?: boolean;
      platforms?: {
        windows?: boolean;
        mac?: boolean;
        linux?: boolean;
      };
      metacritic?: {
        score: number;
        url: string;
      };
      categories?: { description: string }[];
      genres?: { description: string }[];
      release_date?: {
        date: string;
      };
    },
    appId: number,
    currentPlayers: number,
    peakPlayers: number,
    reviewScore: number,
    totalReviews: number
  ): SteamGame {
    return {
      appId,
      name: raw.name || '',
      description: raw.short_description || '',
      headerImage: raw.header_image || '',
      developers: raw.developers || [],
      publishers: raw.publishers || [],
      price: raw.price_overview?.final ? raw.price_overview.final / 100 : 0,
      isFree: raw.is_free || false,
      platforms: {
        windows: raw.platforms?.windows || false,
        mac: raw.platforms?.mac || false,
        linux: raw.platforms?.linux || false,
      },
      metacritic: raw.metacritic || null,
      categories: raw.categories?.map(c => c.description) || [],
      genres: raw.genres?.map(g => g.description) || [],
      releaseDate: raw.release_date?.date || '',
      currentPlayers,
      peakPlayers,
      reviewScore,
      totalReviews,
    };
  }

  private createFailedResult(
    term: string,
    startDate: Date,
    endDate: Date,
    error: string
  ): SourceResult {
    return {
      source: 'steam' as const,
      status: 'failed',
      data: [],
      metadata: {
        term,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dataPoints: 0,
        confidence: 0,
      },
      error,
      fetchedAt: new Date().toISOString(),
    };
  }

  getRateLimitStatus(): { remaining: number; resetAt: Date | null } {
    const limit = this.config.rateLimit?.requests || 200;
    return {
      remaining: Math.max(0, limit - this.requestCount),
      resetAt: this.resetTime,
    };
  }
}

export const steamAdapter = new SteamAdapter();
