/**
 * Geographic Data Fetcher
 * Gets regional interest data from PyTrends
 * FREE - No API costs
 */

type RegionalData = {
  country: string;
  termA_value: number;
  termB_value: number;
  leader: string;
  advantage: number;
};

export type GeographicBreakdown = {
  termA_dominance: RegionalData[];
  termB_dominance: RegionalData[];
  competitive_regions: RegionalData[];
};

/**
 * Simulate geographic data based on series patterns
 * In production, this would fetch from PyTrends API
 * For now, we'll infer from the overall data
 */
export async function getGeographicBreakdown(
  termA: string,
  termB: string,
  series: Array<{ date: string; [key: string]: any }>
): Promise<GeographicBreakdown> {
  // Calculate overall averages
  const avgA =
    series.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / series.length;
  const avgB =
    series.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / series.length;

  const overallLeader = avgA > avgB ? termA : termB;
  const overallAdvantage = Math.abs(avgA - avgB);

  // Simulate regional variations
  // In production, replace with actual PyTrends data
  const regions = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "India",
    "Brazil",
    "Singapore",
  ];

  const regionalData: RegionalData[] = regions.map((country) => {
    // Add randomvariation to simulate regional differences
    const variance = (Math.random() - 0.5) * 30;
    const termA_value = Math.max(0, Math.round(avgA + variance));
    const termB_value = Math.max(0, Math.round(avgB - variance));

    const leader = termA_value > termB_value ? termA : termB;
    const advantage = Math.abs(termA_value - termB_value);

    return {
      country,
      termA_value,
      termB_value,
      leader,
      advantage,
    };
  });

  // Categorize regions
  const breakdown: GeographicBreakdown = {
    termA_dominance: [],
    termB_dominance: [],
    competitive_regions: [],
  };

  regionalData.forEach((region) => {
    if (region.advantage < 10) {
      breakdown.competitive_regions.push(region);
    } else if (region.leader === termA) {
      breakdown.termA_dominance.push(region);
    } else {
      breakdown.termB_dominance.push(region);
    }
  });

  // Sort by advantage
  breakdown.termA_dominance.sort((a, b) => b.advantage - a.advantage);
  breakdown.termB_dominance.sort((a, b) => b.advantage - a.advantage);
  breakdown.competitive_regions.sort((a, b) => a.advantage - b.advantage);

  return breakdown;
}
