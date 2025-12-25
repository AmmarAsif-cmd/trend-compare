/**
 * Prediction Accuracy Tracker
 * Tracks how accurate our predictions are (builds trust)
 * Honest, verifiable metrics - dates not money
 */

export interface PredictionRecord {
  id: string;
  keyword: string;

  // What we predicted
  predictedDate: Date;
  predictedDateRange: { start: Date; end: Date };
  confidence: number; // 0-100
  patternType: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'event-driven';

  // What actually happened
  actualPeakDate: Date | null; // null = hasn't happened yet or no peak occurred
  peakValue: number | null;

  // Accuracy assessment
  accuracy: 'exact' | 'within-3-days' | 'within-week' | 'within-month' | 'missed' | 'pending';
  daysDifference: number | null; // days between predicted and actual

  // Metadata
  createdAt: Date;
  verifiedAt: Date | null; // when we confirmed what actually happened
}

export interface AccuracyStats {
  overall: {
    totalPredictions: number;
    verified: number; // predictions that have been verified
    pending: number; // predictions waiting to happen
    accuracyRate: number; // percentage of verified predictions that were accurate
  };

  byAccuracy: {
    exact: number; // same day
    within3Days: number;
    withinWeek: number;
    withinMonth: number;
    missed: number;
  };

  byPattern: {
    annual: { total: number; accurate: number; rate: number };
    quarterly: { total: number; accurate: number; rate: number };
    monthly: { total: number; accurate: number; rate: number };
    weekly: { total: number; accurate: number; rate: number };
    eventDriven: { total: number; accurate: number; rate: number };
  };

  byKeyword: {
    keyword: string;
    total: number;
    accurate: number;
    rate: number;
    streak: number; // consecutive correct predictions
  }[];

  recentPredictions: {
    keyword: string;
    predicted: string; // date string for display
    actual: string | null;
    accuracy: string;
    status: '✓' | '✗' | '⏳';
  }[];
}

/**
 * Record a new prediction
 */
export async function recordPrediction(prediction: {
  keyword: string;
  predictedDate: Date;
  predictedDateRange: { start: Date; end: Date };
  confidence: number;
  patternType: PredictionRecord['patternType'];
}): Promise<PredictionRecord> {
  const record: PredictionRecord = {
    id: generatePredictionId(),
    keyword: prediction.keyword,
    predictedDate: prediction.predictedDate,
    predictedDateRange: prediction.predictedDateRange,
    confidence: prediction.confidence,
    patternType: prediction.patternType,
    actualPeakDate: null,
    peakValue: null,
    accuracy: 'pending',
    daysDifference: null,
    createdAt: new Date(),
    verifiedAt: null,
  };

  // Save to database
  await savePredictionRecord(record);

  return record;
}

/**
 * Verify a prediction after the date has passed
 */
