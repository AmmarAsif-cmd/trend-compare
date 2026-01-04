/**
 * AI Insight Synthesis Module
 * Uses Claude AI to generate personalized, actionable recommendations
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PatternAnalysis } from './pattern-analysis';
import type { ImpactMetrics } from './impact-quantification';
import type { CompetitiveAnalysis } from './competitive-analysis';
import type { OpportunityAnalysis } from './opportunity-identification';

export interface UserProfile {
  type: 'marketer' | 'product-manager' | 'investor' | 'content-creator' | 'researcher' | 'general';
  industry?: string;
  goals?: string[];
}

export interface ActionableRecommendation {
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  expectedImpact: string;
  timeframe: string;
  effort: 'low' | 'medium' | 'high';
}

export interface RiskAssessment {
  riskType: 'timing' | 'relevance' | 'competitive' | 'market' | 'seasonality';
  level: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  description: string;
  mitigation: string;
}

export interface SynthesizedInsights {
  executiveSummary: string;
  keyTakeaways: string[];
  recommendations: ActionableRecommendation[];
  risks: RiskAssessment[];
  predictiveInsights: string[];
  strategicImplications: string;
}

/**
 * Synthesize all analysis data into actionable insights using Claude AI
 */
export async function synthesizeInsights(
  keyword: string,
  peakDate: Date,
  peakValue: number,
  explanation: string,
  pattern: PatternAnalysis,
  impact: ImpactMetrics,
  competitive: CompetitiveAnalysis,
  opportunities: OpportunityAnalysis,
  userProfile: UserProfile = { type: 'general' },
  comparisonContext?: { termA: string; termB: string }
): Promise<SynthesizedInsights> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Construct comprehensive prompt
  const prompt = buildInsightPrompt(
    keyword,
    peakDate,
    peakValue,
    explanation,
    pattern,
    impact,
    competitive,
    opportunities,
    userProfile,
    comparisonContext
  );

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022', // Fast and cost-effective for synthesis
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    return parseInsightResponse(content);
  } catch (error) {
    console.error('AI synthesis error:', error);
    // Fallback to rule-based synthesis
    return generateFallbackInsights(keyword, pattern, impact, competitive, opportunities, userProfile);
  }
}

/**
 * Build comprehensive prompt for Claude
 */
function buildInsightPrompt(
  keyword: string,
  peakDate: Date,
  peakValue: number,
  explanation: string,
  pattern: PatternAnalysis,
  impact: ImpactMetrics,
  competitive: CompetitiveAnalysis,
  opportunities: OpportunityAnalysis,
  userProfile: UserProfile,
  comparisonContext?: { termA: string; termB: string }
): string {
  const userContext = userProfile.type === 'general' ? '' : `\nUser Profile: ${userProfile.type}${userProfile.industry ? ` in ${userProfile.industry}` : ''}${userProfile.goals ? `\nGoals: ${userProfile.goals.join(', ')}` : ''}`;

  return `You are an expert trend analyst. Generate actionable insights and strategic recommendations based on the following data:

CONTEXT:
Keyword: "${keyword}"
Peak Date: ${peakDate.toLocaleDateString()}
Peak Value: ${peakValue}
${comparisonContext ? `Comparison: "${comparisonContext.termA}" vs "${comparisonContext.termB}"` : ''}
${userContext}

WHAT HAPPENED:
${explanation}

PATTERN ANALYSIS:
${pattern.description}
${pattern.nextPredicted ? `Next Predicted: ${pattern.nextPredicted.date.toLocaleDateString()} (${pattern.confidence}% confidence)` : 'No clear pattern'}

IMPACT METRICS:
- Peak Magnitude: +${impact.peakMagnitude.percentageIncrease}% (${impact.peakMagnitude.multiplier}x baseline)
- Duration: ${impact.duration.totalDays} days to baseline
- Week 1 Elevation: +${impact.sustainedElevation.week1Average}%
- Opportunity Window: ${impact.opportunityWindow.totalDays} days
${impact.historicalComparison ? `- vs Last Year: ${impact.historicalComparison.vsLastYear > 0 ? '+' : ''}${impact.historicalComparison.vsLastYear}%` : ''}

COMPETITIVE DYNAMICS:
${competitive.marketLeader ? `- Market Leader: ${competitive.marketLeader.name} (${competitive.marketLeader.dominance}% share)` : '- No clear leader'}
- Key Insights: ${competitive.competitiveInsights.join('; ')}

TOP OPPORTUNITIES:
${opportunities.summary.highestROI ? `- Highest ROI: ${opportunities.summary.highestROI.title}` : ''}
${opportunities.summary.quickestWin ? `- Quickest Win: ${opportunities.summary.quickestWin.title}` : ''}
- Top Keywords: ${opportunities.keywords.slice(0, 3).map(k => k.keyword).join(', ')}

Please provide:

1. EXECUTIVE SUMMARY (2-3 sentences): What happened and why it matters

2. KEY TAKEAWAYS (3-5 bullet points): Most important insights

3. RECOMMENDATIONS (5-7 actions): Specific, actionable steps categorized as:
   - Immediate (next 48 hours)
   - Short-term (next 2 weeks)
   - Long-term (next 3 months)
   Each with: priority, action, reasoning, expected impact, timeframe, effort

4. RISK ASSESSMENT (3-5 risks): Timing, relevance, competitive, market, seasonality risks with mitigation strategies

5. PREDICTIVE INSIGHTS (2-3 predictions): What to expect next based on patterns

6. STRATEGIC IMPLICATIONS (1 paragraph): What this trend means for the user's strategy

Format as JSON:
{
  "executiveSummary": "...",
  "keyTakeaways": ["...", "..."],
  "recommendations": [{"category": "immediate", "priority": "high", "action": "...", "reasoning": "...", "expectedImpact": "...", "timeframe": "...", "effort": "low"}],
  "risks": [{"riskType": "timing", "level": "moderate", "description": "...", "mitigation": "..."}],
  "predictiveInsights": ["...", "..."],
  "strategicImplications": "..."
}`;
}

