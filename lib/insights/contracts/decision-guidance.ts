/**
 * Decision Guidance provides role-specific recommendations
 * Only available for Marketer and Founder roles
 */

export type DecisionRole = 'marketer' | 'founder';

export type DecisionAction = 
  | 'invest_more'
  | 'invest_less'
  | 'maintain'
  | 'monitor'
  | 'pivot'
  | 'scale'
  | 'optimize';

export interface DecisionGuidance {
  /** Unique identifier for this guidance */
  id: string;
  
  /** Role this guidance is for */
  role: DecisionRole;
  
  /** Recommended action */
  action: DecisionAction;
  
  /** Which term this guidance relates to */
  term: 'termA' | 'termB' | 'both';
  
  /** Primary recommendation text */
  recommendation: string;
  
  /** Supporting rationale */
  rationale: string;
  
  /** Priority level (1-5, where 5 is highest) */
  priority: number;
  
  /** Timeframe for this decision (e.g., "next 30 days", "Q1 2024") */
  timeframe?: string;
  
  /** Risk level for this recommendation */
  riskLevel?: 'low' | 'medium' | 'high';
  
  /** Risk notes explaining potential downsides or concerns */
  riskNotes?: string[];
  
  /** Suggested next check/review timeframe */
  nextCheck?: string;
  
  /** Related interpretation IDs that support this guidance */
  relatedInterpretations?: string[];
  
  /** When this guidance was generated */
  generatedAt: string; // ISO 8601 date string
  
  /** Data freshness information */
  dataFreshness: {
    /** When the underlying data was last updated */
    lastUpdatedAt: string;
    /** Source of the data */
    source: string;
  };
}

