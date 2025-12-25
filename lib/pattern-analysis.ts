/**
 * Pattern Analysis Module
 * Identifies recurring patterns in historical peak data
 */

export interface HistoricalPeak {
  keyword: string;
  date: Date;
  magnitude: number;
  value: number;
}

export interface PatternAnalysis {
  patternType: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'event-driven' | 'none';
  confidence: number; // 0-100
  frequency: string; // "Every September", "Every Q2", etc.
  historicalOccurrences: Date[];
  nextPredicted: {
    date: Date;
    dateRange: { start: Date; end: Date };
    confidence: number;
  } | null;
  patternStrength: number; // 0-100, how consistent the pattern is
  description: string;
}

/**
 * Analyze historical peaks for patterns
 */
export async function analyzePattern(
  keyword: string,
  currentPeakDate: Date,
  historicalPeaks: HistoricalPeak[]
): Promise<PatternAnalysis> {
  // Filter historical peaks for same keyword
  const relevantPeaks = historicalPeaks
    .filter(p => p.keyword.toLowerCase() === keyword.toLowerCase())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (relevantPeaks.length < 2) {
    return {
      patternType: 'none',
      confidence: 0,
      frequency: 'Insufficient data',
      historicalOccurrences: [],
      nextPredicted: null,
      patternStrength: 0,
      description: 'Not enough historical data to identify patterns (minimum 2 data points required).',
    };
  }

  // Check for annual patterns
  const annualPattern = detectAnnualPattern(relevantPeaks);
  if (annualPattern.detected) {
    return annualPattern.analysis;
  }

  // Check for quarterly patterns
  const quarterlyPattern = detectQuarterlyPattern(relevantPeaks);
  if (quarterlyPattern.detected) {
    return quarterlyPattern.analysis;
  }

  // Check for monthly patterns
  const monthlyPattern = detectMonthlyPattern(relevantPeaks);
  if (monthlyPattern.detected) {
    return monthlyPattern.analysis;
  }

  // Check for weekly patterns
  const weeklyPattern = detectWeeklyPattern(relevantPeaks);
  if (weeklyPattern.detected) {
    return weeklyPattern.analysis;
  }

  // If no clear pattern, analyze as event-driven
  return analyzeEventDriven(relevantPeaks);
}

/**
 * Detect annual patterns (same month each year)
 */
function detectAnnualPattern(peaks: HistoricalPeak[]): { detected: boolean; analysis: PatternAnalysis } {
  // Group peaks by month
  const monthCounts: { [month: number]: Date[] } = {};

  peaks.forEach(peak => {
    const month = peak.date.getMonth();
    if (!monthCounts[month]) {
      monthCounts[month] = [];
    }
    monthCounts[month].push(peak.date);
  });

  // Find the most common month
  let maxMonth = -1;
  let maxCount = 0;

  Object.entries(monthCounts).forEach(([month, dates]) => {
    if (dates.length > maxCount) {
      maxCount = dates.length;
      maxMonth = parseInt(month);
    }
  });

  // Consider it an annual pattern if >= 60% of peaks occur in the same month
  const consistency = (maxCount / peaks.length) * 100;

  if (consistency >= 60 && maxCount >= 2) {
    const monthDates = monthCounts[maxMonth];
    const monthName = new Date(2000, maxMonth, 1).toLocaleString('default', { month: 'long' });

    // Calculate typical day range within month
    const days = monthDates.map(d => d.getDate());
    const avgDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    const dayVariance = Math.max(...days) - Math.min(...days);

    // Predict next occurrence
    const now = new Date();
    const nextYear = now.getFullYear() + (now.getMonth() > maxMonth ? 1 : 0);
    const predictedDate = new Date(nextYear, maxMonth, avgDay);
    const rangeStart = new Date(nextYear, maxMonth, Math.max(1, avgDay - Math.ceil(dayVariance / 2)));
    const rangeEnd = new Date(nextYear, maxMonth, Math.min(31, avgDay + Math.ceil(dayVariance / 2)));

    return {
      detected: true,
      analysis: {
        patternType: 'annual',
        confidence: Math.round(consistency),
        frequency: `Every ${monthName}`,
        historicalOccurrences: monthDates,
        nextPredicted: {
          date: predictedDate,
          dateRange: { start: rangeStart, end: rangeEnd },
          confidence: Math.round(consistency),
        },
        patternStrength: Math.round(consistency),
        description: `This keyword peaks every ${monthName} with ${consistency.toFixed(0)}% consistency over ${peaks.length} occurrences. Historical dates: ${monthDates.map(d => d.toLocaleDateString()).join(', ')}.`,
      },
    };
  }

  return { detected: false, analysis: null as any };
}

