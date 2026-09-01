import { getRedis, reportRedisFailure } from "@/lib/redis";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// L1 In-Memory Cache Map (Process-level)
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Cleanup expired L1 keys every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        memoryCache.delete(key);
      }
    }
  }, 60000).unref?.();
}

/**
 * Helper to run a promise with a hard timeout (e.g. 150ms)
 */
async function withTimeout<T>(promise: Promise<T>, ms = 150): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Redis operation timed out")), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Get item from L1 (Memory) or L2 (Redis) cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const now = Date.now();

  // 1. Check L1 Memory (< 1ms)
  const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memEntry) {
    if (memEntry.expiresAt > now) {
      return memEntry.value;
    }
    memoryCache.delete(key);
  }

  // 2. Check L2 Redis with strict timeout
  try {
    const redis = getRedis();
    if (redis) {
      const raw = await withTimeout(redis.get(key), 200);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        memoryCache.set(key, {
          value: parsed,
          expiresAt: now + 30000
        });
        return parsed;
      }
    }
  } catch {
    reportRedisFailure();
  }

  return null;
}

/**
 * Set item in both L1 (Memory) and L2 (Redis)
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  // 1. Set in L1 Memory immediately
  memoryCache.set(key, {
    value,
    expiresAt
  });

  // 2. Set in L2 Redis asynchronously with timeout
  try {
    const redis = getRedis();
    if (redis) {
      const serialized = JSON.stringify(value);
      await withTimeout(redis.set(key, serialized, "EX", ttlSeconds), 200);
    }
  } catch {
    reportRedisFailure();
  }
}

/**
 * Delete a specific key from L1 and L2
 */
export async function deleteCache(key: string): Promise<void> {
  memoryCache.delete(key);

  try {
    const redis = getRedis();
    if (redis) {
      await withTimeout(redis.del(key), 200);
    }
  } catch {
    reportRedisFailure();
  }
}

/**
 * Invalidate keys matching a pattern prefix
 */
export async function invalidateByPattern(pattern: string): Promise<void> {
  // 1. Invalidate L1 matching keys
  const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }

  // 2. Invalidate L2 Redis keys
  try {
    const redis = getRedis();
    if (redis) {
      const keys = await withTimeout(redis.keys(pattern), 300);
      if (keys.length > 0) {
        await withTimeout(redis.del(...keys), 300);
      }
    }
  } catch {
    reportRedisFailure();
  }
}

/**
 * High-Level Helper: Get from cache, or compute and cache
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const fresh = await fetcher();
  if (fresh !== null && fresh !== undefined) {
    await setCache(key, fresh, ttlSeconds);
  }

  return fresh;
}

/**
 * Invalidate all cached data for a specific store
 */
export async function invalidateStoreCache(storeId: string, slug?: string): Promise<void> {
  const tasks = [
    invalidateByPattern(`store:*${storeId}*`),
    invalidateByPattern(`categories:*${storeId}*`),
    invalidateByPattern(`products:*${storeId}*`)
  ];

  if (slug) {
    tasks.push(
      invalidateByPattern(`store:*${slug}*`),
      invalidateByPattern(`categories:*${slug}*`),
      invalidateByPattern(`products:*${slug}*`)
    );
  }

  await Promise.allSettled(tasks);
}
