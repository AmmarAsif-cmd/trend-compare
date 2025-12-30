/**
 * Core Forecasting Module
 * 
 * Implements classical time-series forecasting methods:
 * - ETS (Error, Trend, Seasonality) / Holt-Winters
 * - ARIMA/SARIMA baseline
 * 
 * All methods include prediction intervals and backtesting support.
 */

export interface TimeSeriesPoint {
  date: string; // ISO 8601 date string
  value: number;
}

export interface ForecastPoint {
  date: string;
  value: number; // Forecasted value
  lower80: number; // 80% prediction interval lower bound
  upper80: number; // 80% prediction interval upper bound
  lower95: number; // 95% prediction interval lower bound
  upper95: number; // 95% prediction interval upper bound
}

export interface ForecastResult {
  points: ForecastPoint[];
  model: 'ets' | 'arima' | 'naive';
  metrics: {
    mae: number; // Mean Absolute Error (from backtesting)
    mape: number; // Mean Absolute Percentage Error
    intervalCoverage80: number; // % of actuals within 80% interval
    intervalCoverage95: number; // % of actuals within 95% interval
    sampleSize: number; // Number of backtest windows
  };
  confidenceScore: number; // 0-100, derived from metrics
  qualityFlags: {
    seriesTooShort: boolean;
    tooSpiky: boolean;
    eventShockLikely: boolean;
  };
}

export interface BacktestResult {
  mae: number;
  mape: number;
  intervalCoverage80: number;
  intervalCoverage95: number;
  sampleSize: number;
}

/**
 * Calculate simple statistics for a series
 */
function calculateStats(values: number[]): {
  mean: number;
  std: number;
  min: number;
  max: number;
} {
  if (values.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0 };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { mean, std, min, max };
}

/**
 * Detect if series is too short, too spiky, or likely to have event shocks
 */
function assessQuality(series: TimeSeriesPoint[]): {
  seriesTooShort: boolean;
  tooSpiky: boolean;
  eventShockLikely: boolean;
} {
  if (series.length < 14) {
    return { seriesTooShort: true, tooSpiky: false, eventShockLikely: false };
  }

  const values = series.map(p => p.value);
  const stats = calculateStats(values);

  // Check for extreme volatility (spiky)
  const coefficientOfVariation = stats.std / (stats.mean || 1);
  const tooSpiky = coefficientOfVariation > 1.5; // Very high volatility

  // Check for potential event shocks (large sudden changes)
  let largeChanges = 0;
  for (let i = 1; i < values.length; i++) {
    const change = Math.abs(values[i] - values[i - 1]);
    const percentChange = change / (Math.abs(values[i - 1]) || 1);
    if (percentChange > 0.5) { // 50% change
      largeChanges++;
    }
  }
  const eventShockLikely = largeChanges / values.length > 0.1; // >10% of points have large changes

  return {
    seriesTooShort: false,
    tooSpiky,
    eventShockLikely,
  };
}

/**
 * ETS (Error, Trend, Seasonality) / Holt-Winters forecasting
 * 
 * Implements triple exponential smoothing with optional seasonality detection
 */
