/**
 * Actionable Insights Engine
 * Main orchestrator that combines all analysis modules
 */

import { analyzePattern, type PatternAnalysis, type HistoricalPeak } from './pattern-analysis';
import { quantifyImpact, formatImpactMetrics, type ImpactMetrics, type SearchVolumeData } from './impact-quantification';
import { analyzeCompetition, formatCompetitiveAnalysis, type CompetitiveAnalysis } from './competitive-analysis';
import { identifyOpportunities, formatOpportunityAnalysis, type OpportunityAnalysis } from './opportunity-identification';
import { synthesizeInsights, formatSynthesizedInsights, type SynthesizedInsights, type UserProfile } from './ai-insight-synthesis';
import { explainPeakWithContext, type ImprovedPeakExplanation } from './peak-explanation-improved-v2';

export interface ActionableInsightsInput {
  // Core peak data
  keyword: string;
  peakDate: Date;
  peakValue: number;

  // Comparison context (for disambiguation)
  comparisonContext?: {
    termA: string;
    termB: string;
    category?: string;
  };

  // Historical data
  historicalPeaks?: HistoricalPeak[]; // All historical peaks for this and related keywords
  searchVolumeData?: SearchVolumeData[]; // Time series data (±60 days around peak)
  historicalSearchVolume?: SearchVolumeData[][]; // Previous peaks' time series for comparison

  // Competitive data
  competitorKeywords?: string[]; // Related competitor keywords

  // Related queries (from Google Trends API or similar)
  relatedQueries?: string[];

  // User context
  userProfile?: UserProfile;

  // Options
  options?: {
    includeAISynthesis?: boolean; // Default: true
    useCache?: boolean; // Default: true
    detailLevel?: 'summary' | 'standard' | 'comprehensive'; // Default: standard
  };
}

export interface ActionableInsightsOutput {
  // Basic explanation (existing functionality)
  explanation: ImprovedPeakExplanation;

  // New: Actionable insights
  pattern: PatternAnalysis;
  impact: ImpactMetrics;
  competitive: CompetitiveAnalysis | null;
  opportunities: OpportunityAnalysis;
  synthesis: SynthesizedInsights | null;

  // Metadata
  generatedAt: Date;
  cacheKey: string;
  confidence: number; // Overall confidence score (0-100)
  dataCompleteness: {
    hasHistoricalData: boolean;
    hasSearchVolumeData: boolean;
    hasCompetitiveData: boolean;
    hasRelatedQueries: boolean;
  };

  // Formatted output (ready for display)
  formatted: {
    explanation: string;
    pattern: string;
    impact: string;
    competitive: string | null;
    opportunities: string;
    synthesis: string | null;
    complete: string; // All sections combined
  };
}

/**
 * Generate comprehensive actionable insights
 */
