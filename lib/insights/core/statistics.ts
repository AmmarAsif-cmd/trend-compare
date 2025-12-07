/**
 * Statistical Utility Functions
 * Pure math - no business logic
 * Optimized for performance with large datasets
 */

/**
 * Calculate mean (average)
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate median
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);

  return Math.sqrt(variance);
}

/**
 * Calculate variance
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));

  return calculateMean(squaredDiffs);
}

/**
 * Calculate z-score for a value
 * Tells you how many standard deviations away from mean
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate Pearson correlation coefficient
 * Returns -1 to 1 (how related are two series?)
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;

    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;

  return numerator / denom;
}

/**
 * Calculate covariance
 */
export function calculateCovariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY);
  }

  return sum / x.length;
}

/**
 * Linear regression
 * Returns { slope, intercept, rSquared }
 */
export function linearRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  if (x.length !== y.length || x.length === 0) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + (xi * y[i]), 0);
  const sumX2 = x.reduce((sum, xi) => sum + (xi * xi), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const meanY = sumY / n;
  let ssTotal = 0;
  let ssResidual = 0;

  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    ssTotal += Math.pow(y[i] - meanY, 2);
    ssResidual += Math.pow(y[i] - predicted, 2);
  }

  const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

  return { slope, intercept, rSquared };
}

/**
 * Calculate rolling average
 * @param values - Array of numbers
 * @param window - Window size (e.g., 7 for 7-day average)
 */
export function rollingAverage(values: number[], window: number): number[] {
  if (window <= 0 || values.length === 0) return values;

  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    result.push(calculateMean(windowValues));
  }

  return result;
}

/**
 * Calculate exponential moving average (EMA)
 * More weight to recent values
 */
export function exponentialMovingAverage(values: number[], alpha: number = 0.3): number[] {
  if (values.length === 0) return [];

  const result: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const ema = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Detect outliers using IQR method
 * Returns indices of outlier values
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outlierIndices: number[] = [];
  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outlierIndices.push(index);
    }
  });

  return outlierIndices;
}

/**
 * Normalize values to 0-100 scale
 */
export function normalizeToScale(values: number[], min: number = 0, max: number = 100): number[] {
  if (values.length === 0) return [];

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;

  if (range === 0) return values.map(() => (min + max) / 2);

  return values.map(val => {
    const normalized = (val - dataMin) / range;
    return min + normalized * (max - min);
  });
}

/**
 * Calculate percentage change
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

/**
 * Find local maxima (peaks)
 * Returns indices of peak values
 */
export function findPeaks(values: number[], minProminence: number = 0): number[] {
  if (values.length < 3) return [];

  const peaks: number[] = [];

  for (let i = 1; i < values.length - 1; i++) {
    // Check if current value is greater than neighbors
    if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
      // Check prominence (how much it stands out)
      const leftMin = Math.min(...values.slice(Math.max(0, i - 5), i));
      const rightMin = Math.min(...values.slice(i + 1, Math.min(values.length, i + 6)));
      const prominence = values[i] - Math.max(leftMin, rightMin);

      if (prominence >= minProminence) {
        peaks.push(i);
      }
    }
  }

  return peaks;
}

/**
 * Find local minima (troughs)
 */
export function findTroughs(values: number[], minDepth: number = 0): number[] {
  if (values.length < 3) return [];

  const troughs: number[] = [];

  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
      const leftMax = Math.max(...values.slice(Math.max(0, i - 5), i));
      const rightMax = Math.max(...values.slice(i + 1, Math.min(values.length, i + 6)));
      const depth = Math.min(leftMax, rightMax) - values[i];

      if (depth >= minDepth) {
        troughs.push(i);
      }
    }
  }

  return troughs;
}

/**
 * Calculate coefficient of variation
 * Normalized measure of volatility
 */
export function coefficientOfVariation(values: number[]): number {
  const mean = calculateMean(values);
  if (mean === 0) return 0;

  const stdDev = calculateStdDev(values);
  return (stdDev / Math.abs(mean)) * 100;
}

/**
 * Calculate autocorrelation at lag k
 * Measures how well current values predict future values
 */
export function autocorrelation(values: number[], lag: number): number {
  if (lag <= 0 || lag >= values.length) return 0;

  const n = values.length - lag;
  const x = values.slice(0, n);
  const y = values.slice(lag);

  return calculateCorrelation(x, y);
}

/**
 * Detrend data (remove linear trend)
 * Returns detrended values
 */
export function detrend(values: number[]): number[] {
  const indices = Array.from({ length: values.length }, (_, i) => i);
  const { slope, intercept } = linearRegression(indices, values);

  return values.map((val, i) => val - (slope * i + intercept));
}