/**
 * Detect quarterly patterns (earnings, reports)
 */
function detectQuarterlyPattern(peaks: HistoricalPeak[]): { detected: boolean; analysis: PatternAnalysis } {
  // Group peaks by quarter and approximate week
  const quarters: { [key: string]: Date[] } = {};

  peaks.forEach(peak => {
    const quarter = Math.floor(peak.date.getMonth() / 3);
    const weekOfQuarter = Math.floor((peak.date.getMonth() % 3) * 4 + peak.date.getDate() / 7);
    const key = `Q${quarter + 1}-W${weekOfQuarter}`;

    if (!quarters[key]) {
      quarters[key] = [];
    }
    quarters[key].push(peak.date);
  });

  // Find most common quarter-week combination
  let maxKey = '';
  let maxCount = 0;

  Object.entries(quarters).forEach(([key, dates]) => {
    if (dates.length > maxCount) {
      maxCount = dates.length;
      maxKey = key;
    }
  });

  // Consider it quarterly if >= 50% occur in same quarter-week
  const consistency = (maxCount / peaks.length) * 100;

  if (consistency >= 50 && maxCount >= 3) {
    const quarterDates = quarters[maxKey];

    // Calculate next quarter occurrence
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const targetQuarter = parseInt(maxKey.split('-')[0].substring(1)) - 1;

    let nextYear = now.getFullYear();
    let nextQuarter = targetQuarter;

    if (currentQuarter >= targetQuarter) {
      nextYear += 1;
    }

    // Approximate date within quarter based on historical average
    const avgMonth = Math.round(quarterDates.reduce((sum, d) => sum + d.getMonth(), 0) / quarterDates.length);
    const avgDay = Math.round(quarterDates.reduce((sum, d) => sum + d.getDate(), 0) / quarterDates.length);

    const predictedDate = new Date(nextYear, avgMonth, avgDay);
    const rangeStart = new Date(nextYear, nextQuarter * 3, 1);
    const rangeEnd = new Date(nextYear, nextQuarter * 3 + 3, 0);

    return {
      detected: true,
      analysis: {
        patternType: 'quarterly',
        confidence: Math.round(consistency),
        frequency: `Every Q${targetQuarter + 1}`,
        historicalOccurrences: quarterDates,
        nextPredicted: {
          date: predictedDate,
          dateRange: { start: rangeStart, end: rangeEnd },
          confidence: Math.round(consistency),
        },
        patternStrength: Math.round(consistency),
        description: `This keyword peaks quarterly in Q${targetQuarter + 1} with ${consistency.toFixed(0)}% consistency. This suggests earnings reports, quarterly announcements, or seasonal business cycles.`,
      },
    };
  }

  return { detected: false, analysis: null as any };
}

/**
 * Detect monthly patterns (specific day of month)
 */
function detectMonthlyPattern(peaks: HistoricalPeak[]): { detected: boolean; analysis: PatternAnalysis } {
  // Group peaks by day of month (e.g., all on the 15th, or last day of month)
  const dayCounts: { [day: string]: Date[] } = {};

  peaks.forEach(peak => {
    const day = peak.date.getDate();
    const isEndOfMonth = day >= 28; // Consider 28-31 as "end of month"
    const key = isEndOfMonth ? 'end' : day.toString();

    if (!dayCounts[key]) {
      dayCounts[key] = [];
    }
    dayCounts[key].push(peak.date);
  });

  // Find most common day
  let maxKey = '';
  let maxCount = 0;

  Object.entries(dayCounts).forEach(([key, dates]) => {
    if (dates.length > maxCount) {
      maxCount = dates.length;
      maxKey = key;
    }
  });

  // Consider it monthly if >= 60% occur on same day
  const consistency = (maxCount / peaks.length) * 100;

  if (consistency >= 60 && maxCount >= 3) {
    const dayDates = dayCounts[maxKey];
    const dayDescription = maxKey === 'end' ? 'end of month' : `day ${maxKey}`;

    // Predict next occurrence
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, maxKey === 'end' ? 0 : parseInt(maxKey));

    return {
      detected: true,
      analysis: {
        patternType: 'monthly',
        confidence: Math.round(consistency),
        frequency: `Monthly (${dayDescription})`,
        historicalOccurrences: dayDates,
        nextPredicted: {
          date: nextMonth,
          dateRange: { start: nextMonth, end: nextMonth },
          confidence: Math.round(consistency),
        },
        patternStrength: Math.round(consistency),
        description: `This keyword peaks monthly on the ${dayDescription} with ${consistency.toFixed(0)}% consistency. This suggests regular monthly reports, subscription cycles, or recurring events.`,
      },
    };
  }

  return { detected: false, analysis: null as any };
}

