/**
 * In-memory rate limiter for login attempts.
 * Limits by IP address or email to prevent brute-force attacks.
 * 
 * Note: This is process-level (resets on restart). For multi-instance
 * deployments, consider using Redis-based rate limiting.
 */

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const globalForRateLimit = global as unknown as { rateLimitStore: Map<string, RateLimitEntry> };

const store = globalForRateLimit.rateLimitStore || new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== 'production') globalForRateLimit.rateLimitStore = store;

// Clean up expired entries periodically (every 5 minutes)
// Ensure we don't set multiple intervals on hot reload
const CLEANUP_INTERVAL = 5 * 60 * 1000;
if (!(global as any).rateLimitCleanupInterval) {
    (global as any).rateLimitCleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now > entry.resetAt) {
                store.delete(key);
            }
        }
    }, CLEANUP_INTERVAL);
}

/**
 * Check if a key has exceeded the rate limit.
 * @param key    - Unique identifier (e.g., IP address or email)
 * @param limit  - Maximum number of attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with `allowed` boolean and `retryAfterMs` (0 if allowed)
 */
export function rateLimit(
    key: string,
    limit: number = 5,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; retryAfterMs: number; remaining: number } {
    const now = Date.now();
    const entry = store.get(key);

    // No entry or expired — create new
    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });

        return { allowed: true, retryAfterMs: 0, remaining: limit - 1 };
    }

    // Under the limit
    if (entry.count < limit) {
        entry.count++;

        return { allowed: true, retryAfterMs: 0, remaining: limit - entry.count };
    }



    // Over the limit
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, retryAfterMs, remaining: 0 };
}

/**
 * Clear the rate limit for a specific key (e.g., when admin re-enables a user).
 * @param key - The same key used in rateLimit calls (e.g., `login:user@email.com`)
 */
export function clearRateLimit(key: string): void {
    store.delete(key);
}
