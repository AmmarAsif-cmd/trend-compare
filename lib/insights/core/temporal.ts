/**
 * Temporal Utilities
 * Date/time helpers for pattern detection
 * ML-ready feature extraction from dates
 */

import type { SeriesPoint } from '@/lib/trends';
import type { EnrichedDataPoint } from './types';

/**
 * Enrich data points with temporal features (ML-ready)
 */
export function enrichWithTemporalFeatures(series: SeriesPoint[]): EnrichedDataPoint[] {
  return series.map(point => {
    const date = new Date(point.date);

    return {
      ...point,
      dayOfWeek: date.getDay(),              // 0=Sunday, 6=Saturday
      dayOfMonth: date.getDate(),            // 1-31
      weekOfYear: getWeekOfYear(date),       // 1-52
      month: date.getMonth(),                // 0=Jan, 11=Dec
      quarter: Math.floor(date.getMonth() / 3) + 1, // 1-4
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
}

/**
 * Get week number of year (ISO week)
 */
export function getWeekOfYear(date: Date): number {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
}

/**
 * Group data by month
 * Returns map: month (0-11) → values
 */
export function groupByMonth(
  series: EnrichedDataPoint[],
  term: string
): Map<number, number[]> {
  const grouped = new Map<number, number[]>();

  series.forEach(point => {
    const month = point.month ?? new Date(point.date).getMonth();
    const value = point[term] as number;

    if (!grouped.has(month)) {
      grouped.set(month, []);
    }
    grouped.get(month)!.push(value);
  });

  return grouped;
}

/**
 * Group data by day of week
 */
export function groupByDayOfWeek(
  series: EnrichedDataPoint[],
  term: string
): Map<number, number[]> {
  const grouped = new Map<number, number[]>();

  series.forEach(point => {
    const dow = point.dayOfWeek ?? new Date(point.date).getDay();
    const value = point[term] as number;

    if (!grouped.has(dow)) {
      grouped.set(dow, []);
    }
    grouped.get(dow)!.push(value);
  });

  return grouped;
}

/**
 * Group by quarter
 */
export function groupByQuarter(
  series: EnrichedDataPoint[],
  term: string
): Map<number, number[]> {
  const grouped = new Map<number, number[]>();

  series.forEach(point => {
    const quarter = point.quarter ?? (Math.floor(new Date(point.date).getMonth() / 3) + 1);
    const value = point[term] as number;

    if (!grouped.has(quarter)) {
      grouped.set(quarter, []);
    }
    grouped.get(quarter)!.push(value);
  });

  return grouped;
}

/**
 * Group by hour (if timestamps are available)
 */
export function groupByHour(
  series: EnrichedDataPoint[],
  term: string
): Map<number, number[]> {
  const grouped = new Map<number, number[]>();

  series.forEach(point => {
    const hour = new Date(point.date).getHours();
    const value = point[term] as number;

    if (!grouped.has(hour)) {
      grouped.set(hour, []);
    }
    grouped.get(hour)!.push(value);
  });

  return grouped;
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return names[month] || 'Unknown';
}

/**
 * Get day of week name
 */
export function getDayName(day: number): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[day] || 'Unknown';
}

/**
 * Get quarter name
 */
export function getQuarterName(quarter: number): string {
  return `Q${quarter}`;
}

/**
 * Check if date falls on a major US holiday
 * (Can expand internationally later)
 */
export function isHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();

  // Major US holidays (can expand this list)
  const holidays = [
    { month: 0, day: 1 },   // New Year's Day
    { month: 6, day: 4 },   // Independence Day
    { month: 11, day: 25 }, // Christmas
    // Add more as needed
  ];

  return holidays.some(h => h.month === month && h.day === day);
}

/**
 * Check if date is in a major shopping season
 */
export function isShoppingSeason(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();

  // Black Friday / Cyber Monday (late November)
  if (month === 10 && day >= 20) return true;

  // Holiday shopping (December)
  if (month === 11) return true;

  // Back to school (August - early September)
  if (month === 7 || (month === 8 && day <= 15)) return true;

  return false;
}

/**
 * Get season (Northern Hemisphere)
 */
export function getSeason(date: Date): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = date.getMonth();

  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Calculate date difference in days
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Cyclical encoding for ML (preserves circular nature of time)
 * Converts month/day/etc to sin/cos components
 */
export function cyclicalEncode(value: number, maxValue: number): { sin: number; cos: number } {
  const angle = (2 * Math.PI * value) / maxValue;
  return {
    sin: Math.sin(angle),
    cos: Math.cos(angle)
  };
}

/**
 * Encode month as sine/cosine (ML feature)
 */
export function encodeMonthCyclical(month: number): { sin: number; cos: number } {
  return cyclicalEncode(month, 12);
}

/**
 * Encode day of week as sine/cosine (ML feature)
 */
export function encodeDayOfWeekCyclical(day: number): { sin: number; cos: number } {
  return cyclicalEncode(day, 7);
}
