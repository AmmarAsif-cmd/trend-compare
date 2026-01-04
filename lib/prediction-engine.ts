/**
 * Trend Prediction Engine
 * Uses statistical methods and machine learning to forecast future trends
 * Combines multiple forecasting techniques for robust predictions
 */

import type { SeriesPoint } from './trends';

export type PredictionResult = {
  predictions: Array<{
    date: string;
    value: number;
    confidence: number; // 0-100
  }>;
  trend: 'rising' | 'falling' | 'stable';
  confidence: number; // Overall confidence 0-100
  forecastPeriod: number; // Days ahead
  methods: string[]; // Which methods were used
  explanation: string;
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
};

export type PredictionOptions = {
  series: SeriesPoint[];
  term: string;
  forecastDays?: number; // How many days ahead (default: 30)
  methods?: ('linear' | 'exponential' | 'moving-average' | 'arima' | 'all')[]; // Which methods to use
  historicalDays?: number; // Number of historical data points used (for display)
};

/**
 * Main prediction function - combines multiple methods
 */
export async function predictTrend(options: PredictionOptions): Promise<PredictionResult> {
  const {
    series,
    term,
    forecastDays = 30,
    methods = ['all'],
  } = options;

  if (!series || series.length < 7) {
    return createFallbackPrediction(term, forecastDays, `Insufficient data for prediction (need at least 7 data points, got ${series?.length || 0})`);
  }
  
  // Log data range for transparency
  const firstDate = series[0]?.date;
  const lastDate = series[series.length - 1]?.date;
  const daysOfData = series.length;
  console.log(`[Prediction] Analyzing ${daysOfData} data points from ${firstDate} to ${lastDate} (${daysOfData > 200 ? '~5 years' : daysOfData > 100 ? '~1 year' : `${daysOfData} days`})`);

  const values = series.map(p => Number(p[term] || 0));
  const dates = series.map(p => p.date);

  // Use all methods if 'all' is specified
  const useAllMethods = methods.includes('all');
  const methodsToUse: Array<'linear' | 'exponential' | 'moving-average'> = useAllMethods 
    ? ['linear', 'exponential', 'moving-average'] 
    : methods.filter((m): m is 'linear' | 'exponential' | 'moving-average' => 
        m !== 'all' && (m === 'linear' || m === 'exponential' || m === 'moving-average')
      );

  console.log(`[Prediction] 🔮 Forecasting ${forecastDays} days ahead for "${term}" using methods: ${methodsToUse.join(', ')}`);

  // Run all selected methods in parallel
  const methodResults = await Promise.all(
    methodsToUse.map(method => runPredictionMethod(method, values, dates, forecastDays))
  );

  // Combine predictions using weighted average (more reliable methods get higher weight)
  const combined = combinePredictions(methodResults, forecastDays);

  // Calculate overall confidence
  const confidence = calculateOverallConfidence(methodResults, values);

  // Determine trend direction
  const trend = determineTrend(combined.predictions, values);

  // Generate explanation
  const explanation = generateExplanation(trend, confidence, combined.predictions, term);

  return {
    predictions: combined.predictions,
    trend,
    confidence,
    forecastPeriod: forecastDays,
    methods: methodsToUse,
    explanation,
    confidenceInterval: combined.confidenceInterval,
  };
}

/**
 * Linear Regression Prediction
 * Uses least squares to fit a line and extrapolate
 */
function linearRegressionPrediction(
  values: number[],
  dates: string[],
  forecastDays: number
): Array<{ date: string; value: number; confidence: number }> {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  // Calculate slope (b) and intercept (a) using least squares
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (values[i] - yMean);
    denominator += Math.pow(x[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  // Calculate R-squared for confidence
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    ssRes += Math.pow(values[i] - predicted, 2);
    ssTot += Math.pow(values[i] - yMean, 2);
  }
  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
  const confidence = Math.max(0, Math.min(100, rSquared * 100));
  
  // Generate future predictions
  const lastDate = new Date(dates[dates.length - 1]);
  const predictions: Array<{ date: string; value: number; confidence: number }> = [];
  
  for (let i = 1; i <= forecastDays; i++) {
    const futureX = n + i - 1;
    const predictedValue = slope * futureX + intercept;
    
    // Ensure value is non-negative
    const value = Math.max(0, predictedValue);
    
    // Confidence decreases as we predict further ahead
    const futureConfidence = Math.max(0, confidence * (1 - (i / forecastDays) * 0.5));
    
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      confidence: Math.round(futureConfidence * 100) / 100,
    });
  }
  
  return predictions;
}

