/**
 * TrendArc Score Algorithm
 * Combines data from multiple sources into a unified comparison score
 */

import type { ComparisonCategory } from './category-resolver';
import {
  normalizeYouTubeViews,
  normalizeWikipediaPageviews,
  normalizeMomentum,
  hasLowCoverage,
} from './metric-normalization';

export type SourceMetrics = {
  googleTrends?: {
    avgInterest: number;      // 0-100
    momentum: number;         // -100 to 100 (negative = declining)
    volatility: number;       // 0-100
    leadPercentage: number;   // % of time leading
  };
  youtube?: {
    totalViews: number;
    avgViews: number;
    videoCount: number;
    engagement: number;       // likes/views ratio
  };
  tmdb?: {
    rating: number;           // 0-10
    voteCount: number;
    popularity: number;
  };
  bestbuy?: {
    rating: number;           // 0-5
    reviewCount: number;
    price: number;
  };
  spotify?: {
    popularity: number;       // 0-100
    followers: number;
  };
  steam?: {
    reviewScore: number;      // 0-100 (% positive)
    currentPlayers: number;
    totalReviews: number;
  };
  omdb?: {
    imdbRating: number;
    rottenTomatoes: number;
    metascore: number;
  };
  wikipedia?: {
    avgPageviews: number;      // Average daily pageviews
    totalPageviews: number;    // Total pageviews in period
    articleExists: boolean;   // Whether Wikipedia article exists
  };
};

export type TrendArcScore = {
  overall: number;            // 0-100, main comparison score
  confidence: number;         // 0-100, how reliable is this score
  breakdown: {
    searchInterest: number;   // From Google Trends
    socialBuzz: number;       // From Reddit, YouTube
    authority: number;        // From Wikipedia, TMDB ratings
    momentum: number;         // Trend direction
  };
  sources: string[];          // Which sources contributed
  explanation: string;        // Human-readable explanation
};

export type ComparisonVerdict = {
  winner: string;
  loser: string;
  winnerScore: TrendArcScore;
  loserScore: TrendArcScore;
  margin: number;             // Percentage difference
  confidence: number;         // How confident in this verdict
  headline: string;           // Bold statement
  recommendation: string;     // Actionable advice
  evidence: string[];         // Supporting facts
};

// Category-specific weights for each metric
// Google Trends (searchInterest) is always the primary factor to ensure consistency
// with chart and AI insights which are based on search trends
export const CATEGORY_WEIGHTS: Record<ComparisonCategory, {
  searchInterest: number;
  socialBuzz: number;
  authority: number;
  momentum: number;
}> = {
  movies: { searchInterest: 0.45, socialBuzz: 0.15, authority: 0.3, momentum: 0.1 },
  products: { searchInterest: 0.45, socialBuzz: 0.25, authority: 0.2, momentum: 0.1 },
  tech: { searchInterest: 0.4, socialBuzz: 0.2, authority: 0.25, momentum: 0.15 },
  people: { searchInterest: 0.45, socialBuzz: 0.35, authority: 0.1, momentum: 0.1 },
  games: { searchInterest: 0.4, socialBuzz: 0.3, authority: 0.2, momentum: 0.1 },
  music: { searchInterest: 0.4, socialBuzz: 0.3, authority: 0.2, momentum: 0.1 },
  brands: { searchInterest: 0.4, socialBuzz: 0.25, authority: 0.25, momentum: 0.1 },
  places: { searchInterest: 0.45, socialBuzz: 0.2, authority: 0.25, momentum: 0.1 },
  general: { searchInterest: 0.45, socialBuzz: 0.25, authority: 0.2, momentum: 0.1 },
};

/**
 * Calculate TrendArc Score from multiple source metrics
 */
