/**
 * Impact Quantification Module
 * Measures the magnitude, duration, and characteristics of trend peaks
 */

export interface SearchVolumeData {
  date: Date;
  value: number; // Search volume or interest score (0-100)
}

export interface ImpactMetrics {
  peakMagnitude: {
    absolutePeak: number;
    baseline: number;
    percentageIncrease: number; // e.g., +340%
    multiplier: number; // e.g., 3.4x
  };
  duration: {
    totalDays: number; // Days until return to baseline
    peakDay: Date;
    returnToBaselineDay: Date;
    halfLifeDays: number; // Days to 50% reduction from peak
  };
  sustainedElevation: {
    week1Average: number; // Avg percentage above baseline
    week2Average: number;
    week3Average: number;
    week4Average: number;
  };
  velocity: {
    timeToP eak: number; // Hours from start to peak
    peakDecayRate: number; // Percentage decrease per day
    accelerationTrend: 'increasing' | 'stable' | 'decreasing'; // Compared to previous occurrences
  };
  opportunityWindow: {
    totalDays: number;
    maximumImpactWindow: { days: number; percentOfTraffic: number }; // e.g., Days 1-7 = 80%
    secondaryWindow: { days: number; percentOfTraffic: number };
    longTailWindow: { days: number; percentOfTraffic: number };
  };
  areaUnderCurve: number; // Total "excess interest" - sum of all above-baseline values
  historicalComparison: {
    vsLastYear: number; // Percentage change
    vsLastOccurrence: number;
    trend: 'growing' | 'stable' | 'declining';
  } | null;
}

/**
 * Calculate comprehensive impact metrics for a peak
 */
export async function quantifyImpact(
  peakDate: Date,
  peakValue: number,
  searchVolumeData: SearchVolumeData[],
  historicalPeaks?: SearchVolumeData[][]
): Promise<ImpactMetrics> {
  // Sort data by date
  const sortedData = [...searchVolumeData].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate baseline (30-day average before peak, excluding peak day)
  const baseline = calculateBaseline(sortedData, peakDate);

  // Calculate peak magnitude
  const peakMagnitude = {
    absolutePeak: peakValue,
    baseline: baseline,
    percentageIncrease: Math.round(((peakValue - baseline) / baseline) * 100),
    multiplier: Math.round((peakValue / baseline) * 10) / 10,
  };

  // Calculate duration metrics
  const duration = calculateDuration(sortedData, peakDate, peakValue, baseline);

  // Calculate sustained elevation (weekly averages)
  const sustainedElevation = calculateSustainedElevation(sortedData, peakDate, baseline);

  // Calculate velocity metrics
  const velocity = calculateVelocity(sortedData, peakDate, peakValue, baseline);

  // Calculate opportunity windows
  const opportunityWindow = calculateOpportunityWindow(sortedData, peakDate, baseline);

  // Calculate area under curve (total excess interest)
  const areaUnderCurve = calculateAreaUnderCurve(sortedData, baseline);

  // Compare to historical data if available
  const historicalComparison = historicalPeaks
    ? compareToHistorical(peakValue, historicalPeaks)
    : null;

  return {
    peakMagnitude,
    duration,
    sustainedElevation,
    velocity,
    opportunityWindow,
    areaUnderCurve,
    historicalComparison,
  };
}

/**
 * Calculate baseline value (average before peak)
 */
function calculateBaseline(data: SearchVolumeData[], peakDate: Date): number {
  const peakTime = peakDate.getTime();
  const thirtyDaysBefore = peakTime - 30 * 24 * 60 * 60 * 1000;

  const baselineData = data.filter(d => {
    const time = d.date.getTime();
    return time >= thirtyDaysBefore && time < peakTime;
  });

  if (baselineData.length === 0) {
    // Fallback: use median of all data
    const sortedValues = data.map(d => d.value).sort((a, b) => a - b);
    return sortedValues[Math.floor(sortedValues.length / 2)];
  }

  const sum = baselineData.reduce((acc, d) => acc + d.value, 0);
  return Math.round(sum / baselineData.length);
}

/**
 * Calculate duration metrics
 */