/**
 * Exponential Smoothing Prediction
 * Uses exponential weighted moving average
 */
function exponentialSmoothingPrediction(
  values: number[],
  dates: string[],
  forecastDays: number,
  alpha: number = 0.3 // Smoothing factor (0-1)
): Array<{ date: string; value: number; confidence: number }> {
  if (values.length < 2) {
    return [];
  }
  
  // Calculate exponential moving average
  let ema = values[0];
  const emaValues: number[] = [ema];
  
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema;
    emaValues.push(ema);
  }
  
  // Calculate trend (difference between last two EMA values)
  const trend = emaValues.length > 1 
    ? emaValues[emaValues.length - 1] - emaValues[emaValues.length - 2]
    : 0;
  
  // Calculate confidence based on variance
  const variance = calculateVariance(values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;
  const baseConfidence = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  
  // Generate predictions
  const lastDate = new Date(dates[dates.length - 1]);
  const predictions: Array<{ date: string; value: number; confidence: number }> = [];
  let currentValue = ema;
  
  for (let i = 1; i <= forecastDays; i++) {
    currentValue = currentValue + trend;
    const value = Math.max(0, currentValue);
    
    // Confidence decreases over time
    const futureConfidence = Math.max(0, baseConfidence * (1 - (i / forecastDays) * 0.6));
    
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      confidence: Math.round(futureConfidence * 100) / 100,
    });
  }
  
  return predictions;
}

/**
 * Moving Average Prediction
 * Uses weighted moving average with trend
 */
function movingAveragePrediction(
  values: number[],
  dates: string[],
  forecastDays: number,
  windowSize: number = 7
): Array<{ date: string; value: number; confidence: number }> {
  if (values.length < windowSize) {
    return [];
  }
  
  // Calculate weighted moving average (recent values weighted more)
  const weights = Array.from({ length: windowSize }, (_, i) => (i + 1) / windowSize);
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  
  const recentValues = values.slice(-windowSize);
  const weightedAvg = recentValues.reduce((sum, val, i) => sum + val * weights[i], 0) / sumWeights;
  
  // Calculate trend from recent values
  const recentTrend = calculateRecentTrend(values, windowSize);
  
  // Calculate confidence based on data stability
  const recentVariance = calculateVariance(recentValues);
  const stability = recentVariance < 100 ? 80 : recentVariance < 500 ? 60 : 40;
  
  // Generate predictions
  const lastDate = new Date(dates[dates.length - 1]);
  const predictions: Array<{ date: string; value: number; confidence: number }> = [];
  let currentValue = weightedAvg;
  
  for (let i = 1; i <= forecastDays; i++) {
    currentValue = currentValue + recentTrend;
    const value = Math.max(0, currentValue);
    
    // Confidence decreases over time
    const futureConfidence = Math.max(0, stability * (1 - (i / forecastDays) * 0.5));
    
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      confidence: Math.round(futureConfidence * 100) / 100,
    });
  }
  
  return predictions;
}

/**
 * Run a specific prediction method
 */
async function runPredictionMethod(
  method: 'linear' | 'exponential' | 'moving-average',
  values: number[],
  dates: string[],
  forecastDays: number
): Promise<{
  method: string;
  predictions: Array<{ date: string; value: number; confidence: number }>;
  reliability: number; // 0-100
}> {
  let predictions: Array<{ date: string; value: number; confidence: number }> = [];
  let reliability = 50;
  
  switch (method) {
    case 'linear':
      predictions = linearRegressionPrediction(values, dates, forecastDays);
      // Reliability based on R-squared
      const rSquared = calculateRSquared(values, dates);
      reliability = Math.max(40, Math.min(90, rSquared * 100));
      break;
      
    case 'exponential':
      predictions = exponentialSmoothingPrediction(values, dates, forecastDays);
      // Reliability based on data stability
      const cv = calculateCoefficientOfVariation(values);
      reliability = Math.max(50, Math.min(85, 100 - (cv * 50)));
      break;
      
    case 'moving-average':
      predictions = movingAveragePrediction(values, dates, forecastDays);
      // Reliability based on recent trend consistency
      const trendConsistency = calculateTrendConsistency(values);
      reliability = Math.max(45, Math.min(80, trendConsistency * 100));
      break;
  }
  
  return {
    method,
    predictions,
    reliability,
  };
}

