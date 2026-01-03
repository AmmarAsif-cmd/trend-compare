/**
 * Peak Note represents a detected peak event in trend data
 * Includes date, magnitude, duration, classification, and optional AI explanation
 */

export type PeakClassification = 
  | 'spike'
  | 'plateau'
  | 'sustained_high'
  | 'gradual_peak'
  | 'sharp_peak';

export type PeakType = 'peak' | 'trough' | 'plateau';

export interface PeakNote {
  /** Unique identifier for this peak */
  id: string;
  
  /** Which term this peak relates to */
  term: 'termA' | 'termB';
  
  /** Type of peak */
  type: PeakType;
  
  /** Date when the peak occurred */
  peakDate: string; // ISO 8601 date string
  
  /** Magnitude of the peak (normalized 0-100) */
  magnitude: number;
  
  /** Duration of the peak event (in days) */
  duration: number;
  
  /** Classification of the peak pattern */
  classification: PeakClassification;
  
  /** Start date of the peak period */
  startDate: string; // ISO 8601 date string
  
  /** End date of the peak period */
  endDate: string; // ISO 8601 date string
  
  /** Context around the peak (what was happening) */
  context?: string;
  
  /** Optional AI-generated explanation of the peak */
  aiExplanation?: {
    /** Explanation text */
    text: string;
    /** Confidence in the explanation (0-100) */
    confidence: number;
    /** When this explanation was generated */
    generatedAt: string;
    /** Prompt version used */
    promptVersion: string;
  };
  
  /** Hash of the peak data for cache invalidation */
  peakHash: string;
  
  /** When this peak note was generated */
  generatedAt: string; // ISO 8601 date string
  
  /** Data freshness information */
  dataFreshness: {
    /** When the underlying data was last updated */
    lastUpdatedAt: string;
    /** Source of the data */
    source: string;
  };
}