function calculateDuration(
  data: SearchVolumeData[],
  peakDate: Date,
  peakValue: number,
  baseline: number
): ImpactMetrics['duration'] {
  const peakTime = peakDate.getTime();

  // Find when it returns to baseline (within 10% of baseline)
  const threshold = baseline * 1.1;
  let returnToBaselineDay = peakDate;

  for (let i = 0; i < data.length; i++) {
    if (data[i].date.getTime() > peakTime && data[i].value <= threshold) {
      returnToBaselineDay = data[i].date;
      break;
    }
  }

  const totalDays = Math.round((returnToBaselineDay.getTime() - peakTime) / (24 * 60 * 60 * 1000));

  // Calculate half-life (time to 50% reduction)
  const halfValue = baseline + (peakValue - baseline) / 2;
  let halfLifeDays = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i].date.getTime() > peakTime && data[i].value <= halfValue) {
      halfLifeDays = Math.round((data[i].date.getTime() - peakTime) / (24 * 60 * 60 * 1000));
      break;
    }
  }

  return {
    totalDays,
    peakDay: peakDate,
    returnToBaselineDay,
    halfLifeDays: halfLifeDays || totalDays,
  };
}

/**
 * Calculate sustained elevation (weekly averages above baseline)
 */
function calculateSustainedElevation(
  data: SearchVolumeData[],
  peakDate: Date,
  baseline: number
): ImpactMetrics['sustainedElevation'] {
  const peakTime = peakDate.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  const calculateWeekAverage = (weekNumber: number): number => {
    const weekStart = peakTime + (weekNumber - 1) * 7 * oneDay;
    const weekEnd = peakTime + weekNumber * 7 * oneDay;

    const weekData = data.filter(d => {
      const time = d.date.getTime();
      return time >= weekStart && time < weekEnd;
    });

    if (weekData.length === 0) return 0;

    const avgValue = weekData.reduce((sum, d) => sum + d.value, 0) / weekData.length;
    return Math.round(((avgValue - baseline) / baseline) * 100);
  };

  return {
    week1Average: calculateWeekAverage(1),
    week2Average: calculateWeekAverage(2),
    week3Average: calculateWeekAverage(3),
    week4Average: calculateWeekAverage(4),
  };
}

/**
 * Calculate velocity metrics (how fast it rises/falls)
 */
function calculateVelocity(
  data: SearchVolumeData[],
  peakDate: Date,
  peakValue: number,
  baseline: number
): ImpactMetrics['velocity'] {
  const peakTime = peakDate.getTime();
  const oneHour = 60 * 60 * 1000;

  // Find time to peak (from when it started rising)
  const riseThreshold = baseline * 1.2; // 20% above baseline = start of rise
  let riseStartTime = peakTime;

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].date.getTime() < peakTime && data[i].value < riseThreshold) {
      riseStartTime = data[i].date.getTime();
      break;
    }
  }

  const timeTopeakHours = Math.round((peakTime - riseStartTime) / oneHour);

  // Calculate decay rate (first 7 days after peak)
  const sevenDaysAfter = peakTime + 7 * 24 * oneHour;
  const decayData = data.filter(d => {
    const time = d.date.getTime();
    return time > peakTime && time <= sevenDaysAfter;
  });

  let peakDecayRate = 0;
  if (decayData.length > 0) {
    const endValue = decayData[decayData.length - 1].value;
    const totalDecay = peakValue - endValue;
    const days = decayData.length;
    peakDecayRate = Math.round((totalDecay / peakValue / days) * 100);
  }

  return {
    timeTopeakHours,
    peakDecayRate,
    accelerationTrend: 'stable', // Would need historical data to determine
  };
}

/**
 * Calculate opportunity windows
 */
function calculateOpportunityWindow(
  data: SearchVolumeData[],
  peakDate: Date,
  baseline: number
): ImpactMetrics['opportunityWindow'] {
  const peakTime = peakDate.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  // Calculate total excess interest by day
  const dailyExcess: number[] = [];
  let currentDay = peakTime;

  while (currentDay <= peakTime + 60 * oneDay) {
    const dayEnd = currentDay + oneDay;
    const dayData = data.filter(d => {
      const time = d.date.getTime();
      return time >= currentDay && time < dayEnd;
    });

    if (dayData.length > 0) {
      const avgValue = dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length;
      const excess = Math.max(0, avgValue - baseline);
      dailyExcess.push(excess);
    } else {
      dailyExcess.push(0);
    }

    currentDay += oneDay;
  }

  // Calculate cumulative percentages
  const totalExcess = dailyExcess.reduce((sum, val) => sum + val, 0);
  let cumulative = 0;
  let maxImpactEnd = 7;
  let secondaryEnd = 14;

  for (let i = 0; i < dailyExcess.length; i++) {
    cumulative += dailyExcess[i];
    const percentage = (cumulative / totalExcess) * 100;

    if (percentage >= 80 && maxImpactEnd === 7) {
      maxImpactEnd = i + 1;
    }
    if (percentage >= 95 && secondaryEnd === 14) {
      secondaryEnd = i + 1;
    }
  }

  // Find when it returns to baseline
  let totalDays = 21; // Default
  for (let i = 0; i < dailyExcess.length; i++) {
    if (dailyExcess[i] < baseline * 0.1) {
      totalDays = i;
      break;
    }
  }

  return {
    totalDays,
    maximumImpactWindow: { days: maxImpactEnd, percentOfTraffic: 80 },
    secondaryWindow: { days: secondaryEnd - maxImpactEnd, percentOfTraffic: 15 },
    longTailWindow: { days: totalDays - secondaryEnd, percentOfTraffic: 5 },
  };
}

