/**
 * Signal types for trend analysis
 * Signals represent raw observations from data analysis
 */

export type SignalType = 
  | 'momentum_shift'
  | 'volatility_spike'
  | 'correlation_change'
  | 'volume_surge'
  | 'sentiment_shift'
  | 'competitor_crossover'
  | 'seasonal_pattern'
  | 'anomaly_detected';

export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Signal {
  /** Unique identifier for this signal */
  id: string;
  
  /** Type of signal detected */
  type: SignalType;
  
  /** Severity level */
  severity: SignalSeverity;
  
  /** Which term this signal relates to ('termA', 'termB', or 'both') */
  term: 'termA' | 'termB' | 'both';
  
  /** Human-readable description of the signal */
  description: string;
  
  /** When this signal was detected */
  detectedAt: string; // ISO 8601 date string
  
  /** Confidence score (0-100) */
  confidence: number;
  
  /** Raw data values that triggered this signal */
  dataPoints?: {
    date: string;
    value: number;
  }[];
  
  /** Metadata about the signal source */
  source: {
    /** Data source that generated this signal */
    provider: string;
    /** When the source data was last updated */
    lastUpdatedAt: string;
  };
  
  /** When this signal was generated */
  generatedAt: string; // ISO 8601 date string
}

