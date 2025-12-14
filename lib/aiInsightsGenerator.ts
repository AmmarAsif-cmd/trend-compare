/**
 * Cost-Optimized AI Insights Generator with Database Persistence
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
 * - Track usage in database (persists across deployments)
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { ensureDatabaseMigration } from "./ensureDatabaseMigration";

const prisma = new PrismaClient();

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
  intelligentComparison?: {
    scores: {
      termA: { overall: number; breakdown: { searchInterest: number; socialBuzz: number; authority: number; momentum: number } };
      termB: { overall: number; breakdown: { searchInterest: number; socialBuzz: number; authority: number; momentum: number } };
    };
    verdict: { winner: string; margin: number; confidence: number };
    performance: { sourcesQueried: string[] };
  };
};

type AIInsightResult = {
  category: string; // e.g., "Technology", "Consumer Products", "Entertainment", etc.
  whatDataTellsUs: string[];
  whyThisMatters: string;
  keyDifferences: string;
  volatilityAnalysis: string;
  peakExplanations: {
    termA?: string; // Why termA peaked on that date
    termB?: string; // Why termB peaked on that date
  };
  practicalImplications: {
    [key: string]: string; // Dynamic audience keys
  };
  prediction: string;
};

const DAILY_LIMIT = 200;
const MONTHLY_LIMIT = 6000;

/**
 * Get or create usage record for today
 */
