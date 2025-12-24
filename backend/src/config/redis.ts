import { createClient, RedisClientType } from 'redis';
import { env, isDevelopment } from './env';

/**
 * Redis Client Type
 */
export type RedisClient = RedisClientType;

/**
 * Redis client instance
 * Used for caching, session management, and rate limiting
 */
let redisClient: RedisClient | null = null;

/**
 * Create and configure Redis client
 *
 * Features:
 * - Automatic reconnection on connection loss
 * - Error handling with logging
 * - Connection event listeners
 *
 * @returns Configured Redis client instance
 */
export async function createRedisClient(): Promise<RedisClient> {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        // Exponential backoff: 50ms, 100ms, 200ms, ... up to 3000ms
        if (retries > 10) {
          console.error('❌ Redis: Max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        const delay = Math.min(retries * 50, 3000);
        console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
        return delay;
      },
    },
  });

  // Event listeners for connection monitoring
  client.on('connect', () => {
    console.log('✅ Redis: Connected');
  });

  client.on('ready', () => {
    console.log('✅ Redis: Ready to accept commands');
  });

  client.on('error', (err) => {
    console.error('❌ Redis error:', err);
  });

  client.on('reconnecting', () => {
    console.log('🔄 Redis: Reconnecting...');
  });

  client.on('end', () => {
    console.log('⚠️  Redis: Connection closed');
  });

  try {
    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Get the Redis client instance
 * Creates a new client if one doesn't exist
 *
 * @returns Active Redis client
 */
export async function getRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    return await createRedisClient();
  }
  return redisClient;
}

/**
 * Gracefully disconnect Redis client
 * Call this during application shutdown
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis: Disconnected');
  }
}

/**
 * Test Redis connection
 * Useful for health checks
 *
 * @returns true if connection is successful, false otherwise
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

/**
 * Cache Helper Functions
 */

/**
 * Set a value in cache with optional TTL
 *
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttlSeconds - Time to live in seconds (optional)
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const client = await getRedisClient();
  const serialized = JSON.stringify(value);

  if (ttlSeconds) {
    await client.setEx(key, ttlSeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
}

/**
 * Get a value from cache
 *
 * @param key - Cache key
 * @returns Parsed value or null if not found
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const value = await client.get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to parse cached value for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a value from cache
 *
 * @param key - Cache key
 */
export async function cacheDel(key: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(key);
}

/**
 * Delete multiple keys from cache
 *
 * @param pattern - Key pattern (e.g., "user:*")
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = await getRedisClient();
  const keys = await client.keys(pattern);

  if (keys.length > 0) {
    await client.del(keys);
  }
}

/**
 * Check if a key exists in cache
 *
 * @param key - Cache key
 * @returns true if key exists, false otherwise
 */
export async function cacheExists(key: string): Promise<boolean> {
  const client = await getRedisClient();
  const exists = await client.exists(key);
  return exists === 1;
}

/**
 * Set cache expiry for a key
 *
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 */
export async function cacheExpire(key: string, ttlSeconds: number): Promise<void> {
  const client = await getRedisClient();
  await client.expire(key, ttlSeconds);
}
