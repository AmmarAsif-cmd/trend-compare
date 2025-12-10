/**
 * Intelligent Comparison System
 * Combines category detection, multi-source data, and verdict generation
 */

import { detectCategory, getRecommendationTemplate, type ComparisonCategory, type CategoryResult } from './category-resolver';
import { calculateTrendArcScore, generateVerdict, type SourceMetrics, type TrendArcScore, type ComparisonVerdict } from './trendarc-score';
import { youtubeAdapter } from './sources/adapters/youtube';
import { tmdbAdapter } from './sources/adapters/tmdb';
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
    enableReddit?: boolean;
  } = {}
): Promise<IntelligentComparisonResult> {
  const startTime = Date.now();
  const sourcesQueried: string[] = ['Google Trends'];
  
  const {
    enableYouTube = true,
    enableTMDB = true,
  } = options;

  // Step 1: Detect category
  const category = detectCategory(terms);
  
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

  // Step 3: Fetch additional data based on category
  const fetchPromises: Promise<void>[] = [];

  // YouTube data (for all categories)
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

  // TMDB data (for movies category)
  if (enableTMDB && category.category === 'movies' && process.env.TMDB_API_KEY) {
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
        } catch (error) {
          console.warn('[IntelligentComparison] TMDB fetch failed:', error);
        }
      })()
    );
  }

  // Wait for all enrichment data
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
