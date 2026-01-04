/**
 * Performance Metrics Collection
 * Tracks TTFB, response times, cache hits, API calls, DB queries
 */

export interface PerformanceMetrics {
  requestId: string;
  path: string;
  method: string;
  startTime: number;
  ttfb?: number;
  totalTime?: number;
  cacheHits: number;
  cacheMisses: number;
  externalApiCalls: number;
  dbQueries: number;
  dbQueryTime: number;
  errors: string[];
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private static instance: MetricsCollector;

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  startRequest(requestId: string, path: string, method: string = 'GET'): void {
    this.metrics.set(requestId, {
      requestId,
      path,
      method,
      startTime: Date.now(),
      cacheHits: 0,
      cacheMisses: 0,
      externalApiCalls: 0,
      dbQueries: 0,
      dbQueryTime: 0,
      errors: [],
    });
  }

  recordCacheHit(requestId: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) metrics.cacheHits++;
  }

  recordCacheMiss(requestId: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) metrics.cacheMisses++;
  }

  recordApiCall(requestId: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) metrics.externalApiCalls++;
  }

  recordDbQuery(requestId: string, queryTime: number): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.dbQueries++;
      metrics.dbQueryTime += queryTime;
    }
  }

  recordError(requestId: string, error: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) metrics.errors.push(error);
  }

  recordTTFB(requestId: string, ttfb: number): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) metrics.ttfb = ttfb;
  }

  setMetadata(requestId: string, key: string, value: any): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      if (!metrics.metadata) metrics.metadata = {};
      metrics.metadata[key] = value;
    }
  }

  finishRequest(requestId: string): PerformanceMetrics | null {
    const metrics = this.metrics.get(requestId);
    if (!metrics) return null;

    metrics.totalTime = Date.now() - metrics.startTime;
    
    // Log metrics (structured logging)
    const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(1)
      : '0.0';

    console.log(JSON.stringify({
      type: 'performance',
      requestId: metrics.requestId,
      path: metrics.path,
      method: metrics.method,
      ttfb: metrics.ttfb,
      totalTime: metrics.totalTime,
      cacheHitRate: `${cacheHitRate}%`,
      cacheHits: metrics.cacheHits,
      cacheMisses: metrics.cacheMisses,
      externalApiCalls: metrics.externalApiCalls,
      dbQueries: metrics.dbQueries,
      dbQueryTime: metrics.dbQueryTime,
      errors: metrics.errors.length > 0 ? metrics.errors : undefined,
      metadata: metrics.metadata,
    }));

    // Clean up after logging (keep last 100 for debugging)
    if (this.metrics.size > 100) {
      const oldestKey = Array.from(this.metrics.keys())[0];
      this.metrics.delete(oldestKey);
    }

    return metrics;
  }

  getMetrics(requestId: string): PerformanceMetrics | null {
    return this.metrics.get(requestId) || null;
  }
}

export const metricsCollector = MetricsCollector.getInstance();

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Middleware helper to track request performance
 */
export function withMetrics<T>(
  requestId: string,
  path: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  metricsCollector.startRequest(requestId, path, method);
  const startTime = Date.now();

  return fn()
    .then(result => {
      const ttfb = Date.now() - startTime;
      metricsCollector.recordTTFB(requestId, ttfb);
      metricsCollector.finishRequest(requestId);
      return result;
    })
    .catch(error => {
      metricsCollector.recordError(requestId, error.message || String(error));
      metricsCollector.finishRequest(requestId);
      throw error;
    });
}