export async function verifyPrediction(
  predictionId: string,
  actualPeakDate: Date,
  peakValue: number
): Promise<PredictionRecord> {
  const record = await getPredictionRecord(predictionId);

  if (!record) {
    throw new Error('Prediction record not found');
  }

  // Calculate accuracy
  const daysDiff = Math.abs(
    (actualPeakDate.getTime() - record.predictedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let accuracy: PredictionRecord['accuracy'];
  if (daysDiff === 0) accuracy = 'exact';
  else if (daysDiff <= 3) accuracy = 'within-3-days';
  else if (daysDiff <= 7) accuracy = 'within-week';
  else if (daysDiff <= 30) accuracy = 'within-month';
  else accuracy = 'missed';

  // Update record
  record.actualPeakDate = actualPeakDate;
  record.peakValue = peakValue;
  record.accuracy = accuracy;
  record.daysDifference = Math.round(daysDiff);
  record.verifiedAt = new Date();

  await updatePredictionRecord(record);

  return record;
}

/**
 * Get accuracy statistics
 */
export async function getAccuracyStats(
  userId?: string,
  options?: {
    timeframe?: 'last-month' | 'last-3-months' | 'last-year' | 'all-time';
    keywords?: string[];
  }
): Promise<AccuracyStats> {
  const predictions = await getPredictionRecords(userId, options);

  const verified = predictions.filter(p => p.accuracy !== 'pending');
  const pending = predictions.filter(p => p.accuracy === 'pending');

  // Overall stats
  const totalPredictions = predictions.length;
  const verifiedCount = verified.length;

  // Count accurate predictions (within week considered accurate)
  const accuratePredictions = verified.filter(p =>
    p.accuracy === 'exact' ||
    p.accuracy === 'within-3-days' ||
    p.accuracy === 'within-week'
  );

  const accuracyRate = verifiedCount > 0
    ? Math.round((accuratePredictions.length / verifiedCount) * 100)
    : 0;

  // By accuracy level
  const byAccuracy = {
    exact: verified.filter(p => p.accuracy === 'exact').length,
    within3Days: verified.filter(p => p.accuracy === 'within-3-days').length,
    withinWeek: verified.filter(p => p.accuracy === 'within-week').length,
    withinMonth: verified.filter(p => p.accuracy === 'within-month').length,
    missed: verified.filter(p => p.accuracy === 'missed').length,
  };

  // By pattern type
  const patternTypes: PredictionRecord['patternType'][] = ['annual', 'quarterly', 'monthly', 'weekly', 'event-driven'];
  const byPattern = {} as AccuracyStats['byPattern'];

  for (const type of patternTypes) {
    const typePredictions = verified.filter(p => p.patternType === type);
    const typeAccurate = typePredictions.filter(p =>
      p.accuracy === 'exact' ||
      p.accuracy === 'within-3-days' ||
      p.accuracy === 'within-week'
    );

    const key = type === 'event-driven' ? 'eventDriven' : type;
    byPattern[key as keyof AccuracyStats['byPattern']] = {
      total: typePredictions.length,
      accurate: typeAccurate.length,
      rate: typePredictions.length > 0
        ? Math.round((typeAccurate.length / typePredictions.length) * 100)
        : 0,
    };
  }

  // By keyword
  const keywordMap = new Map<string, PredictionRecord[]>();
  verified.forEach(p => {
    if (!keywordMap.has(p.keyword)) {
      keywordMap.set(p.keyword, []);
    }
    keywordMap.get(p.keyword)!.push(p);
  });

  const byKeyword = Array.from(keywordMap.entries())
    .map(([keyword, preds]) => {
      const accurate = preds.filter(p =>
        p.accuracy === 'exact' ||
        p.accuracy === 'within-3-days' ||
        p.accuracy === 'within-week'
      );

      // Calculate streak (consecutive accurate predictions)
      let streak = 0;
      const sortedPreds = [...preds].sort((a, b) =>
        (a.predictedDate?.getTime() || 0) - (b.predictedDate?.getTime() || 0)
      );

      for (let i = sortedPreds.length - 1; i >= 0; i--) {
        const isAccurate = sortedPreds[i].accuracy === 'exact' ||
                          sortedPreds[i].accuracy === 'within-3-days' ||
                          sortedPreds[i].accuracy === 'within-week';
        if (isAccurate) {
          streak++;
        } else {
          break;
        }
      }

      return {
        keyword,
        total: preds.length,
        accurate: accurate.length,
        rate: Math.round((accurate.length / preds.length) * 100),
        streak,
      };
    })
    .sort((a, b) => b.rate - a.rate) // Sort by accuracy rate
    .slice(0, 10); // Top 10 keywords

  // Recent predictions (last 10)
  const recentPredictions = predictions
    .sort((a, b) => (b.predictedDate?.getTime() || 0) - (a.predictedDate?.getTime() || 0))
    .slice(0, 10)
    .map(p => ({
      keyword: p.keyword,
      predicted: p.predictedDate.toLocaleDateString(),
      actual: p.actualPeakDate ? p.actualPeakDate.toLocaleDateString() : null,
      accuracy: p.accuracy === 'pending' ? 'Pending' :
                p.accuracy === 'exact' ? 'Exact match' :
                p.accuracy === 'within-3-days' ? `±${p.daysDifference} days` :
                p.accuracy === 'within-week' ? `±${p.daysDifference} days` :
                p.accuracy === 'within-month' ? `±${p.daysDifference} days` :
                'Missed',
      status: (p.accuracy === 'exact' || p.accuracy === 'within-3-days' || p.accuracy === 'within-week') ? '✓' as const :
              p.accuracy === 'pending' ? '⏳' as const :
              '✗' as const,
    }));

  return {
    overall: {
      totalPredictions,
      verified: verifiedCount,
      pending: pending.length,
      accuracyRate,
    },
    byAccuracy,
    byPattern,
    byKeyword,
    recentPredictions,
  };
}

/**
 * Format accuracy stats for display
 */
export function formatAccuracyStats(stats: AccuracyStats): string {
  return `
🎯 PREDICTION ACCURACY REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL ACCURACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Predictions Made: ${stats.overall.totalPredictions}
Verified (past events): ${stats.overall.verified}
Pending (future events): ${stats.overall.pending}

✨ Overall Accuracy Rate: ${stats.overall.accuracyRate}%

Breakdown:
→ Exact match (same day): ${stats.byAccuracy.exact} predictions
→ Within 3 days: ${stats.byAccuracy.within3Days} predictions
→ Within 1 week: ${stats.byAccuracy.withinWeek} predictions
→ Within 1 month: ${stats.byAccuracy.withinMonth} predictions
→ Missed: ${stats.byAccuracy.missed} predictions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCURACY BY PATTERN TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Annual Patterns: ${stats.byPattern.annual.rate}% accurate (${stats.byPattern.annual.accurate}/${stats.byPattern.annual.total})
Quarterly Patterns: ${stats.byPattern.quarterly.rate}% accurate (${stats.byPattern.quarterly.accurate}/${stats.byPattern.quarterly.total})
Monthly Patterns: ${stats.byPattern.monthly.rate}% accurate (${stats.byPattern.monthly.accurate}/${stats.byPattern.monthly.total})
Weekly Patterns: ${stats.byPattern.weekly.rate}% accurate (${stats.byPattern.weekly.accurate}/${stats.byPattern.weekly.total})
Event-Driven: ${stats.byPattern.eventDriven.rate}% accurate (${stats.byPattern.eventDriven.accurate}/${stats.byPattern.eventDriven.total})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP KEYWORDS (By Accuracy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stats.byKeyword.slice(0, 5).map((k, i) => `
${i + 1}. ${k.keyword}
   → ${k.rate}% accurate (${k.accurate}/${k.total} predictions)
   → Current streak: ${k.streak} consecutive correct ${k.streak === 1 ? 'prediction' : 'predictions'}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECENT PREDICTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stats.recentPredictions.map(p => `
${p.status} ${p.keyword}
   Predicted: ${p.predicted}
   ${p.actual ? `Actual: ${p.actual}` : 'Status: Pending'}
   ${p.accuracy !== 'Pending' ? `Accuracy: ${p.accuracy}` : ''}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT THIS MEANS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stats.overall.accuracyRate >= 85 ? `
✓ Excellent accuracy (${stats.overall.accuracyRate}%)
✓ Our predictions are highly reliable
✓ You can confidently plan content around our predictions
` : stats.overall.accuracyRate >= 70 ? `
✓ Good accuracy (${stats.overall.accuracyRate}%)
✓ Predictions are generally reliable
✓ Use confidence scores to prioritize highest-confidence predictions
` : `
⚠️ Moderate accuracy (${stats.overall.accuracyRate}%)
→ Focus on high-confidence predictions (90%+)
→ Annual patterns tend to be most accurate
`}

Note: We track prediction accuracy to build trust. Dates are verifiable
facts - no income claims, just honest performance metrics.
`.trim();
}

/**
 * Helper functions (database operations)
 */
function generatePredictionId(): string {
  return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function savePredictionRecord(record: PredictionRecord): Promise<void> {
  // Save to database
}

async function getPredictionRecord(id: string): Promise<PredictionRecord | null> {
  // Get from database
  return null;
}

async function updatePredictionRecord(record: PredictionRecord): Promise<void> {
  // Update in database
}

async function getPredictionRecords(
  userId?: string,
  options?: {
    timeframe?: string;
    keywords?: string[];
  }
): Promise<PredictionRecord[]> {
  // Get from database with filters
  return [];
}
