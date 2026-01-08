/**
 * API Usage Monitoring and Cost Tracking
 * Tracks API calls for cost monitoring and rate limiting
 */

interface APIUsageRecord {
  service: string;
  endpoint: string;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
}

// In-memory store (in production, use Redis or database)
const usageRecords: APIUsageRecord[] = [];
const MAX_RECORDS = 1000; // Keep last 1000 records

/**
 * Record an API call
 */
export function recordAPICall(
  service: string,
  endpoint: string,
  duration: number,
  success: boolean,
  error?: string
): void {
  const record: APIUsageRecord = {
    service,
    endpoint,
    timestamp: Date.now(),
    duration,
    success,
    error,
  };

  usageRecords.push(record);

  // Keep only last MAX_RECORDS
  if (usageRecords.length > MAX_RECORDS) {
    usageRecords.shift();
  }
}

/**
 * Get API usage statistics
 */
export function getAPIUsageStats(timeframe: '1h' | '24h' | '7d' = '24h'): {
  total: number;
  successful: number;
  failed: number;
  byService: Record<string, { total: number; successful: number; failed: number; avgDuration: number }>;
} {
  const now = Date.now();
  const timeframeMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  }[timeframe];

  const cutoff = now - timeframeMs;
  const recentRecords = usageRecords.filter(r => r.timestamp >= cutoff);

  const byService: Record<string, { total: number; successful: number; failed: number; durations: number[] }> = {};

  recentRecords.forEach(record => {
    if (!byService[record.service]) {
      byService[record.service] = { total: 0, successful: 0, failed: 0, durations: [] };
    }

    byService[record.service].total++;
    if (record.success) {
      byService[record.service].successful++;
    } else {
      byService[record.service].failed++;
    }
    byService[record.service].durations.push(record.duration);
  });

  // Calculate averages
  const byServiceWithAvg = Object.entries(byService).reduce((acc, [service, stats]) => {
    acc[service] = {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      avgDuration: stats.durations.length > 0
        ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        : 0,
    };
    return acc;
  }, {} as Record<string, { total: number; successful: number; failed: number; avgDuration: number }>);

  const successful = recentRecords.filter(r => r.success).length;
  const failed = recentRecords.filter(r => !r.success).length;

  return {
    total: recentRecords.length,
    successful,
    failed,
    byService: byServiceWithAvg,
  };
}

/**
 * Check if we should throttle API calls for a service
 */
export function shouldThrottle(service: string, maxCallsPerMinute: number = 20): boolean {
  const oneMinuteAgo = Date.now() - 60 * 1000;
  const recentCalls = usageRecords.filter(
    r => r.service === service && r.timestamp >= oneMinuteAgo
  );

  return recentCalls.length >= maxCallsPerMinute;
}

/**
 * Get estimated cost (if applicable)
 * This is a placeholder - actual cost calculation depends on API pricing
 */
export function getEstimatedCost(timeframe: '1h' | '24h' | '7d' = '24h'): {
  keepa: number;
  anthropic: number;
  total: number;
} {
  const stats = getAPIUsageStats(timeframe);

  // Placeholder cost estimates (update with actual pricing)
  const keepaCostPerRequest = 0.001; // $0.001 per request (example)
  const anthropicCostPerRequest = 0.01; // $0.01 per request (example)

  const keepaRequests = stats.byService['keepa']?.successful || 0;
  const anthropicRequests = stats.byService['anthropic']?.successful || 0;

  return {
    keepa: keepaRequests * keepaCostPerRequest,
    anthropic: anthropicRequests * anthropicCostPerRequest,
    total: (keepaRequests * keepaCostPerRequest) + (anthropicRequests * anthropicCostPerRequest),
  };
}

