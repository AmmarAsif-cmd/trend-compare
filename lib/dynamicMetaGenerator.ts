/**
 * Dynamic Meta Content Generator
 * Generates unique SEO meta content based on actual comparison data
 * Solves duplicate content issues by creating data-specific titles and descriptions
 */

type ComparisonData = {
  leader: string;
  trailer: string;
  advantage: number;
  trendDirection: "rising" | "falling" | "stable";
  recentSpike?: {
    term: string;
    magnitude: number;
    date: string;
  };
  lastUpdated: Date;
};

export function generateDynamicMeta(
  comparisonData: ComparisonData,
  termA: string,
  termB: string
): {
  title: string;
  description: string;
} {
  const { leader, trailer, advantage, trendDirection, recentSpike, lastUpdated } =
    comparisonData;

  const prettyTerm = (t: string) =>
    t
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const leaderPretty = prettyTerm(leader);
  const trailerPretty = prettyTerm(trailer);
  const termAPretty = prettyTerm(termA);
  const termBPretty = prettyTerm(termB);

  const month = lastUpdated.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const date = lastUpdated.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Generate unique title based on current state
  let title: string;

  if (advantage > 50) {
    // Dominant leader
    title = `${leaderPretty} Dominates ${trailerPretty} by ${advantage}% - ${month}`;
  } else if (advantage > 20) {
    // Clear leader
    title = `${leaderPretty} vs ${trailerPretty}: ${leaderPretty} Leading ${advantage}% | Live Data`;
  } else if (advantage > 10) {
    // Moderate lead
    title = `${termAPretty} vs ${termBPretty}: ${leaderPretty} Ahead ${advantage}% - ${month}`;
  } else {
    // Neck-and-neck
    title = `${termAPretty} vs ${termBPretty}: Neck-and-Neck (${advantage}% Gap) - ${date}`;
  }

  // Ensure title is within Google's 60-character limit
  if (title.length > 60) {
    title = title.substring(0, 57) + "...";
  }

  // Generate unique description with specific data points
  let description = `Live trend comparison: ${leaderPretty} currently leads ${trailerPretty} by ${advantage}%. `;

  // Add trend direction
  if (trendDirection === "rising") {
    description += `${leaderPretty} gaining momentum. `;
  } else if (trendDirection === "falling") {
    description += `${leaderPretty}'s lead shrinking. `;
  } else {
    description += `Stable competition between both terms. `;
  }

  // Add spike info if available
  if (recentSpike) {
    const spikeTerm = prettyTerm(recentSpike.term);
    const spikeDate = new Date(recentSpike.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    description += `Recent spike: ${spikeTerm} +${recentSpike.magnitude}% on ${spikeDate}. `;
  }

  // Add update timestamp
  description += `Updated ${date}. AI insights, real-time data & historical analysis.`;

  // Ensure description is within Google's 160-character limit
  if (description.length > 160) {
    description = description.substring(0, 157) + "...";
  }

  return {
    title,
    description,
  };
}

/**
 * Calculate comparison data from series for meta generation
 */
export function calculateComparisonData(
  termA: string,
  termB: string,
  series: Array<{ date: string; [key: string]: any }>
): ComparisonData {
  if (!series || series.length === 0) {
    return {
      leader: termA,
      trailer: termB,
      advantage: 0,
      trendDirection: "stable",
      lastUpdated: new Date(),
    };
  }

  // Calculate recent averages (last 7 data points)
  const recentPoints = series.slice(-Math.min(7, series.length));
  const avgA =
    recentPoints.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) /
    recentPoints.length;
  const avgB =
    recentPoints.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) /
    recentPoints.length;

  const leader = avgA > avgB ? termA : termB;
  const trailer = leader === termA ? termB : termA;
  const leaderAvg = Math.max(avgA, avgB);
  const trailerAvg = Math.min(avgA, avgB);
  const advantage =
    trailerAvg > 0 ? Math.round(((leaderAvg - trailerAvg) / trailerAvg) * 100) : 0;

  // Determine trend direction
  const midPoint = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, midPoint);
  const secondHalf = series.slice(midPoint);

  const avgFirstA =
    firstHalf.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / firstHalf.length;
  const avgFirstB =
    firstHalf.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / firstHalf.length;
  const avgSecondA =
    secondHalf.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / secondHalf.length;
  const avgSecondB =
    secondHalf.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / secondHalf.length;

  const leaderFirstHalf = avgFirstA > avgFirstB ? termA : termB;
  const leaderSecondHalf = avgSecondA > avgSecondB ? termA : termB;

  let trendDirection: "rising" | "falling" | "stable" = "stable";

  if (leaderFirstHalf === leaderSecondHalf) {
    const leaderGrowth =
      leader === termA
        ? ((avgSecondA - avgFirstA) / avgFirstA) * 100
        : ((avgSecondB - avgFirstB) / avgFirstB) * 100;

    if (leaderGrowth > 20) {
      trendDirection = "rising";
    } else if (leaderGrowth < -20) {
      trendDirection = "falling";
    }
  }

  // Detect recent spike (last 7 days vs previous 7 days)
  let recentSpike;
  if (series.length >= 14) {
    const last7 = series.slice(-7);
    const prev7 = series.slice(-14, -7);

    const avgA_recent = last7.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / 7;
    const avgB_recent = last7.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / 7;
    const avgA_prev = prev7.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / 7;
    const avgB_prev = prev7.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / 7;

    const spikeA =
      avgA_prev > 0 ? Math.round(((avgA_recent - avgA_prev) / avgA_prev) * 100) : 0;
    const spikeB =
      avgB_prev > 0 ? Math.round(((avgB_recent - avgB_prev) / avgB_prev) * 100) : 0;

    if (spikeA > 100) {
      recentSpike = {
        term: termA,
        magnitude: spikeA,
        date: last7[last7.length - 1].date,
      };
    } else if (spikeB > 100) {
      recentSpike = {
        term: termB,
        magnitude: spikeB,
        date: last7[last7.length - 1].date,
      };
    }
  }

  return {
    leader,
    trailer,
    advantage,
    trendDirection,
    recentSpike,
    lastUpdated: new Date(series[series.length - 1].date),
  };
}
