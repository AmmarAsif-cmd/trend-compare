# Forecasting System Documentation

## Overview

The TrendArc forecasting system provides short-horizon time-series forecasts (default 4 weeks, optionally 8 weeks) using classical statistical methods. All forecasts include prediction intervals and confidence scores based on historical backtesting performance.

## Methodology

### Models

The system uses two primary forecasting models:

1. **ETS (Error, Trend, Seasonality) / Holt-Winters**
   - Triple exponential smoothing
   - Automatic seasonality detection (weekly patterns for daily data)
   - Parameter optimization via grid search
   - Suitable for data with trends and seasonality

2. **ARIMA (AutoRegressive Integrated Moving Average)**
   - ARIMA(p,d,q) with automatic differencing (d=1)
   - Autoregressive order p=1 or p=2 (based on data length)
   - Method of moments for parameter estimation
   - Suitable for stationary or near-stationary series

### Model Selection

Models are selected automatically via **walk-forward backtesting**:

1. Split historical data into training and validation windows
2. Train each model on training data
3. Evaluate on validation data using MAE (Mean Absolute Error) and MAPE (Mean Absolute Percentage Error)
4. Select the model with lower MAE
5. Aggregate metrics across all validation windows

### Prediction Intervals

All forecasts include:
- **80% prediction interval**: Expected to contain 80% of actual values
- **95% prediction interval**: Expected to contain 95% of actual values

Intervals are calculated based on:
- Residual standard error from model fitting
- Uncertainty growth with forecast horizon
- t-distribution approximations (t80=1.28, t95=1.96)

### Confidence Score

The confidence score (0-100) is calculated from:

1. **Error Metrics (40% weight)**
   - Lower MAE and MAPE → higher score
   - Normalized to 0-100 scale

2. **Interval Coverage (30% weight)**
   - How well actual intervals match expected coverage
   - 80% interval should cover ~80% of actuals
   - 95% interval should cover ~95% of actuals

3. **Sample Size (30% weight)**
   - More backtest windows → more reliable
   - Full score at 20+ samples

**Quality Penalties:**
- Series too short (< 14 points): 50% reduction
- Too spiky (high volatility): 30% reduction
- Event shocks likely: 20% reduction

## Head-to-Head Analytics

For comparisons between two terms, the system computes:

### Winner Probability
- Probability that termB > termA over the forecast horizon
- Calculated via Monte Carlo simulation (1000 samples)
- Samples from forecast distributions using prediction intervals

### Expected Margin
- Average (termB - termA) over forecast horizon
- Positive = termB leading, Negative = termA leading

### Lead Change Risk
Risk levels: `low` | `medium` | `high`

Determined by:
- Current margin (small margin = higher risk)
- Crossover probability (how often forecasts cross)
- Confidence scores (low confidence = higher risk)

**Risk Classification:**
- **High**: Margin < 10%, crossover > 30%, or confidence < 50
- **Medium**: Margin < 20%, crossover > 15%, or confidence < 70
- **Low**: Otherwise

## Data Quality Gating

The system applies quality checks:

### Series Too Short
- **Threshold**: < 14 data points
- **Action**: Return naive forecast, confidence = 0
- **Flag**: `seriesTooShort = true`

### Too Spiky
- **Threshold**: Coefficient of variation > 1.5
- **Action**: Reduce confidence by 30%, mark as experimental
- **Flag**: `tooSpiky = true`

### Event Shock Likely
- **Threshold**: > 10% of points have > 50% change
- **Action**: Reduce confidence by 20%, warn user
- **Flag**: `eventShockLikely = true`

## Caching and Performance

### Database Cache
Forecasts are cached in the database:
- **ForecastRun**: Stores model selection, metrics, confidence scores
- **ForecastPoint**: Stores individual forecast points with intervals
- **Cache Key**: `comparisonId + timeframe + horizon + dataHash`
- **TTL**: 24 hours (recomputed if older)

### Idempotency
- Unique constraints prevent duplicate forecasts
- Concurrent requests are safe (upsert pattern)
- Forecast points are deleted and recreated on update

## Evaluation and Trust Building

### Evaluation Cron Job
Runs daily via `/api/cron/evaluate-forecasts`:

1. Finds forecast runs older than horizon end date
2. Fetches actual observed values for forecast period
3. Calculates evaluation metrics:
   - Winner correctness (predicted vs actual)
   - Direction correctness per term
   - Interval hit rates (80% and 95%)
   - MAE and MAPE for forecast horizon
4. Creates `ForecastEvaluation` records
5. Updates trust statistics

### Trust Statistics
Aggregated metrics stored in `ForecastTrustStats`:
- **Total Evaluated**: Number of forecasts evaluated
- **Winner Accuracy**: % of correct winner predictions
- **Interval Coverage**: Average % of actuals within intervals
- **Last 90 Days Accuracy**: Recent performance metric
- **Sample Size**: Number of evaluated forecasts

## API Integration

### Premium Endpoint
`GET /api/comparison/premium?slug=...&tf=...&geo=...`

Returns `forecastPack` in response:
```json
{
  "forecastPack": {
    "termA": { /* ForecastResult */ },
    "termB": { /* ForecastResult */ },
    "headToHead": { /* HeadToHeadForecast */ },
    "computedAt": "2024-01-01T00:00:00Z",
    "horizon": 28
  }
}
```

### Trust Stats Endpoint
`GET /api/forecast/trust-stats`

Returns aggregated trust statistics:
```json
{
  "totalEvaluated": 100,
  "winnerAccuracyPercent": 75.5,
  "intervalCoveragePercent": 82.3,
  "last90DaysAccuracy": 78.2,
  "sampleSize": 100
}
```

## UI Components

### ForecastSection
Displays:
- Forecast chart with historical + forecast data
- Confidence bands (80% and 95% intervals)
- Winner probability, expected margin, lead change risk
- Confidence score with explanation
- Trust statistics (if available)
- Model information and backtest metrics
- Disclosure text for low confidence/experimental forecasts

## Limitations and Disclaimers

1. **Short Horizon Only**: Default 4 weeks, max 8 weeks
   - Longer horizons have exponentially higher uncertainty
   - Sudden events can invalidate forecasts

2. **No External Factors**: Models only use historical patterns
   - News events, product launches, etc. not considered
   - User should interpret in context

3. **Data Quality Dependent**: Poor data → poor forecasts
   - Short series, high volatility, event shocks reduce reliability
   - System marks these as "experimental"

4. **Classical Methods Only**: No ML/AI models
   - ETS and ARIMA are interpretable and defensible
   - LSTM/transformers not used (as per requirements)

## Future Enhancements

Potential improvements:
- Ensemble methods (combine ETS + ARIMA)
- External regressors (news sentiment, events)
- Longer horizons with uncertainty scaling
- Category-specific model tuning
- Real-time model retraining

## References

- Hyndman, R.J., & Athanasopoulos, G. (2021). *Forecasting: principles and practice*
- Box, G.E.P., Jenkins, G.M., & Reinsel, G.C. (2015). *Time Series Analysis: Forecasting and Control*
- Holt, C.C. (2004). "Forecasting seasonals and trends by exponentially weighted moving averages"


