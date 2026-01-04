/**
 * Trend Index Forecaster
 * 
 * Specialized forecasting for bounded trend indices (0-100).
 * Implements:
 * - Damped Holt's linear trend (ETS with damping)
 * - Theta method
 * - Naive baseline
 * 
 * Uses bootstrap-based confidence intervals and model selection via backtesting.
 */

export interface ForecastOptions {
  allowSeasonality?: boolean;
  clampBounds?: [number, number]; // Default [0, 100]
  horizon?: number; // Default 8-12 points
}

export interface ForecastOutput {
  forecast: number[]; // Median forecast
  lower: number[]; // 10th percentile (or similar)
  upper: number[]; // 90th percentile (or similar)
  modelUsed: 'holt_damped' | 'theta' | 'naive';
  diagnostics: {
    backtestError: number; // MAE or sMAPE
    residualStd: number;
  };
}

/**
 * Damped Holt's Linear Trend (ETS with damping parameter)
 * 
 * Equations:
 *   l[t] = α * y[t] + (1 - α) * (l[t-1] + φ * b[t-1])
 *   b[t] = β * (l[t] - l[t-1]) + (1 - β) * φ * b[t-1]
 *   ŷ[t+h] = l[t] + (φ + φ² + ... + φ^h) * b[t]
 * 
 * Where:
 *   l[t] = level at time t
 *   b[t] = trend at time t
 *   φ = damping parameter (0 < φ < 1, typically 0.8-0.95)
 *   α = level smoothing (0 < α < 1)
 *   β = trend smoothing (0 < β < 1)
 */
function holtDamped(
  series: number[],
  horizon: number,
  bounds: [number, number]
): { forecast: number[]; residuals: number[]; state: { level: number; trend: number } } {
  const n = series.length;
  if (n < 3) {
    // Not enough data
    const lastValue = series[n - 1] || 50;
    return {
      forecast: Array(horizon).fill(Math.max(bounds[0], Math.min(bounds[1], lastValue))),
      residuals: [],
      state: { level: lastValue, trend: 0 },
    };
  }

  // Initialize parameters (can be optimized, but using reasonable defaults)
  const alpha = 0.3; // Level smoothing
  const beta = 0.1; // Trend smoothing
  const phi = 0.9; // Damping factor

  // Initialize level and trend
  let level = series[0];
  let trend = n > 1 ? (series[1] - series[0]) : 0;

  const residuals: number[] = [];
  const fitted: number[] = [level];

  // Fit model
  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    const prevTrend = trend;

    // Update level
    level = alpha * series[i] + (1 - alpha) * (prevLevel + phi * prevTrend);

    // Update trend
    trend = beta * (level - prevLevel) + (1 - beta) * phi * prevTrend;

    // Fitted value
    const fittedValue = prevLevel + phi * prevTrend;
    fitted.push(fittedValue);

    // Residual
    residuals.push(series[i] - fittedValue);
  }

  // Forecast forward
  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    // Sum of geometric series: φ + φ² + ... + φ^h
    const dampedTrendSum = phi * (1 - Math.pow(phi, h)) / (1 - phi);
    const forecastValue = level + dampedTrendSum * trend;
    
    // Clamp to bounds
    forecast.push(Math.max(bounds[0], Math.min(bounds[1], forecastValue)));
  }

  return { forecast, residuals, state: { level, trend } };
}

/**
 * Theta Method (Classic formulation)
 * 
 * The Theta method decomposes the series into a linear trend and a local component.
 * It forecasts by:
 * 1. Computing theta line (linear trend)
 * 2. Decomposing original series from theta line
 * 3. Forecasting decomposed series with SES
 * 4. Combining forecasts
 */