function forecastETS(
  series: TimeSeriesPoint[],
  horizon: number
): { points: ForecastPoint[]; mse: number } {
  const values = series.map(p => p.value);
  const n = values.length;

  if (n < 4) {
    // Fallback to naive forecast
    const lastValue = values[n - 1] || 0;
    const points: ForecastPoint[] = [];
    const lastDate = new Date(series[n - 1].date);
    
    for (let i = 0; i < horizon; i++) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i + 1);
      points.push({
        date: date.toISOString().split('T')[0],
        value: lastValue,
        lower80: lastValue * 0.8,
        upper80: lastValue * 1.2,
        lower95: lastValue * 0.7,
        upper95: lastValue * 1.3,
      });
    }
    return { points, mse: 0 };
  }

  // Detect seasonality (weekly pattern for daily data)
  const seasonLength = 7; // Weekly seasonality
  const hasSeasonality = n >= seasonLength * 2;

  // Initialize parameters
  let alpha = 0.3; // Level smoothing
  let beta = 0.1; // Trend smoothing
  let gamma = 0.1; // Seasonality smoothing (if applicable)

  // Initialize level, trend, and seasonal components
  let level = values[0];
  let trend = n > 1 ? (values[1] - values[0]) : 0;
  
  const seasonal: number[] = [];
  if (hasSeasonality) {
    // Initialize seasonal indices
    for (let i = 0; i < seasonLength; i++) {
      seasonal[i] = 1.0; // Start neutral
    }
    // Calculate initial seasonal indices from first season
    for (let i = 0; i < seasonLength && i < n; i++) {
      seasonal[i] = values[i] / (level || 1);
    }
  }

  // Fit the model (optimize parameters via simple grid search)
  let bestMSE = Infinity;
  let bestParams = { alpha, beta, gamma };
  
  // Simple grid search for parameters
  for (const a of [0.1, 0.2, 0.3, 0.4, 0.5]) {
    for (const b of [0.05, 0.1, 0.15, 0.2]) {
      for (const g of hasSeasonality ? [0.05, 0.1, 0.15, 0.2] : [0]) {
        const result = fitETS(values, a, b, g, seasonLength, hasSeasonality);
        const mse = typeof result === 'number' ? result : result.mse;
        if (mse < bestMSE) {
          bestMSE = mse;
          bestParams = { alpha: a, beta: b, gamma: g };
        }
      }
    }
  }

  alpha = bestParams.alpha;
  beta = bestParams.beta;
  gamma = bestParams.gamma;

  // Re-fit with best parameters to get final state
  const fitResult = fitETS(values, alpha, beta, gamma, seasonLength, hasSeasonality, true);
  const { level: finalLevel, trend: finalTrend, seasonal: finalSeasonal, mse } = 
    typeof fitResult === 'number' ? { level: 0, trend: 0, seasonal: [], mse: fitResult } : fitResult;

  // Generate forecasts
  const points: ForecastPoint[] = [];
  const lastDate = new Date(series[n - 1].date);
  let forecastLevel = finalLevel;
  let forecastTrend = finalTrend;

  // Calculate prediction intervals based on residual standard error
  const residualStd = Math.sqrt(mse);
  const t80 = 1.28; // 80% interval (approx)
  const t95 = 1.96; // 95% interval

  for (let i = 0; i < horizon; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    
    // Update level and trend for forecast
    forecastLevel = forecastLevel + forecastTrend;
    
    // Add seasonality if applicable
    let forecast = forecastLevel;
    if (hasSeasonality && finalSeasonal.length > 0) {
      const seasonIndex = (n + i) % seasonLength;
      forecast = forecastLevel * (finalSeasonal[seasonIndex] || 1);
    }

    // Calculate prediction intervals
    const uncertainty = residualStd * Math.sqrt(i + 1); // Uncertainty grows with horizon
    const lower80 = Math.max(0, forecast - t80 * uncertainty);
    const upper80 = forecast + t80 * uncertainty;
    const lower95 = Math.max(0, forecast - t95 * uncertainty);
    const upper95 = forecast + t95 * uncertainty;

    points.push({
      date: date.toISOString().split('T')[0],
      value: forecast,
      lower80,
      upper80,
      lower95,
      upper95,
    });
  }

  return { points, mse };
}

/**
 * Fit ETS model and return final state
 */
function fitETS(
  values: number[],
  alpha: number,
  beta: number,
  gamma: number,
  seasonLength: number,
  hasSeasonality: boolean,
  returnState = false
): { level: number; trend: number; seasonal: number[]; mse: number } | number {
  const n = values.length;
  let level = values[0];
  let trend = n > 1 ? (values[1] - values[0]) : 0;
  
  const seasonal: number[] = [];
  if (hasSeasonality) {
    for (let i = 0; i < seasonLength; i++) {
      seasonal[i] = 1.0;
    }
    for (let i = 0; i < seasonLength && i < n; i++) {
      seasonal[i] = values[i] / (level || 1);
    }
  }

  const errors: number[] = [];

  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    const prevTrend = trend;
    
    // Get seasonal component
    let seasonalComponent = 1;
    if (hasSeasonality) {
      const seasonIndex = (i - 1) % seasonLength;
      seasonalComponent = seasonal[seasonIndex] || 1;
    }

    // One-step-ahead forecast
    const forecast = (prevLevel + prevTrend) * seasonalComponent;
    const error = values[i] - forecast;

    // Update level
    level = alpha * (values[i] / seasonalComponent) + (1 - alpha) * (prevLevel + prevTrend);
    
    // Update trend
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    
    // Update seasonality
    if (hasSeasonality) {
      const seasonIndex = (i - 1) % seasonLength;
      seasonal[seasonIndex] = gamma * (values[i] / level) + (1 - gamma) * seasonalComponent;
    }

    errors.push(error);
  }

  const mse = errors.reduce((sum, e) => sum + e * e, 0) / errors.length;

  if (returnState) {
    return { level, trend, seasonal, mse };
  }
  return mse;
}

