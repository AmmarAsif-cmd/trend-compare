/**
 * Cost-Optimized AI Insights Generator
 * Budget: <$10/month with Claude Haiku
 *
 * Cost Breakdown:
 * - Claude Haiku: $0.25/M input tokens, $1.25/M output tokens
 * - Avg insight: ~1500 input + ~800 output tokens = ~$0.0014 per insight
 * - $10/month = ~7,000 insights/month = ~233 insights/day
 *
 * Strategy:
 * - Only generate for comparisons with >5 views in last 30 days
 * - Cache for 7 days (weekly regeneration)
 * - Hard limit: 200 insights/day, 6000 insights/month
 * - Track usage and stop when budget reached
 */

import Anthropic from "@anthropic-ai/sdk";

type ComparisonInsightData = {
  termA: string;
  termB: string;
  currentLeader: string;
  advantage: number;
  currentWeekAvgA: number;
  currentWeekAvgB: number;
  peakADate: string;
  peakAValue: number;
  peakBDate: string;
  peakBValue: number;
  volatilityA: number;
  volatilityB: number;
  recentSpike?: {
    term: string;
    magnitude: number;
    date: string;
  };
  crossoverCount: number;
  trendDirection: string;
};

type AIInsightResult = {
  whatDataTellsUs: string[];
  whyThisMatters: string;
  keyDifferences: string;
  volatilityAnalysis: string;
  practicalImplications: {
    forInvestors?: string;
    forContentCreators?: string;
    forSEOExperts?: string;
  };
  prediction: string;
};

// Budget control - stored in environment or database
let monthlyInsightsGenerated = 0;
let dailyInsightsGenerated = 0;
const DAILY_LIMIT = 200;
const MONTHLY_LIMIT = 6000;

/**
 * Check if we're within budget
 */
export function canGenerateInsight(): boolean {
  if (dailyInsightsGenerated >= DAILY_LIMIT) {
    console.log(`[AI Budget] Daily limit reached: ${dailyInsightsGenerated}/${DAILY_LIMIT}`);
    return false;
  }

  if (monthlyInsightsGenerated >= MONTHLY_LIMIT) {
    console.log(`[AI Budget] Monthly limit reached: ${monthlyInsightsGenerated}/${MONTHLY_LIMIT}`);
    return false;
  }

  return true;
}

/**
 * Calculate insight data from series
 */
export function prepareInsightData(
  termA: string,
  termB: string,
  series: Array<{ date: string; [key: string]: any }>
): ComparisonInsightData {
  // Current week averages
  const recentPoints = series.slice(-Math.min(7, series.length));
  const currentWeekAvgA =
    recentPoints.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / recentPoints.length;
  const currentWeekAvgB =
    recentPoints.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / recentPoints.length;

  const currentLeader = currentWeekAvgA > currentWeekAvgB ? termA : termB;
  const advantage =
    currentWeekAvgB > 0
      ? Math.round(
          ((Math.max(currentWeekAvgA, currentWeekAvgB) -
            Math.min(currentWeekAvgA, currentWeekAvgB)) /
            Math.min(currentWeekAvgA, currentWeekAvgB)) *
            100
        )
      : 0;

  // Find peaks
  let peakA = { value: 0, date: "" };
  let peakB = { value: 0, date: "" };
  series.forEach((point) => {
    const valA = Number(point[termA]) || 0;
    const valB = Number(point[termB]) || 0;

    if (valA > peakA.value) {
      peakA = { value: valA, date: point.date };
    }
    if (valB > peakB.value) {
      peakB = { value: valB, date: point.date };
    }
  });

  // Calculate volatility (coefficient of variation)
  const valuesA = series.map((p) => Number(p[termA]) || 0);
  const valuesB = series.map((p) => Number(p[termB]) || 0);

  const volatilityA = calculateVolatility(valuesA);
  const volatilityB = calculateVolatility(valuesB);

  // Detect recent spike
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
      recentSpike = { term: termA, magnitude: spikeA, date: last7[last7.length - 1].date };
    } else if (spikeB > 100) {
      recentSpike = { term: termB, magnitude: spikeB, date: last7[last7.length - 1].date };
    }
  }

  // Count crossovers
  let crossoverCount = 0;
  let previousLeader = "";
  series.forEach((point) => {
    const currentPointLeader =
      (Number(point[termA]) || 0) > (Number(point[termB]) || 0) ? termA : termB;
    if (previousLeader && currentPointLeader !== previousLeader) {
      crossoverCount++;
    }
    previousLeader = currentPointLeader;
  });

  // Trend direction
  const midPoint = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, midPoint);
  const secondHalf = series.slice(midPoint);

  const avgFirstA =
    firstHalf.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / firstHalf.length;
  const avgSecondA =
    secondHalf.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / secondHalf.length;

  const leaderGrowth = ((avgSecondA - avgFirstA) / avgFirstA) * 100;
  const trendDirection =
    leaderGrowth > 20 ? "rising" : leaderGrowth < -20 ? "falling" : "stable";

  return {
    termA,
    termB,
    currentLeader,
    advantage,
    currentWeekAvgA: Math.round(currentWeekAvgA),
    currentWeekAvgB: Math.round(currentWeekAvgB),
    peakADate: peakA.date,
    peakAValue: peakA.value,
    peakBDate: peakB.date,
    peakBValue: peakB.value,
    volatilityA: Math.round(volatilityA * 10) / 10,
    volatilityB: Math.round(volatilityB * 10) / 10,
    recentSpike,
    crossoverCount,
    trendDirection,
  };
}

