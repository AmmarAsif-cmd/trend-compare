/**
 * Canonical Insight Framework Contracts for TrendArc
 * 
 * This module exports all type definitions and constants for the insight framework.
 * These contracts serve as the single source of truth for insights used by UI and exports.
 * 
 * @module lib/insights/contracts
 */

// Version constants
export {
  INSIGHT_VERSION,
  PROMPT_VERSION,
  PREDICTION_ENGINE_VERSION,
  INSIGHT_FRAMEWORK_VERSION,
} from './versions';

// Type definitions
export type {
  Signal,
  SignalType,
  SignalSeverity,
} from './signals';

export type {
  Interpretation,
  InterpretationCategory,
} from './interpretations';

export type {
  DecisionGuidance,
  DecisionRole,
  DecisionAction,
} from './decision-guidance';

export type {
  ForecastBundleSummary,
  ForecastPoint,
  ForecastDirection,
  ForecastWarning,
} from './forecast-bundle-summary';

export type {
  PeakNote,
  PeakClassification,
  PeakType,
} from './peak-note';

export type {
  AIInsights,
} from './ai-insights';

export type {
  InsightsPack,
} from './insights-pack';

export {
  createEmptyInsightsPack,
} from './insights-pack';

