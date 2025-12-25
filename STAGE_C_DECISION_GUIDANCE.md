# Stage C: Decision Guidance Implementation

## ✅ Implementation Complete

Stage C generates role-specific decision guidance using deterministic templates with bounded language.

## 📋 Overview

**Input**: Signals + Interpretations  
**Output**: DecisionGuidance arrays for Marketer and Founder roles  
**Method**: Deterministic, template-based, rule-driven

## 🎯 Key Features

### Role-Specific Guidance
- **Marketer**: 2-3 tactical recommendations
- **Founder**: 2-3 strategic recommendations

### Recommendation Structure
Each recommendation includes:
- **action**: Specific action type (invest_more, invest_less, maintain, monitor, pivot, scale, optimize)
- **term**: Which term it relates to (termA, termB, both)
- **recommendation**: Primary recommendation text (50-500 chars)
- **rationale**: Supporting rationale (50+ chars)
- **priority**: 1-5 (5 = highest priority)
- **timeframe**: Specific timing window (e.g., "next 2-4 weeks", "next 4-8 weeks", "ongoing")
- **relatedInterpretations**: IDs of supporting interpretations

## 📊 Marketer Recommendations

### 1. Focus Allocation
**Trigger**: Margin >= 10 points  
**Action**: `invest_more` or `maintain`  
**Timeframe**: "next 2-4 weeks"  
**Logic**: Focus on winner if rising momentum, maintain if stable

### 2. Monitor Competitive Dynamics
**Trigger**: Crossover detected OR margin < 15 points  
**Action**: `monitor`  
**Timeframe**: "next 1-2 weeks"  
**Risk Level**: High if crossover, Medium if narrow margin  
**Logic**: Early warning system for competitive shifts

### 3. Optimize for Volatility
**Trigger**: Volatility spikes detected  
**Action**: `optimize`  
**Timeframe**: "next 3-4 weeks"  
**Logic**: A/B testing and flexible messaging for volatile markets

### 4. Scale Successful Campaigns
**Trigger**: Strong momentum (>25% change)  
**Action**: `scale`  
**Timeframe**: "next 2-3 weeks"  
**Logic**: Capitalize on positive momentum periods

## 🏢 Founder Recommendations

### 1. Strategic Positioning
**Trigger**: Margin >= 15 points  
**Action**: `invest_more` or `maintain`  
**Timeframe**: "next 4-8 weeks"  
**Logic**: Strategic initiatives based on market position and sustainability

### 2. Pivot Consideration
**Trigger**: Regime shift signals OR (crossover + margin < 10)  
**Action**: `pivot`  
**Timeframe**: "next 2-6 weeks"  
**Risk Level**: High for regime shift, Medium for crossover  
**Logic**: Strategic response to fundamental market changes

### 3. Risk Management
**Trigger**: Volatility spikes detected  
**Action**: `monitor`  
**Timeframe**: "next 4-12 weeks"  
**Risk Level**: High if multiple volatility signals, Medium otherwise  
**Logic**: Maintain flexibility and robust risk management

### 4. Growth Opportunity
**Trigger**: Strong upward momentum (>25% change)  
**Action**: `scale`  
**Timeframe**: "next 4-8 weeks"  
**Logic**: Scale operations to capture market share during growth periods

## 🚫 Bounded Language

### Prohibited Terms
- ❌ Financial advice: "buy", "sell", "investment", "return", "profit", "loss", "revenue", "earnings"
- ❌ Speculative claims: "will definitely", "guaranteed", "certain to"
- ❌ Vague language: "maybe", "possibly", "might"

### Required Elements
- ✅ Clear, specific actions
- ✅ Explicit timeframes
- ✅ Data-driven rationale
- ✅ Risk level indicators (via priority)
- ✅ Actionable recommendations

## 📈 Scenario Examples

### Stable Winner Scenario
**Input**: Large margin (25 points), stable momentum  
**Marketer Guidance**:
1. Focus on winner (invest_more, priority 4)
2. Monitor competitive dynamics (monitor, priority 2)

**Founder Guidance**:
1. Strategic positioning (invest_more, priority 5)
2. Maintain strategic direction (maintain, priority 2)

### Volatile Hype Scenario
**Input**: High volatility spikes, moderate scores  
**Marketer Guidance**:
1. Optimize for volatility (optimize, priority 3)
2. Monitor market conditions (monitor, priority 3)

**Founder Guidance**:
1. Risk management (monitor, priority 5)
2. Maintain flexibility (monitor, priority 4)

### Regime Shift Scenario
**Input**: Momentum divergence + correlation change + crossover  
**Marketer Guidance**:
1. Monitor competitive dynamics (monitor, priority 5)
2. Optimize approach (optimize, priority 3)

**Founder Guidance**:
1. Pivot consideration (pivot, priority 5)
2. Risk management (monitor, priority 4)

## ✅ Test Coverage

### Test Scenarios
- ✅ Stable winner scenario
- ✅ Volatile hype scenario
- ✅ Regime shift scenario
- ✅ Bounded language verification
- ✅ Role-specific guidance differentiation
- ✅ Deterministic behavior

### Test Assertions
- All recommendations have valid actions
- All recommendations have timeframes
- All recommendations have rationale
- No prohibited language
- Priority levels are appropriate (1-5)
- At least 2 recommendations per role
- Maximum 3 recommendations per role

## 🔗 Integration

Ready to integrate with:
- `lib/insights/generateSignals` - Stage A
- `lib/insights/generateInterpretations` - Stage B
- `lib/insights/contracts/decision-guidance` - Type definitions
- `lib/cache` - Caching layer

## 📝 Usage

```typescript
import { generateDecisionGuidance } from '@/lib/insights/generate';

const { marketer, founder } = generateDecisionGuidance({
  termA: 'Product A',
  termB: 'Product B',
  signals: [...],
  interpretations: [...],
  scores: {
    termA: { overall: 70, breakdown: { momentum: 65 } },
    termB: { overall: 50, breakdown: { momentum: 50 } },
  },
  dataSource: 'google-trends',
  lastUpdatedAt: new Date().toISOString(),
});
```

---

**Status**: ✅ Complete - Deterministic, bounded, tested, and ready for integration