/**
 * Parse Claude's response into structured insights
 */
function parseInsightResponse(response: string): SynthesizedInsights {
  try {
    // Extract JSON from response (Claude might wrap it in markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      executiveSummary: parsed.executiveSummary || '',
      keyTakeaways: parsed.keyTakeaways || [],
      recommendations: parsed.recommendations || [],
      risks: parsed.risks || [],
      predictiveInsights: parsed.predictiveInsights || [],
      strategicImplications: parsed.strategicImplications || '',
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid AI response format');
  }
}

/**
 * Generate fallback insights using rule-based logic (if AI fails)
 */
function generateFallbackInsights(
  keyword: string,
  pattern: PatternAnalysis,
  impact: ImpactMetrics,
  competitive: CompetitiveAnalysis,
  opportunities: OpportunityAnalysis,
  userProfile: UserProfile
): SynthesizedInsights {
  const daysSincePeak = Math.round((new Date().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const executiveSummary = `${keyword} experienced a ${impact.peakMagnitude.percentageIncrease}% search volume spike${pattern.patternType !== 'none' ? `, following a ${pattern.frequency} pattern` : ''}. ${competitive.marketLeader ? `${competitive.marketLeader.name} dominates with ${competitive.marketLeader.dominance}% market share.` : ''} The ${impact.opportunityWindow.totalDays}-day opportunity window${daysSincePeak <= impact.opportunityWindow.totalDays ? ' is still open' : ' has passed'}.`;

  const keyTakeaways = [
    `Peak magnitude: +${impact.peakMagnitude.percentageIncrease}% (${impact.peakMagnitude.multiplier}x baseline)`,
    pattern.nextPredicted
      ? `Next peak predicted: ${pattern.nextPredicted.date.toLocaleDateString()} (${pattern.confidence}% confidence)`
      : 'No predictable pattern identified',
    `Opportunity window: ${impact.opportunityWindow.maximumImpactWindow.days} days for maximum impact`,
    competitive.competitiveInsights[0] || 'Competitive dynamics unclear',
  ];

  const recommendations: ActionableRecommendation[] = [];

  // Immediate actions (based on timing window)
  if (opportunities.timing.length > 0 && opportunities.timing[0].urgency === 'critical') {
    recommendations.push({
      category: 'immediate',
      priority: 'critical',
      action: opportunities.timing[0].actionRequired,
      reasoning: `${opportunities.timing[0].daysRemaining} days remaining in ${opportunities.timing[0].trafficPotential}% traffic window`,
      expectedImpact: `Capture ${opportunities.timing[0].trafficPotential}% of total opportunity traffic`,
      timeframe: `Next ${opportunities.timing[0].daysRemaining} days`,
      effort: 'high',
    });
  }

  // Short-term content actions
  if (opportunities.summary.quickestWin) {
    recommendations.push({
      category: 'short-term',
      priority: 'high',
      action: `Create: "${opportunities.summary.quickestWin.title}"`,
      reasoning: opportunities.summary.quickestWin.strategicValue,
      expectedImpact: `${opportunities.summary.quickestWin.estimatedTraffic.minimum.toLocaleString()}-${opportunities.summary.quickestWin.estimatedTraffic.maximum.toLocaleString()} visitors`,
      timeframe: `Publish by ${opportunities.summary.quickestWin.timing.optimalDay.toLocaleDateString()}`,
      effort: 'medium',
    });
  }

  // Long-term pattern-based actions
  if (pattern.nextPredicted) {
    recommendations.push({
      category: 'long-term',
      priority: 'medium',
      action: `Set calendar alert for ${pattern.nextPredicted.date.toLocaleDateString()} (next predicted peak)`,
      reasoning: `${pattern.description}`,
      expectedImpact: 'Proactive preparation for next cycle',
      timeframe: `Alert 30 days before: ${new Date(pattern.nextPredicted.date.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      effort: 'low',
    });
  }

  const risks: RiskAssessment[] = [
    {
      riskType: 'timing',
      level: daysSincePeak > impact.opportunityWindow.totalDays ? 'high' : daysSincePeak > impact.opportunityWindow.maximumImpactWindow.days ? 'moderate' : 'low',
      description: `${daysSincePeak} days elapsed since peak. ${daysSincePeak > impact.opportunityWindow.totalDays ? 'Opportunity window closed' : `${Math.max(0, impact.opportunityWindow.totalDays - daysSincePeak)} days remaining`}.`,
      mitigation:
        daysSincePeak > impact.opportunityWindow.totalDays
          ? 'Pivot to evergreen content strategy instead of news coverage'
          : 'Act quickly to capitalize on remaining window',
    },
  ];

  const predictiveInsights = pattern.nextPredicted
    ? [
        `Next peak expected: ${pattern.nextPredicted.date.toLocaleDateString()} (${pattern.confidence}% confidence)`,
        impact.historicalComparison?.trend === 'growing'
          ? 'Trend is growing year-over-year - expect larger future peaks'
          : 'Trend stable - expect similar magnitude in future occurrences',
      ]
    : ['Pattern unclear - monitor for emerging trends'];

  const strategicImplications =
    userProfile.type === 'marketer'
      ? `Focus on ${opportunities.timing[0]?.type || 'content'} opportunities within the ${impact.opportunityWindow.totalDays}-day window. Allocate budget to high-ROI keywords and prepare for ${pattern.nextPredicted ? 'next predicted peak' : 'future trends'}.`
      : userProfile.type === 'product-manager'
        ? `${competitive.recommendedTiming.reasoning} ${pattern.nextPredicted ? `Plan next launch for ${new Date(pattern.nextPredicted.date.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} to avoid competitive noise.` : ''}`
        : `This trend presents ${opportunities.content.length} content opportunities with traffic potential up to ${opportunities.summary.highestROI?.estimatedTraffic.maximum.toLocaleString()} visitors. ${pattern.nextPredicted ? 'Pattern is predictable - plan ahead for next cycle.' : 'Monitor for future patterns.'}`;

  return {
    executiveSummary,
    keyTakeaways,
    recommendations,
    risks,
    predictiveInsights,
    strategicImplications,
  };
}

/**
 * Format synthesized insights for display
 */
export function formatSynthesizedInsights(insights: SynthesizedInsights): string {
  return `
═══════════════════════════════════════════════════════════
📊 ACTIONABLE INSIGHTS & STRATEGIC RECOMMENDATIONS
═══════════════════════════════════════════════════════════

📋 EXECUTIVE SUMMARY
${insights.executiveSummary}

─────────────────────────────────────────────────────────────

🎯 KEY TAKEAWAYS
${insights.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

─────────────────────────────────────────────────────────────

⚡ RECOMMENDED ACTIONS

${insights.recommendations
  .filter(r => r.category === 'immediate')
  .map(
    r => `🚨 IMMEDIATE (${r.priority.toUpperCase()})
   Action: ${r.action}
   Why: ${r.reasoning}
   Impact: ${r.expectedImpact}
   Timeframe: ${r.timeframe}
   Effort: ${r.effort}`
  )
  .join('\n\n')}

${insights.recommendations
  .filter(r => r.category === 'short-term')
  .map(
    r => `📅 SHORT-TERM (${r.priority.toUpperCase()})
   Action: ${r.action}
   Why: ${r.reasoning}
   Impact: ${r.expectedImpact}
   Timeframe: ${r.timeframe}
   Effort: ${r.effort}`
  )
  .join('\n\n')}

${insights.recommendations
  .filter(r => r.category === 'long-term')
  .map(
    r => `🔮 LONG-TERM (${r.priority.toUpperCase()})
   Action: ${r.action}
   Why: ${r.reasoning}
   Impact: ${r.expectedImpact}
   Timeframe: ${r.timeframe}
   Effort: ${r.effort}`
  )
  .join('\n\n')}

─────────────────────────────────────────────────────────────

⚠️ RISK ASSESSMENT

${insights.risks
  .map(
    r => `${r.riskType.toUpperCase()} RISK: ${r.level.toUpperCase()}
   → ${r.description}
   → Mitigation: ${r.mitigation}`
  )
  .join('\n\n')}

─────────────────────────────────────────────────────────────

🔮 PREDICTIVE INSIGHTS

${insights.predictiveInsights.map((p, i) => `${i + 1}. ${p}`).join('\n')}

─────────────────────────────────────────────────────────────

💡 STRATEGIC IMPLICATIONS

${insights.strategicImplications}

═══════════════════════════════════════════════════════════
`.trim();
}
