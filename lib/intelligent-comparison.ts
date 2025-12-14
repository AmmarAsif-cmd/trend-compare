/**
 * Intelligent Comparison System
 * Combines category detection, multi-source data, and verdict generation
 *
 * Implements 3-tier caching for category detection:
 * 1. Comparison-level cache (database, passed via options.cachedCategory)
 * 2. Keyword-level cache (database, via category-cache.ts)
 * 3. AI detection (fallback, ~$0.0001 per call)
 */

import { detectCategory, getRecommendationTemplate, type ComparisonCategory, type CategoryResult } from './category-resolver';
import { detectCategoryByAPI, detectCategoryByPatterns } from './smart-category-detector';
import { detectCategoryWithAI, getAPIsForCategory } from './ai-category-detector';
import { getCachedComparisonCategory, cacheComparisonKeywords } from './category-cache';
import { calculateTrendArcScore, generateVerdict, type SourceMetrics, type TrendArcScore, type ComparisonVerdict } from './trendarc-score';
import { youtubeAdapter } from './sources/adapters/youtube';
import { tmdbAdapter } from './sources/adapters/tmdb';
import { bestBuyAdapter } from './sources/adapters/bestbuy';
import { spotifyAdapter } from './sources/adapters/spotify';
import { steamAdapter } from './sources/adapters/steam';
import type { SeriesPoint } from './trends';
import { withTimeout } from './utils/timeout';
import { retryWithBackoff } from './utils/retry';

export type IntelligentComparisonResult = {
  category: CategoryResult;
  scores: {
    termA: TrendArcScore;
    termB: TrendArcScore;
  };
  verdict: ComparisonVerdict;
  enrichedData: {
    youtube?: {
      termA: { views: number; videos: number };
      termB: { views: number; videos: number };
    };
    tmdb?: {
      termA: { rating: number; title: string } | null;
      termB: { rating: number; title: string } | null;
    };
    bestbuy?: {
      termA: { rating: number; reviews: number; name: string } | null;
      termB: { rating: number; reviews: number; name: string } | null;
    };
    spotify?: {
      termA: { popularity: number; followers: number; name: string } | null;
      termB: { popularity: number; followers: number; name: string } | null;
    };
    steam?: {
      termA: { reviewScore: number; players: number; name: string } | null;
      termB: { reviewScore: number; players: number; name: string } | null;
    };
    wikipedia?: {
      termA: { avgPageviews: number; articleTitle: string } | null;
      termB: { avgPageviews: number; articleTitle: string } | null;
    };
  };
  performance: {
    totalMs: number;
    sourcesQueried: string[];
  };
};

/**
 * Wrap API call with timeout and retry
 */
async function safeAPICall<T>(
  fn: () => Promise<T>,
  apiName: string,
  timeoutMs: number = 8000
): Promise<T | null> {
  try {
    return await retryWithBackoff(
      () => withTimeout(fn(), timeoutMs, `${apiName} request timed out`),
      {
        maxRetries: 2,
        initialDelay: 1000,
        shouldRetry: (error) => {
          // Retry on timeout or network errors
          return error?.name === 'TimeoutError' || 
                 error?.code === 'ECONNRESET' || 
                 error?.code === 'ETIMEDOUT' ||
                 (error?.status >= 500 && error?.status < 600);
        }
      }
    );
  } catch (error) {
    console.warn(`[IntelligentComparison] ${apiName} fetch failed after retries:`, error);
    return null;
  }
}

/**
 * Calculate stats from series data for a specific term
 */