function thetaMethod(
  series: number[],
  horizon: number,
  bounds: [number, number]
): { forecast: number[]; residuals: number[] } {
  const n = series.length;
  if (n < 3) {
    const lastValue = series[n - 1] || 50;
    return {
      forecast: Array(horizon).fill(Math.max(bounds[0], Math.min(bounds[1], lastValue))),
      residuals: [],
    };
  }

  // Step 1: Compute theta line (linear trend)
  // Fit simple linear regression: y = a + b*t
  let sumT = 0;
  let sumY = 0;
  let sumTY = 0;
  let sumT2 = 0;

  for (let i = 0; i < n; i++) {
    const t = i + 1;
    const y = series[i];
    sumT += t;
    sumY += y;
    sumTY += t * y;
    sumT2 += t * t;
  }

  const b = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
  const a = (sumY - b * sumT) / n;

  // Compute theta line values
  const thetaLine: number[] = [];
  for (let i = 0; i < n; i++) {
    thetaLine.push(a + b * (i + 1));
  }

  // Step 2: Decompose: local component = original - theta line
  const localComponent: number[] = [];
  for (let i = 0; i < n; i++) {
    localComponent.push(series[i] - thetaLine[i]);
  }

  // Step 3: Forecast local component using Simple Exponential Smoothing (SES)
  const alpha = 0.3; // SES smoothing parameter
  let sesLevel = localComponent[0];
  const sesForecast: number[] = [];

  for (let i = 1; i < n; i++) {
    sesLevel = alpha * localComponent[i] + (1 - alpha) * sesLevel;
  }

  // Forecast local component (constant level for SES)
  for (let h = 1; h <= horizon; h++) {
    sesForecast.push(sesLevel);
  }

  // Step 4: Combine forecasts
  // Forecast theta line forward
  const thetaForecast: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    thetaForecast.push(a + b * (n + h));
  }

  // Combine: forecast = theta forecast + local forecast
  const forecast: number[] = [];
  for (let h = 0; h < horizon; h++) {
    const combined = thetaForecast[h] + sesForecast[h];
    forecast.push(Math.max(bounds[0], Math.min(bounds[1], combined)));
  }

  // Compute residuals (fitted = theta line + SES fitted local component)
  const residuals: number[] = [];
  let fittedLocal = localComponent[0];
  for (let i = 1; i < n; i++) {
    fittedLocal = alpha * localComponent[i] + (1 - alpha) * fittedLocal;
    const fittedValue = thetaLine[i] + fittedLocal;
    residuals.push(series[i] - fittedValue);
  }

  return { forecast, residuals };
}

/**
 * Naive baseline (last value)
 */
function naiveMethod(
  series: number[],
  horizon: number,
  bounds: [number, number]
): { forecast: number[]; residuals: number[] } {
  const lastValue = series.length > 0 ? series[series.length - 1] : 50;
  const clampedValue = Math.max(bounds[0], Math.min(bounds[1], lastValue));
  
  const residuals: number[] = [];
  for (let i = 1; i < series.length; i++) {
    residuals.push(series[i] - series[i - 1]);
  }

  return {
    forecast: Array(horizon).fill(clampedValue),
    residuals,
  };
}

/**
 * Compute bootstrap-based confidence intervals
 * 
 * Uses residual bootstrap:
 * 1. Fit model and get residuals
 * 2. For each simulation:
 *    - Resample residuals (with replacement)
 *    - Generate forecast path by adding resampled residuals
 * 3. Take quantiles across simulations
 */
function bootstrapIntervals(
  series: number[],
  horizon: number,
  modelFn: (s: number[], h: number, bounds: [number, number]) => { forecast: number[]; residuals: number[] },
  bounds: [number, number],
  numSimulations: number = 200
): { lower: number[]; upper: number[] } {
  const { forecast: pointForecast, residuals } = modelFn(series, horizon, bounds);

  if (residuals.length < 2) {
    // Not enough residuals for bootstrap - use simple interval based on residual std
    const residualStd = 5; // Default uncertainty
    return {
      lower: pointForecast.map(f => Math.max(bounds[0], f - 1.28 * residualStd)), // 80% interval
      upper: pointForecast.map(f => Math.min(bounds[1], f + 1.28 * residualStd)),
    };
  }

  // Compute residual standard deviation
  const meanResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const residualVariance = residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / residuals.length;
  const residualStd = Math.sqrt(residualVariance);

  // Center residuals (mean should be ~0)
  const centeredResiduals = residuals.map(r => r - meanResidual);

  // Generate bootstrap samples
  const simulations: number[][] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    // Generate forecast path by adding resampled residuals
    const path: number[] = [];

    for (let h = 0; h < horizon; h++) {
      // Sample residual (with replacement)
      const residualIdx = Math.floor(Math.random() * centeredResiduals.length);
      const sampledResidual = centeredResiduals[residualIdx];

      // Add to point forecast
      const forecastValue = pointForecast[h] + sampledResidual;
      const clampedValue = Math.max(bounds[0], Math.min(bounds[1], forecastValue));
      path.push(clampedValue);
    }

    simulations.push(path);
  }

  // Compute percentiles (10th and 90th)
  const lower: number[] = [];
  const upper: number[] = [];

  for (let h = 0; h < horizon; h++) {
    const valuesAtH = simulations.map(sim => sim[h]).sort((a, b) => a - b);
    const lowerIdx = Math.max(0, Math.floor(0.1 * valuesAtH.length));
    const upperIdx = Math.min(valuesAtH.length - 1, Math.floor(0.9 * valuesAtH.length));
    
    lower.push(Math.max(bounds[0], valuesAtH[lowerIdx] || pointForecast[h] - 5));
    upper.push(Math.min(bounds[1], valuesAtH[upperIdx] || pointForecast[h] + 5));
  }

  return { lower, upper };
}