/**
 * Combine predictions from multiple methods using weighted average
 */
function combinePredictions(
  methodResults: Array<{
    method: string;
    predictions: Array<{ date: string; value: number; confidence: number }>;
    reliability: number;
  }>,
  forecastDays: number
): {
  predictions: Array<{ date: string; value: number; confidence: number }>;
  confidenceInterval: { lower: number[]; upper: number[] };
} {
  if (methodResults.length === 0) {
    return {
      predictions: [],
      confidenceInterval: { lower: [], upper: [] },
    };
  }
  
  // If only one method, return it directly
  if (methodResults.length === 1) {
    const result = methodResults[0];
    const lower = result.predictions.map(p => Math.max(0, p.value * 0.8));
    const upper = result.predictions.map(p => p.value * 1.2);
    return {
      predictions: result.predictions,
      confidenceInterval: { lower, upper },
    };
  }
  
  // Weight predictions by reliability
  const totalReliability = methodResults.reduce((sum, r) => sum + r.reliability, 0);
  const weights = methodResults.map(r => r.reliability / totalReliability);
  
  // Combine predictions
  const combined: Array<{ date: string; value: number; confidence: number }> = [];
  const allValues: number[][] = [];
  
  for (let i = 0; i < forecastDays; i++) {
    const date = methodResults[0].predictions[i]?.date || '';
    let weightedValue = 0;
    let weightedConfidence = 0;
    const dayValues: number[] = [];
    
    methodResults.forEach((result, idx) => {
      const pred = result.predictions[i];
      if (pred) {
        weightedValue += pred.value * weights[idx];
        weightedConfidence += pred.confidence * weights[idx];
        dayValues.push(pred.value);
      }
    });
    
    allValues.push(dayValues);
    
    combined.push({
      date,
      value: Math.round(weightedValue * 100) / 100,
      confidence: Math.round(weightedConfidence * 100) / 100,
    });
  }
  
  // Calculate confidence intervals (80% confidence)
  const lower: number[] = [];
  const upper: number[] = [];
  
  allValues.forEach((dayValues) => {
    if (dayValues.length > 0) {
      const mean = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
      const stdDev = Math.sqrt(
        dayValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dayValues.length
      );
      // 80% confidence interval (approximately 1.28 standard deviations)
      lower.push(Math.max(0, mean - 1.28 * stdDev));
      upper.push(mean + 1.28 * stdDev);
    } else {
      lower.push(0);
      upper.push(0);
    }
  });
  
  return {
    predictions: combined,
    confidenceInterval: { lower, upper },
  };
}

/**
 * Calculate overall confidence in predictions
 */
function calculateOverallConfidence(
  methodResults: Array<{ reliability: number }>,
  historicalValues: number[]
): number {
  // Average reliability of methods
  const avgReliability = methodResults.reduce((sum, r) => sum + r.reliability, 0) / methodResults.length;
  
  // Data quality factor
  const dataQuality = calculateDataQuality(historicalValues);
  
  // Combine factors
  const confidence = (avgReliability * 0.6 + dataQuality * 0.4);
  
  return Math.round(Math.max(0, Math.min(100, confidence)));
}

/**
 * Determine trend direction
 */