function calculateSeriesStats(series: SeriesPoint[], termName: string, otherTermName: string): {
  avgInterest: number;
  momentum: number;
  leadPercentage: number;
  volatility: number;
} {
  if (series.length === 0) {
    return { avgInterest: 50, momentum: 0, leadPercentage: 50, volatility: 0 };
  }

  // Use actual term names instead of relying on Object.keys() order
  const termKey = termName;
  const otherKey = otherTermName;

  const values = series.map(p => {
    const val = p[termKey];
    return typeof val === 'number' ? val : 0;
  });
  
  const otherValues = series.map(p => {
    const val = p[otherKey];
    return typeof val === 'number' ? val : 0;
  });
  
  // Average interest
  const avgInterest = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Momentum (compare recent to earlier)
  const halfPoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, halfPoint);
  const secondHalf = values.slice(halfPoint);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  const momentum = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100;
  
  // Lead percentage
  let leadCount = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] >= otherValues[i]) leadCount++;
  }
  const leadPercentage = (leadCount / values.length) * 100;
  
  // Volatility (standard deviation)
  const mean = avgInterest;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const volatility = Math.sqrt(variance);

  return {
    avgInterest: Math.round(avgInterest),
    momentum: Math.round(Math.max(-100, Math.min(100, momentum))),
    leadPercentage: Math.round(leadPercentage),
    volatility: Math.round(volatility),
  };
}

/**
 * Run an intelligent comparison with multi-source data
 * Wrapped with timeout to prevent hanging
 */
export async function runIntelligentComparison(
  terms: string[],
  series: SeriesPoint[],
  options: {
    enableYouTube?: boolean;
    enableTMDB?: boolean;
    enableBestBuy?: boolean;
    enableSpotify?: boolean;
    enableSteam?: boolean;
    cachedCategory?: string | null; // Previously detected category from database
  } = {}
): Promise<IntelligentComparisonResult> {
  // Wrap entire comparison in timeout (30 seconds max)
  return withTimeout(
    runIntelligentComparisonInternal(terms, series, options),
    30000,
    'Comparison took too long to complete'
  );
}

/**
 * Internal comparison function (without timeout wrapper)
 */