export async function generateActionableInsights(
  input: ActionableInsightsInput
): Promise<ActionableInsightsOutput> {
  const startTime = Date.now();

  // Validate input
  validateInput(input);

  // Extract options with defaults
  const options = {
    includeAISynthesis: input.options?.includeAISynthesis ?? true,
    useCache: input.options?.useCache ?? true,
    detailLevel: input.options?.detailLevel ?? 'standard',
  };

  // Step 1: Generate context-aware peak explanation
  console.log('[ActionableInsights] Generating peak explanation...');
  const explanation = await explainPeakWithContext(
    input.keyword,
    input.peakDate,
    input.peakValue,
    input.comparisonContext || { termA: input.keyword, termB: '' },
    {
      windowDays: 7,
      minRelevance: 70,
      useAIVerification: true,
    }
  );

  // Step 2: Analyze patterns
  console.log('[ActionableInsights] Analyzing patterns...');
  const pattern = await analyzePattern(
    input.keyword,
    input.peakDate,
    input.historicalPeaks || []
  );

  // Step 3: Quantify impact
  console.log('[ActionableInsights] Quantifying impact...');
  const impact = await quantifyImpact(
    input.peakDate,
    input.peakValue,
    input.searchVolumeData || generateMockSearchVolumeData(input.peakDate, input.peakValue),
    input.historicalSearchVolume
  );

  // Step 4: Analyze competition (if competitor data available)
  console.log('[ActionableInsights] Analyzing competition...');
  let competitive: CompetitiveAnalysis | null = null;
  if (input.competitorKeywords && input.competitorKeywords.length > 0 && input.historicalPeaks) {
    competitive = await analyzeCompetition(
      input.keyword,
      input.peakDate,
      input.peakValue,
      input.competitorKeywords,
      input.historicalPeaks
    );
  }

  // Step 5: Identify opportunities
  console.log('[ActionableInsights] Identifying opportunities...');
  const opportunities = await identifyOpportunities(
    input.keyword,
    input.peakDate,
    input.peakValue,
    input.relatedQueries || generateDefaultRelatedQueries(input.keyword),
    new Date()
  );

  // Step 6: AI synthesis (if enabled)
  console.log('[ActionableInsights] Synthesizing insights with AI...');
  let synthesis: SynthesizedInsights | null = null;
  if (options.includeAISynthesis) {
    try {
      synthesis = await synthesizeInsights(
        input.keyword,
        input.peakDate,
        input.peakValue,
        explanation.explanation,
        pattern,
        impact,
        competitive || {
          marketLeader: null,
          competitorTiming: [],
          searchInterestComparison: [],
          competitiveInsights: [],
          recommendedTiming: { avoid: [], opportunity: [], reasoning: 'No competitive data available' },
        },
        opportunities,
        input.userProfile || { type: 'general' },
        input.comparisonContext
      );
    } catch (error) {
      console.error('[ActionableInsights] AI synthesis failed, using fallback:', error);
      // synthesis will remain null, formatted output will indicate this
    }
  }

  // Calculate data completeness
  const dataCompleteness = {
    hasHistoricalData: (input.historicalPeaks?.length || 0) > 0,
    hasSearchVolumeData: (input.searchVolumeData?.length || 0) > 0,
    hasCompetitiveData: (input.competitorKeywords?.length || 0) > 0,
    hasRelatedQueries: (input.relatedQueries?.length || 0) > 0,
  };

  // Calculate overall confidence
  const confidence = calculateOverallConfidence(
    explanation.confidence,
    pattern.confidence,
    dataCompleteness
  );

  // Format all outputs
  const formatted = formatAllInsights(
    explanation,
    pattern,
    impact,
    competitive,
    opportunities,
    synthesis,
    options.detailLevel
  );

  const duration = Date.now() - startTime;
  console.log(`[ActionableInsights] Complete in ${duration}ms`);

  return {
    explanation,
    pattern,
    impact,
    competitive,
    opportunities,
    synthesis,
    generatedAt: new Date(),
    cacheKey: generateCacheKey(input),
    confidence,
    dataCompleteness,
    formatted,
  };
}

/**
 * Validate input parameters
 */
function validateInput(input: ActionableInsightsInput): void {
  if (!input.keyword || input.keyword.trim().length === 0) {
    throw new Error('Keyword is required');
  }

  if (!input.peakDate || !(input.peakDate instanceof Date)) {
    throw new Error('Valid peak date is required');
  }

  if (typeof input.peakValue !== 'number' || input.peakValue < 0 || input.peakValue > 100) {
    throw new Error('Peak value must be a number between 0-100');
  }
}

/**
 * Generate mock search volume data (fallback if real data not available)
 */
function generateMockSearchVolumeData(peakDate: Date, peakValue: number): SearchVolumeData[] {
  const data: SearchVolumeData[] = [];
  const baseline = Math.round(peakValue / 3); // Assume baseline is ~33% of peak

  // Generate ±60 days around peak
  for (let i = -60; i <= 60; i++) {
    const date = new Date(peakDate);
    date.setDate(date.getDate() + i);

    let value = baseline;

    if (i === 0) {
      // Peak day
      value = peakValue;
    } else if (i > 0 && i <= 7) {
      // Week after peak - high but declining
      value = Math.round(baseline + (peakValue - baseline) * (1 - i / 10));
    } else if (i > 7 && i <= 21) {
      // Weeks 2-3 - gradual decline
      value = Math.round(baseline + (peakValue - baseline) * 0.3 * (1 - (i - 7) / 21));
    } else if (i > 21) {
      // After 3 weeks - return to baseline with noise
      value = Math.round(baseline + Math.random() * baseline * 0.2);
    } else if (i < 0 && i >= -7) {
      // Week before peak - building up
      value = Math.round(baseline + (peakValue - baseline) * ((7 + i) / 7) * 0.3);
    }

    data.push({ date, value: Math.max(0, Math.min(100, value)) });
  }

  return data;
}

/**
 * Generate default related queries
 */
