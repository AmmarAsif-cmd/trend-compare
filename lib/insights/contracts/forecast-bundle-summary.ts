/**
 * Forecast Bundle Summary provides aggregated forecast information
 * Includes 14-day and 30-day forecasts with confidence and warnings
 */

export type ForecastDirection = 'rising' | 'falling' | 'stable' | 'volatile';

export type ForecastWarning = 
  | 'low_confidence'
  | 'insufficient_data'
  | 'high_volatility'
  | 'anomaly_detected'
  | 'data_quality_concern';

export interface ForecastPoint {
  /** Forecast date */
  date: string; // ISO 8601 date string
  
  /** Predicted value */
  value: number;
  
  /** Lower bound of confidence interval */
  lowerBound: number;
  
  /** Upper bound of confidence interval */
  upperBound: number;
  
  /** Confidence level (0-100) */
  confidence: number;
}

export interface ForecastBundleSummary {
  /** Unique identifier for this forecast bundle */
  id: string;
  
  /** Which term this forecast is for */
  term: 'termA' | 'termB';
  
  /** Overall forecast direction */
  direction: ForecastDirection;
  
  /** 14-day forecast summary */
  forecast14Day: {
    /** Average predicted value over 14 days */
    averageValue: number;
    /** Confidence score (0-100) */
    confidence: number;
    /** Key forecast points */
    keyPoints: ForecastPoint[];
    /** Warnings, if any */
    warnings?: ForecastWarning[];
  };
  
  /** 30-day forecast summary */
  forecast30Day: {
    /** Average predicted value over 30 days */
    averageValue: number;
    /** Confidence score (0-100) */
    confidence: number;
    /** Key forecast points */
    keyPoints: ForecastPoint[];
    /** Warnings, if any */
    warnings?: ForecastWarning[];
  };
  
  /** Overall confidence across both forecasts */
  overallConfidence: number;
  
  /** Combined warnings from both forecasts */
  warnings?: ForecastWarning[];
  
  /** Hash of the forecast data for cache invalidation */
  forecastHash: string;
  
  /** When this forecast was generated */
  generatedAt: string; // ISO 8601 date string
  
  /** Data freshness information */
  dataFreshness: {
    /** When the underlying data was last updated */
    lastUpdatedAt: string;
    /** Source of the data */
    source: string;
  };
  
  /** Prediction engine version used */
  predictionEngineVersion: string;
}

