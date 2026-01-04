/**
 * Deterministic Insight Generation
 * 
 * Stage A: Generate Signals from comparison data
 * Stage B: Generate Interpretations from Signals
 * Stage C: Generate Decision Guidance from Signals and Interpretations
 * Stage E: Build and Get InsightsPack with caching
 */

// Re-export memoized versions
export { generateSignals, type GenerateSignalsInput } from '../generateSignals';
export { 
  generateInterpretations, 
  type GenerateInterpretationsInput,
  type SeriesClassification,
  type SustainabilityClassification,
  type LeaderChangeRisk,
} from '../generateInterpretations';
export { 
  generateDecisionGuidance, 
  type GenerateDecisionGuidanceInput,
} from '../generateDecisionGuidance';
export { 
  buildInsightsPack, 
  type BuildInsightsPackInput,
} from '../buildInsightsPack';
export { 
  getInsightsPack, 
  type GetInsightsPackInput,
  type GetInsightsPackResult,
} from '../getInsightsPack';