/**
 * Rolling-origin backtesting for model selection
 * 
 * Tests models on last portion of series using rolling windows.
 * Returns MAE (Mean Absolute Error).
 */
function rollingOriginBacktest(
  series: number[],
  modelFn: (s: number[], h: number, bounds: [number, number]) => { forecast: number[] },
  testWindowSize: number = 12,
  horizon: number = 4,
  minTrainSize: number = 12
): number {
  const n = series.length;
  const bounds: [number, number] = [0, 100];

  if (n < minTrainSize + horizon) {
    return Infinity; // Not enough data
  }

  const errors: number[] = [];

  // Test on last portion of series
  const testStart = Math.max(minTrainSize, n - testWindowSize);
  
  for (let testStartIdx = testStart; testStartIdx <= n - horizon; testStartIdx++) {
    const trainSeries = series.slice(0, testStartIdx);
    const testSeries = series.slice(testStartIdx, testStartIdx + horizon);

    if (trainSeries.length < minTrainSize) continue;

    const { forecast } = modelFn(trainSeries, horizon, bounds);

    // Compute errors
    for (let i = 0; i < Math.min(forecast.length, testSeries.length); i++) {
      const error = Math.abs(forecast[i] - testSeries[i]);
      errors.push(error);
    }
  }

  if (errors.length === 0) {
    return Infinity;
  }

  // Return MAE
  return errors.reduce((a, b) => a + b, 0) / errors.length;
}

/**
 * Main forecasting function
 */
export function forecastTrendIndex(
  series: number[],
  options: ForecastOptions = {}
): ForecastOutput {
  const {
    clampBounds = [0, 100],
    horizon = 10, // Default 8-12, using 10 as middle
  } = options;

  const n = series.length;

  // Reliability gating: check if we should forecast
  if (n < 24) {
    // Fall back to naive with low reliability
    const { forecast, residuals } = naiveMethod(series, horizon, clampBounds);
    const residualStd = residuals.length > 0
      ? Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length)
      : 5;

    return {
      forecast,
      lower: forecast.map(f => Math.max(clampBounds[0], f - 10)),
      upper: forecast.map(f => Math.min(clampBounds[1], f + 10)),
      modelUsed: 'naive',
      diagnostics: {
        backtestError: Infinity,
        residualStd,
      },
    };
  }

  // Model selection via backtesting
  const holtError = rollingOriginBacktest(series, holtDamped, 12, 4, 12);
  const thetaError = rollingOriginBacktest(series, thetaMethod, 12, 4, 12);
  const naiveError = rollingOriginBacktest(series, naiveMethod, 12, 4, 12);

  // Select model with lowest error
  let selectedModel: 'holt_damped' | 'theta' | 'naive';
  let modelFn: (s: number[], h: number, bounds: [number, number]) => { forecast: number[]; residuals: number[] };

  if (holtError <= thetaError && holtError <= naiveError) {
    selectedModel = 'holt_damped';
    modelFn = holtDamped;
  } else if (thetaError <= naiveError) {
    selectedModel = 'theta';
    modelFn = thetaMethod;
  } else {
    selectedModel = 'naive';
    modelFn = naiveMethod;
  }

  // Generate forecast with selected model
  const { forecast, residuals } = modelFn(series, horizon, clampBounds);

  // Compute bootstrap intervals
  const { lower, upper } = bootstrapIntervals(series, horizon, modelFn, clampBounds);

  // Compute diagnostics
  const residualStd = residuals.length > 0
    ? Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length)
    : 5;

  const backtestError = selectedModel === 'holt_damped' ? holtError
    : selectedModel === 'theta' ? thetaError
    : naiveError;

  return {
    forecast,
    lower,
    upper,
    modelUsed: selectedModel,
    diagnostics: {
      backtestError,
      residualStd,
    },
  };
}