export function calculateTrendArcScore(
  metrics: SourceMetrics,
  category: ComparisonCategory = 'general'
): TrendArcScore {
  // Ensure category is valid, fallback to 'general' if not
  const validCategory = category in CATEGORY_WEIGHTS ? category : 'general';
  const weights = CATEGORY_WEIGHTS[validCategory];
  
  // Ensure weights exist (should always be true, but safety check)
  if (!weights) {
    console.error('[TrendArcScore] Invalid weights for category:', category);
    // Use general weights as fallback
    const fallbackWeights = CATEGORY_WEIGHTS.general;
    return {
      overall: 50,
      confidence: 30,
      breakdown: {
        searchInterest: 50,
        socialBuzz: 50,
        authority: 50,
        momentum: 50,
      },
      sources: [],
      explanation: 'Unable to calculate score - invalid category',
    };
  }
  
  const sources: string[] = [];
  
  // Calculate component scores
  let searchInterest = 50; // Default neutral
  let socialBuzz = 50;
  let authority = 50;
  let momentum = 50;

  // Search Interest (Google Trends) - REQUIRED, should always exist
  if (metrics.googleTrends && typeof metrics.googleTrends.avgInterest === 'number') {
    searchInterest = metrics.googleTrends.avgInterest;
    sources.push('Google Trends');
    console.log('[TrendArcScore] Google Trends searchInterest:', searchInterest);
  } else {
    // If googleTrends is missing, this is a critical error
    console.error('[TrendArcScore] ❌ Missing googleTrends in metrics:', JSON.stringify(metrics, null, 2));
    // Use default 50, but log the error
  }

  // Social Buzz (YouTube + Spotify + Wikipedia)
  const socialScores: number[] = [];
  const socialWeights: number[] = []; // Track weights for weighted average
  
  if (metrics.youtube) {
    const avgViews = metrics.youtube.avgViews || 0;
    const videoCount = metrics.youtube.videoCount || 0;
    const engagement = metrics.youtube.engagement || 0;
    
    // Check for low coverage
    const lowCoverage = hasLowCoverage(metrics.youtube, ['avgViews', 'videoCount']);
    
    if (!lowCoverage && (avgViews > 0 || videoCount > 0)) {
      // Use improved normalization
      const viewScore = normalizeYouTubeViews(avgViews);
      
      // Video count bonus: 0-20 points
      const videoCountScore = Math.min(20, Math.log10(Math.max(1, videoCount + 1)) * 10);
      
      // Engagement score: 0-30 points
      const engagementScore = Math.min(30, engagement * 600);
      
      // Combine: views (0-100) + video count (0-20) + engagement (0-30)
      // Normalize to 0-100 by taking weighted average
      const ytScore = (viewScore * 0.6) + (videoCountScore * 0.2) + (engagementScore * 0.2);
      
      if (ytScore > 0) {
        socialScores.push(ytScore);
        socialWeights.push(1.0); // Full weight
        sources.push('YouTube');
        console.log('[TrendArcScore] YouTube contribution (normalized):', {
          avgViews: avgViews.toLocaleString(),
          normalizedViewScore: Math.round(viewScore),
          videoCountScore: Math.round(videoCountScore),
          engagementScore: Math.round(engagementScore),
          totalYtScore: Math.round(ytScore),
        });
      }
    } else if (lowCoverage) {
      console.warn('[TrendArcScore] ⚠️ YouTube has low coverage - reducing weight');
    }
  }

  if (metrics.spotify) {
    const lowCoverage = hasLowCoverage(metrics.spotify, ['popularity']);
    if (!lowCoverage && metrics.spotify.popularity > 0) {
      // Spotify popularity is already 0-100, but ensure it's meaningful
      socialScores.push(metrics.spotify.popularity);
      socialWeights.push(1.0);
      sources.push('Spotify');
      console.log('[TrendArcScore] Spotify contribution:', metrics.spotify.popularity);
    } else if (lowCoverage) {
      console.warn('[TrendArcScore] ⚠️ Spotify has low coverage - reducing weight');
    }
  }

  if (metrics.wikipedia) {
    const lowCoverage = hasLowCoverage(metrics.wikipedia, ['avgPageviews']);
    if (!lowCoverage && metrics.wikipedia.avgPageviews > 0) {
      const wikiScore = normalizeWikipediaPageviews(metrics.wikipedia.avgPageviews);
      socialScores.push(wikiScore);
      socialWeights.push(1.0);
      sources.push('Wikipedia');
      console.log('[TrendArcScore] Wikipedia contribution (normalized):', {
        avgPageviews: metrics.wikipedia.avgPageviews.toLocaleString(),
        score: Math.round(wikiScore),
      });
    } else if (lowCoverage) {
      console.warn('[TrendArcScore] ⚠️ Wikipedia has low coverage - reducing weight');
    }
  }

  if (socialScores.length > 0) {
    // Weighted average (all weights are 1.0 for now, but structure allows for future weighting)
    const totalWeight = socialWeights.reduce((a, b) => a + b, 0);
    if (totalWeight > 0) {
      socialBuzz = socialScores.reduce((sum, score, idx) => sum + score * socialWeights[idx], 0) / totalWeight;
    } else {
      socialBuzz = socialScores.reduce((a, b) => a + b, 0) / socialScores.length;
    }
    console.log('[TrendArcScore] Social buzz calculated (normalized):', {
      scores: socialScores.map(s => Math.round(s)),
      average: Math.round(socialBuzz),
      sources: sources.filter(s => ['YouTube', 'Spotify', 'Wikipedia'].includes(s)),
    });
  } else {
    console.warn('[TrendArcScore] ⚠️ No valid social sources available, socialBuzz defaults to 50');
  }

  // Authority (TMDB ratings, Best Buy reviews, Steam reviews, expert sources)
  const authorityScores: number[] = [];

  if (metrics.tmdb && metrics.tmdb.rating > 0) {
    authorityScores.push(metrics.tmdb.rating * 10);
    sources.push('TMDB');
  }

  if (metrics.bestbuy && metrics.bestbuy.rating > 0) {
    // Convert 0-5 rating to 0-100 scale
    const bestbuyScore = (metrics.bestbuy.rating / 5) * 100;
    authorityScores.push(bestbuyScore);
    sources.push('Best Buy');
  }

  if (metrics.steam && metrics.steam.reviewScore > 0) {
    // Steam review score is already 0-100 (percentage positive)
    // Only add if we have meaningful data (reviewScore > 0)
    authorityScores.push(metrics.steam.reviewScore);
    sources.push('Steam');
    console.log('[TrendArcScore] Steam authority contribution:', {
      reviewScore: metrics.steam.reviewScore,
      totalReviews: metrics.steam.totalReviews,
      currentPlayers: metrics.steam.currentPlayers,
    });
  } else if (metrics.steam) {
    // Steam data exists but reviewScore is 0 - log warning
    console.warn('[TrendArcScore] ⚠️ Steam data exists but reviewScore is 0:', {
      totalReviews: metrics.steam.totalReviews,
      currentPlayers: metrics.steam.currentPlayers,
    });
  }
  
  if (metrics.omdb) {
    const avgRating = (
      (metrics.omdb.imdbRating || 0) * 10 +
      (metrics.omdb.rottenTomatoes || 0) +
      (metrics.omdb.metascore || 0)
    ) / 3;
    if (avgRating > 0) {
      authorityScores.push(avgRating);
      sources.push('OMDb');
    }
  }

  if (authorityScores.length > 0) {
    authority = authorityScores.reduce((a, b) => a + b, 0) / authorityScores.length;
    console.log('[TrendArcScore] Authority calculated:', {
      scores: authorityScores.map(s => Math.round(s)),
      average: Math.round(authority),
      sources: sources.filter(s => ['TMDB', 'Steam', 'Best Buy', 'OMDb'].includes(s)),
    });
  } else {
    console.warn('[TrendArcScore] ⚠️ No valid authority sources available, authority defaults to 50');
  }

  // Momentum (trend direction)
  if (metrics.googleTrends && typeof metrics.googleTrends.momentum === 'number') {
    momentum = normalizeMomentum(metrics.googleTrends.momentum);
    console.log('[TrendArcScore] Momentum (normalized):', {
      raw: metrics.googleTrends.momentum,
      normalized: Math.round(momentum),
    });
  }

  // Calculate weighted overall score
  const overall = Math.round(
    searchInterest * weights.searchInterest +
    socialBuzz * weights.socialBuzz +
    authority * weights.authority +
    momentum * weights.momentum
  );
  
  // Log calculation for debugging
  console.log('[TrendArcScore] 📊 Score calculation:', {
    category: validCategory,
    components: {
      searchInterest: Math.round(searchInterest),
      socialBuzz: Math.round(socialBuzz),
      authority: Math.round(authority),
      momentum: Math.round(momentum),
    },
    weights: {
      searchInterest: weights.searchInterest,
      socialBuzz: weights.socialBuzz,
      authority: weights.authority,
      momentum: weights.momentum,
    },
    weightedSum: searchInterest * weights.searchInterest + socialBuzz * weights.socialBuzz + authority * weights.authority + momentum * weights.momentum,
    overall: Math.max(0, Math.min(100, overall)),
    sources: sources.length,
  });

  // Calculate confidence based on number of sources
  // NOTE: This is a preliminary confidence value. The final confidence used in the UI
  // is computed by computeComparisonMetrics() using a continuous calculation based on
  // multiple factors (agreementIndex, volatility, dataPoints, sourceCount, margin, etc).
  // This value is primarily used as a placeholder until computeComparisonMetrics runs.
  const confidence = Math.min(95, 40 + sources.length * 15);

  // Generate explanation
  const explanationParts: string[] = [];
  
  if (searchInterest >= 60) {
    explanationParts.push('high search interest');
  } else if (searchInterest <= 40) {
    explanationParts.push('lower search volume');
  }
  
  if (socialBuzz >= 60) {
    explanationParts.push('strong social engagement');
  }
  
  if (authority >= 70) {
    explanationParts.push('well-rated');
  }
  
  if (momentum >= 60) {
    explanationParts.push('trending upward');
  } else if (momentum <= 40) {
    explanationParts.push('declining interest');
  }

  const explanation = explanationParts.length > 0 
    ? `Shows ${explanationParts.join(', ')}`
    : 'Moderate performance across metrics';

  return {
    overall: Math.max(0, Math.min(100, overall)),
    confidence,
    breakdown: {
      searchInterest: Math.round(searchInterest),
      socialBuzz: Math.round(socialBuzz),
      authority: Math.round(authority),
      momentum: Math.round(momentum),
    },
    sources,
    explanation,
  };
}