async function runIntelligentComparisonInternal(
  terms: string[],
  series: SeriesPoint[],
  options: {
    enableYouTube?: boolean;
    enableTMDB?: boolean;
    enableBestBuy?: boolean;
    enableSpotify?: boolean;
    enableSteam?: boolean;
    cachedCategory?: string | null;
  } = {}
): Promise<IntelligentComparisonResult> {
  const startTime = Date.now();
  const sourcesQueried: string[] = ['Google Trends'];

  const {
    enableYouTube = true,
    enableTMDB = true,
    enableBestBuy = true,
    enableSpotify = true,
    enableSteam = true,
    cachedCategory = null,
  } = options;

  // Step 1: 3-Tier Category Detection with Caching
  // TIER 1: Comparison-level cache (from database Comparison.category field)
  // TIER 2: Keyword-level cache (from database KeywordCategory table)
  // TIER 3: AI detection (fallback, ~$0.0001 per call)
  console.log('[IntelligentComparison] 🔍 Starting category detection for:', terms);

  let category: CategoryResult;
  let smartCategory: any = null;
  let aiResult: any = null;
  let cacheSource: string = 'none';

  // TIER 1: Check comparison-level cache first (highest priority)
  if (cachedCategory && cachedCategory !== 'null' && cachedCategory !== 'undefined') {
    console.log('[IntelligentComparison] ✅ TIER 1: Using comparison-level cached category:', cachedCategory);
    category = {
      category: cachedCategory as ComparisonCategory,
      confidence: 100,
      evidence: [
        {
          source: 'comparison_cache',
          signal: 'Previously detected and cached',
          confidence: 100,
        },
      ],
    };
    cacheSource = 'comparison_cache';
  } else {
    // TIER 2: Check keyword-level cache
    const keywordCacheResult = await getCachedComparisonCategory(terms[0], terms[1]);

    if (keywordCacheResult) {
      console.log('[IntelligentComparison] ✅ TIER 2: Using keyword-level cached category:', keywordCacheResult.category);
      category = {
        category: keywordCacheResult.category,
        confidence: keywordCacheResult.confidence,
        evidence: [
          {
            source: 'keyword_cache',
            signal: 'Both keywords cached with same category',
            confidence: keywordCacheResult.confidence,
          },
        ],
      };
      cacheSource = 'keyword_cache';
    } else {
      // TIER 3: AI detection (fresh call)
      console.log('[IntelligentComparison] ⚠️ Cache miss - performing AI detection');
      aiResult = await detectCategoryWithAI(terms[0], terms[1]);

      // Use AI result if successful and confident (≥70)
      if (aiResult.success && aiResult.confidence >= 70) {
        console.log('[IntelligentComparison] ✅ TIER 3: AI detection successful:', {
          category: aiResult.category,
          confidence: aiResult.confidence,
          reasoning: aiResult.reasoning,
        });

        category = {
          category: aiResult.category,
          confidence: aiResult.confidence,
          evidence: [
            {
              source: 'ai_detection',
              signal: aiResult.reasoning,
              confidence: aiResult.confidence,
            },
          ],
        };
        cacheSource = 'ai_detection';

        // Cache both keywords for future use
        await cacheComparisonKeywords(
          terms[0],
          terms[1],
          aiResult.category,
          aiResult.confidence,
          'ai',
          aiResult.reasoning
        );
      } else {
        // Fallback to API probing if AI fails or is uncertain
        console.log('[IntelligentComparison] ⚠️ AI uncertain, falling back to API probing');

        smartCategory = await detectCategoryByAPI(terms[0], terms[1], {
          enableSpotify,
          enableTMDB,
          enableSteam,
          enableBestBuy,
        });

        category = {
          category: smartCategory.category,
          confidence: smartCategory.confidence,
          evidence: smartCategory.evidence,
        };
        cacheSource = 'api_probing';

        console.log('[IntelligentComparison] ✅ API probing result:', {
          category: category.category,
          confidence: category.confidence,
          apiMatches: smartCategory.apiMatches,
        });

        // Cache keywords from API probing too
        if (smartCategory.confidence >= 70) {
          await cacheComparisonKeywords(
            terms[0],
            terms[1],
            smartCategory.category,
            smartCategory.confidence,
            'api_probing',
            `API probing: ${smartCategory.apiMatches || 0} matches`
          );
        }
      }
    }
  }

  console.log(`[IntelligentComparison] 📊 Category detection complete: ${category.category} (source: ${cacheSource})`);
  
  // Step 2: Calculate base stats from Google Trends data
  // Pass actual term names to avoid Object.keys() order issues
  const statsA = calculateSeriesStats(series, terms[0], terms[1]);
  const statsB = calculateSeriesStats(series, terms[1], terms[0]);

  // Validate stats before using
  if (!statsA || !statsB || typeof statsA.avgInterest !== 'number' || typeof statsB.avgInterest !== 'number') {
    console.error('[IntelligentComparison] Invalid stats calculated:', { statsA, statsB });
    throw new Error('Failed to calculate base statistics from series data');
  }

  // Initialize metrics - googleTrends is REQUIRED
  const metricsA: SourceMetrics = {
    googleTrends: statsA,
  };
  const metricsB: SourceMetrics = {
    googleTrends: statsB,
  };

  // Initialize enriched data
  const enrichedData: IntelligentComparisonResult['enrichedData'] = {};

  // Step 3: Fetch data from relevant APIs based on detected category
  const fetchPromises: Promise<void>[] = [];

  // Determine if we should fetch directly (category known) or use cached API results
  // Fetch directly if:
  // 1. AI detection succeeded (aiResult exists and is confident)
  // 2. OR category is cached with high confidence (from comparison or keyword cache)
  // Use cached API results only if: API probing was used (smartCategory exists)
  const shouldFetchDirectly = 
    (aiResult && aiResult.success && aiResult.confidence >= 70) ||
    (cacheSource !== 'none' && category.confidence >= 70);

  if (shouldFetchDirectly) {
    // Category is known (from AI or cache) - fetch from relevant APIs directly
    const apisToQuery = getAPIsForCategory(category.category);
    
    console.log(`[IntelligentComparison] 🔍 Fetching APIs for category "${category.category}" (source: ${cacheSource}):`, apisToQuery);

    // Fetch Spotify data (for music)
    if (apisToQuery.spotify && enableSpotify && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      fetchPromises.push(
        (async () => {
          try {
            const [artistA, artistB] = await Promise.all([
              safeAPICall(() => spotifyAdapter.searchArtist(terms[0]), 'Spotify', 8000),
              safeAPICall(() => spotifyAdapter.searchArtist(terms[1]), 'Spotify', 8000),
            ]);
            
            if (!artistA && !artistB) return; // Both failed, skip

            if (artistA) {
              metricsA.spotify = {
                popularity: artistA.popularity,
                followers: artistA.followers,
              };
            }

            if (artistB) {
              metricsB.spotify = {
                popularity: artistB.popularity,
                followers: artistB.followers,
              };
            }

            enrichedData.spotify = {
              termA: artistA ? { popularity: artistA.popularity, followers: artistA.followers, name: artistA.name } : null,
              termB: artistB ? { popularity: artistB.popularity, followers: artistB.followers, name: artistB.name } : null,
            };

            sourcesQueried.push('Spotify');
            console.log('[IntelligentComparison] ✅ Fetched Spotify data (AI-directed)');
          } catch (error) {
            console.warn('[IntelligentComparison] Spotify fetch failed:', error);
          }
        })()
      );
    }

    // Fetch TMDB data (for movies)
    if (apisToQuery.tmdb && enableTMDB && process.env.TMDB_API_KEY) {
      fetchPromises.push(
        (async () => {
          try {
            const [movieA, movieB] = await Promise.all([
              safeAPICall(() => tmdbAdapter.searchMovie(terms[0]), 'TMDB', 8000),
              safeAPICall(() => tmdbAdapter.searchMovie(terms[1]), 'TMDB', 8000),
            ]);
            
            if (!movieA && !movieB) return; // Both failed, skip

            if (movieA) {
              metricsA.tmdb = {
                rating: movieA.voteAverage,
                voteCount: movieA.voteCount,
                popularity: movieA.popularity,
              };
            }

            if (movieB) {
              metricsB.tmdb = {
                rating: movieB.voteAverage,
                voteCount: movieB.voteCount,
                popularity: movieB.popularity,
              };
            }

            enrichedData.tmdb = {
              termA: movieA ? { rating: movieA.voteAverage, title: movieA.title } : null,
              termB: movieB ? { rating: movieB.voteAverage, title: movieB.title } : null,
            };

            sourcesQueried.push('TMDB');
            console.log('[IntelligentComparison] ✅ Fetched TMDB data (AI-directed)');
          } catch (error) {
            console.warn('[IntelligentComparison] TMDB fetch failed:', error);
          }
        })()
      );
    }

    // Fetch Steam data (for games)
    if (apisToQuery.steam && enableSteam) {
      fetchPromises.push(
        (async () => {
          try {
            const [gameA, gameB] = await Promise.all([
              safeAPICall(() => steamAdapter.searchGame(terms[0]), 'Steam', 8000),
              safeAPICall(() => steamAdapter.searchGame(terms[1]), 'Steam', 8000),
            ]);
            
            if (!gameA && !gameB) return; // Both failed, skip

            if (gameA) {
              metricsA.steam = {
                reviewScore: gameA.reviewScore,
                currentPlayers: gameA.currentPlayers,
                totalReviews: gameA.totalReviews,
              };
            }

            if (gameB) {
              metricsB.steam = {
                reviewScore: gameB.reviewScore,
                currentPlayers: gameB.currentPlayers,
                totalReviews: gameB.totalReviews,
              };
            }

            enrichedData.steam = {
              termA: gameA ? { reviewScore: gameA.reviewScore, players: gameA.currentPlayers, name: gameA.name } : null,
              termB: gameB ? { reviewScore: gameB.reviewScore, players: gameB.currentPlayers, name: gameB.name } : null,
            };

            sourcesQueried.push('Steam');
            console.log('[IntelligentComparison] ✅ Fetched Steam data (AI-directed)');
          } catch (error) {
            console.warn('[IntelligentComparison] Steam fetch failed:', error);
          }
        })()
      );
    }

    // Fetch Best Buy data (for products)
    if (apisToQuery.bestbuy && enableBestBuy && process.env.BESTBUY_API_KEY) {
      fetchPromises.push(
        (async () => {
          try {
            const [productA, productB] = await Promise.all([
              safeAPICall(() => bestBuyAdapter.searchProduct(terms[0]), 'Best Buy', 8000),
              safeAPICall(() => bestBuyAdapter.searchProduct(terms[1]), 'Best Buy', 8000),
            ]);
            
            if (!productA && !productB) return; // Both failed, skip

            if (productA) {
              metricsA.bestbuy = {
                rating: productA.customerReviewAverage,
                reviewCount: productA.customerReviewCount,
                price: productA.regularPrice,
              };
            }

            if (productB) {
              metricsB.bestbuy = {
                rating: productB.customerReviewAverage,
                reviewCount: productB.customerReviewCount,
                price: productB.regularPrice,
              };
            }

            enrichedData.bestbuy = {
              termA: productA ? { rating: productA.customerReviewAverage, reviews: productA.customerReviewCount, name: productA.name } : null,
              termB: productB ? { rating: productB.customerReviewAverage, reviews: productB.customerReviewCount, name: productB.name } : null,
            };

            sourcesQueried.push('Best Buy');
            console.log('[IntelligentComparison] ✅ Fetched Best Buy data (AI-directed)');
          } catch (error) {
            console.warn('[IntelligentComparison] Best Buy fetch failed:', error);
          }
        })()
      );
    }
  } else if (smartCategory) {
    // API probing was used - use cached results to avoid duplicate calls
    console.log('[IntelligentComparison] 📦 Using cached results from API probing');

    // Process Spotify data if available
    if (smartCategory.cachedResults.spotify) {
    const artistA = smartCategory.cachedResults.spotify.termA;
    const artistB = smartCategory.cachedResults.spotify.termB;

    if (artistA) {
      metricsA.spotify = {
        popularity: artistA.popularity,
        followers: artistA.followers,
      };
    }

    if (artistB) {
      metricsB.spotify = {
        popularity: artistB.popularity,
        followers: artistB.followers,
      };
    }

    enrichedData.spotify = {
      termA: artistA ? { popularity: artistA.popularity, followers: artistA.followers, name: artistA.name } : null,
      termB: artistB ? { popularity: artistB.popularity, followers: artistB.followers, name: artistB.name } : null,
    };

    sourcesQueried.push('Spotify');
    console.log('[IntelligentComparison] ✅ Using cached Spotify data');
  }

  // Process TMDB data if available
  if (smartCategory.cachedResults.tmdb) {
    const movieA = smartCategory.cachedResults.tmdb.termA;
    const movieB = smartCategory.cachedResults.tmdb.termB;

    if (movieA) {
      metricsA.tmdb = {
        rating: movieA.voteAverage,
        voteCount: movieA.voteCount,
        popularity: movieA.popularity,
      };
    }

    if (movieB) {
      metricsB.tmdb = {
        rating: movieB.voteAverage,
        voteCount: movieB.voteCount,
        popularity: movieB.popularity,
      };
    }

    enrichedData.tmdb = {
      termA: movieA ? { rating: movieA.voteAverage, title: movieA.title } : null,
      termB: movieB ? { rating: movieB.voteAverage, title: movieB.title } : null,
    };

    sourcesQueried.push('TMDB');
    console.log('[IntelligentComparison] ✅ Using cached TMDB data');
  }

  // Process Steam data if available
  if (smartCategory.cachedResults.steam) {
    const gameA = smartCategory.cachedResults.steam.termA;
    const gameB = smartCategory.cachedResults.steam.termB;

    if (gameA) {
      metricsA.steam = {
        reviewScore: gameA.reviewScore,
        currentPlayers: gameA.currentPlayers,
        totalReviews: gameA.totalReviews,
      };
    }

    if (gameB) {
      metricsB.steam = {
        reviewScore: gameB.reviewScore,
        currentPlayers: gameB.currentPlayers,
        totalReviews: gameB.totalReviews,
      };
    }

    enrichedData.steam = {
      termA: gameA ? { reviewScore: gameA.reviewScore, players: gameA.currentPlayers, name: gameA.name } : null,
      termB: gameB ? { reviewScore: gameB.reviewScore, players: gameB.currentPlayers, name: gameB.name } : null,
    };

    sourcesQueried.push('Steam');
    console.log('[IntelligentComparison] ✅ Using cached Steam data');
  }

  // Process Best Buy data if available
  if (smartCategory.cachedResults.bestbuy) {
    const productA = smartCategory.cachedResults.bestbuy.termA;
    const productB = smartCategory.cachedResults.bestbuy.termB;

    if (productA) {
      metricsA.bestbuy = {
        rating: productA.customerReviewAverage,
        reviewCount: productA.customerReviewCount,
        price: productA.regularPrice,
      };
    }

    if (productB) {
      metricsB.bestbuy = {
        rating: productB.customerReviewAverage,
        reviewCount: productB.customerReviewCount,
        price: productB.regularPrice,
      };
    }

    enrichedData.bestbuy = {
      termA: productA ? { rating: productA.customerReviewAverage, reviews: productA.customerReviewCount, name: productA.name } : null,
      termB: productB ? { rating: productB.customerReviewAverage, reviews: productB.customerReviewCount, name: productB.name } : null,
    };

    sourcesQueried.push('Best Buy');
    console.log('[IntelligentComparison] ✅ Using cached Best Buy data');
  }
  }  // End of else if (smartCategory) - cached results block

  // YouTube data (for all categories - always fetch)
  if (enableYouTube && process.env.YOUTUBE_API_KEY) {
    fetchPromises.push(
      (async () => {
        try {
          console.log('[IntelligentComparison] 🔍 Fetching YouTube data for:', terms[0], 'vs', terms[1]);
          const [ytA, ytB] = await Promise.all([
            safeAPICall(() => youtubeAdapter.getVideoStats(terms[0]), 'YouTube', 10000).catch(err => {
              // Check if it's a quota error
              if (err?.name === 'QuotaExceededError' || err?.message?.includes('quota')) {
                console.warn(`[IntelligentComparison] ⚠️ YouTube quota exceeded. Skipping YouTube data for this comparison.`);
                console.warn(`[IntelligentComparison] 💡 YouTube free tier allows ~100 searches/day. Consider enabling billing for higher limits.`);
              } else {
                console.error(`[IntelligentComparison] ❌ YouTube failed for "${terms[0]}":`, err);
              }
              return null;
            }),
            safeAPICall(() => youtubeAdapter.getVideoStats(terms[1]), 'YouTube', 10000).catch(err => {
              // Check if it's a quota error
              if (err?.name === 'QuotaExceededError' || err?.message?.includes('quota')) {
                console.warn(`[IntelligentComparison] ⚠️ YouTube quota exceeded. Skipping YouTube data for this comparison.`);
              } else {
                console.error(`[IntelligentComparison] ❌ YouTube failed for "${terms[1]}":`, err);
              }
              return null;
            }),
          ]);
          
          // Log what we got
          console.log('[IntelligentComparison] YouTube results:', {
            termA: ytA ? `✅ ${ytA.totalVideos} videos, ${ytA.totalViews.toLocaleString()} views` : '❌ Failed',
            termB: ytB ? `✅ ${ytB.totalVideos} videos, ${ytB.totalViews.toLocaleString()} views` : '❌ Failed',
          });
          
          // Handle null results - set metrics even if one fails
          const ytAStats = ytA || { totalViews: 0, avgViews: 0, totalVideos: 0, totalLikes: 0 };
          const ytBStats = ytB || { totalViews: 0, avgViews: 0, totalVideos: 0, totalLikes: 0 };
          
          // Only skip if BOTH failed AND we have no data
          if (!ytA && !ytB && ytAStats.totalViews === 0 && ytBStats.totalViews === 0) {
            console.warn('[IntelligentComparison] ⚠️ YouTube: Both terms returned no data');
            console.warn('[IntelligentComparison] 💡 Possible reasons:');
            console.warn('  - API key invalid or quota exceeded');
            console.warn('  - Search terms too specific or no videos found');
            console.warn('  - Network/API error');
            return;
          }
          
          metricsA.youtube = {
            totalViews: ytAStats.totalViews,
            avgViews: ytAStats.avgViews,
            videoCount: ytAStats.totalVideos,
            engagement: ytAStats.totalViews > 0 ? ytAStats.totalLikes / ytAStats.totalViews : 0,
          };
          
          metricsB.youtube = {
            totalViews: ytBStats.totalViews,
            avgViews: ytBStats.avgViews,
            videoCount: ytBStats.totalVideos,
            engagement: ytBStats.totalViews > 0 ? ytBStats.totalLikes / ytBStats.totalViews : 0,
          };
          
          enrichedData.youtube = {
            termA: { views: ytAStats.totalViews, videos: ytAStats.totalVideos },
            termB: { views: ytBStats.totalViews, videos: ytBStats.totalVideos },
          };
          
          sourcesQueried.push('YouTube');
          console.log('[IntelligentComparison] ✅ YouTube data fetched:', {
            termA: { views: ytAStats.totalViews, videos: ytAStats.totalVideos, engagement: metricsA.youtube.engagement },
            termB: { views: ytBStats.totalViews, videos: ytBStats.totalVideos, engagement: metricsB.youtube.engagement },
          });
        } catch (error) {
          console.warn('[IntelligentComparison] ❌ YouTube fetch failed:', error);
        }
      })()
    );
  } else {
    console.warn('[IntelligentComparison] ⚠️ YouTube disabled or API key missing');
  }

  // Wikipedia data (for general topics and all categories - FREE, no API key needed)
  // Wikipedia provides pageview data which is great for general topics
  if (category.category === 'general' || category.category === 'people' || category.category === 'places' || category.category === 'brands') {
    fetchPromises.push(
      (async () => {
        try {
          const { wikipediaAdapter } = await import('./sources/adapters/wikipedia');
          console.log('[IntelligentComparison] 🔍 Fetching Wikipedia data for:', terms[0], 'vs', terms[1]);
          
          const [wikiA, wikiB] = await Promise.all([
            safeAPICall(() => wikipediaAdapter.getArticleStats(terms[0]), 'Wikipedia', 8000),
            safeAPICall(() => wikipediaAdapter.getArticleStats(terms[1]), 'Wikipedia', 8000),
          ]);
          
          if (wikiA && wikiA.articleExists && wikiA.avgPageviews > 0) {
            metricsA.wikipedia = {
              avgPageviews: wikiA.avgPageviews,
              totalPageviews: wikiA.totalPageviews,
              articleExists: true,
            };
            enrichedData.wikipedia = {
              termA: { 
                avgPageviews: wikiA.avgPageviews, 
                articleTitle: wikiA.articleTitle || terms[0] 
              },
              termB: null,
            };
            sourcesQueried.push('Wikipedia');
            console.log('[IntelligentComparison] ✅ Wikipedia data for term A:', {
              article: wikiA.articleTitle,
              avgPageviews: Math.round(wikiA.avgPageviews).toLocaleString(),
            });
          }
          
          if (wikiB && wikiB.articleExists && wikiB.avgPageviews > 0) {
            metricsB.wikipedia = {
              avgPageviews: wikiB.avgPageviews,
              totalPageviews: wikiB.totalPageviews,
              articleExists: true,
            };
            if (!enrichedData.wikipedia) {
              enrichedData.wikipedia = { termA: null, termB: null };
            }
            enrichedData.wikipedia.termB = { 
              avgPageviews: wikiB.avgPageviews, 
              articleTitle: wikiB.articleTitle || terms[1] 
            };
            if (!sourcesQueried.includes('Wikipedia')) {
              sourcesQueried.push('Wikipedia');
            }
            console.log('[IntelligentComparison] ✅ Wikipedia data for term B:', {
              article: wikiB.articleTitle,
              avgPageviews: Math.round(wikiB.avgPageviews).toLocaleString(),
            });
          }
        } catch (error) {
          console.warn('[IntelligentComparison] ❌ Wikipedia fetch failed:', error);
        }
      })()
    );
  }

  // All specialized APIs (Spotify, TMDB, Steam, Best Buy) are now handled via cached results above
  // No duplicate API calls needed!

  // Wait for all enrichment data (YouTube + Wikipedia)
  await Promise.allSettled(fetchPromises);

  // Step 4: Calculate TrendArc Scores
  // Ensure metrics have required googleTrends data
  if (!metricsA.googleTrends || !metricsB.googleTrends) {
    console.error('[IntelligentComparison] Missing googleTrends in metrics:', { metricsA, metricsB });
    throw new Error('Failed to calculate scores - missing required Google Trends data');
  }
  
  // Ensure category is valid (calculateTrendArcScore handles fallback internally)
  const scoreA = calculateTrendArcScore(metricsA, category.category);
  const scoreB = calculateTrendArcScore(metricsB, category.category);

  // Step 5: Generate verdict
  const verdict = generateVerdict(terms[0], terms[1], scoreA, scoreB, category.category);

  const totalMs = Date.now() - startTime;

  return {
    category,
    scores: {
      termA: scoreA,
      termB: scoreB,
    },
    verdict,
    enrichedData,
    performance: {
      totalMs,
      sourcesQueried,
    },
  };
}

