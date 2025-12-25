# Deterministic Insight Generation Implementation

## ✅ Implementation Complete

Stage A (Signals), Stage B (Interpretations), and Stage C (Decision Guidance) have been implemented with deterministic, rule-based logic.

## 📁 Files Created

### Core Implementation
1. **`lib/insights/generateSignals.ts`** - Stage A: Signal Generation
   - Analyzes time series, scores, anomalies, peaks, and forecasts
   - Generates Signals matching contracts
   - Pure, deterministic function

2. **`lib/insights/generateInterpretations.ts`** - Stage B: Interpretation Generation
   - Takes Signals as input
   - Uses strict rule-based logic
   - Generates Interpretations with explicit reasons
   - Includes classification rules

3. **`lib/insights/generateDecisionGuidance.ts`** - Stage C: Decision Guidance Generation
   - Takes Signals and Interpretations as input
   - Generates role-specific recommendations (Marketer, Founder)
   - Uses deterministic templates
   - Bounded language (no financial advice, clear wording)

4. **`lib/insights/generate/index.ts`** - Export file

5. **`lib/insights/__tests__/generateSignals.test.ts`** - Signal generation tests
6. **`lib/insights/__tests__/generateInterpretations.test.ts`** - Interpretation generation tests
7. **`lib/insights/__tests__/generateDecisionGuidance.test.ts`** - Decision guidance tests

## ✨ Features Implemented

### Stage A: Signal Generation

**Input:**
- `termA`, `termB`
- `timeframe`
- Time series points (A and B)
- TrendArc scores (overall + breakdown)
- Anomalies + peaks info (optional)
- Forecast summary (optional)

**Output:** Array of `Signal` objects matching contracts

**Signal Types Detected:**
1. **Momentum Shift** - Significant trend direction changes
2. **Volatility Spike** - High variance/volatility
3. **Correlation Change** - Changing relationship between terms
4. **Competitor Crossover** - One term overtaking another
5. **Seasonal Pattern** - Recurring seasonal trends
6. **Anomaly Detected** - Unusual spikes/drops
7. **Volume Surge** - Forecasted growth surges

### Stage B: Interpretation Generation

**Input:** Signals array

**Output:** Array of `Interpretation` objects with explicit reasons

**Interpretation Categories:**
1. **Trend Analysis** - Overall trend patterns
2. **Competitive Dynamics** - Market competition insights
3. **Market Positioning** - Relative positioning
4. **Growth Pattern** - Growth trajectory analysis
5. **Decline Pattern** - Decline trajectory analysis
6. **Stability Analysis** - Volatility and stability

## 🎯 Classification Rules

### Series Classification
- **Stable**: Low volatility, consistent patterns
- **Seasonal**: Recurring seasonal patterns detected
- **EventDriven**: Anomalies without high volatility
- **Noisy**: High volatility, unpredictable
- **RegimeShift**: Significant momentum shift + correlation change

### Sustainability Classification
- **Sustainable**: Strong momentum + rising trend
- **Unsustainable**: Strong momentum + falling trend
- **Uncertain**: Moderate momentum or stable

### Leader Change Risk
- **Low**: Large margin (>15 points), no crossovers
- **Medium**: Moderate margin (10-15 points) or momentum divergence
- **High**: Small margin (<10 points) or crossover detected

### Confidence Labeling
- Based on signal confidence scores
- Adjusted by margin/strength of pattern
- Ranges from 50-95

## 📊 Signal Detection Logic

### Momentum Shift
- Calculates percentage change over recent vs older period
- Threshold: >15% change triggers signal
- Severity based on magnitude (>30% = high, >20% = medium)

### Volatility Spike
- Uses coefficient of variation (CV = stdDev / mean)
- Threshold: CV > 0.5
- Severity: CV > 1.0 = high, >0.7 = medium

### Correlation Change
- Calculates Pearson correlation over recent vs older period
- Threshold: Change > 0.3
- Severity: Change > 0.5 = high

### Competitor Crossover
- Detects when series values cross over
- Compares recent average vs older average
- Triggers when leader changes

### Seasonal Pattern
- Uses autocorrelation at lag 12 (monthly)
- Threshold: Autocorrelation > 0.3
- Severity: > 0.6 = high

### Anomaly Detection
- Uses provided anomaly data
- Creates signal for each anomaly
- Includes anomaly type and date

### Volume Surge
- Uses forecast summary if available
- Triggers for rising forecasts with >70% confidence
- Severity based on confidence (>85% = high)

## 🔍 Interpretation Logic

### Trend Analysis
- Analyzes momentum signals
- Classifies series pattern
- Assesses sustainability
- Compares relative performance

### Competitive Dynamics
- Detects crossovers
- Monitors correlation changes
- Assesses leader change risk
- Provides competitive insights

### Market Positioning
- Compares search interest
- Compares social buzz
- Compares authority metrics
- Highlights positioning advantages

