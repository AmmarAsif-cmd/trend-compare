/**
 * Refresh Manager
 * Prevents concurrent refresh operations and manages refresh queue
 */

// In-memory tracking of active refresh operations
// In production, this could be Redis for multi-instance deployments
const activeRefreshes = new Map<string, {
  startTime: number;
  type: 'single' | 'all' | 'trending';
  promise: Promise<any>;
}>();

const MAX_CONCURRENT_REFRESHES = 3; // Max 3 refresh operations at once
const REFRESH_COOLDOWN = 30 * 1000; // 30 seconds cooldown between same type refreshes

/**
 * Check if a refresh operation is already in progress
 */
export function isRefreshInProgress(
  key: string,
  type: 'single' | 'all' | 'trending' = 'single'
): boolean {
  const existing = activeRefreshes.get(key);
  if (!existing) return false;
  
  // Check if it's the same type and still active (not older than 5 minutes)
  if (existing.type === type && Date.now() - existing.startTime < 5 * 60 * 1000) {
    return true;
  }
  
  // Clean up stale entries
  if (Date.now() - existing.startTime > 5 * 60 * 1000) {
    activeRefreshes.delete(key);
    return false;
  }
  
  return false;
}

/**
 * Register a refresh operation
 */
export function registerRefresh(
  key: string,
  type: 'single' | 'all' | 'trending',
  promise: Promise<any>
): void {
  activeRefreshes.set(key, {
    startTime: Date.now(),
    type,
    promise,
  });
  
  // Clean up when promise resolves/rejects
  promise.finally(() => {
    // Keep it for a short time to prevent immediate re-refresh
    setTimeout(() => {
      activeRefreshes.delete(key);
    }, REFRESH_COOLDOWN);
  });
}

/**
 * Get active refresh count
 */
export function getActiveRefreshCount(): number {
  // Clean up stale entries first
  const now = Date.now();
  for (const [key, value] of activeRefreshes.entries()) {
    if (now - value.startTime > 5 * 60 * 1000) {
      activeRefreshes.delete(key);
    }
  }
  return activeRefreshes.size;
}

/**
 * Check if we can start a new refresh operation
 */
export function canStartRefresh(type: 'single' | 'all' | 'trending'): {
  allowed: boolean;
  reason?: string;
  activeCount: number;
} {
  const activeCount = getActiveRefreshCount();
  
  // Check concurrent limit
  if (activeCount >= MAX_CONCURRENT_REFRESHES) {
    return {
      allowed: false,
      reason: `Too many concurrent refresh operations (${activeCount}/${MAX_CONCURRENT_REFRESHES}). Please wait.`,
      activeCount,
    };
  }
  
  // Check for duplicate operations of the same type
  const typeKey = `type:${type}`;
  if (isRefreshInProgress(typeKey, type)) {
    return {
      allowed: false,
      reason: `A ${type} refresh is already in progress. Please wait.`,
      activeCount,
    };
  }
  
  return {
    allowed: true,
    activeCount,
  };
}

/**
 * Wait for a refresh to complete (if in progress)
 */
export async function waitForRefresh(key: string, timeout: number = 30000): Promise<void> {
  const existing = activeRefreshes.get(key);
  if (!existing) return;
  
  try {
    await Promise.race([
      existing.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for refresh')), timeout)
      ),
    ]);
  } catch (error) {
    // Ignore errors, just wait for it to complete
  }
}

/**
 * Get refresh status
 */
export function getRefreshStatus(): {
  active: number;
  maxConcurrent: number;
  operations: Array<{
    key: string;
    type: string;
    duration: number;
  }>;
} {
  const now = Date.now();
  const operations = Array.from(activeRefreshes.entries()).map(([key, value]) => ({
    key,
    type: value.type,
    duration: now - value.startTime,
  }));
  
  return {
    active: activeRefreshes.size,
    maxConcurrent: MAX_CONCURRENT_REFRESHES,
    operations,
  };
}