/**
 * Generate a quick verdict from existing stats (no API calls)
 */
export function generateQuickVerdict(
  terms: string[],
  series: SeriesPoint[]
): {
  winner: string;
  margin: number;
  headline: string;
  confidence: number;
} {
  const statsA = calculateSeriesStats(series, terms[0], terms[1]);
  const statsB = calculateSeriesStats(series, terms[1], terms[0]);
  
  const category = detectCategory(terms);
  
  const scoreA = calculateTrendArcScore({ googleTrends: statsA }, category.category);
  const scoreB = calculateTrendArcScore({ googleTrends: statsB }, category.category);
  
  const winner = scoreA.overall >= scoreB.overall ? terms[0] : terms[1];
  const margin = Math.abs(scoreA.overall - scoreB.overall);
  
  let headline: string;
  if (margin >= 20) {
    headline = `${winner} dominates this comparison`;
  } else if (margin >= 10) {
    headline = `${winner} leads in popularity`;
  } else if (margin >= 5) {
    headline = `${winner} has a slight edge`;
  } else {
    headline = `It's a close race between ${terms[0]} and ${terms[1]}`;
  }
  
  return {
    winner,
    margin,
    headline,
    confidence: Math.round((scoreA.confidence + scoreB.confidence) / 2),
  };
}

/**
 * Get action verb for category
 */
export function getActionVerb(category: ComparisonCategory): string {
  const templates = getRecommendationTemplate(category);
  return templates.action;
}