/**
 * Detect weekly patterns (specific day of week)
 */
function detectWeeklyPattern(peaks: HistoricalPeak[]): { detected: boolean; analysis: PatternAnalysis } {
  // Group peaks by day of week
  const dayOfWeekCounts: { [day: number]: Date[] } = {};

  peaks.forEach(peak => {
    const dayOfWeek = peak.date.getDay();
    if (!dayOfWeekCounts[dayOfWeek]) {
      dayOfWeekCounts[dayOfWeek] = [];
    }
    dayOfWeekCounts[dayOfWeek].push(peak.date);
  });

  // Find most common day of week
  let maxDay = -1;
  let maxCount = 0;

  Object.entries(dayOfWeekCounts).forEach(([day, dates]) => {
    if (dates.length > maxCount) {
      maxCount = dates.length;
      maxDay = parseInt(day);
    }
  });

  // Consider it weekly if >= 70% occur on same day of week
  const consistency = (maxCount / peaks.length) * 100;

  if (consistency >= 70 && maxCount >= 4) {
    const dayDates = dayOfWeekCounts[maxDay];
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][maxDay];

    // Predict next occurrence
    const now = new Date();
    const daysUntilNext = (maxDay - now.getDay() + 7) % 7 || 7;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilNext);

    return {
      detected: true,
      analysis: {
        patternType: 'weekly',
        confidence: Math.round(consistency),
        frequency: `Every ${dayName}`,
        historicalOccurrences: dayDates,
        nextPredicted: {
          date: nextDate,
          dateRange: { start: nextDate, end: nextDate },
          confidence: Math.round(consistency),
        },
        patternStrength: Math.round(consistency),
        description: `This keyword peaks every ${dayName} with ${consistency.toFixed(0)}% consistency. This suggests weekly content releases, recurring events, or day-of-week effects.`,
      },
    };
  }

  return { detected: false, analysis: null as any };
}

/**
 * Analyze event-driven (irregular) patterns
 */
function analyzeEventDriven(peaks: HistoricalPeak[]): PatternAnalysis {
  // Calculate average time between peaks
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const days = (peaks[i].date.getTime() - peaks[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const stdDev = Math.sqrt(
    intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length
  );

  // High standard deviation = irregular pattern
  const irregularity = (stdDev / avgInterval) * 100;

  return {
    patternType: 'event-driven',
    confidence: 40, // Lower confidence for irregular patterns
    frequency: `Irregular (avg ${Math.round(avgInterval)} days between peaks)`,
    historicalOccurrences: peaks.map(p => p.date),
    nextPredicted: null, // Can't reliably predict
    patternStrength: Math.max(0, 100 - irregularity),
    description: `This keyword shows irregular, event-driven peaks with high variability (${irregularity.toFixed(0)}% coefficient of variation). Peaks likely triggered by news events, announcements, or external factors rather than predictable cycles. Average interval between peaks: ${Math.round(avgInterval)} days.`,
  };
}

/**
 * Calculate pattern confidence based on data quality
 */
export function calculatePatternConfidence(
  historicalOccurrences: number,
  consistency: number,
  timeSpan: number
): number {
  // More occurrences = higher confidence
  const occurrenceScore = Math.min(100, (historicalOccurrences / 5) * 50);

  // Higher consistency = higher confidence
  const consistencyScore = consistency;

  // Longer time span = higher confidence (validates pattern over time)
  const timeScore = Math.min(100, (timeSpan / 3) * 30); // 3+ years = max score

  // Weighted average
  return Math.round((occurrenceScore * 0.3 + consistencyScore * 0.5 + timeScore * 0.2));
}
