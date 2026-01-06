import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ParsedKeepaData } from "@/lib/services/keepa/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalysisRequest {
  productName: string;
  keepaData: ParsedKeepaData | null;
  trendsData: any;
}

const PRODUCT_ANALYSIS_PROMPT = `You are an expert Amazon FBA product research analyst. Analyze this product data and provide actionable insights.

Product: {productName}

Data Available:
- Current Price: {currentPrice}
- Average Price: {averagePrice}
- Price Range (365 days): {minPrice} - {maxPrice}
- Current Sales Rank: {salesRank}
- Rating: {rating}
- Review Count: {reviewCount}
- Out of Stock (30 days): {outOfStock30}%
- Out of Stock (90 days): {outOfStock90}%

Provide analysis in this JSON format:

{
  "verdict": "good" | "medium" | "avoid",
  "headline": "Brief one-sentence summary",
  "recommendation": "2-3 sentence recommendation",
  "whyTrending": [
    "Reason 1 (be specific and data-driven)",
    "Reason 2",
    "Reason 3"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3",
    "Actionable recommendation 4"
  ],
  "risks": [
    "Risk 1",
    "Risk 2",
    "Risk 3"
  ],
  "opportunityAssessment": {
    "marketSize": "small" | "medium" | "large",
    "competitionLevel": "low" | "medium" | "high",
    "priceStability": "volatile" | "stable" | "declining"
  }
}

Guidelines for verdict:
- "good": Strong opportunity with good ratings (>4.0), decent sales rank (<50k), low stock issues (<15%), stable pricing
- "medium": Moderate opportunity, some concerns but potential exists
- "avoid": Avoid if poor ratings (<3.5), very high competition (<10k rank with >2k reviews), frequent stock-outs (>25%), highly volatile pricing

Be specific, actionable, and focus on helping sellers make GO/NO-GO decisions. Base your analysis on the actual data provided.`;

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    const { productName, keepaData } = body;

    // Check if ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: "AI analysis not configured. Please set ANTHROPIC_API_KEY.",
          fallback: {
            verdict: "unknown",
            headline: "AI Analysis Unavailable",
            recommendation: "AI insights are not configured. Please check your API configuration.",
            whyTrending: [],
            recommendations: [],
            risks: [],
          },
        },
        { status: 503 }
      );
    }

    // Prepare prompt with actual data
    const prompt = PRODUCT_ANALYSIS_PROMPT.replace("{productName}", productName)
      .replace("{currentPrice}", keepaData?.currentPrice ? `$${keepaData.currentPrice.toFixed(2)}` : "N/A")
      .replace("{averagePrice}", keepaData?.averagePrice ? `$${keepaData.averagePrice.toFixed(2)}` : "N/A")
      .replace("{minPrice}", keepaData ? `$${keepaData.minPrice.toFixed(2)}` : "N/A")
      .replace("{maxPrice}", keepaData ? `$${keepaData.maxPrice.toFixed(2)}` : "N/A")
      .replace("{salesRank}", keepaData?.currentSalesRank ? `#${keepaData.currentSalesRank.toLocaleString()}` : "N/A")
      .replace("{rating}", keepaData?.rating ? keepaData.rating.toFixed(1) : "N/A")
      .replace("{reviewCount}", keepaData?.reviewCount ? keepaData.reviewCount.toLocaleString() : "N/A")
      .replace("{outOfStock30}", keepaData ? keepaData.outOfStockPercentage30Days.toFixed(1) : "N/A")
      .replace("{outOfStock90}", keepaData ? keepaData.outOfStockPercentage90Days.toFixed(1) : "N/A");

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Extract JSON from response
    let analysisData;
    try {
      // Try to parse as JSON directly
      analysisData = JSON.parse(content.text);
    } catch (e) {
      // If not valid JSON, try to extract JSON from markdown code blocks
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in the text
        const jsonObjectMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          analysisData = JSON.parse(jsonObjectMatch[0]);
        } else {
          throw new Error("Could not parse JSON from Claude response");
        }
      }
    }

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error("[ProductAnalyze] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate AI insights",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
