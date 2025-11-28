/**
 * Core Type Definitions for Insights Engine
 * Designed to support both statistical analysis AND future ML models
 */

import type { SeriesPoint } from '@/lib/trends';

// ============================================
// DATA STRUCTURES (ML-Ready)
// ============================================

/**
 * Time series data point with metadata
 * Format supports ML feature engineering
 */
export interface EnrichedDataPoint extends SeriesPoint {
  // Original data
  date: string;
  [term: string]: number | string;

  // ML-ready metadata (added during preprocessing)
  dayOfWeek?: number;        // 0-6 (ML feature)
  dayOfMonth?: number;       // 1-31 (ML feature)
  weekOfYear?: number;       // 1-52 (ML feature)
  month?: number;            // 0-11 (ML feature)
  quarter?: number;          // 1-4 (ML feature)
  isWeekend?: boolean;       // ML feature
  isHoliday?: boolean;       // ML feature (future)
}

/**
 * Pattern detection result
 */
export interface DetectedPattern {
  type: 'seasonal' | 'spike' | 'trend' | 'cycle' | 'anomaly';
  confidence: number;        // 0-100
  strength: number;          // How strong is this pattern?
  description: string;       // Human-readable
  dataPoints: number[];      // Indices in series where pattern occurs
  metadata: Record<string, any>; // Extensible for ML features
}

/**
 * Seasonal pattern (annual, weekly, etc.)
 */
export interface SeasonalPattern extends DetectedPattern {
  type: 'seasonal';
  period: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily';
  peakPeriods: Array<{
    name: string;            // "September", "Tuesday", etc.
    value: number;           // Peak index
    avgIncrease: number;     // % increase vs baseline
  }>;
  cyclicStrength: number;    // 0-1: How repeatable is this?
}

/**
 * Spike/Anomaly detection
 */
export interface SpikeEvent extends DetectedPattern {
  type: 'spike' | 'anomaly';
  date: string;
  value: number;
  magnitude: number;         // % above baseline
  zScore: number;            // Statistical significance
  context?: string;          // Inferred reason (optional)
}

/**
 * Trend analysis
 */
export interface TrendMetrics {
  direction: 'strong-growth' | 'growth' | 'stable' | 'decline' | 'strong-decline';
  slope: number;             // Linear regression slope
  rSquared: number;          // How linear is the trend?
  percentChange: number;     // Recent vs historical change
  momentum: number;          // Rate of acceleration
  confidence: number;        // 0-100
}

/**
 * Volatility metrics
 */
export interface VolatilityMetrics {
  stdDev: number;
  coefficientOfVariation: number;
  classification: 'very-stable' | 'stable' | 'moderate' | 'volatile' | 'highly-volatile';
  interpretation: string;
}

/**
 * Cross-term comparison metrics
 */
export interface ComparisonMetrics {
  correlation: number;       // -1 to 1: How related are the terms?
  covariance: number;
  leadLag: number;           // Does one term lead the other? (days)
  dominance: {
    leader: string;
    follower: string;
    gapPercent: number;
  };
  crossoverPoints: Array<{   // When does one overtake the other?
    date: string;
    direction: 'term1-overtakes' | 'term2-overtakes';
  }>;
}

/**
 * Complete insight package for a comparison
 */
export interface InsightPackage {
  // Metadata
  generatedAt: Date;
  dataQuality: DataQuality;

  // Per-term insights
  termInsights: Map<string, TermInsight>;

  // Comparative insights
  comparison: ComparisonMetrics;

  // Detected patterns
  patterns: {
    seasonal: SeasonalPattern[];
    spikes: SpikeEvent[];
    trends: Map<string, TrendMetrics>;
    volatility: Map<string, VolatilityMetrics>;
  };

  // Generated narratives
  story: {
    headline: string;
    summary: string;
    keyFindings: string[];
    deepDive: string;
  };

  // ML-ready data (for future use)
  mlFeatures?: MLFeatures;
}

/**
 * Per-term insight
 */
export interface TermInsight {
  term: string;
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    range: number;
  };
  trend: TrendMetrics;
  volatility: VolatilityMetrics;
  peaks: Array<{
    date: string;
    value: number;
    context?: string;
  }>;
  seasonality?: SeasonalPattern;
}

/**
 * Data quality assessment
 */
export interface DataQuality {
  sourceCount: number;        // How many data sources?
  completeness: number;       // 0-1: % of non-null values
  reliability: 'high' | 'medium' | 'low';
  warnings: string[];
  sourcesUsed: string[];
}

/**
 * ML-ready feature set (for future predictive models)
 */
export interface MLFeatures {
  // Statistical features
  rollingMean7d: number[];
  rollingMean30d: number[];
  rollingStd7d: number[];

  // Trend features
  momentum: number[];
  acceleration: number[];

  // Seasonal features
  monthSinCos: Array<{ sin: number; cos: number }>;
  weekdaySinCos: Array<{ sin: number; cos: number }>;

  // Lag features (for time series forecasting)
  lag1: number[];
  lag7: number[];
  lag30: number[];

  // Metadata
  featureNames: string[];
  normalized: boolean;
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * Configuration for pattern detection
 */
export interface PatternDetectionConfig {
  // Spike detection
  spikeThreshold: number;     // Standard deviations (default: 2)
  minSpikeSignificance: number; // Minimum % increase (default: 20)

  // Seasonality detection
  minSeasonalConfidence: number; // 0-1 (default: 0.7)
  seasonalPeriods: Array<'annual' | 'quarterly' | 'monthly' | 'weekly'>;

  // Trend analysis
  trendWindowDays: number;    // Days to analyze (default: 30)
  minTrendStrength: number;   // R² threshold (default: 0.5)

  // General
  minDataPoints: number;      // Minimum series length (default: 30)
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: PatternDetectionConfig = {
  spikeThreshold: 2,
  minSpikeSignificance: 20,
  minSeasonalConfidence: 0.7,
  seasonalPeriods: ['annual', 'monthly', 'weekly'],
  trendWindowDays: 30,
  minTrendStrength: 0.5,
  minDataPoints: 30,
};
