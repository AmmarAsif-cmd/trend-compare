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
  };
  performance: {
    totalMs: number;
    sourcesQueried: string[];
  };
};

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

  // Initialize metrics
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
  // Use direct fetch if: AI detection succeeded
  // Use cached results only if: API probing was used (smartCategory exists)
  const shouldFetchDirectly = aiResult && aiResult.success && aiResult.confidence >= 70;

  if (shouldFetchDirectly) {
    // AI told us the category - fetch from relevant APIs directly
    const apisToQuery = getAPIsForCategory(category.category);

    // Fetch Spotify data (for music)
    if (apisToQuery.spotify && enableSpotify && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      fetchPromises.push(
        (async () => {
          try {
            const [artistA, artistB] = await Promise.all([
              spotifyAdapter.searchArtist(terms[0]),
              spotifyAdapter.searchArtist(terms[1]),
            ]);

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
              tmdbAdapter.searchMovie(terms[0]),
              tmdbAdapter.searchMovie(terms[1]),
            ]);

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
              steamAdapter.searchGame(terms[0]),
              steamAdapter.searchGame(terms[1]),
            ]);

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
              bestBuyAdapter.searchProduct(terms[0]),
              bestBuyAdapter.searchProduct(terms[1]),
            ]);

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
          const [ytA, ytB] = await Promise.all([
            youtubeAdapter.getVideoStats(terms[0]),
            youtubeAdapter.getVideoStats(terms[1]),
          ]);
          
          metricsA.youtube = {
            totalViews: ytA.totalViews,
            avgViews: ytA.avgViews,
            videoCount: ytA.totalVideos,
            engagement: ytA.totalViews > 0 ? ytA.totalLikes / ytA.totalViews : 0,
          };
          
          metricsB.youtube = {
            totalViews: ytB.totalViews,
            avgViews: ytB.avgViews,
            videoCount: ytB.totalVideos,
            engagement: ytB.totalViews > 0 ? ytB.totalLikes / ytB.totalViews : 0,
          };
          
          enrichedData.youtube = {
            termA: { views: ytA.totalViews, videos: ytA.totalVideos },
            termB: { views: ytB.totalViews, videos: ytB.totalVideos },
          };
          
          sourcesQueried.push('YouTube');
        } catch (error) {
          console.warn('[IntelligentComparison] YouTube fetch failed:', error);
        }
      })()
    );
  }

  // All specialized APIs (Spotify, TMDB, Steam, Best Buy) are now handled via cached results above
  // No duplicate API calls needed!

  // Wait for all enrichment data (only YouTube now)
  await Promise.allSettled(fetchPromises);

  // Step 4: Calculate TrendArc Scores
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
