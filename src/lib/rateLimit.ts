import { toast } from "sonner";

/**
 * In-memory client-side rate limiter.
 * Tracks timestamps of actions per key and enforces a sliding window limit.
 */

const store = new Map<string, number[]>();

export function createRateLimiter(key: string, maxActions: number, windowMs: number) {
  return {
    check(): { allowed: boolean; retryAfterMs: number } {
      const now = Date.now();
      const timestamps = store.get(key) ?? [];

      // Remove timestamps outside the window
      const valid = timestamps.filter((t) => now - t < windowMs);

      if (valid.length >= maxActions) {
        // Find how long until the oldest timestamp expires
        const oldest = valid[0];
        const retryAfterMs = windowMs - (now - oldest);
        store.set(key, valid);
        return { allowed: false, retryAfterMs };
      }

      // Record this action
      valid.push(now);
      store.set(key, valid);
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

// Preset limiters
export const followLimiter = createRateLimiter("follow", 30, 60000);
export const likeLimiter = createRateLimiter("like", 60, 60000);
export const dmLimiter = createRateLimiter("dm", 20, 60000);
export const postLimiter = createRateLimiter("post", 5, 60000);
export const authLimiter = createRateLimiter("auth", 5, 60000);

/**
 * Checks the rate limiter and shows a toast if blocked.
 * Returns true if the action is allowed, false if rate limited.
 */
export function checkRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  actionName?: string
): boolean {
  const { allowed, retryAfterMs } = limiter.check();
  if (!allowed) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    toast.error(
      actionName
        ? `Too many ${actionName} attempts! Try again in ${seconds}s`
        : `Slow down! Try again in ${seconds} seconds`
    );
    return false;
  }
  return true;
}
