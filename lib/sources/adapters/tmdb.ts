/**
 * TMDB (The Movie Database) Adapter
 * Fetches movie/TV show data including ratings, popularity, and metadata
 */

import type { DataSourceAdapter, SourceConfig, SourceResult, SourceDataPoint } from '../types';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

export type TMDBMovie = {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string;
  popularity: number;
  voteAverage: number;
  voteCount: number;
  posterPath: string | null;
  backdropPath: string | null;
  genres: { id: number; name: string }[];
  runtime: number | null;
  revenue: number;
  budget: number;
};

export type TMDBSearchResult = {
  results: TMDBMovie[];
  totalResults: number;
  totalPages: number;
};

export class TMDBAdapter implements DataSourceAdapter {
  name: 'tmdb' = 'tmdb' as const;
  config: SourceConfig;
  private apiKey: string | null;
  private requestCount = 0;
  private resetTime: Date | null = null;

  constructor(config: Partial<SourceConfig> = {}) {
    this.apiKey = process.env.TMDB_API_KEY || null;
    this.config = {
      enabled: !!this.apiKey,
      priority: 3,
      timeout: 10000,
      retries: 2,
      rateLimit: { requests: 40, period: 10000 },
      ...config,
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(
        `${TMDB_API_BASE}/configuration?api_key=${this.apiKey}`,
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
    if (!this.apiKey) {
      return this.createFailedResult(term, startDate, endDate, 'TMDB API key not configured');
    }

    try {
      const movie = await this.searchMovie(term);
      
      if (!movie) {
        return this.createFailedResult(term, startDate, endDate, 'Movie not found');
      }

      const dataPoints: SourceDataPoint[] = [{
        date: new Date().toISOString().split('T')[0],
        value: Math.round(movie.voteAverage * 10),
        rawValue: movie.popularity,
        source: 'tmdb' as const,
      }];

      return {
        source: 'tmdb' as const,
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: 1,
          confidence: 85,
          notes: `${movie.title}: ${movie.voteAverage}/10 (${movie.voteCount.toLocaleString()} votes)`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[TMDB] Fetch error:', error);
      return this.createFailedResult(
        term, 
        startDate, 
        endDate, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async searchMovie(query: string): Promise<TMDBMovie | null> {
    if (!this.apiKey) return null;

    const searchUrl = new URL(`${TMDB_API_BASE}/search/movie`);
    searchUrl.searchParams.set('api_key', this.apiKey);
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('include_adult', 'false');

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB search failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const movie = data.results[0];
    return this.normalizeMovie(movie);
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
    if (!this.apiKey) return null;

    const response = await fetch(
      `${TMDB_API_BASE}/movie/${movieId}?api_key=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`TMDB details failed: ${response.status}`);
    }

    const movie = await response.json();
    return this.normalizeMovie(movie);
  }

  async compareMovies(titleA: string, titleB: string): Promise<{
    movieA: TMDBMovie | null;
    movieB: TMDBMovie | null;
    winner: 'A' | 'B' | 'tie' | null;
    comparison: {
      rating: { winner: string; diff: number };
      popularity: { winner: string; diff: number };
      votes: { winner: string; diff: number };
    } | null;
  }> {
    const [movieA, movieB] = await Promise.all([
      this.searchMovie(titleA),
      this.searchMovie(titleB),
    ]);

    if (!movieA || !movieB) {
      return { movieA, movieB, winner: null, comparison: null };
    }

    const ratingDiff = movieA.voteAverage - movieB.voteAverage;
    const popularityDiff = movieA.popularity - movieB.popularity;
    const votesDiff = movieA.voteCount - movieB.voteCount;

    let score = 0;
    if (ratingDiff > 0.5) score++;
    else if (ratingDiff < -0.5) score--;
    
    if (popularityDiff > 0) score++;
    else if (popularityDiff < 0) score--;
    
    if (votesDiff > 0) score++;
    else if (votesDiff < 0) score--;

    const winner = score > 0 ? 'A' : score < 0 ? 'B' : 'tie';

    return {
      movieA,
      movieB,
      winner,
      comparison: {
        rating: {
          winner: ratingDiff >= 0 ? titleA : titleB,
          diff: Math.abs(ratingDiff),
        },
        popularity: {
          winner: popularityDiff >= 0 ? titleA : titleB,
          diff: Math.abs(popularityDiff),
        },
        votes: {
          winner: votesDiff >= 0 ? titleA : titleB,
          diff: Math.abs(votesDiff),
        },
      },
    };
  }

  private normalizeMovie(raw: {
    id: number;
    title: string;
    original_title?: string;
    overview?: string;
    release_date?: string;
    popularity?: number;
    vote_average?: number;
    vote_count?: number;
    poster_path?: string | null;
    backdrop_path?: string | null;
    genres?: { id: number; name: string }[];
    runtime?: number | null;
    revenue?: number;
    budget?: number;
  }): TMDBMovie {
    return {
      id: raw.id,
      title: raw.title,
      originalTitle: raw.original_title || raw.title,
      overview: raw.overview || '',
      releaseDate: raw.release_date || '',
      popularity: raw.popularity || 0,
      voteAverage: raw.vote_average || 0,
      voteCount: raw.vote_count || 0,
      posterPath: raw.poster_path ?? null,
      backdropPath: raw.backdrop_path ?? null,
      genres: raw.genres || [],
      runtime: raw.runtime || null,
      revenue: raw.revenue || 0,
      budget: raw.budget || 0,
    };
  }

  private createFailedResult(
    term: string,
    startDate: Date,
    endDate: Date,
    error: string
  ): SourceResult {
    return {
      source: 'tmdb' as const,
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
    const limit = this.config.rateLimit?.requests || 40;
    return {
      remaining: Math.max(0, limit - this.requestCount),
      resetAt: this.resetTime,
    };
  }
}

export const tmdbAdapter = new TMDBAdapter();
