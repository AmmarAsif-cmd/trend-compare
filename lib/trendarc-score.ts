/**
 * TrendArc Score Algorithm
 * Combines data from multiple sources into a unified comparison score
 */

import type { ComparisonCategory } from './category-resolver';

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
  } else {
    // If googleTrends is missing, this is a critical error
    console.error('[TrendArcScore] Missing googleTrends in metrics:', metrics);
    // Use default 50, but log the error
  }

  // Social Buzz (YouTube + Spotify + Wikipedia)
  const socialScores: number[] = [];
  
  if (metrics.youtube) {
    // Improved YouTube scoring:
    // - Use logarithmic scale for views (handles both small and huge numbers)
    // - Video count also matters (more videos = more presence)
    // - Engagement rate is important but shouldn't dominate
    
    const avgViews = metrics.youtube.avgViews || 0;
    const videoCount = metrics.youtube.videoCount || 0;
    const engagement = metrics.youtube.engagement || 0;
    
    // Only calculate YouTube score if we have meaningful data
    // Skip if all values are 0 (no data or API failure)
    if (avgViews > 0 || videoCount > 0) {
      // View score: logarithmic scale, 0-50 points
      // 1k views = ~10, 10k = ~20, 100k = ~30, 1M = ~40, 10M+ = 50
      let viewScore = 0;
      if (avgViews > 0) {
        const logViews = Math.log10(Math.max(1, avgViews));
        viewScore = Math.min(50, (logViews / 7) * 50); // log10(10M) ≈ 7
      }
      
      // Video count bonus: 0-20 points (more videos = more presence)
      // 1 video = 5, 10 videos = 10, 50+ videos = 20
      const videoCountScore = Math.min(20, Math.log10(Math.max(1, videoCount + 1)) * 10);
      
      // Engagement score: 0-30 points (5% engagement = 30, which is very high)
      const engagementScore = Math.min(30, engagement * 600);
      
      const ytScore = viewScore + videoCountScore + engagementScore;
      
      // Only add if score is meaningful (> 0)
      if (ytScore > 0) {
        socialScores.push(ytScore);
        sources.push('YouTube');
        console.log('[TrendArcScore] YouTube contribution:', {
          avgViews: avgViews.toLocaleString(),
          videoCount,
          engagement: (engagement * 100).toFixed(2) + '%',
          viewScore: Math.round(viewScore),
          videoCountScore: Math.round(videoCountScore),
          engagementScore: Math.round(engagementScore),
          totalYtScore: Math.round(ytScore),
        });
      } else {
        console.warn('[TrendArcScore] ⚠️ YouTube data exists but score is 0 (no meaningful engagement)');
      }
    } else {
      console.warn('[TrendArcScore] ⚠️ YouTube data exists but all values are 0 - skipping YouTube contribution');
    }
  }

  if (metrics.spotify) {
    // Spotify popularity is already 0-100
    // Only add if meaningful (> 0)
    if (metrics.spotify.popularity > 0) {
      socialScores.push(metrics.spotify.popularity);
      sources.push('Spotify');
      console.log('[TrendArcScore] Spotify contribution:', metrics.spotify.popularity);
    }
  }

  if (metrics.wikipedia) {
    // Wikipedia pageviews: 0-100 scale
    // Higher pageviews = more interest
    if (metrics.wikipedia.avgPageviews > 0) {
      // Normalize pageviews to 0-100 scale
      // 1k/day = ~20, 10k/day = ~40, 100k/day = ~60, 1M/day = ~80, 10M+/day = 100
      const logPageviews = Math.log10(Math.max(1, metrics.wikipedia.avgPageviews));
      const wikiScore = Math.min(100, (logPageviews / 7) * 100);
      socialScores.push(wikiScore);
      sources.push('Wikipedia');
      console.log('[TrendArcScore] Wikipedia contribution:', {
        avgPageviews: metrics.wikipedia.avgPageviews.toLocaleString(),
        score: Math.round(wikiScore),
      });
    }
  }

  if (socialScores.length > 0) {
    socialBuzz = socialScores.reduce((a, b) => a + b, 0) / socialScores.length;
    console.log('[TrendArcScore] Social buzz calculated:', {
      scores: socialScores.map(s => Math.round(s)),
      average: Math.round(socialBuzz),
      sources: sources.filter(s => ['YouTube', 'Spotify', 'Wikipedia'].includes(s)),
    });
  } else {
    console.warn('[TrendArcScore] ⚠️ No valid social sources available, socialBuzz defaults to 50');
  }

  // Authority (TMDB ratings, Best Buy reviews, Steam reviews, expert sources)
  const authorityScores: number[] = [];

  if (metrics.tmdb) {
    authorityScores.push(metrics.tmdb.rating * 10);
    sources.push('TMDB');
  }

  if (metrics.bestbuy) {
    // Convert 0-5 rating to 0-100 scale
    const bestbuyScore = (metrics.bestbuy.rating / 5) * 100;
    authorityScores.push(bestbuyScore);
    sources.push('Best Buy');
  }

  if (metrics.steam) {
    // Steam review score is already 0-100 (percentage positive)
    authorityScores.push(metrics.steam.reviewScore);
    sources.push('Steam');
  }
  
  if (metrics.omdb) {
    const avgRating = (
      (metrics.omdb.imdbRating || 0) * 10 +
      (metrics.omdb.rottenTomatoes || 0) +
      (metrics.omdb.metascore || 0)
    ) / 3;
    authorityScores.push(avgRating);
    sources.push('OMDb');
  }

  if (authorityScores.length > 0) {
    authority = authorityScores.reduce((a, b) => a + b, 0) / authorityScores.length;
  }

  // Momentum (trend direction)
  if (metrics.googleTrends) {
    momentum = 50 + (metrics.googleTrends.momentum / 2); // Convert -100,100 to 0-100
  }

  // Calculate weighted overall score
  const overall = Math.round(
    searchInterest * weights.searchInterest +
    socialBuzz * weights.socialBuzz +
    authority * weights.authority +
    momentum * weights.momentum
  );

  // Calculate confidence based on number of sources
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
