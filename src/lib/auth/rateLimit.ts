import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq, gt } from "drizzle-orm";

let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn("[RateLimit] Failed to initialize Upstash Redis:", err);
  }
}

// In-memory fallback bucket for development & offline environments
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitCheckResult {
  success: boolean;
  remaining: number;
  resetSeconds: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitCheckResult> {
  // 1. If Redis is available, use Upstash Ratelimit
  if (redisClient) {
    try {
      const ratelimit = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        prefix: "fizikalab_rl",
      });
      const result = await ratelimit.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        resetSeconds: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (err) {
      console.warn("[RateLimit] Upstash call failed, falling back to local store:", err);
    }
  }

  // 2. Local memory fallback store
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, resetSeconds: windowSeconds };
  }

  if (entry.count >= limit) {
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { success: false, remaining: 0, resetSeconds: Math.max(1, resetSeconds) };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { success: true, remaining, resetSeconds };
}
