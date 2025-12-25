/**
 * Simple Prediction Engine for Free Users
 * Provides basic trend direction without detailed forecasts
 */

export type SimplePrediction = {
  trend: 'rising' | 'falling' | 'stable';
  direction: string; // Human-readable direction
  confidence: number; // 0-100
  explanation: string;
};

/**
 * Generate a simple prediction based on recent trend
 * Free users get this instead of full predictions
 */
export function generateSimplePrediction(
  series: Array<{ date: string; [key: string]: number }>,
  term: string
): SimplePrediction | null {
  if (!series || series.length < 7) {
    return null; // Need at least a week of data
  }

  // Get last 30 days of data (or available data)
  const recentData = series.slice(-30);
  const termValues = recentData.map((point) => point[term] || 0).filter((v) => v > 0);

  if (termValues.length < 7) {
    return null;
  }

  // Calculate trend using simple linear regression on recent data
  const n = termValues.length;
  const firstHalf = termValues.slice(0, Math.floor(n / 2));
  const secondHalf = termValues.slice(Math.floor(n / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = avgSecond - avgFirst;
  const percentChange = (change / avgFirst) * 100;

  // Determine trend
  let trend: 'rising' | 'falling' | 'stable';
  let direction: string;
  let confidence: number;

  if (percentChange > 10) {
    trend = 'rising';
    direction = 'Increasing';
    confidence = Math.min(85, 60 + Math.min(25, Math.abs(percentChange) / 2));
  } else if (percentChange < -10) {
    trend = 'falling';
    direction = 'Decreasing';
    confidence = Math.min(85, 60 + Math.min(25, Math.abs(percentChange) / 2));
  } else {
    trend = 'stable';
    direction = 'Stable';
    confidence = 70;
  }

  // Generate simple explanation
  const formatTerm = (t: string) => t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const explanation = `Based on recent ${recentData.length} days of data, ${formatTerm(term)} shows a ${direction.toLowerCase()} trend (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}% change).`;

  return {
    trend,
    direction,
    confidence: Math.round(confidence),
    explanation,
  };
}