async function getUsageRecord() {
  // Ensure database migration has run
  const migrationOk = await ensureDatabaseMigration();
  if (!migrationOk) {
    console.error('[AI Budget] ❌ Database migration failed - using fallback');
    return { dailyCount: 0, monthlyCount: 0, recordId: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to midnight

  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  console.log(`[AI Budget] 🗄️ Fetching usage record for ${today.toISOString().split('T')[0]}`);

  try {
    let record = await prisma.aIInsightUsage.findUnique({
      where: { date: today },
    });

    if (!record) {
      console.log("[AI Budget] 📝 Creating new daily record...");
      // Create new daily record - use upsert to handle race conditions
      try {
        record = await prisma.aIInsightUsage.create({
          data: {
            date: today,
            month,
            dailyCount: 0,
            monthlyCount: 0,
          },
        });
        console.log(`[AI Budget] ✅ Created record: ${record.id}`);
      } catch (createError: any) {
        // If month unique constraint fails, try to find the existing record
        if (createError?.code === 'P2002') {
          console.log("[AI Budget] Record already exists, fetching it...");
          record = await prisma.aIInsightUsage.findUnique({
            where: { date: today },
          });
          if (!record) {
            throw new Error("Failed to create or find daily record");
          }
        } else {
          throw createError;
        }
      }
    } else {
      console.log(`[AI Budget] ✅ Found existing record: ${record.id}`);
    }

    // Get monthly total across all records this month
    const monthlyRecords = await prisma.aIInsightUsage.findMany({
      where: { month },
    });

    const monthlyTotal = monthlyRecords.reduce((sum: number, r: any) => sum + r.dailyCount, 0);

    console.log(`[AI Budget] Monthly total for ${month}: ${monthlyTotal} (from ${monthlyRecords.length} records)`);

    return {
      dailyCount: record.dailyCount,
      monthlyCount: monthlyTotal,
      recordId: record.id,
    };
  } catch (error) {
    console.error("[AI Budget] ❌ Database error:", error);
    if (error instanceof Error) {
      console.error("[AI Budget] Error details:", error.message);
    }
    // Fallback to allowing generation if DB fails
    console.log("[AI Budget] ⚠️ Using fallback values (0/0) - database unavailable");
    return { dailyCount: 0, monthlyCount: 0, recordId: null };
  }
}

/**
 * Increment usage counter in database
 */
async function incrementUsage(recordId: string | null) {
  if (!recordId) return;

  try {
    await prisma.aIInsightUsage.update({
      where: { id: recordId },
      data: {
        dailyCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[AI Budget] Failed to increment usage:", error);
  }
}

/**
 * Check if we're within budget
 */
export async function canGenerateInsight(): Promise<boolean> {
  console.log("[AI Budget] 📊 Checking budget limits...");
  const usage = await getUsageRecord();

  console.log(`[AI Budget] Current usage - Daily: ${usage.dailyCount}/${DAILY_LIMIT}, Monthly: ${usage.monthlyCount}/${MONTHLY_LIMIT}`);

  if (usage.dailyCount >= DAILY_LIMIT) {
    console.log(`[AI Budget] ❌ Daily limit reached: ${usage.dailyCount}/${DAILY_LIMIT}`);
    return false;
  }

  if (usage.monthlyCount >= MONTHLY_LIMIT) {
    console.log(`[AI Budget] ❌ Monthly limit reached: ${usage.monthlyCount}/${MONTHLY_LIMIT}`);
    return false;
  }

  console.log("[AI Budget] ✅ Within budget limits");
  return true;
}

/**
 * Calculate insight data from series
 */
export function prepareInsightData(
  termA: string,
  termB: string,
  series: Array<{ date: string; [key: string]: any }>,
  intelligentComparison?: {
    scores: {
      termA: { overall: number; breakdown: { searchInterest: number; socialBuzz: number; authority: number; momentum: number } };
      termB: { overall: number; breakdown: { searchInterest: number; socialBuzz: number; authority: number; momentum: number } };
    };
    verdict: { winner: string; margin: number; confidence: number };
    performance: { sourcesQueried: string[] };
  } | null
): ComparisonInsightData {
  // Current week averages
  const recentPoints = series.slice(-Math.min(7, series.length));
  const currentWeekAvgA =
    recentPoints.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / recentPoints.length;
  const currentWeekAvgB =
    recentPoints.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / recentPoints.length;

  // Use multi-source comparison data if available (more accurate)
  // Otherwise fall back to Google Trends data
  let currentLeader: string;
  let advantage: number;
  
  if (intelligentComparison) {
    // Use multi-source winner (more accurate)
    currentLeader = intelligentComparison.verdict.winner;
    advantage = intelligentComparison.verdict.margin;
    console.log(`[AI Insights] ✅ Using multi-source data: ${currentLeader} wins with ${advantage}% margin`);
  } else {
    // Fall back to Google Trends only
    currentLeader = currentWeekAvgA > currentWeekAvgB ? termA : termB;
    advantage =
      currentWeekAvgB > 0
        ? Math.round(
            ((Math.max(currentWeekAvgA, currentWeekAvgB) -
              Math.min(currentWeekAvgA, currentWeekAvgB)) /
              Math.min(currentWeekAvgA, currentWeekAvgB)) *
              100
          )
        : 0;
    console.log(`[AI Insights] ⚠️ Using Google Trends only: ${currentLeader} leads by ${advantage}%`);
  }

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
    intelligentComparison: intelligentComparison || undefined,
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
  console.log(`[AI Insights] 🚀 Starting generation for: ${data.termA} vs ${data.termB}`);

  // Check budget (now uses database)
  const canGenerate = await canGenerateInsight();
  console.log(`[AI Insights] 📊 Budget check result: ${canGenerate}`);

  if (!canGenerate) {
    console.log("[AI Budget] ❌ Skipping insight generation - budget limit reached");
    return null;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[AI Insights] ❌ ANTHROPIC_API_KEY not found in environment");
    return null;
  }

  console.log(`[AI Insights] ✅ API key found: ${apiKey.slice(0, 10)}...`);

  try {
    console.log("[AI Insights] 🔧 Initializing Anthropic client...");
    const client = new Anthropic({ apiKey });

    const prettyTermA = data.termA.replace(/-/g, " ");
    const prettyTermB = data.termB.replace(/-/g, " ");

    // Construct intelligent, data-specific prompt
    const prompt = `You are analyzing a trend comparison between "${prettyTermA}" vs "${prettyTermB}".

STEP 1: ANALYZE THE KEYWORDS
First, determine what category these terms belong to:
- Tech/Software? (e.g., React vs Vue, iPhone vs Android)
- Business/Finance? (e.g., stocks, companies, economic terms)
- Entertainment/Media? (e.g., movies, shows, celebrities, music)
- Consumer Products? (e.g., brands, food items, physical products)
- Health/Lifestyle? (e.g., diet trends, fitness, wellness)
- Education/Career? (e.g., programming languages, certifications, skills)
- Other categories?

STEP 2: IDENTIFY RELEVANT AUDIENCES
Based on the keyword category, identify 1-3 SPECIFIC, RELEVANT audiences who would care about this comparison.
DO NOT default to generic audiences like "content creators" unless it's actually relevant.

Examples of good audience targeting:
- For "React vs Vue": "WebDevelopers", "TechLeads", "StartupFounders"
- For "iPhone vs Android": "Consumers", "MobileDevelopers", "TechReviewers"
- For "Nutella vs Peanut Butter": "Parents", "HealthConsciousConsumers", "FoodBloggers"
- For "Tesla vs Toyota": "CarBuyers", "EnvironmentalAdvocates", "Investors"
- For "Netflix vs Disney+": "Families", "StreamingSubscribers", "EntertainmentIndustry"

STEP 3: ANALYZE THE DATA
COMPARISON: ${prettyTermA} vs ${prettyTermB}

${data.intelligentComparison ? `MULTI-SOURCE ANALYSIS (MOST ACCURATE):
- TrendArc Score: ${prettyTermA} = ${data.intelligentComparison.scores.termA.overall}/100, ${prettyTermB} = ${data.intelligentComparison.scores.termB.overall}/100
- Winner: ${data.currentLeader.replace(/-/g, " ")} (margin: ${data.advantage}%)
- Confidence: ${data.intelligentComparison.verdict.confidence}%
- Data Sources: ${data.intelligentComparison.performance.sourcesQueried.join(', ')}
- Search Interest: ${prettyTermA} = ${data.intelligentComparison.scores.termA.breakdown.searchInterest}, ${prettyTermB} = ${data.intelligentComparison.scores.termB.breakdown.searchInterest}
- Social Buzz: ${prettyTermA} = ${data.intelligentComparison.scores.termA.breakdown.socialBuzz}, ${prettyTermB} = ${data.intelligentComparison.scores.termB.breakdown.socialBuzz}
- Authority: ${prettyTermA} = ${data.intelligentComparison.scores.termA.breakdown.authority}, ${prettyTermB} = ${data.intelligentComparison.scores.termB.breakdown.authority}
- Momentum: ${prettyTermA} = ${data.intelligentComparison.scores.termA.breakdown.momentum}, ${prettyTermB} = ${data.intelligentComparison.scores.termB.breakdown.momentum}

IMPORTANT: The winner (${data.currentLeader.replace(/-/g, " ")}) is determined by the multi-source TrendArc Score, NOT just Google Trends. Use this winner in all insights.` : `GOOGLE TRENDS DATA ONLY:
- ${prettyTermA}: ${data.currentWeekAvgA} avg searches
- ${prettyTermB}: ${data.currentWeekAvgB} avg searches
- Current Leader: ${data.currentLeader.replace(/-/g, " ")} by ${data.advantage}%`}

HISTORICAL PEAKS (CRITICAL FOR PEAK EXPLANATIONS):
- ${prettyTermA} peaked on ${new Date(data.peakADate).toLocaleDateString()} reaching ${data.peakAValue}/100 (this is a ${data.peakAValue >= 80 ? 'very high' : data.peakAValue >= 60 ? 'high' : data.peakAValue >= 40 ? 'moderate' : 'low'} peak)
- ${prettyTermB} peaked on ${new Date(data.peakBDate).toLocaleDateString()} reaching ${data.peakBValue}/100 (this is a ${data.peakBValue >= 80 ? 'very high' : data.peakBValue >= 60 ? 'high' : data.peakBValue >= 40 ? 'moderate' : 'low'} peak)

IMPORTANT FOR PEAK EXPLANATIONS:
- Research what happened on or within 3-7 days BEFORE each peak date
- Common peak causes: product launches, major announcements, news events, controversies, viral social media moments, seasonal events, competitor actions, price changes, feature releases
- The peak value (${data.peakAValue} vs ${data.peakBValue}) indicates the relative magnitude - higher values suggest more significant events
- Be specific about dates, events, and why they would drive search interest

VOLATILITY:
- ${prettyTermA}: ${data.volatilityA}/10 (${data.volatilityA > 5 ? "high" : data.volatilityA > 3 ? "moderate" : "low"})
- ${prettyTermB}: ${data.volatilityB}/10 (${data.volatilityB > 5 ? "high" : data.volatilityB > 3 ? "moderate" : "low"})

${data.recentSpike ? `RECENT SPIKE:\n${data.recentSpike.term.replace(/-/g, " ")} surged ${data.recentSpike.magnitude}% in the past week (detected on ${new Date(data.recentSpike.date).toLocaleDateString()})` : "No major spikes detected in past week"}

COMPETITIVE DYNAMICS:
- Leadership changes: ${data.crossoverCount} times
- Trend: ${data.trendDirection}

STEP 4: GENERATE INSIGHTS
Provide insights in this EXACT JSON format:
{
  "category": "EXACTLY ONE of: music, movies, games, products, tech, people, brands, places, general (lowercase only)",
  "whatDataTellsUs": [
    "First key insight with exact numbers and dates from the data above",
    "Second key insight with exact numbers and dates from the data above",
    "Third key insight with exact numbers and dates from the data above"
  ],
  "whyThisMatters": "Explain why this comparison matters in the real world, based on what these terms represent",
  "keyDifferences": "Highlight the most important differences between the two trends using specific data points",
  "volatilityAnalysis": "Explain what the volatility numbers mean practically - is one more predictable? More seasonal? More event-driven?",
  "peakExplanations": {
    "termA": "For ${prettyTermA}'s peak on ${new Date(data.peakADate).toLocaleDateString()} (reached ${data.peakAValue}/100): Clearly explain the SPECIFIC reason this peak occurred. Research what happened around this date - was it a product launch, news event, announcement, controversy, viral moment, or seasonal trend? Be concrete and specific. Format: 'This peak occurred because [specific reason]. [What happened] on or around ${new Date(data.peakADate).toLocaleDateString()} that drove search interest to ${data.peakAValue}/100. [Additional context if relevant].'",
    "termB": "For ${prettyTermB}'s peak on ${new Date(data.peakBDate).toLocaleDateString()} (reached ${data.peakBValue}/100): Clearly explain the SPECIFIC reason this peak occurred. Research what happened around this date - was it a product launch, news event, announcement, controversy, viral moment, or seasonal trend? Be concrete and specific. Format: 'This peak occurred because [specific reason]. [What happened] on or around ${new Date(data.peakBDate).toLocaleDateString()} that drove search interest to ${data.peakBValue}/100. [Additional context if relevant].'"
  },
  "practicalImplications": {
    "AudienceName1": "Specific, actionable advice for this audience based on the trend data",
    "AudienceName2": "Specific, actionable advice for this audience based on the trend data"
  },
  "prediction": "Data-driven forecast for the next 1-3 months based on observed patterns"
}

CRITICAL REQUIREMENTS:
1. category MUST be EXACTLY ONE of these lowercase values: music, movies, games, products, tech, people, brands, places, general
2. Choose category based on what the keywords represent (music artists→music, movies/shows→movies, video games→games, physical items→products, software/programming→tech, politicians/athletes→people, companies→brands, cities/countries→places)
3. In practicalImplications, use camelCase audience names (e.g., "webDevelopers", "healthConsciousConsumers", "parents")
4. Choose 1-3 audiences that are ACTUALLY relevant to these specific keywords
5. DO NOT use generic audiences like "content creators" unless the terms are about content creation
6. In peakExplanations, you MUST provide CLEAR, SPECIFIC explanations for why each peak occurred. Each explanation should:
   - Start with "This peak occurred because..." followed by the specific reason
   - Mention the exact event, announcement, news, or trend that happened on or around the peak date
   - Include the peak value (e.g., "reached 88/100") to show the magnitude
   - Be concrete and factual - avoid vague statements like "increased interest" or "gained attention"
   - If you cannot determine a specific reason, state "The exact cause is unclear, but possible reasons include..." and list 2-3 likely scenarios
   - Examples of good explanations:
     * "This peak occurred because Apple announced the iPhone 17 on September 10, 2023. The official launch event generated massive media coverage and consumer anticipation, driving search interest to 92/100."
     * "This peak occurred because Google Pixel 10 leaks surfaced on October 20, 2023. Tech blogs and social media shared leaked specifications and design images, creating significant buzz that reached 75/100."
     * "This peak occurred because a major software update was released on this date, addressing critical security issues that had been widely reported in tech news."
7. Every insight must include specific numbers, dates, or percentages from the data
8. Be concise but insightful - quality over quantity
9. Return ONLY the JSON, no markdown formatting or additional text`;


    console.log("[AI Insights] 📡 Calling Anthropic API...");
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022", // Haiku - cost-optimized model
      max_tokens: 2000, // Increased for category detection + peak explanations
      messages: [{ role: "user", content: prompt }],
    });

    console.log("[AI Insights] ✅ API call successful!");

    // Increment usage in database
    const usage = await getUsageRecord();
    await incrementUsage(usage.recordId);

    console.log(
      `[AI Budget] ✅ Generated insight. Daily: ${usage.dailyCount + 1}/${DAILY_LIMIT}, Monthly: ${usage.monthlyCount + 1}/${MONTHLY_LIMIT}`
    );

    // Parse response
    const content = message.content[0];
    console.log(`[AI Insights] 📝 Response type: ${content.type}`);

    if (content.type === "text") {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("[AI Insights] ✅ JSON extracted successfully");
        const result = JSON.parse(jsonMatch[0]);
        console.log("[AI Insights] ✅ JSON parsed successfully");
        return result;
      } else {
        console.error("[AI Insights] ❌ No JSON found in response:", content.text.slice(0, 200));
      }
    }

    console.error("[AI Insights] ❌ Failed to extract insights from response");
    return null;
  } catch (error) {
    console.error("[AI Insights] ❌ Generation error:", error);
    if (error instanceof Error) {
      console.error("[AI Insights] Error name:", error.name);
      console.error("[AI Insights] Error message:", error.message);
      console.error("[AI Insights] Error stack:", error.stack);
    }
    return null;
  }
}

/**
 * Get current budget status
 */
export async function getBudgetStatus() {
  const usage = await getUsageRecord();
  const dailyRemaining = DAILY_LIMIT - usage.dailyCount;
  const monthlyRemaining = MONTHLY_LIMIT - usage.monthlyCount;
  const estimatedMonthlyCost = (usage.monthlyCount * 0.0014).toFixed(2);

  return {
    dailyUsed: usage.dailyCount,
    dailyLimit: DAILY_LIMIT,
    dailyRemaining,
    monthlyUsed: usage.monthlyCount,
    monthlyLimit: MONTHLY_LIMIT,
    monthlyRemaining,
    estimatedCost: `$${estimatedMonthlyCost}`,
  };
}

/**
 * Get or generate AI insights with smart caching
 * This is the main function to use - it handles caching automatically
 *
 * @param slug - Comparison slug (e.g., "react-vs-vue")
 * @param timeframe - Timeframe (e.g., "12m")
 * @param geo - Geographic region (e.g., "" for worldwide)
 * @param data - Insight data to generate from (if cache miss)
 * @param forceRefresh - Force regeneration even if cached data exists
 * @returns AI insights or null
 */
export async function getOrGenerateAIInsights(
  slug: string,
  timeframe: string,
  geo: string,
  data: ComparisonInsightData,
  forceRefresh: boolean = false
): Promise<AIInsightResult | null> {
  const CACHE_DAYS = 7; // Refresh insights after 7 days

  console.log(`[AI Cache] 🔍 Checking cache for: ${slug} (${timeframe}, ${geo})`);

  try {
    // 1. Check if cached insights exist and are fresh
    if (!forceRefresh) {
      const existing = await prisma.comparison.findUnique({
        where: { slug_timeframe_geo: { slug, timeframe, geo } },
        select: { ai: true, updatedAt: true },
      });

      if (existing?.ai) {
        // Check if it's real AI insights (not template data)
        const aiData = existing.ai as any;
        if (aiData && typeof aiData === 'object' && 'whatDataTellsUs' in aiData) {
          // Calculate age in days
          const ageInDays = (Date.now() - existing.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

          if (ageInDays < CACHE_DAYS) {
            console.log(`[AI Cache] ✅ Using cached insights (${ageInDays.toFixed(1)} days old)`);
            return aiData as AIInsightResult;
          } else {
            console.log(`[AI Cache] ⏰ Cached insights stale (${ageInDays.toFixed(1)} days old), regenerating...`);
          }
        }
      }
    }

    // 2. Generate new insights
    console.log(`[AI Cache] 🚀 Generating fresh insights for: ${slug}`);
    const insights = await generateAIInsights(data);

    if (!insights) {
      console.log('[AI Cache] ⚠️ Generation failed or budget limit reached');
      return null;
    }

    // 3. Save to database for future use
    try {
      await prisma.comparison.update({
        where: { slug_timeframe_geo: { slug, timeframe, geo } },
        data: {
          ai: insights as any,
          category: insights.category,
          updatedAt: new Date(),
        },
      });
      console.log(`[AI Cache] ✅ Saved insights to database for future use`);

      // Cache individual keywords for future comparisons
      // This enables keyword-level caching (TIER 2) for cost optimization
      try {
        const { cacheComparisonKeywords } = await import('./category-cache');
        const categoryMap: Record<string, string> = {
          'Technology': 'tech',
          'Movies': 'movies',
          'Music': 'music',
          'Gaming': 'games',
          'Products': 'products',
          'People': 'people',
          'Brands': 'brands',
          'Places': 'places',
          'Entertainment': 'movies', // Map Entertainment to movies as fallback
          'Business': 'brands', // Map Business to brands as fallback
        };

        const normalizedCategory = categoryMap[insights.category] || 'general';

        await cacheComparisonKeywords(
          data.termA,
          data.termB,
          normalizedCategory as any,
          90, // High confidence since it's from AI insights
          'ai',
          `From AI insights: ${insights.category}`
        );
        console.log(`[AI Cache] 💾 Cached keywords: "${data.termA}", "${data.termB}" as ${normalizedCategory}`);
      } catch (cacheError) {
        console.warn('[AI Cache] ⚠️ Failed to cache keywords:', cacheError);
        // Non-critical error - continue
      }
    } catch (saveError) {
      console.error('[AI Cache] ⚠️ Failed to save insights to database:', saveError);
      // Return insights anyway even if save failed
    }

    return insights;
  } catch (error) {
    console.error('[AI Cache] ❌ Error in getOrGenerateAIInsights:', error);
    return null;
  }
}

/**
 * Check if insights need refresh (older than 7 days)
 */
export async function checkInsightsNeedRefresh(
  slug: string,
  timeframe: string,
  geo: string
): Promise<{ needsRefresh: boolean; ageInDays: number; hasInsights: boolean }> {
  const CACHE_DAYS = 7;

  try {
    const existing = await prisma.comparison.findUnique({
      where: { slug_timeframe_geo: { slug, timeframe, geo } },
      select: { ai: true, updatedAt: true },
    });

    if (!existing || !existing.ai) {
      return { needsRefresh: true, ageInDays: 0, hasInsights: false };
    }

    const aiData = existing.ai as any;
    // Check if it's real AI insights (not template data)
    const hasRealInsights = aiData && typeof aiData === 'object' && 'whatDataTellsUs' in aiData;

    if (!hasRealInsights) {
      return { needsRefresh: true, ageInDays: 0, hasInsights: false };
    }

    const ageInDays = (Date.now() - existing.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const needsRefresh = ageInDays >= CACHE_DAYS;

    return { needsRefresh, ageInDays, hasInsights: true };
  } catch (error) {
    console.error('[AI Cache] Error checking refresh status:', error);
    return { needsRefresh: true, ageInDays: 0, hasInsights: false };
  }
}