/**
 * Calculate area under curve (total excess interest)
 */
function calculateAreaUnderCurve(data: SearchVolumeData[], baseline: number): number {
  return data.reduce((sum, point) => {
    const excess = Math.max(0, point.value - baseline);
    return sum + excess;
  }, 0);
}

/**
 * Compare to historical peaks
 */
function compareToHistorical(
  currentPeak: number,
  historicalPeaks: SearchVolumeData[][]
): ImpactMetrics['historicalComparison'] {
  if (historicalPeaks.length === 0) return null;

  // Get peak values from historical data
  const historicalValues = historicalPeaks.map(dataset => Math.max(...dataset.map(d => d.value)));

  const lastOccurrence = historicalValues[historicalValues.length - 1];
  const vsLastOccurrence = Math.round(((currentPeak - lastOccurrence) / lastOccurrence) * 100);

  // Find last year's peak (if available)
  let vsLastYear = 0;
  if (historicalValues.length >= 2) {
    const lastYearValue = historicalValues[historicalValues.length - 2];
    vsLastYear = Math.round(((currentPeak - lastYearValue) / lastYearValue) * 100);
  }

  // Determine trend
  let trend: 'growing' | 'stable' | 'declining' = 'stable';
  if (vsLastOccurrence > 10) trend = 'growing';
  else if (vsLastOccurrence < -10) trend = 'declining';

  return {
    vsLastYear,
    vsLastOccurrence,
    trend,
  };
}

/**
 * Format impact metrics for display
 */
export function formatImpactMetrics(metrics: ImpactMetrics): string {
  return `
📈 IMPACT QUANTIFICATION

Search Volume Spike:
→ Day 1: +${metrics.peakMagnitude.percentageIncrease}% above baseline (${metrics.peakMagnitude.multiplier}x)
→ Week 1: +${metrics.sustainedElevation.week1Average}% sustained elevation
→ Week 2: +${metrics.sustainedElevation.week2Average}% declining
→ Day ${metrics.duration.totalDays}: Returns to baseline

Peak Characteristics:
→ Time to peak: ${metrics.velocity.timeTopeakHours} hours
→ Duration: ${metrics.duration.totalDays} days
→ Half-life: ${metrics.duration.halfLifeDays} days (50% reduction)
→ Decay rate: ${metrics.velocity.peakDecayRate}% per day

💰 Opportunity Window: ${metrics.opportunityWindow.totalDays} days
→ Maximum impact: Days 1-${metrics.opportunityWindow.maximumImpactWindow.days} (${metrics.opportunityWindow.maximumImpactWindow.percentOfTraffic}% of total traffic)
→ Secondary window: Days ${metrics.opportunityWindow.maximumImpactWindow.days + 1}-${metrics.opportunityWindow.maximumImpactWindow.days + metrics.opportunityWindow.secondaryWindow.days} (${metrics.opportunityWindow.secondaryWindow.percentOfTraffic}% of traffic)
→ Long-tail: Days ${metrics.opportunityWindow.maximumImpactWindow.days + metrics.opportunityWindow.secondaryWindow.days + 1}-${metrics.opportunityWindow.totalDays} (${metrics.opportunityWindow.longTailWindow.percentOfTraffic}% of traffic)

${
  metrics.historicalComparison
    ? `Historical Comparison:
→ vs. Last occurrence: ${metrics.historicalComparison.vsLastOccurrence > 0 ? '+' : ''}${metrics.historicalComparison.vsLastOccurrence}%
→ vs. Last year: ${metrics.historicalComparison.vsLastYear > 0 ? '+' : ''}${metrics.historicalComparison.vsLastYear}%
→ Trend: ${metrics.historicalComparison.trend.toUpperCase()}`
    : ''
}
`.trim();
}
