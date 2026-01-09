
import { Redis } from '@upstash/redis';
import { SUBSCRIPTION_PLANS } from '@/lib/config/subscription';

// In-memory fallback for development or when Redis is absent
// Note: This resets on server restart, which is fine for dev.
const memoryStore = new Map<string, { count: number, expiry: number }>();

// Initialize Redis only if env vars are present
const redis = (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
    })
    : null;

/**
 * Check if a user (or IP) has reached their daily search limit.
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkSearchLimit(identifier: string, tier: 'FREE' | 'PRO' = 'FREE') {
    const limit = SUBSCRIPTION_PLANS[tier].limits.dailySearches;

    // Pro users bypass checks
    if (limit > 1000) {
        return { allowed: true, remaining: 9999, limit };
    }

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `usage:search:${date}:${identifier}`;

    try {
        let usage = 0;

        if (redis) {
            const usageStr = await redis.get<number>(key);
            usage = Number(usageStr) || 0;
        } else {
            // Memory fallback
            const data = memoryStore.get(key);
            if (data) {
                // Simple expiry check (though key includes date, so mostly redundant)
                if (Date.now() < data.expiry) {
                    usage = data.count;
                } else {
                    memoryStore.delete(key);
                }
            }
        }

        if (usage >= limit) {
            return { allowed: false, remaining: 0, limit };
        }

        return { allowed: true, remaining: limit - usage, limit };
    } catch (error) {
        console.error('[UsageCheck] Error:', error);
        // Fail open if something catastrophic happens
        return { allowed: true, remaining: 1, limit };
    }
}

/**
 * Increment the search usage count for a user/IP.
 */
export async function incrementSearchUsage(identifier: string) {
    const date = new Date().toISOString().split('T')[0];
    const key = `usage:search:${date}:${identifier}`;
    const ONE_DAY_SECONDS = 86400;

    try {
        if (redis) {
            const pipeline = redis.pipeline();
            pipeline.incr(key);
            pipeline.expire(key, ONE_DAY_SECONDS);
            await pipeline.exec();
        } else {
            // Memory fallback
            const current = memoryStore.get(key) || { count: 0, expiry: Date.now() + (ONE_DAY_SECONDS * 1000) };
            memoryStore.set(key, {
                count: current.count + 1,
                expiry: current.expiry
            });
            console.log(`[MemoryStore] Incremented usage for ${key}. Count: ${current.count + 1}`);
        }
    } catch (error) {
        console.error('[UsageCheck] Failed to increment usage:', error);
    }
}
