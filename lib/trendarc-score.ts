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
  reddit?: {
    postCount: number;
    totalScore: number;
    avgScore: number;
    sentiment: number;        // -1 to 1
  };
  wikipedia?: {
    pageViews: number;
    articleQuality: number;   // 0-100
  };
  tmdb?: {
    rating: number;           // 0-10
    voteCount: number;
    popularity: number;
  };
  omdb?: {
    imdbRating: number;
    rottenTomatoes: number;
    metascore: number;
  };
  github?: {
    stars: number;
    forks: number;
    contributors: number;
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
const CATEGORY_WEIGHTS: Record<ComparisonCategory, {
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
  const weights = CATEGORY_WEIGHTS[category];
  const sources: string[] = [];
  
  // Calculate component scores
  let searchInterest = 50; // Default neutral
  let socialBuzz = 50;
  let authority = 50;
  let momentum = 50;

  // Search Interest (Google Trends)
  if (metrics.googleTrends) {
    searchInterest = metrics.googleTrends.avgInterest;
    sources.push('Google Trends');
  }

  // Social Buzz (YouTube + Reddit)
  const socialScores: number[] = [];
  
  if (metrics.youtube) {
    const ytScore = Math.min(100, (metrics.youtube.avgViews / 100000) * 50 + 
      metrics.youtube.engagement * 100);
    socialScores.push(ytScore);
    sources.push('YouTube');
  }
  
  if (metrics.reddit) {
    const redditScore = Math.min(100, 
      metrics.reddit.avgScore * 2 + 
      (metrics.reddit.sentiment + 1) * 25);
    socialScores.push(redditScore);
    sources.push('Reddit');
  }
  
  if (socialScores.length > 0) {
    socialBuzz = socialScores.reduce((a, b) => a + b, 0) / socialScores.length;
  }

  // Authority (Wikipedia, TMDB ratings, expert sources)
  const authorityScores: number[] = [];
  
  if (metrics.wikipedia) {
    authorityScores.push(Math.min(100, (metrics.wikipedia.pageViews / 10000) * 30 + 
      metrics.wikipedia.articleQuality * 0.7));
    sources.push('Wikipedia');
  }
  
  if (metrics.tmdb) {
    authorityScores.push(metrics.tmdb.rating * 10);
    sources.push('TMDB');
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
  
  if (metrics.github) {
    const ghScore = Math.min(100, 
      Math.log10(metrics.github.stars + 1) * 15 +
      Math.log10(metrics.github.forks + 1) * 10);
    authorityScores.push(ghScore);
    sources.push('GitHub');
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
