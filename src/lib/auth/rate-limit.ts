interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, maxLimit = 5, windowMs = 15 * 60 * 1000): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Clean up periodically if map grows large
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxLimit - 1 };
  }

  if (record.count >= maxLimit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: maxLimit - record.count };
}
