// SEC-004: Simple in-memory rate limiter for protecting login endpoint
// In production, consider Redis-based solution for distributed systems

const loginAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until retry is allowed
}

/**
 * Check if an identifier (email/IP) has exceeded rate limit for login
 * @param identifier - Email address or IP address to rate limit
 * @returns Object indicating if request is allowed and retry time if blocked
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];

  // Filter out attempts older than the time window
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  // Check if limit exceeded
  if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0];
    const retryAfter = Math.ceil((oldestAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      retryAfter,
    };
  }

  // Record this attempt
  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);

  return { allowed: true };
}

/**
 * Clear rate limit records (useful for manual reset or testing)
 */
export function clearRateLimitRecords(): void {
  loginAttempts.clear();
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(identifier: string): {
  attempts: number;
  remaining: number;
  resetSeconds: number;
} {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  const oldestAttempt = recentAttempts[0];
  const resetSeconds = oldestAttempt
    ? Math.ceil((oldestAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000)
    : 0;

  return {
    attempts: recentAttempts.length,
    remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - recentAttempts.length),
    resetSeconds,
  };
}