/**
 * Compare two items and generate a verdict
 */
export function generateVerdict(
  termA: string,
  termB: string,
  scoreA: TrendArcScore,
  scoreB: TrendArcScore,
  category: ComparisonCategory = 'general'
): ComparisonVerdict {
  const isAWinner = scoreA.overall >= scoreB.overall;
  const winner = isAWinner ? termA : termB;
  const loser = isAWinner ? termB : termA;
  const winnerScore = isAWinner ? scoreA : scoreB;
  const loserScore = isAWinner ? scoreB : scoreA;
  
  const margin = Math.abs(scoreA.overall - scoreB.overall);
  const confidence = Math.round((scoreA.confidence + scoreB.confidence) / 2);

  // Generate headline based on margin
  let headline: string;
  if (margin >= 20) {
    headline = `${winner} clearly leads over ${loser}`;
  } else if (margin >= 10) {
    headline = `${winner} has the edge over ${loser}`;
  } else if (margin >= 5) {
    headline = `${winner} slightly ahead of ${loser}`;
  } else {
    headline = `${winner} and ${loser} are virtually tied`;
  }

  // Generate recommendation based on category
  let recommendation: string;
  switch (category) {
    case 'movies':
      if (margin >= 10) {
        recommendation = `Based on ratings and audience interest, you should watch ${winner}. It scores ${winnerScore.overall}/100 compared to ${loserScore.overall}/100 for ${loser}.`;
      } else {
        recommendation = `Both are great choices! ${winner} edges out slightly with better ratings and buzz.`;
      }
      break;
    case 'products':
      recommendation = `${winner} is the more popular choice with stronger search interest and user engagement. Consider ${winner} as your primary option.`;
      break;
    case 'tech':
      recommendation = `${winner} shows more developer adoption and community activity. It may be the safer bet for your project.`;
      break;
    case 'games':
      recommendation = `${winner} has more player interest and engagement. If you can only pick one, go with ${winner}.`;
      break;
    default:
      recommendation = `Based on our analysis across ${winnerScore.sources.length} data sources, ${winner} is currently more popular than ${loser}.`;
  }

  // Generate evidence
  const evidence: string[] = [];
  
  if (winnerScore.breakdown.searchInterest > loserScore.breakdown.searchInterest) {
    evidence.push(`Higher search interest (${winnerScore.breakdown.searchInterest} vs ${loserScore.breakdown.searchInterest})`);
  }
  
  if (winnerScore.breakdown.socialBuzz > loserScore.breakdown.socialBuzz) {
    evidence.push(`Stronger social engagement`);
  }
  
  if (winnerScore.breakdown.authority > loserScore.breakdown.authority) {
    evidence.push(`Better ratings and reviews`);
  }
  
  if (winnerScore.breakdown.momentum > loserScore.breakdown.momentum) {
    evidence.push(`Trending more positively`);
  }

  evidence.push(`Data from ${[...new Set([...winnerScore.sources, ...loserScore.sources])].join(', ')}`);

  return {
    winner,
    loser,
    winnerScore,
    loserScore,
    margin,
    confidence,
    headline,
    recommendation,
    evidence,
  };
}

/**
 * Quick score calculation from basic stats
 */
export function quickScore(
  avgInterest: number,
  leadPercentage: number,
  momentum: number = 0
): number {
  return Math.round(
    avgInterest * 0.5 +
    leadPercentage * 0.3 +
    (50 + momentum / 2) * 0.2
  );
}
