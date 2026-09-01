import Redis from "ioredis";

let redisInstance: Redis | null = null;
let isHealthy = false;
let lastFailureTime = 0;
const COOLDOWN_MS = 60000; // 60s cooldown if Redis fails/times out

export function getRedis(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  const now = Date.now();

  // If in cooldown after a failure, don't attempt to use Redis
  if (!isHealthy && lastFailureTime > 0 && now - lastFailureTime < COOLDOWN_MS) {
    return null;
  }

  if (redisInstance) {
    return redisInstance;
  }

  try {
    redisInstance = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 1000,
      commandTimeout: 1000,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });

    redisInstance.on("connect", () => {
      isHealthy = true;
      lastFailureTime = 0;
    });

    redisInstance.on("ready", () => {
      isHealthy = true;
      lastFailureTime = 0;
    });

    redisInstance.on("error", () => {
      isHealthy = false;
      lastFailureTime = Date.now();
    });

    redisInstance.on("close", () => {
      isHealthy = false;
    });
  } catch {
    redisInstance = null;
    isHealthy = false;
    lastFailureTime = Date.now();
  }

  return redisInstance;
}

export function reportRedisFailure(): void {
  isHealthy = false;
  lastFailureTime = Date.now();
}

export function isRedisHealthy(): boolean {
  return isHealthy;
}