### Growth/Decline Patterns
- Momentum > 55 → Growth pattern
- Momentum < 45 → Decline pattern
- Includes pattern classification
- References related signals

### Stability Analysis
- Analyzes volatility signals
- Classifies stability level
- Provides predictability assessment

## ✅ Deterministic & Pure

Both functions are:
- **Deterministic**: Same input → same output
- **Pure**: No side effects
- **Testable**: Easy to unit test
- **Idempotent**: Can be called multiple times safely

## 🧪 Test Coverage

### generateSignals Tests
- ✅ Stable growth series
- ✅ Event-driven spike series
- ✅ Seasonal series
- ✅ Competitor crossover
- ✅ Deterministic behavior

### generateInterpretations Tests
- ✅ Stable growth series
- ✅ Event-driven spike series
- ✅ Seasonal series
- ✅ Competitive dynamics
- ✅ Market positioning
- ✅ Deterministic behavior

## 📝 Usage Example

```typescript
import { generateSignals, generateInterpretations } from '@/lib/insights/generate';

// Stage A: Generate Signals
const signals = generateSignals({
  termA: 'Taylor Swift',
  termB: 'Beyonce',
  timeframe: '12m',
  series: timeSeriesData,
  scores: {
    termA: { overall: 70, breakdown: {...}, ... },
    termB: { overall: 60, breakdown: {...}, ... },
  },
  anomalies: { termA: [...], termB: [...] },
  peaks: { termA: [...], termB: [...] },
  forecastSummary: { termA: {...}, termB: {...} },
  dataSource: 'google-trends',
  lastUpdatedAt: new Date().toISOString(),
});

// Stage B: Generate Interpretations
const interpretations = generateInterpretations({
  termA: 'Taylor Swift',
  termB: 'Beyonce',
  signals,
  scores: {
    termA: { overall: 70, breakdown: {...} },
    termB: { overall: 60, breakdown: {...} },
  },
  seriesLength: 12,
  dataSource: 'google-trends',
  lastUpdatedAt: new Date().toISOString(),
});
```

## 🎯 Classification Examples

### Stable Series
- No volatility spikes
- No seasonal patterns
- Low momentum variance
- → Classification: `Stable`

### Seasonal Series
- Seasonal pattern signal detected
- → Classification: `Seasonal`

### Event-Driven Series
- Anomaly detected
- Low volatility
- → Classification: `EventDriven`

### Noisy Series
- High volatility spike
- No seasonal pattern
- → Classification: `Noisy`

### Regime Shift
- Strong momentum shift (>30%)
- Correlation change detected
- → Classification: `RegimeShift`

## 🔗 Integration Points

Ready to integrate with:
- `lib/insights/contracts` - Type definitions
- `lib/cache` - Caching layer
- `lib/trendarc-score` - Score calculations
- `lib/peak-event-detector` - Peak detection

## 📊 Output Structure

### Signals
- Match `Signal` contract exactly
- Include `generatedAt`, `dataFreshness`, `source`
- Have unique IDs based on content hash
- Include confidence scores

### Interpretations
- Match `Interpretation` contract exactly
- Include `generatedAt`, `dataFreshness`
- Reference related signal IDs
- Include explicit evidence
- Have confidence scores

## 🎯 Stage C: Decision Guidance

### Input
- Signals array
- Interpretations array
- Scores (overall + breakdown)
- Term names

### Output
- **Marketer Guidance**: 2-3 recommendations
- **Founder Guidance**: 2-3 recommendations

### Recommendation Structure
Each recommendation includes:
- **action**: Specific action (invest_more, invest_less, maintain, monitor, pivot, scale, optimize)
- **term**: Which term it relates to (termA, termB, both)
- **recommendation**: Primary recommendation text
- **rationale**: Supporting rationale
- **priority**: 1-5 (5 = highest)
- **timeframe**: Specific timing window (e.g., "next 2-4 weeks")
- **relatedInterpretations**: IDs of supporting interpretations

### Marketer Recommendations
1. **Focus Allocation** - Based on current leader and margin
2. **Monitor Competitive Dynamics** - For crossovers and narrow margins
3. **Optimize for Volatility** - When volatility spikes detected
4. **Scale Successful Campaigns** - When strong momentum detected

### Founder Recommendations
1. **Strategic Positioning** - Based on market position and sustainability
2. **Pivot Consideration** - For regime shifts and crossovers
3. **Risk Management** - For high volatility scenarios
4. **Growth Opportunity** - When strong momentum detected

### Bounded Language
- ✅ No financial advice language (no "buy", "sell", "investment", "return", "profit", "loss")
- ✅ No speculative claims
- ✅ Clear, specific wording
- ✅ Actionable recommendations
- ✅ Explicit timeframes

## ✨ Next Steps

The deterministic insight generation is complete and ready for:
1. Integration with caching layer
2. Wiring into comparison pages
3. Export functionality
4. AI enhancement (optional Stage D - AI Insights)

---

**Status**: ✅ Complete - All three stages implemented, deterministic, pure, tested, and ready for integration