function determineTrend(
  predictions: Array<{ value: number }>,
  historicalValues: number[]
): 'rising' | 'falling' | 'stable' {
  if (predictions.length < 2) return 'stable';
  
  const recentAvg = historicalValues.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, historicalValues.length);
  const futureAvg = predictions.slice(0, 7).reduce((a, b) => a + b.value, 0) / Math.min(7, predictions.length);
  
  const change = ((futureAvg - recentAvg) / recentAvg) * 100;
  
  if (change > 10) return 'rising';
  if (change < -10) return 'falling';
  return 'stable';
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(
  trend: 'rising' | 'falling' | 'stable',
  confidence: number,
  predictions: Array<{ value: number }>,
  term: string
): string {
  const avgFuture = predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length;
  const formattedTerm = term.replace(/-/g, ' ');
  
  let explanation = `Based on statistical analysis of historical data, `;
  
  if (trend === 'rising') {
    explanation += `${formattedTerm} is predicted to show an upward trend over the next ${predictions.length} days, with an average forecasted value of ${avgFuture.toFixed(1)}. `;
  } else if (trend === 'falling') {
    explanation += `${formattedTerm} is predicted to show a downward trend over the next ${predictions.length} days, with an average forecasted value of ${avgFuture.toFixed(1)}. `;
  } else {
    explanation += `${formattedTerm} is predicted to remain relatively stable over the next ${predictions.length} days, with an average forecasted value of ${avgFuture.toFixed(1)}. `;
  }
  
  if (confidence >= 70) {
    explanation += `This prediction has high confidence (${confidence}%) based on consistent historical patterns.`;
  } else if (confidence >= 50) {
    explanation += `This prediction has moderate confidence (${confidence}%) - trends may vary.`;
  } else {
    explanation += `This prediction has lower confidence (${confidence}%) due to high variability in historical data.`;
  }
  
  return explanation;
}

// Helper functions

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function calculateRSquared(values: number[], dates: string[]): number {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (values[i] - yMean);
    denominator += Math.pow(x[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    ssRes += Math.pow(values[i] - predicted, 2);
    ssTot += Math.pow(values[i] - yMean, 2);
  }
  
  return ssTot !== 0 ? Math.max(0, Math.min(1, 1 - (ssRes / ssTot))) : 0;
}

function calculateCoefficientOfVariation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(calculateVariance(values));
  return mean > 0 ? stdDev / mean : 0;
}

function calculateRecentTrend(values: number[], windowSize: number): number {
  if (values.length < windowSize) return 0;
  const recent = values.slice(-windowSize);
  const first = recent[0];
  const last = recent[recent.length - 1];
  return (last - first) / windowSize;
}

function calculateTrendConsistency(values: number[]): number {
  if (values.length < 3) return 0.5;
  
  const trends: number[] = [];
  for (let i = 1; i < values.length; i++) {
    trends.push(values[i] - values[i - 1]);
  }
  
  // Check if trends are consistent (all positive or all negative)
  const allPositive = trends.every(t => t >= 0);
  const allNegative = trends.every(t => t <= 0);
  
  if (allPositive || allNegative) return 0.8;
  
  // Calculate consistency as percentage of trends in same direction
  const positiveCount = trends.filter(t => t > 0).length;
  const negativeCount = trends.filter(t => t < 0).length;
  const consistency = Math.max(positiveCount, negativeCount) / trends.length;
  
  return consistency;
}

function calculateDataQuality(values: number[]): number {
  if (values.length < 7) return 30;
  
  // Check for missing data
  const missingData = values.filter(v => v === 0 || isNaN(v)).length;
  const completeness = 1 - (missingData / values.length);
  
  // Check for outliers (using IQR method)
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const outliers = values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
  const outlierRatio = outliers / values.length;
  
  // Quality score: completeness (60%) + low outliers (40%)
  const quality = (completeness * 0.6 + (1 - outlierRatio) * 0.4) * 100;
  
  return Math.max(0, Math.min(100, quality));
}

function createFallbackPrediction(
  term: string,
  forecastDays: number,
  reason: string
): PredictionResult {
  const formattedTerm = term.replace(/-/g, ' ');
  
  return {
    predictions: [],
    trend: 'stable',
    confidence: 0,
    forecastPeriod: forecastDays,
    methods: [],
    explanation: `Unable to generate predictions for "${formattedTerm}": ${reason}. At least 7 data points are required for reliable forecasting.`,
    confidenceInterval: {
      lower: [],
      upper: [],
    },
  };
}

