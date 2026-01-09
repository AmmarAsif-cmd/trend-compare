/**
 * Smart Category Detector
 * Uses actual API responses to intelligently detect what's being compared
 * No hard-coded lists - fully adaptive and scalable
 */

import { spotifyAdapter } from './sources/adapters/spotify';
import { tmdbAdapter } from './sources/adapters/tmdb';
import { steamAdapter } from './sources/adapters/steam';
import { bestBuyAdapter } from './sources/adapters/bestbuy';
import type { ComparisonCategory, CategoryEvidence } from './category-resolver';

export type SmartCategoryResult = {
  category: ComparisonCategory;
  confidence: number;
  evidence: CategoryEvidence[];
  apiMatches: {
    spotify: boolean;
    tmdb: boolean;
    steam: boolean;
    bestbuy: boolean;
  };
  // Cache API results to avoid duplicate calls
  cachedResults: {
    spotify?: { termA: any; termB: any };
    tmdb?: { termA: any; termB: any };
    steam?: { termA: any; termB: any };
    bestbuy?: { termA: any; termB: any };
  };
};

/**
 * Intelligently detect category by probing actual APIs
 * This works for ANY term - no pre-defined lists needed
 */
export async function detectCategoryByAPI(
  termA: string,
  termB: string,
  options: {
    enableSpotify?: boolean;
    enableTMDB?: boolean;
    enableSteam?: boolean;
    enableBestBuy?: boolean;
  } = {}
): Promise<SmartCategoryResult> {
  const {
    enableSpotify = true,
    enableTMDB = true,
    enableSteam = true,
    enableBestBuy = true,
  } = options;

  const evidence: CategoryEvidence[] = [];
  const apiMatches = {
    spotify: false,
    tmdb: false,
    steam: false,
    bestbuy: false,
  };
  const cachedResults: SmartCategoryResult['cachedResults'] = {};

  // Probe all APIs in parallel
  const probePromises: Promise<void>[] = [];

  // Probe Spotify (music)
  if (enableSpotify && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    probePromises.push(
      (async () => {
        try {
          const [artistA, artistB] = await Promise.all([
            spotifyAdapter.searchArtist(termA),
            spotifyAdapter.searchArtist(termB),
          ]);

          if (artistA || artistB) {
            apiMatches.spotify = true;
            cachedResults.spotify = { termA: artistA, termB: artistB };
            const matchCount = (artistA ? 1 : 0) + (artistB ? 1 : 0);
            evidence.push({
              source: 'spotify_api',
              signal: `Found ${matchCount}/2 terms on Spotify`,
              confidence: matchCount === 2 ? 95 : 70,
            });
          }
        } catch (error) {
          // Spotify not available or no matches
        }
      })()
    );
  }

  // Probe TMDB (movies/TV)
  if (enableTMDB && process.env.TMDB_API_KEY) {
    probePromises.push(
      (async () => {
        try {
          const [movieA, movieB] = await Promise.all([
            tmdbAdapter.searchMovie(termA),
            tmdbAdapter.searchMovie(termB),
          ]);

          if (movieA || movieB) {
            apiMatches.tmdb = true;
            cachedResults.tmdb = { termA: movieA, termB: movieB };
            const matchCount = (movieA ? 1 : 0) + (movieB ? 1 : 0);
            evidence.push({
              source: 'tmdb_api',
              signal: `Found ${matchCount}/2 terms on TMDB`,
              confidence: matchCount === 2 ? 95 : 70,
            });
          }
        } catch (error) {
          // TMDB not available or no matches
        }
      })()
    );
  }

  // Probe Steam (games)
  if (enableSteam) {
    probePromises.push(
      (async () => {
        try {
          const [gameA, gameB] = await Promise.all([
            steamAdapter.searchGame(termA),
            steamAdapter.searchGame(termB),
          ]);

          if (gameA || gameB) {
            apiMatches.steam = true;
            cachedResults.steam = { termA: gameA, termB: gameB };
            const matchCount = (gameA ? 1 : 0) + (gameB ? 1 : 0);
            evidence.push({
              source: 'steam_api',
              signal: `Found ${matchCount}/2 terms on Steam`,
              confidence: matchCount === 2 ? 95 : 70,
            });
          }
        } catch (error) {
          // Steam not available or no matches
        }
      })()
    );
  }

  // Probe Best Buy (products)
  if (enableBestBuy && process.env.BESTBUY_API_KEY) {
    probePromises.push(
      (async () => {
        try {
          const [productA, productB] = await Promise.all([
            bestBuyAdapter.searchProduct(termA),
            bestBuyAdapter.searchProduct(termB),
          ]);

          if (productA || productB) {
            apiMatches.bestbuy = true;
            cachedResults.bestbuy = { termA: productA, termB: productB };
            const matchCount = (productA ? 1 : 0) + (productB ? 1 : 0);
            evidence.push({
              source: 'bestbuy_api',
              signal: `Found ${matchCount}/2 terms on Best Buy`,
              confidence: matchCount === 2 ? 95 : 70,
            });
          }
        } catch (error) {
          // Best Buy not available or no matches
        }
      })()
    );
  }

  // Wait for all probes to complete
  await Promise.allSettled(probePromises);

  // Determine category based on API matches
  let category: ComparisonCategory = 'general';
  let confidence = 50;

  // Priority order: More specific categories first
  if (apiMatches.spotify) {
    category = 'music';
    confidence = 90;
  } else if (apiMatches.tmdb) {
    category = 'movies';
    confidence = 90;
  } else if (apiMatches.steam) {
    category = 'games';
    confidence = 90;
  } else if (apiMatches.bestbuy) {
    category = 'products';
    confidence = 85;
  } else {
    // No API matches - fall back to general
    category = 'general';
    confidence = 50;
    evidence.push({
      source: 'fallback',
      signal: 'No specialized API matches found',
      confidence: 50,
    });
  }

  console.log('[SmartCategoryDetector] Results:', {
    category,
    confidence,
    apiMatches,
  });

  return {
    category,
    confidence,
    evidence,
    apiMatches,
    cachedResults,
  };
}

