/**
 * Confidence Calculator
 * 
 * Calculates continuous confidence scores (0-100) based on multiple factors
 * Replaces tier mapping with a continuous calculation
 */

export interface ConfidenceFactors {
  // Data quality factors
  agreementIndex: number; // 0-100, higher = more agreement between sources
  volatility: number; // 0-100, higher = more volatile (reduces confidence)
  dataPoints: number; // Number of data points available
  sourceCount: number; // Number of data sources used
  
  // Risk factors
  leaderChangeRisk?: number; // 0-100, higher = more risk of leader changing
  margin?: number; // Margin between winner/loser (higher margin = more confidence)
  
  // Data coverage
  timeSpanDays?: number; // Time span of data in days
}

/**
 * Calculate continuous confidence score (0-100) based on multiple factors
 * 
 * Formula:
 * - Base: 50
 * - Agreement bonus: (agreementIndex - 50) * 0.3 (up to ±15 points)
 * - Volatility penalty: -volatility * 0.25 (up to -25 points)
 * - Data points bonus: min(20, (dataPoints / 50) * 20) (up to +20 points)
 * - Source count bonus: min(15, (sourceCount - 1) * 7.5) (up to +15 points)
 * - Margin bonus: min(10, margin * 0.5) (up to +10 points for wide margins)
 * - Leader change risk penalty: -leaderChangeRisk * 0.15 (up to -15 points)
 * 
 * Clamped to 0-100
 */
export function calculateConfidenceScore(factors: ConfidenceFactors): number {
  const {
    agreementIndex = 50,
    volatility = 0,
    dataPoints = 0,
    sourceCount = 1,
    leaderChangeRisk = 0,
    margin = 0,
  } = factors;

  // Base confidence
  let confidence = 50;

  // Agreement bonus/penalty: Higher agreement increases confidence
  // agreementIndex ranges 0-100, centered at 50
  // At 100 agreement: +15 points, at 0 agreement: -15 points
  const agreementBonus = (agreementIndex - 50) * 0.3;
  confidence += agreementBonus;

  // Volatility penalty: Higher volatility decreases confidence
  // volatility ranges 0-100
  // At 100 volatility: -25 points, at 0 volatility: 0 points
  const volatilityPenalty = volatility * 0.25;
  confidence -= volatilityPenalty;

  // Data points bonus: More data points increase confidence
  // Full bonus (20 points) at 50+ data points
  const dataPointsBonus = Math.min(20, (dataPoints / 50) * 20);
  confidence += dataPointsBonus;

  // Source count bonus: More sources increase confidence
  // 1 source: 0 points, 2 sources: +7.5, 3 sources: +15 (max)
  const sourceCountBonus = Math.min(15, (sourceCount - 1) * 7.5);
  confidence += sourceCountBonus;

  // Margin bonus: Wider margins increase confidence (but only up to +10)
  // A margin of 20+ gives full bonus
  const marginBonus = Math.min(10, margin * 0.5);
  confidence += marginBonus;

  // Leader change risk penalty: Higher risk decreases confidence
  // leaderChangeRisk ranges 0-100
  // At 100 risk: -15 points, at 0 risk: 0 points
  const riskPenalty = leaderChangeRisk * 0.15;
  confidence -= riskPenalty;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Get confidence label from score
 */
export function getConfidenceLabel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * Calculate confidence for comparison verdict
 * This is the main function used throughout the app
 */
export function calculateComparisonConfidence(
  agreementIndex: number,
  volatility: number,
  dataPoints: number,
  sourceCount: number,
  margin: number = 0,
  leaderChangeRisk: number = 0
): {
  score: number; // 0-100 continuous score
  label: 'low' | 'medium' | 'high';
} {
  const score = calculateConfidenceScore({
    agreementIndex,
    volatility,
    dataPoints,
    sourceCount,
    margin,
    leaderChangeRisk,
  });

  return {
    score,
    label: getConfidenceLabel(score),
  };
}

