/**
 * Prediction Tracking System
 * Tracks predictions and verifies their accuracy over time
 */

import { prisma } from './db';

export type PredictionRecord = {
  id: string;
  slug: string;
  term: string;
  predictedDate: string; // Date when prediction was made
  forecastDate: string; // Date being predicted
  predictedValue: number;
  actualValue: number | null; // Filled in later when actual data is available
  accuracy: number | null; // 0-100, calculated when actualValue is available
  confidence: number;
  method: string;
  verified: boolean; // Whether we've verified this prediction
  verifiedAt: Date | null;
};

/**
 * Save a prediction to the database
 * Uses upsert to avoid duplicates - only creates new predictions or updates existing ones if they're older
 */
export async function savePrediction(data: {
  slug: string;
  term: string;
  forecastDate: string;
  predictedValue: number;
  confidence: number;
  method: string;
}): Promise<void> {
  try {
    // Validate required fields
    if (!data.slug || !data.term || !data.forecastDate) {
      console.warn('[PredictionTracking] ⚠️ Missing required fields:', {
        hasSlug: !!data.slug,
        hasTerm: !!data.term,
        hasForecastDate: !!data.forecastDate,
      });
      return;
    }

    const forecastDateObj = new Date(data.forecastDate);
    forecastDateObj.setHours(0, 0, 0, 0); // Normalize to midnight to avoid time issues
    
    // ALWAYS use findFirst + create/update approach to prevent duplicates
    // This works regardless of whether unique constraint exists
    const existing = await prisma.prediction.findFirst({
      where: {
        slug: data.slug,
        term: data.term,
        forecastDate: forecastDateObj,
      },
    });
    
    let result;
    if (existing) {
      // Update only if not verified (preserve verified predictions)
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
    
    // Only log if it's a new prediction
    if (result) {
      // Check if it was created or updated by comparing predictedDate
      const isNew = Math.abs(new Date(result.predictedDate).getTime() - Date.now()) < 5000; // Within 5 seconds = newly created
      if (isNew) {
        console.log('[PredictionTracking] ✅ Saved prediction:', {
          id: result.id,
          slug: data.slug,
          term: data.term,
          forecastDate: data.forecastDate,
        });
      }
    }
  } catch (error: any) {
    // Log detailed error for debugging
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
    // Don't throw - prediction tracking shouldn't break the page
  }
}

/**
 * Verify predictions by comparing with actual data
 */
export async function verifyPredictions(
  slug: string,
  term: string,
  actualSeries: Array<{ date: string; [key: string]: any }>
): Promise<{
  verified: number;
  accuracy: number; // Average accuracy
  total: number;
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
    });
    
    if (predictions.length === 0) {
      return { verified: 0, accuracy: 0, total: 0 };
    }
    
    let verified = 0;
    let totalAccuracy = 0;
    
    for (const prediction of predictions) {
      const forecastDateStr = prediction.forecastDate.toISOString().split('T')[0];
      const actualPoint = actualSeries.find(p => p.date === forecastDateStr);
      
      if (actualPoint) {
        const actualValue = Number(actualPoint[term] || 0);
        
        if (actualValue > 0) {
          // Calculate accuracy: how close was our prediction?
          const error = Math.abs(prediction.predictedValue - actualValue);
          const percentageError = (error / actualValue) * 100;
          const accuracy = Math.max(0, 100 - percentageError);
          
          await prisma.prediction.update({
            where: { id: prediction.id },
            data: {
              actualValue,
              accuracy,
              verified: true,
              verifiedAt: new Date(),
            },
          });
          
          verified++;
          totalAccuracy += accuracy;
          
          console.log(`[PredictionTracking] ✅ Verified prediction: ${forecastDateStr} - Predicted: ${prediction.predictedValue.toFixed(1)}, Actual: ${actualValue.toFixed(1)}, Accuracy: ${accuracy.toFixed(1)}%`);
        }
      }
    }
    
    const avgAccuracy = verified > 0 ? totalAccuracy / verified : 0;
    
    return {
      verified,
      accuracy: Math.round(avgAccuracy * 100) / 100,
      total: predictions.length,
    };
  } catch (error) {
    console.error('[PredictionTracking] Error verifying predictions:', error);
    return { verified: 0, accuracy: 0, total: 0 };
  }
}

/**
 * Get prediction accuracy stats
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
      ? verified.reduce((sum: any, p: any) => sum + (p.accuracy || 0), 0) / verifiedCount
      : 0;

    // Calculate accuracy by method
    const methodAccuracies: Record<string, number[]> = {};
    verified.forEach((p: any) => {
      const methods = p.method.split('+');
      methods.forEach((method: any) => {
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