/**
 * Fast heuristic-based detection (fallback when APIs can't be queried)
 * Uses patterns but no hard-coded entity lists
 */
export function detectCategoryByPatterns(termA: string, termB: string): {
  category: ComparisonCategory;
  confidence: number;
} {
  const combined = `${termA} ${termB}`.toLowerCase();

  // Pattern-based hints (lightweight)
  const patterns = {
    music: /\b(music|song|album|artist|singer|band|spotify|concert|tour|rap|pop|rock|jazz|hiphop|rnb|lyrics|vocal|soundtrack|orchestra|symphony|composer|producer|remix|acoustic|instrumental|ep|lp|single|discography|billboard|grammy)\b/i,
    movies: /\b(movie|film|watch|netflix|imdb|trailer|actor|actress|director|series|season|episode|cinema|theatre|theater|hbo|disney|marvel|dc|superhero|documentary|sequel|prequel|trilogy|box office|blockbuster|oscars|emmy|screenplay|cinematography|streaming|prime video|hulu)\b/i,
    games: /\b(game|gaming|steam|playstation|ps4|ps5|xbox|nintendo|switch|console|pc game|esports|twitch|gameplay|fps|rpg|mmo|moba|battle royale|controller|multiplayer|online|pvp|pve|level|boss|quest|achievement|trophy|speedrun|mod|dlc|expansion|remake|remaster)\b/i,
    products: /\b(buy|price|review|iphone|samsung|galaxy|pixel|laptop|macbook|dell|hp|lenovo|asus|phone|smartphone|android|ios|tablet|ipad|headphones|earbuds|airpods|sony|bose|camera|canon|nikon|dslr|mirrorless|lens|tv|oled|qled|monitor|keyboard|mouse|printer|router|smartwatch|watch|garmin|fitbit|appliance|fridge|washer|dryer|vacuum|dyson|kitchen|blender|coffee|sneaker|shoe|nike|adidas|jordan|yeezy|fashion|clothing|outfit|skincare|makeup|toy|lego|doll|action figure)\b/i,
    tech: /\b(programming|coding|developer|software|hardware|framework|library|api|sdk|react|vue|angular|svelte|nextjs|node|python|javascript|typescript|java|c\+\+|c#|golang|rust|php|ruby|swift|kotlin|flutter|dart|aws|azure|gcp|cloud|server|database|sql|nosql|mongodb|postgres|mysql|redis|docker|kubernetes|linux|ubuntu|windows|macos|git|github|gitlab|ide|vscode|compiler|algorithm|data structure|machine learning|ai|neural network|blockchain|crypto|bitcoin|ethereum)\b/i,
  };

  for (const [cat, pattern] of Object.entries(patterns)) {
    if (pattern.test(combined)) {
      return {
        category: cat as ComparisonCategory,
        confidence: 60,
      };
    }
  }

  return {
    category: 'general',
    confidence: 50,
  };
}