function calculateVolatility(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? (stdDev / mean) * 100 : 0;
}

/**
 * Generate AI insights using Claude Haiku (cost-optimized)
 */
export async function generateAIInsights(
  data: ComparisonInsightData
): Promise<AIInsightResult | null> {
  // Check budget
  if (!canGenerateInsight()) {
    console.log("[AI Budget] Skipping insight generation - budget limit reached");
    return null;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[AI Insights] ANTHROPIC_API_KEY not found");
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });

    const prettyTermA = data.termA.replace(/-/g, " ");
    const prettyTermB = data.termB.replace(/-/g, " ");

    // Construct data-specific prompt
    const prompt = `Analyze this specific trend comparison data and provide SPECIFIC insights based ONLY on the data provided.

COMPARISON: ${prettyTermA} vs ${prettyTermB}

CURRENT WEEK DATA:
- ${prettyTermA}: ${data.currentWeekAvgA} avg searches
- ${prettyTermB}: ${data.currentWeekAvgB} avg searches
- Current Leader: ${data.currentLeader.replace(/-/g, " ")} by ${data.advantage}%

HISTORICAL PEAKS:
- ${prettyTermA} peaked on ${new Date(data.peakADate).toLocaleDateString()} at ${data.peakAValue}
- ${prettyTermB} peaked on ${new Date(data.peakBDate).toLocaleDateString()} at ${data.peakBValue}

VOLATILITY:
- ${prettyTermA}: ${data.volatilityA}/10 (${data.volatilityA > 5 ? "high" : data.volatilityA > 3 ? "moderate" : "low"})
- ${prettyTermB}: ${data.volatilityB}/10 (${data.volatilityB > 5 ? "high" : data.volatilityB > 3 ? "moderate" : "low"})

${data.recentSpike ? `RECENT SPIKE:\n${data.recentSpike.term.replace(/-/g, " ")} surged ${data.recentSpike.magnitude}% in the past week (detected on ${new Date(data.recentSpike.date).toLocaleDateString()})` : "No major spikes detected in past week"}

COMPETITIVE DYNAMICS:
- Leadership changes: ${data.crossoverCount} times
- Trend: ${data.trendDirection}

Provide insights in JSON format with these exact keys:
{
  "whatDataTellsUs": ["insight1 with exact numbers and dates", "insight2 with exact numbers and dates", "insight3 with exact numbers and dates"],
  "whyThisMatters": "brief explanation based on the data patterns",
  "keyDifferences": "specific differences between the two terms with data",
  "volatilityAnalysis": "what the volatility numbers mean practically",
  "practicalImplications": {
    "forContentCreators": "specific timing/strategy advice based on patterns"
  },
  "prediction": "data-driven short-term forecast"
}

CRITICAL: Use ONLY the specific data provided. Include exact dates, numbers, and percentages. Be concise and actionable.`;

    const message = await client.messages.create({
      model: "claude-haiku-3-5-20241022", // Haiku - cheaper model
      max_tokens: 1000, // Limit output to control costs
      messages: [{ role: "user", content: prompt }],
    });

    // Increment usage counters
    dailyInsightsGenerated++;
    monthlyInsightsGenerated++;

    console.log(
      `[AI Budget] Generated insight. Daily: ${dailyInsightsGenerated}/${DAILY_LIMIT}, Monthly: ${monthlyInsightsGenerated}/${MONTHLY_LIMIT}`
    );

    // Parse response
    const content = message.content[0];
    if (content.type === "text") {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result;
      }
    }

    return null;
  } catch (error) {
    console.error("[AI Insights] Generation error:", error);
    return null;
  }
}

/**
 * Reset daily counter (call this from a cron job at midnight)
 */
export function resetDailyCounter() {
  dailyInsightsGenerated = 0;
  console.log("[AI Budget] Daily counter reset");
}

/**
 * Reset monthly counter (call this from a cron job on 1st of month)
 */
export function resetMonthlyCounter() {
  monthlyInsightsGenerated = 0;
  console.log("[AI Budget] Monthly counter reset");
}

/**
 * Get current budget status
 */
export function getBudgetStatus() {
  const dailyRemaining = DAILY_LIMIT - dailyInsightsGenerated;
  const monthlyRemaining = MONTHLY_LIMIT - monthlyInsightsGenerated;
  const estimatedMonthlyCost = (monthlyInsightsGenerated * 0.0014).toFixed(2);

  return {
    dailyUsed: dailyInsightsGenerated,
    dailyLimit: DAILY_LIMIT,
    dailyRemaining,
    monthlyUsed: monthlyInsightsGenerated,
    monthlyLimit: MONTHLY_LIMIT,
    monthlyRemaining,
    estimatedCost: `$${estimatedMonthlyCost}`,
  };
}
