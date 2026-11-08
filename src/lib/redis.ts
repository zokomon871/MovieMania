import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6389';
let redisClient: Redis | null = null;
let isRedisAvailable = true;

export function getRedisClient(): Redis | null {
  if (!isRedisAvailable) return null;
  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 3) {
            console.warn('[Redis] Max retries reached. Cache bypass mode enabled.');
            isRedisAvailable = false;
            return null;
          }
          return Math.min(times * 100, 1000);
        },
      });

      redisClient.on('error', (err) => {
        console.warn('[Redis] Connection warning:', err.message);
      });

      redisClient.on('connect', () => {
        isRedisAvailable = true;
        console.log('[Redis] Connected successfully.');
      });
    } catch {
      isRedisAvailable = false;
      return null;
    }
  }
  return redisClient;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setCachedJson(key: string, data: unknown, ttlSeconds = 18000): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.warn(`[Redis] Failed setting cache key ${key}:`, err);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`[Redis] Invalidate error for ${pattern}:`, err);
  }
}

