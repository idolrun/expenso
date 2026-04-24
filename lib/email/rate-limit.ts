interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  options: { maxRequests: number; windowMs: number } = {
    maxRequests: 3,
    windowMs: 60_000,
  },
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const key = identifier.toLowerCase().trim();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: options.maxRequests - 1,
      resetAt,
    };
  }

  if (entry.count >= options.maxRequests) {
    return {
      ok: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  return {
    ok: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}