/**
 * Simple ARIMA-like forecasting using differencing and autoregression
 * 
 * Implements ARIMA(p,d,q) where:
 * - p: autoregressive order (we use p=1 or 2)
 * - d: differencing order (we use d=1)
 * - q: moving average order (we use q=0 for simplicity)
 */
function forecastARIMA(
  series: TimeSeriesPoint[],
  horizon: number
): { points: ForecastPoint[]; mse: number } {
  const values = series.map(p => p.value);
  const n = values.length;

  if (n < 4) {
    // Fallback to naive forecast
    const lastValue = values[n - 1] || 0;
    const points: ForecastPoint[] = [];
    const lastDate = new Date(series[n - 1].date);
    
    for (let i = 0; i < horizon; i++) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i + 1);
      points.push({
        date: date.toISOString().split('T')[0],
        value: lastValue,
        lower80: lastValue * 0.8,
        upper80: lastValue * 1.2,
        lower95: lastValue * 0.7,
        upper95: lastValue * 1.3,
      });
    }
    return { points, mse: 0 };
  }

  // Difference the series (d=1)
  const diffValues: number[] = [];
  for (let i = 1; i < n; i++) {
    diffValues.push(values[i] - values[i - 1]);
  }

  // Fit AR(1) or AR(2) model on differenced series
  const arOrder = diffValues.length >= 10 ? 2 : 1;
  
  // Estimate AR coefficients using Yule-Walker equations (simplified)
  let phi1 = 0;
  let phi2 = 0;
  
  if (arOrder === 1) {
    // AR(1): phi1 = autocorrelation at lag 1
    const mean = diffValues.reduce((a, b) => a + b, 0) / diffValues.length;
    let numerator = 0;
    let denominator = 0;
    for (let i = 1; i < diffValues.length; i++) {
      numerator += (diffValues[i] - mean) * (diffValues[i - 1] - mean);
      denominator += Math.pow(diffValues[i - 1] - mean, 2);
    }
    phi1 = denominator > 0 ? numerator / denominator : 0;
    phi1 = Math.max(-0.99, Math.min(0.99, phi1)); // Constrain to stationarity
  } else {
    // AR(2): Use method of moments (simplified)
    const mean = diffValues.reduce((a, b) => a + b, 0) / diffValues.length;
    let ac1 = 0, ac2 = 0, var0 = 0;
    for (let i = 2; i < diffValues.length; i++) {
      const d0 = diffValues[i] - mean;
      const d1 = diffValues[i - 1] - mean;
      const d2 = diffValues[i - 2] - mean;
      ac1 += d0 * d1;
      ac2 += d0 * d2;
      var0 += d0 * d0;
    }
    const n2 = diffValues.length - 2;
    if (n2 > 0 && var0 > 0) {
      const r1 = ac1 / var0;
      const r2 = ac2 / var0;
      // Solve Yule-Walker for AR(2)
      phi1 = (r1 * (1 - r2)) / (1 - r1 * r1);
      phi2 = (r2 - r1 * r1) / (1 - r1 * r1);
      phi1 = Math.max(-0.99, Math.min(0.99, phi1));
      phi2 = Math.max(-0.99, Math.min(0.99, phi2));
    }
  }

  // Calculate residuals and MSE
  const residuals: number[] = [];
  for (let i = arOrder; i < diffValues.length; i++) {
    let predicted = 0;
    if (arOrder === 1) {
      predicted = phi1 * diffValues[i - 1];
    } else {
      predicted = phi1 * diffValues[i - 1] + phi2 * diffValues[i - 2];
    }
    residuals.push(diffValues[i] - predicted);
  }
  const mse = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;

  // Generate forecasts on differenced series
  const diffForecasts: number[] = [];
  let lastDiff1 = diffValues[diffValues.length - 1];
  let lastDiff2 = diffValues.length > 1 ? diffValues[diffValues.length - 2] : 0;

  for (let i = 0; i < horizon; i++) {
    let diffForecast = 0;
    if (arOrder === 1) {
      diffForecast = phi1 * lastDiff1;
      lastDiff1 = diffForecast;
    } else {
      diffForecast = phi1 * lastDiff1 + phi2 * lastDiff2;
      lastDiff2 = lastDiff1;
      lastDiff1 = diffForecast;
    }
    diffForecasts.push(diffForecast);
  }

  // Integrate back to original scale
  const lastValue = values[n - 1];
  const forecasts: number[] = [];
  let cumulative = lastValue;
  for (const diff of diffForecasts) {
    cumulative += diff;
    forecasts.push(cumulative);
  }

  // Generate forecast points with intervals
  const points: ForecastPoint[] = [];
  const lastDate = new Date(series[n - 1].date);
  const residualStd = Math.sqrt(mse);
  const t80 = 1.28;
  const t95 = 1.96;

  for (let i = 0; i < horizon; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    
    const forecast = forecasts[i];
    const uncertainty = residualStd * Math.sqrt(i + 1);
    const lower80 = Math.max(0, forecast - t80 * uncertainty);
    const upper80 = forecast + t80 * uncertainty;
    const lower95 = Math.max(0, forecast - t95 * uncertainty);
    const upper95 = forecast + t95 * uncertainty;

    points.push({
      date: date.toISOString().split('T')[0],
      value: forecast,
      lower80,
      upper80,
      lower95,
      upper95,
    });
  }

  return { points, mse };
}