function generateDefaultRelatedQueries(keyword: string): string[] {
  return [
    `${keyword} vs`,
    `is ${keyword} worth it`,
    `${keyword} review`,
    `${keyword} price`,
    `best ${keyword}`,
    `${keyword} alternative`,
    `should i buy ${keyword}`,
    `${keyword} pros and cons`,
  ];
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(
  explanationConfidence: number,
  patternConfidence: number,
  dataCompleteness: ActionableInsightsOutput['dataCompleteness']
): number {
  // Base confidence from explanation and pattern
  let confidence = (explanationConfidence + patternConfidence) / 2;

  // Adjust based on data completeness
  const completenessScore =
    (dataCompleteness.hasHistoricalData ? 25 : 0) +
    (dataCompleteness.hasSearchVolumeData ? 25 : 0) +
    (dataCompleteness.hasCompetitiveData ? 25 : 0) +
    (dataCompleteness.hasRelatedQueries ? 25 : 0);

  // Weight: 70% from analysis, 30% from data completeness
  confidence = confidence * 0.7 + completenessScore * 0.3;

  return Math.round(confidence);
}

/**
 * Generate cache key for results
 */
function generateCacheKey(input: ActionableInsightsInput): string {
  const parts = [
    input.keyword.toLowerCase().replace(/\s+/g, '-'),
    input.peakDate.toISOString().split('T')[0],
    input.peakValue.toString(),
    input.comparisonContext ? `${input.comparisonContext.termA}-vs-${input.comparisonContext.termB}` : '',
  ];

  return parts.filter(Boolean).join('_');
}

/**
 * Format all insights into display-ready strings
 */
function formatAllInsights(
  explanation: ImprovedPeakExplanation,
  pattern: PatternAnalysis,
  impact: ImpactMetrics,
  competitive: CompetitiveAnalysis | null,
  opportunities: OpportunityAnalysis,
  synthesis: SynthesizedInsights | null,
  detailLevel: 'summary' | 'standard' | 'comprehensive'
): ActionableInsightsOutput['formatted'] {
  const formattedExplanation = formatExplanation(explanation);
  const formattedPattern = formatPattern(pattern);
  const formattedImpact = formatImpactMetrics(impact);
  const formattedCompetitive = competitive ? formatCompetitiveAnalysis(competitive) : null;
  const formattedOpportunities = formatOpportunityAnalysis(opportunities);
  const formattedSynthesis = synthesis ? formatSynthesizedInsights(synthesis) : null;

  // Combine all sections
  const sections = [
    formattedExplanation,
    formattedPattern,
    formattedImpact,
    formattedCompetitive,
    formattedOpportunities,
    formattedSynthesis,
  ].filter(Boolean);

  const complete = sections.join('\n\n' + '═'.repeat(60) + '\n\n');

  return {
    explanation: formattedExplanation,
    pattern: formattedPattern,
    impact: formattedImpact,
    competitive: formattedCompetitive,
    opportunities: formattedOpportunities,
    synthesis: formattedSynthesis,
    complete,
  };
}

/**
 * Format explanation section
 */
function formatExplanation(explanation: ImprovedPeakExplanation): string {
  return `
📰 WHAT HAPPENED

${explanation.explanation}

${explanation.topEvents.length > 0 ? `Key Events:\n${explanation.topEvents.map(e => `• ${e.title} (${e.date.toLocaleDateString()})\n  ${e.description}\n  Source: ${e.source}`).join('\n\n')}` : ''}

${explanation.interpretation ? `\nInterpretation: ${explanation.interpretation}\nContext Match: ${explanation.contextMatch ? 'Yes ✓' : 'No ✗'}` : ''}

Confidence: ${explanation.status} (${explanation.confidence}%)
  `.trim();
}

/**
 * Format pattern section
 */
function formatPattern(pattern: PatternAnalysis): string {
  return `
🔄 PATTERN ANALYSIS

Type: ${pattern.patternType.toUpperCase()}
Frequency: ${pattern.frequency}
Pattern Strength: ${pattern.patternStrength}%
Confidence: ${pattern.confidence}%

Description:
${pattern.description}

${pattern.nextPredicted ? `Next Predicted Peak:\n→ Date: ${pattern.nextPredicted.date.toLocaleDateString()}\n→ Range: ${pattern.nextPredicted.dateRange.start.toLocaleDateString()} - ${pattern.nextPredicted.dateRange.end.toLocaleDateString()}\n→ Confidence: ${pattern.nextPredicted.confidence}%` : ''}

${pattern.historicalOccurrences.length > 0 ? `Historical Occurrences:\n${pattern.historicalOccurrences.map(d => `→ ${d.toLocaleDateString()}`).join('\n')}` : ''}
  `.trim();
}

/**
 * Export for use in other modules
 */
export { formatImpactMetrics, formatCompetitiveAnalysis, formatOpportunityAnalysis, formatSynthesizedInsights };
