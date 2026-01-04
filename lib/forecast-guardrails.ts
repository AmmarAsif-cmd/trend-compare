/**
 * Forecast Guardrails
 * Determines if a forecast should be shown based on data quality and reliability
 */

export interface ForecastGuardrailContext {
  seriesLength: number;
  volatility: number;
  disagreementFlag: boolean;
  agreementIndex: number;
  qualityFlags?: {
    seriesTooShort: boolean;
    tooSpiky: boolean;
    eventShockLikely: boolean;
  };
}

export interface ForecastGuardrailResult {
  shouldShow: boolean;
  reason?: string;
}

const MIN_SERIES_LENGTH = 24; // Minimum data points required
const MAX_VOLATILITY = 50; // Maximum volatility threshold
const MIN_AGREEMENT_INDEX = 60; // Minimum agreement index

/**
 * Determine if forecast should be shown
 */
export function shouldShowForecast(context: ForecastGuardrailContext): ForecastGuardrailResult {
  // Check series length
  if (context.seriesLength < MIN_SERIES_LENGTH) {
    return {
      shouldShow: false,
      reason: `Insufficient data (${context.seriesLength} points, need ${MIN_SERIES_LENGTH}+)`,
    };
  }

  // Check volatility
  if (context.volatility > MAX_VOLATILITY) {
    return {
      shouldShow: false,
      reason: `High volatility (${context.volatility.toFixed(1)}%) makes forecasts unreliable`,
    };
  }

  // Check disagreement
  if (context.disagreementFlag || context.agreementIndex < MIN_AGREEMENT_INDEX) {
    return {
      shouldShow: false,
      reason: `Source disagreement (${context.agreementIndex.toFixed(0)}% agreement) reduces forecast reliability`,
    };
  }

  // Check quality flags
  if (context.qualityFlags) {
    if (context.qualityFlags.seriesTooShort) {
      return {
        shouldShow: false,
        reason: 'Series too short for reliable forecasting',
      };
    }
    if (context.qualityFlags.tooSpiky) {
      return {
        shouldShow: false,
        reason: 'High volatility detected - forecasts may be unreliable',
      };
    }
    if (context.qualityFlags.eventShockLikely) {
      return {
        shouldShow: false,
        reason: 'Event-driven spikes detected - forecasts may be unreliable',
      };
    }
  }

  return { shouldShow: true };
}

