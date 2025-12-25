/**
 * Interpretations provide meaning and context for signals
 * They translate raw signals into actionable understanding
 */

export type InterpretationCategory = 
  | 'trend_analysis'
  | 'competitive_dynamics'
  | 'market_positioning'
  | 'growth_pattern'
  | 'decline_pattern'
  | 'stability_analysis';

export interface Interpretation {
  /** Unique identifier for this interpretation */
  id: string;
  
  /** Category of interpretation */
  category: InterpretationCategory;
  
  /** Which term this interpretation relates to */
  term: 'termA' | 'termB' | 'comparison';
  
  /** Main interpretation text */
  text: string;
  
  /** Supporting evidence or data points */
  evidence?: string[];
  
  /** Related signal IDs that support this interpretation */
  relatedSignals?: string[];
  
  /** Confidence score (0-100) */
  confidence: number;
  
  /** When this interpretation was generated */
  generatedAt: string; // ISO 8601 date string
  
  /** Data freshness information */
  dataFreshness: {
    /** When the underlying data was last updated */
    lastUpdatedAt: string;
    /** Source of the data */
    source: string;
  };
}

