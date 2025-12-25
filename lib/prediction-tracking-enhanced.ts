/**
 * Enhanced Prediction Tracking System
 * Improved stability, error handling, and user notification support
 */

import { prisma } from './db';

export type PredictionRecord = {
  id: string;
  slug: string;
  term: string;
  predictedDate: string;
  forecastDate: string;
  predictedValue: number;
  actualValue: number | null;
  accuracy: number | null;
  confidence: number;
  method: string;
  verified: boolean;
  verifiedAt: Date | null;
};

export type VerifiedPrediction = {
  id: string;
  forecastDate: string;
  predictedValue: number;
  actualValue: number;
  accuracy: number;
  confidence: number;
  verifiedAt: string;
};

/**
 * Save a prediction with improved validation and error handling
 */
export async function savePrediction(data: {
  slug: string;
  term: string;
  forecastDate: string;
  predictedValue: number;
  confidence: number;
  method: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Enhanced validation
    if (!data.slug || !data.term || !data.forecastDate) {
      const error = 'Missing required fields';
      console.warn('[PredictionTracking] ⚠️', error, {
        hasSlug: !!data.slug,
        hasTerm: !!data.term,
        hasForecastDate: !!data.forecastDate,
      });
      return { success: false, error };
    }

    // Validate numeric values
    if (isNaN(data.predictedValue) || data.predictedValue < 0 || data.predictedValue > 100) {
      const error = `Invalid predictedValue: ${data.predictedValue} (must be 0-100)`;
      console.warn('[PredictionTracking] ⚠️', error);
      return { success: false, error };
    }

    if (isNaN(data.confidence) || data.confidence < 0 || data.confidence > 100) {
      const error = `Invalid confidence: ${data.confidence} (must be 0-100)`;
      console.warn('[PredictionTracking] ⚠️', error);
      return { success: false, error };
    }

    // Normalize date to midnight UTC to avoid timezone issues
    const forecastDateObj = new Date(data.forecastDate);
    if (isNaN(forecastDateObj.getTime())) {
      const error = `Invalid forecastDate: ${data.forecastDate}`;
      console.warn('[PredictionTracking] ⚠️', error);
      return { success: false, error };
    }
    forecastDateObj.setHours(0, 0, 0, 0);

    // Check for existing prediction
    const existing = await prisma.prediction.findFirst({
      where: {
        slug: data.slug,
        term: data.term,
        forecastDate: forecastDateObj,
      },
    });

    let result;
    if (existing) {
      // Only update if not verified (preserve verified predictions)
      if (!existing.verified) {
        result = await prisma.prediction.update({
          where: { id: existing.id },
          data: {
            predictedValue: data.predictedValue,
            confidence: data.confidence,
            method: data.method,
            predictedDate: new Date(),
          },
        });
      } else {
        // Keep existing verified prediction
        result = existing;
      }
    } else {
      // Create new prediction
      result = await prisma.prediction.create({
        data: {
          slug: data.slug,
          term: data.term,
          predictedDate: new Date(),
          forecastDate: forecastDateObj,
          predictedValue: data.predictedValue,
          actualValue: null,
          accuracy: null,
          confidence: data.confidence,
          method: data.method,
          verified: false,
        },
      });
    }

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error('[PredictionTracking] ❌ Failed to save prediction:', {
      error: error?.message || error,
      code: error?.code,
      meta: error?.meta,
      data: {
        slug: data.slug,
        term: data.term,
        forecastDate: data.forecastDate,
      },
    });
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

/**
 * Verify predictions with improved accuracy calculation
 */
export async function verifyPredictions(
  slug: string,
  term: string,
  actualSeries: Array<{ date: string; [key: string]: any }>
): Promise<{
  verified: number;
  accuracy: number;
  total: number;
  newlyVerified: VerifiedPrediction[];
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find unverified predictions that should have actual data now
    const predictions = await prisma.prediction.findMany({
      where: {
        slug,
        term,
        verified: false,
        forecastDate: {
          lte: today, // Only verify past dates
        },
      },
      orderBy: {
        forecastDate: 'asc',
      },
    });

    if (predictions.length === 0) {
      return { verified: 0, accuracy: 0, total: 0, newlyVerified: [] };
    }

    let verified = 0;
    let totalAccuracy = 0;
    const newlyVerified: VerifiedPrediction[] = [];

    for (const prediction of predictions) {
      const forecastDateStr = prediction.forecastDate.toISOString().split('T')[0];
      
      // Try exact match first
      let actualPoint = actualSeries.find(p => p.date === forecastDateStr);
      
      // If no exact match, try ±1 day (data might be delayed)
      if (!actualPoint) {
        const forecastDate = new Date(forecastDateStr);
        const dayBefore = new Date(forecastDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(forecastDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        
        actualPoint = actualSeries.find(p => {
          const pDate = new Date(p.date);
          return pDate.toDateString() === forecastDate.toDateString() ||
                 pDate.toDateString() === dayBefore.toDateString() ||
                 pDate.toDateString() === dayAfter.toDateString();
        });
      }

      if (actualPoint) {
        const actualValue = Number(actualPoint[term] || 0);

        // Only verify if we have actual data
        if (actualValue >= 0) {
          // Improved accuracy calculation
          // Use relative error for better accuracy representation
          const error = Math.abs(prediction.predictedValue - actualValue);
          
          // For values close to 0, use absolute error
          // For larger values, use percentage error
          let accuracy: number;
          if (actualValue === 0) {
            // If actual is 0, accuracy depends on how close predicted is to 0
            accuracy = prediction.predictedValue < 5 ? 95 : Math.max(0, 100 - prediction.predictedValue * 10);
          } else {
            const percentageError = (error / actualValue) * 100;
            accuracy = Math.max(0, 100 - percentageError);
          }

          // Cap accuracy at 100%
          accuracy = Math.min(100, accuracy);

          const verifiedAt = new Date();
          
          await prisma.prediction.update({
            where: { id: prediction.id },
            data: {
              actualValue,
              accuracy,
              verified: true,
              verifiedAt,
            },
          });

          newlyVerified.push({
            id: prediction.id,
            forecastDate: forecastDateStr,
            predictedValue: prediction.predictedValue,
            actualValue,
            accuracy: Math.round(accuracy * 100) / 100,
            confidence: prediction.confidence,
            verifiedAt: verifiedAt.toISOString(),
          });

          verified++;
          totalAccuracy += accuracy;

          console.log(`[PredictionTracking] ✅ Verified: ${forecastDateStr} - Predicted: ${prediction.predictedValue.toFixed(1)}, Actual: ${actualValue.toFixed(1)}, Accuracy: ${accuracy.toFixed(1)}%`);
        }
      }
    }

    const avgAccuracy = verified > 0 ? totalAccuracy / verified : 0;

    return {
      verified,
      accuracy: Math.round(avgAccuracy * 100) / 100,
      total: predictions.length,
      newlyVerified,
    };
  } catch (error) {
    console.error('[PredictionTracking] Error verifying predictions:', error);
    return { verified: 0, accuracy: 0, total: 0, newlyVerified: [] };
  }
}

/**
 * Get verified predictions for a comparison (for displaying to users)
 */
export async function getVerifiedPredictions(
  slug: string,
  term?: string
): Promise<VerifiedPrediction[]> {
  try {
    const where: any = {
      slug,
      verified: true,
    };

    if (term) {
      where.term = term;
    }

    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: {
        forecastDate: 'desc', // Most recent first
      },
      take: 50, // Limit to 50 most recent
    });

    return predictions.map(p => ({
      id: p.id,
      forecastDate: p.forecastDate.toISOString().split('T')[0],
      predictedValue: p.predictedValue,
      actualValue: p.actualValue!,
      accuracy: p.accuracy!,
      confidence: p.confidence,
      verifiedAt: p.verifiedAt!.toISOString(),
    }));
  } catch (error) {
    console.error('[PredictionTracking] Error fetching verified predictions:', error);
    return [];
  }
}

/**
 * Get prediction accuracy stats (enhanced)
 */
export async function getPredictionStats(): Promise<{
  totalPredictions: number;
  verifiedPredictions: number;
  averageAccuracy: number;
  accuracyByMethod: Record<string, number>;
}> {
  try {
    const [total, verified] = await Promise.all([
      prisma.prediction.count(),
      prisma.prediction.findMany({
        where: { verified: true },
        select: { accuracy: true, method: true },
      }),
    ]);

    const verifiedCount = verified.length;
    const avgAccuracy = verifiedCount > 0
      ? verified.reduce((sum, p) => sum + (p.accuracy || 0), 0) / verifiedCount
      : 0;

    // Calculate accuracy by method
    const methodAccuracies: Record<string, number[]> = {};
    verified.forEach(p => {
      const methods = p.method.split('+');
      methods.forEach(method => {
        if (!methodAccuracies[method]) {
          methodAccuracies[method] = [];
        }
        if (p.accuracy !== null) {
          methodAccuracies[method].push(p.accuracy);
        }
      });
    });

    const accuracyByMethod: Record<string, number> = {};
    Object.entries(methodAccuracies).forEach(([method, accuracies]) => {
      if (accuracies.length > 0) {
        accuracyByMethod[method] = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      }
    });

    return {
      totalPredictions: total,
      verifiedPredictions: verifiedCount,
      averageAccuracy: Math.round(avgAccuracy * 100) / 100,
      accuracyByMethod: Object.fromEntries(
        Object.entries(accuracyByMethod).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
    };
  } catch (error) {
    console.error('[PredictionTracking] Error getting stats:', error);
    return {
      totalPredictions: 0,
      verifiedPredictions: 0,
      averageAccuracy: 0,
      accuracyByMethod: {},
    };
  }
}


