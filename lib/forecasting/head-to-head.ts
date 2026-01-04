/**
 * Head-to-Head Forecast Analytics
 * 
 * Computes comparative metrics between two forecasted series:
 * - Winner probability
 * - Expected margin
 * - Lead change risk
 */

import type { ForecastResult } from './core';

export interface HeadToHeadForecast {
  winnerProbability: number; // P(termB > termA) averaged across horizon, 0-100
  expectedMarginPoints: number; // Average (B - A) over horizon
  leadChangeRisk: 'low' | 'medium' | 'high';
  currentMargin: number; // Current difference (B - A)
  forecastHorizon: number;
}

/**
 * Calculate head-to-head forecast analytics
 */
export function computeHeadToHeadForecast(
  forecastA: ForecastResult,
  forecastB: ForecastResult,
  currentValueA: number,
  currentValueB: number
): HeadToHeadForecast {
  const horizon = Math.min(forecastA.points.length, forecastB.points.length);
  
  if (horizon === 0) {
    return {
      winnerProbability: 50,
      expectedMarginPoints: 0,
      leadChangeRisk: 'medium',
      currentMargin: currentValueB - currentValueA,
      forecastHorizon: 0,
    };
  }

  // Current margin
  const currentMargin = currentValueB - currentValueA;

  // Monte Carlo simulation to estimate winner probability
  // Sample from forecast distributions (using mean and intervals as proxy for distribution)
  const samples = 1000;
  let termBWins = 0;
  let totalMargin = 0;

  for (let i = 0; i < samples; i++) {
    let cumulativeMargin = 0;
    let termBLeading = 0;

    for (let h = 0; h < horizon; h++) {
      // Sample from forecast distribution (simplified: uniform within 80% interval)
      const rangeA = forecastA.points[h].upper80 - forecastA.points[h].lower80;
      const rangeB = forecastB.points[h].upper80 - forecastB.points[h].lower80;
      
      const sampleA = forecastA.points[h].value + (Math.random() - 0.5) * rangeA;
      const sampleB = forecastB.points[h].value + (Math.random() - 0.5) * rangeB;
      
      const margin = sampleB - sampleA;
      cumulativeMargin += margin;
      
      if (margin > 0) {
        termBLeading++;
      }
    }

    // Check if termB wins on average over horizon
    if (cumulativeMargin / horizon > 0) {
      termBWins++;
    }
    totalMargin += cumulativeMargin / horizon;
  }

  const winnerProbability = (termBWins / samples) * 100;
  const expectedMarginPoints = totalMargin / samples;

  // Calculate lead change risk
  // Risk is high if:
  // - Current margin is small (close race)
  // - Forecast shows high volatility/crossover probability
  // - Confidence is low
  const avgConfidence = (forecastA.confidenceScore + forecastB.confidenceScore) / 2;
  const marginAbs = Math.abs(currentMargin);
  const marginPercent = Math.max(currentValueA, currentValueB) > 0 
    ? marginAbs / Math.max(currentValueA, currentValueB) 
    : 0;

  // Crossover probability (how often forecasts cross)
  let crossovers = 0;
  for (let i = 0; i < samples; i++) {
    let prevMargin = currentMargin;
    for (let h = 0; h < horizon; h++) {
      const rangeA = forecastA.points[h].upper80 - forecastA.points[h].lower80;
      const rangeB = forecastB.points[h].upper80 - forecastB.points[h].lower80;
      
      const sampleA = forecastA.points[h].value + (Math.random() - 0.5) * rangeA;
      const sampleB = forecastB.points[h].value + (Math.random() - 0.5) * rangeB;
      
      const margin = sampleB - sampleA;
      if ((prevMargin > 0 && margin < 0) || (prevMargin < 0 && margin > 0)) {
        crossovers++;
        break; // Count one crossover per sample
      }
      prevMargin = margin;
    }
  }
  const crossoverProbability = crossovers / samples;

  // Determine lead change risk
  let leadChangeRisk: 'low' | 'medium' | 'high';
  if (marginPercent < 0.1 || crossoverProbability > 0.3 || avgConfidence < 50) {
    leadChangeRisk = 'high';
  } else if (marginPercent < 0.2 || crossoverProbability > 0.15 || avgConfidence < 70) {
    leadChangeRisk = 'medium';
  } else {
    leadChangeRisk = 'low';
  }

  return {
    winnerProbability,
    expectedMarginPoints,
    leadChangeRisk,
    currentMargin,
    forecastHorizon: horizon,
  };
}


