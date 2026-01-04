/**
 * AI Insights provide optional AI-enhanced explanations
 * These are optional sections that can be added to enrich insights
 */

export interface AIInsights {
  /** Unique identifier for this AI insights bundle */
  id: string;
  
  /** Optional explanation of what the comparison means */
  meaningExplanation?: {
    /** Explanation text */
    text: string;
    /** Confidence in the explanation (0-100) */
    confidence: number;
    /** When this explanation was generated */
    generatedAt: string;
    /** Prompt version used */
    promptVersion: string;
  };
  
  /** Optional explanation of the forecast */
  forecastExplanation?: {
    /** Explanation text */
    text: string;
    /** Confidence in the explanation (0-100) */
    confidence: number;
    /** When this explanation was generated */
    generatedAt: string;
    /** Prompt version used */
    promptVersion: string;
  };
  
  /** Optional AI explanations for peaks */
  peakExplanations?: {
    /** Peak ID this explanation relates to */
    peakId: string;
    /** Explanation text */
    text: string;
    /** Confidence in the explanation (0-100) */
    confidence: number;
    /** When this explanation was generated */
    generatedAt: string;
    /** Prompt version used */
    promptVersion: string;
  }[];
  
  /** When this AI insights bundle was generated */
  generatedAt: string; // ISO 8601 date string
  
  /** Data freshness information */
  dataFreshness: {
    /** When the underlying data was last updated */
    lastUpdatedAt: string;
    /** Source of the data */
    source: string;
  };
  
  /** Hash of the AI insights data for cache invalidation */
  aiInsightsHash?: string;
}

