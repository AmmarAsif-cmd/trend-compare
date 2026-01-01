/**
 * Gap-Based Comparison Forecaster
 * 
 * Forecasts the GAP (difference) between two trend indices instead of
 * forecasting each series independently. This prevents artificial convergence
 * patterns that occur when forecasting normalized indices separately.
 */

import { forecastTrendIndex, type ForecastOutput } from './trend-index-forecaster';

export interface GapForecastResult {
  gapForecast: ForecastOutput; // Forecast of gap (termA - termB)
  expectedGap: number; // Median forecast at horizon end
  leadChangeRisk: number; // Probability gap crosses 0 (0-100)
  expectedMarginChange: number; // expectedGap - currentGap
  currentGap: number;
  reliability: {
    shouldShow: boolean;
    reason?: string; // If shouldShow is false, explains why
  };
}

/**
 * Forecast the gap between two series
 * 
 * Gap = seriesA - seriesB (range: -100 to 100)
 */
export function forecastGap(
  seriesA: number[],
  seriesB: number[],
  horizon: number = 10
): GapForecastResult {
  if (seriesA.length !== seriesB.length || seriesA.length < 24) {
    // Not enough data
    const currentGap = seriesA.length > 0 && seriesB.length > 0
      ? seriesA[seriesA.length - 1] - seriesB[seriesB.length - 1]
      : 0;

    return {
      gapForecast: {
        forecast: Array(horizon).fill(currentGap),
        lower: Array(horizon).fill(currentGap - 10),
        upper: Array(horizon).fill(currentGap + 10),
        modelUsed: 'naive',
        diagnostics: {
          backtestError: Infinity,
          residualStd: 10,
        },
      },
      expectedGap: currentGap,
      leadChangeRisk: 50, // Unknown risk
      expectedMarginChange: 0,
      currentGap,
      reliability: {
        shouldShow: false,
        reason: seriesA.length < 24 ? 'Insufficient data (need at least 24 points)' : 'Series length mismatch',
      },
    };
  }

  // Compute gap series
  const gapSeries: number[] = [];
  for (let i = 0; i < seriesA.length; i++) {
    gapSeries.push(seriesA[i] - seriesB[i]);
  }

  // Check volatility
  const gapValues = gapSeries.slice(-24); // Last 24 points
  const mean = gapValues.reduce((a, b) => a + b, 0) / gapValues.length;
  const variance = gapValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gapValues.length;
  const std = Math.sqrt(variance);
  const volatility = std / (Math.abs(mean) || 1); // Coefficient of variation

  // Forecast gap (bounds: -100 to 100)
  const gapForecast = forecastTrendIndex(gapSeries, {
    clampBounds: [-100, 100],
    horizon,
  });

  // Compute expected gap (median at horizon end)
  const expectedGap = gapForecast.forecast[gapForecast.forecast.length - 1];
  const currentGap = gapSeries[gapSeries.length - 1];
  const expectedMarginChange = expectedGap - currentGap;

  // Compute lead change risk (probability gap crosses 0)
  // Use bootstrap simulation to estimate probability
  const numSimulations = 1000;
  let crossCount = 0;

  // Get point forecast and uncertainty from intervals
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [];
    let currentGapSim = currentGap;

    for (let h = 0; h < horizon; h++) {
      // Sample from forecast distribution (uniform within interval)
      const range = gapForecast.upper[h] - gapForecast.lower[h];
      const sample = gapForecast.forecast[h] + (Math.random() - 0.5) * range;
      currentGapSim = Math.max(-100, Math.min(100, sample));
      path.push(currentGapSim);
    }

    // Check if gap crosses 0 (lead change)
    let crossed = false;
    const initialSign = currentGap >= 0 ? 1 : -1;
    
    for (const gapValue of path) {
      const sign = gapValue >= 0 ? 1 : -1;
      if (sign !== initialSign) {
        crossed = true;
        break;
      }
    }

    if (crossed) {
      crossCount++;
    }
  }

  const leadChangeRisk = (crossCount / numSimulations) * 100;

  // Reliability gating
  const backtestError = gapForecast.diagnostics.backtestError;
  const highVolatility = volatility > 1.5;
  const highError = backtestError > 20; // Threshold for backtest error

  const shouldShow = !highVolatility && !highError && !isNaN(backtestError);

  let reason: string | undefined;
  if (!shouldShow) {
    if (highVolatility) {
      reason = 'High volatility detected';
    } else if (highError) {
      reason = 'High forecast error (low reliability)';
    } else if (isNaN(backtestError)) {
      reason = 'Forecast calculation error';
    }
  }

  return {
    gapForecast,
    expectedGap,
    leadChangeRisk,
    expectedMarginChange,
    currentGap,
    reliability: {
      shouldShow,
      reason,
    },
  };
}

/**
 * Convert gap forecast to insights for UI
 */
export interface GapForecastInsights {
  expectedMarginInHorizon: number; // Expected margin in X days/weeks
  leadChangeRisk: number; // 0-100 probability
  confidenceLabel: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-100
}

export function getGapForecastInsights(
  result: GapForecastResult,
  horizonDays: number
): GapForecastInsights {
  // Compute confidence score from diagnostics
  const backtestError = result.gapForecast.diagnostics.backtestError;
  const residualStd = result.gapForecast.diagnostics.residualStd;

  // Lower error and lower std = higher confidence
  const errorScore = Math.max(0, 100 - backtestError * 2); // Scale: error of 50 = 0 score
  const stdScore = Math.max(0, 100 - residualStd * 2); // Scale: std of 50 = 0 score

  const confidenceScore = Math.min(100, (errorScore * 0.6 + stdScore * 0.4));

  const confidenceLabel: 'low' | 'medium' | 'high' =
    confidenceScore >= 70 ? 'high'
    : confidenceScore >= 50 ? 'medium'
    : 'low';

  return {
    expectedMarginInHorizon: result.expectedGap,
    leadChangeRisk: result.leadChangeRisk,
    confidenceLabel,
    confidenceScore,
  };
}

