/**
 * Smart Prediction Sampling Strategy
 * Instead of storing all 30 daily predictions, we store key milestones:
 * - Day 1, 3 (near-term, high confidence)
 * - Day 7, 14, 21 (weekly milestones)
 * - Day 30 (end of forecast period)
 * 
 * Total: 6 predictions per term (12 total) instead of 60
 * This reduces storage by 80% while maintaining accuracy tracking
 */

export type SamplingStrategy = 'all' | 'smart' | 'weekly' | 'milestones';

export const SAMPLING_STRATEGIES = {
  /**
   * Store all predictions (30 per term = 60 total)
   * Best for: Maximum accuracy tracking, detailed analysis
   */
  all: (forecastDays: number) => {
    return Array.from({ length: forecastDays }, (_, i) => i + 1);
  },

  /**
   * Smart sampling: Key milestones with more points near-term
   * Stores: Day 1, 3, 7, 14, 21, 30 (6 predictions)
   * Best for: Balanced accuracy tracking + storage efficiency
   */
  smart: (forecastDays: number) => {
    if (forecastDays <= 7) {
      // For short forecasts, store all days
      return Array.from({ length: forecastDays }, (_, i) => i + 1);
    }
    
    const milestones: number[] = [];
    
    // Near-term: Day 1, 3 (high confidence, important for immediate decisions)
    milestones.push(1);
    if (forecastDays >= 3) milestones.push(3);
    
    // Weekly milestones: Day 7, 14, 21
    if (forecastDays >= 7) milestones.push(7);
    if (forecastDays >= 14) milestones.push(14);
    if (forecastDays >= 21) milestones.push(21);
    
    // End of period: Day 30
    if (forecastDays >= 30) milestones.push(30);
    
    // For custom periods, add intermediate points
    if (forecastDays > 30) {
      // Add points at 1/3 and 2/3 of remaining period
      const remaining = forecastDays - 30;
      if (remaining > 0) {
        const third = Math.floor(remaining / 3);
        if (third > 0) milestones.push(30 + third);
        if (third > 0) milestones.push(30 + (third * 2));
      }
      milestones.push(forecastDays); // Always include final day
    }
    
    return milestones.sort((a, b) => a - b);
  },

  /**
   * Weekly sampling: Store only weekly milestones
   * Stores: Day 7, 14, 21, 30 (4 predictions)
   * Best for: Maximum storage efficiency, weekly accuracy tracking
   */
  weekly: (forecastDays: number) => {
    const milestones: number[] = [];
    for (let day = 7; day <= forecastDays; day += 7) {
      milestones.push(day);
    }
    // Always include final day if not already included
    if (milestones[milestones.length - 1] !== forecastDays) {
      milestones.push(forecastDays);
    }
    return milestones;
  },

  /**
   * Key milestones only: Day 1, 7, 14, 21, 30 (5 predictions)
   * Best for: Essential tracking points
   */
  milestones: (forecastDays: number) => {
    const milestones: number[] = [1]; // Always include Day 1
    
    if (forecastDays >= 7) milestones.push(7);
    if (forecastDays >= 14) milestones.push(14);
    if (forecastDays >= 21) milestones.push(21);
    if (forecastDays >= 30) milestones.push(30);
    
    if (forecastDays > 30 && milestones[milestones.length - 1] !== forecastDays) {
      milestones.push(forecastDays);
    }
    
    return milestones;
  },
};

/**
 * Get which days to store based on strategy
 */
export function getDaysToStore(
  forecastDays: number = 30,
  strategy: SamplingStrategy = 'smart'
): number[] {
  const sampler = SAMPLING_STRATEGIES[strategy];
  return sampler(forecastDays);
}

/**
 * Filter predictions to only include sampled days
 */
export function samplePredictions<T extends { date: string }>(
  predictions: T[],
  daysToStore: number[],
  startDate: Date
): T[] {
  const sampled: T[] = [];
  
  daysToStore.forEach((dayOffset) => {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // Find prediction for this date (or closest)
    const prediction = predictions.find(p => {
      const predDate = new Date(p.date);
      const daysDiff = Math.abs(
        Math.floor((predDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      return daysDiff <= 1; // Allow 1 day tolerance
    });
    
    if (prediction) {
      sampled.push(prediction);
    }
  });
  
  return sampled;
}

/**
 * Get storage efficiency stats
 */
export function getStorageStats(
  forecastDays: number = 30,
  strategy: SamplingStrategy = 'smart'
): {
  totalDays: number;
  storedDays: number;
  reduction: number; // Percentage reduction
  storagePerComparison: number; // Total predictions for 2 terms
} {
  const daysToStore = getDaysToStore(forecastDays, strategy);
  const reduction = ((forecastDays - daysToStore.length) / forecastDays) * 100;
  
  return {
    totalDays: forecastDays,
    storedDays: daysToStore.length,
    reduction: Math.round(reduction * 100) / 100,
    storagePerComparison: daysToStore.length * 2, // 2 terms
  };
}


