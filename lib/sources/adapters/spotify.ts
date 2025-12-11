/**
 * Spotify Adapter
 * Fetches artist/album data including followers, popularity, and streaming stats
 */

import type { DataSourceAdapter, SourceConfig, SourceResult, SourceDataPoint } from '../types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com/api';

export type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity: number; // 0-100
  followers: number;
  images: { url: string; height: number; width: number }[];
  externalUrls: { spotify: string };
};

export type SpotifySearchResult = {
  artists: SpotifyArtist[];
  total: number;
};

export class SpotifyAdapter implements DataSourceAdapter {
  name: 'spotify' = 'spotify' as const;
  config: SourceConfig;
  private clientId: string | null;
  private clientSecret: string | null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private requestCount = 0;
  private resetTime: Date | null = null;

  constructor(config: Partial<SourceConfig> = {}) {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || null;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || null;
    this.config = {
      enabled: !!(this.clientId && this.clientSecret),
      priority: 3,
      timeout: 10000,
      retries: 2,
      rateLimit: { requests: 100, period: 30000 },
      ...config,
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.clientId || !this.clientSecret) return false;

    try {
      await this.getAccessToken();
      return !!this.accessToken;
    } catch {
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);

    if (!this.accessToken) {
      throw new Error('Failed to obtain Spotify access token');
    }

    return this.accessToken;
  }

  async fetchTimeSeries(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<SourceResult> {
    if (!this.clientId || !this.clientSecret) {
      return this.createFailedResult(term, startDate, endDate, 'Spotify API credentials not configured');
    }

    try {
      const artist = await this.searchArtist(term);

      if (!artist) {
        return this.createFailedResult(term, startDate, endDate, 'Artist not found');
      }

      const dataPoints: SourceDataPoint[] = [{
        date: new Date().toISOString().split('T')[0],
        value: artist.popularity,
        rawValue: artist.followers,
        source: 'spotify' as const,
      }];

      return {
        source: 'spotify' as const,
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: 1,
          confidence: artist.followers > 1000000 ? 90 : 75,
          notes: `${artist.name}: ${artist.popularity}/100 popularity (${artist.followers.toLocaleString()} followers)`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Spotify] Fetch error:', error);
      return this.createFailedResult(
        term,
        startDate,
        endDate,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async searchArtist(query: string): Promise<SpotifyArtist | null> {
    const token = await this.getAccessToken();

    const searchUrl = new URL(`${SPOTIFY_API_BASE}/search`);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'artist');
    searchUrl.searchParams.set('limit', '1');

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.artists || !data.artists.items || data.artists.items.length === 0) {
      return null;
    }

    const artist = data.artists.items[0];
    return this.normalizeArtist(artist);
  }

  async getArtist(artistId: string): Promise<SpotifyArtist | null> {
    const token = await this.getAccessToken();

    const response = await fetch(`${SPOTIFY_API_BASE}/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify artist fetch failed: ${response.status}`);
    }

    const artist = await response.json();
    return this.normalizeArtist(artist);
  }

  async compareArtists(termA: string, termB: string): Promise<{
    artistA: SpotifyArtist | null;
    artistB: SpotifyArtist | null;
    winner: 'A' | 'B' | 'tie' | null;
    comparison: {
      popularity: { winner: string; diff: number };
      followers: { winner: string; diff: number };
    } | null;
  }> {
    const [artistA, artistB] = await Promise.all([
      this.searchArtist(termA),
      this.searchArtist(termB),
    ]);

    if (!artistA || !artistB) {
      return { artistA, artistB, winner: null, comparison: null };
    }

    const popularityDiff = artistA.popularity - artistB.popularity;
    const followersDiff = artistA.followers - artistB.followers;

    let score = 0;
    // Popularity score
    if (popularityDiff > 5) score++;
    else if (popularityDiff < -5) score--;

    // Followers count
    if (followersDiff > 100000) score++;
    else if (followersDiff < -100000) score--;

    const winner = score > 0 ? 'A' : score < 0 ? 'B' : 'tie';

    return {
      artistA,
      artistB,
      winner,
      comparison: {
        popularity: {
          winner: popularityDiff >= 0 ? termA : termB,
          diff: Math.abs(popularityDiff),
        },
        followers: {
          winner: followersDiff >= 0 ? termA : termB,
          diff: Math.abs(followersDiff),
        },
      },
    };
  }

  private normalizeArtist(raw: {
    id: string;
    name: string;
    genres?: string[];
    popularity?: number;
    followers?: { total: number };
    images?: { url: string; height: number; width: number }[];
    external_urls?: { spotify: string };
  }): SpotifyArtist {
    return {
      id: raw.id,
      name: raw.name,
      genres: raw.genres || [],
      popularity: raw.popularity || 0,
      followers: raw.followers?.total || 0,
      images: raw.images || [],
      externalUrls: {
        spotify: raw.external_urls?.spotify || '',
      },
    };
  }

  private createFailedResult(
    term: string,
    startDate: Date,
    endDate: Date,
    error: string
  ): SourceResult {
    return {
      source: 'spotify' as const,
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
    const limit = this.config.rateLimit?.requests || 100;
    return {
      remaining: Math.max(0, limit - this.requestCount),
      resetAt: this.resetTime,
    };
  }
}

export const spotifyAdapter = new SpotifyAdapter();