/**
 * Walk-forward backtesting to evaluate model performance
 * 
 * Splits data into training and validation windows, evaluates each model,
 * and returns metrics aggregated across all windows.
 */
export function walkForwardBacktest(
  series: TimeSeriesPoint[],
  model: 'ets' | 'arima',
  minTrainSize: number = 14,
  validationSize: number = 7,
  stepSize: number = 7
): BacktestResult {
  const n = series.length;
  if (n < minTrainSize + validationSize) {
    // Not enough data for backtesting
    return {
      mae: Infinity,
      mape: Infinity,
      intervalCoverage80: 0,
      intervalCoverage95: 0,
      sampleSize: 0,
    };
  }

  const errors: number[] = [];
  const percentageErrors: number[] = [];
  const intervalHits80: boolean[] = [];
  const intervalHits95: boolean[] = [];

  // Walk forward through the series
  for (let trainEnd = minTrainSize; trainEnd < n - validationSize; trainEnd += stepSize) {
    const trainSeries = series.slice(0, trainEnd);
    const validationSeries = series.slice(trainEnd, trainEnd + validationSize);

    // Generate forecast for validation period
    const forecastFunc = model === 'ets' ? forecastETS : forecastARIMA;
    const { points } = forecastFunc(trainSeries, validationSize);

    // Compare forecasts to actuals
    for (let i = 0; i < Math.min(points.length, validationSeries.length); i++) {
      const actual = validationSeries[i].value;
      const forecast = points[i].value;
      const error = Math.abs(actual - forecast);
      const pctError = actual > 0 ? (error / actual) * 100 : 0;

      errors.push(error);
      percentageErrors.push(pctError);

      // Check interval coverage
      intervalHits80.push(actual >= points[i].lower80 && actual <= points[i].upper80);
      intervalHits95.push(actual >= points[i].lower95 && actual <= points[i].upper95);
    }
  }

  if (errors.length === 0) {
    return {
      mae: Infinity,
      mape: Infinity,
      intervalCoverage80: 0,
      intervalCoverage95: 0,
      sampleSize: 0,
    };
  }

  const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
  const mape = percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length;
  const intervalCoverage80 = (intervalHits80.filter(h => h).length / intervalHits80.length) * 100;
  const intervalCoverage95 = (intervalHits95.filter(h => h).length / intervalHits95.length) * 100;

  return {
    mae,
    mape,
    intervalCoverage80,
    intervalCoverage95,
    sampleSize: errors.length,
  };
}

/**
 * Calculate confidence score (0-100) based on backtest metrics
 * 
 * Formula:
 * - Base score from MAE/MAPE (lower is better)
 * - Bonus for good interval coverage (80% interval should cover ~80% of actuals)
 * - Penalty for small sample size
 * - Penalty for quality flags
 */
function calculateConfidenceScore(
  metrics: BacktestResult,
  qualityFlags: { seriesTooShort: boolean; tooSpiky: boolean; eventShockLikely: boolean }
): number {
  if (metrics.sampleSize === 0) {
    return 0;
  }

  // Base score from error metrics (inverse relationship)
  // Normalize MAE and MAPE to 0-100 scale (assuming reasonable ranges)
  const maeScore = Math.max(0, 100 - Math.min(100, metrics.mae * 2)); // Penalize high MAE
  const mapeScore = Math.max(0, 100 - Math.min(100, metrics.mape)); // Penalize high MAPE
  const errorScore = (maeScore + mapeScore) / 2;

  // Interval coverage score (80% interval should cover ~80% of actuals)
  const coverage80Score = Math.max(0, 100 - Math.abs(metrics.intervalCoverage80 - 80) * 2);
  const coverage95Score = Math.max(0, 100 - Math.abs(metrics.intervalCoverage95 - 95) * 2);
  const coverageScore = (coverage80Score + coverage95Score) / 2;

  // Sample size penalty (more samples = more reliable)
  const sampleSizeScore = Math.min(100, (metrics.sampleSize / 20) * 100); // Full score at 20+ samples

  // Combine scores with weights
  let confidence = (
    errorScore * 0.4 +      // 40% weight on accuracy
    coverageScore * 0.3 +    // 30% weight on interval coverage
    sampleSizeScore * 0.3    // 30% weight on sample size
  );

  // Apply quality flag penalties
  if (qualityFlags.seriesTooShort) {
    confidence *= 0.5; // Halve confidence if series too short
  }
  if (qualityFlags.tooSpiky) {
    confidence *= 0.7; // Reduce by 30% if too spiky
  }
  if (qualityFlags.eventShockLikely) {
    confidence *= 0.8; // Reduce by 20% if event shocks likely
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Main forecasting function
 * 
 * Runs both ETS and ARIMA models, selects best via backtesting,
 * and returns forecast with confidence metrics.
 */
export async function forecast(
  series: TimeSeriesPoint[],
  horizon: number = 28 // 4 weeks default
): Promise<ForecastResult> {
  if (series.length < 7) {
    // Not enough data - return naive forecast
    const lastValue = series.length > 0 ? series[series.length - 1].value : 0;
    const points: ForecastPoint[] = [];
    const lastDate = series.length > 0 
      ? new Date(series[series.length - 1].date)
      : new Date();
    
    for (let i = 0; i < horizon; i++) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i + 1);
      points.push({
        date: date.toISOString().split('T')[0],
        value: lastValue,
        lower80: lastValue * 0.8,
        upper80: lastValue * 1.2,
        lower95: lastValue * 0.7,
        upper95: lastValue * 1.3,
      });
    }

    return {
      points,
      model: 'naive',
      metrics: {
        mae: Infinity,
        mape: Infinity,
        intervalCoverage80: 0,
        intervalCoverage95: 0,
        sampleSize: 0,
      },
      confidenceScore: 0,
      qualityFlags: {
        seriesTooShort: true,
        tooSpiky: false,
        eventShockLikely: false,
      },
    };
  }

  // Assess data quality
  const qualityFlags = assessQuality(series);

  // Backtest both models
  const etsBacktest = walkForwardBacktest(series, 'ets');
  const arimaBacktest = walkForwardBacktest(series, 'arima');

  // Select best model based on MAE (lower is better)
  const useETS = etsBacktest.mae <= arimaBacktest.mae;
  const selectedModel = useETS ? 'ets' : 'arima';
  const selectedBacktest = useETS ? etsBacktest : arimaBacktest;

  // Generate forecast with selected model
  const forecastFunc = useETS ? forecastETS : forecastARIMA;
  const { points } = forecastFunc(series, horizon);

  // Validate forecast points are reasonable
  if (points.length > 0) {
    const forecastValues = points.map(p => p.value);
    const minForecast = Math.min(...forecastValues);
    const maxForecast = Math.max(...forecastValues);
    const lastHistorical = series[series.length - 1]?.value || 0;
    
    console.log(`[Forecast] Generated ${points.length} forecast points using ${selectedModel}:`, {
      minForecast: minForecast.toFixed(2),
      maxForecast: maxForecast.toFixed(2),
      lastHistorical: lastHistorical.toFixed(2),
      firstForecast: points[0].value.toFixed(2),
    });

    // Warn if forecast values seem unreasonable (all zeros or extreme)
    if (maxForecast === 0 && lastHistorical > 0) {
      console.warn(`[Forecast] Warning: Forecast values are all zero but historical data exists. Last historical: ${lastHistorical}`);
    }
  }

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(selectedBacktest, qualityFlags);

  return {
    points,
    model: selectedModel,
    metrics: selectedBacktest,
    confidenceScore,
    qualityFlags,
  };
}

