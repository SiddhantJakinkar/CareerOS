import { createClient, type RedisClientType } from 'redis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let client: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType | null> {
  if (!env.REDIS_URL) {
    logger.info('Redis not configured — using in-memory cache');
    return null;
  }

  try {
    client = createClient({ url: env.REDIS_URL });
    client.on('error', (err) => logger.error('Redis error', { err: String(err) }));
    await client.connect();
    logger.info('Redis connected');
    return client;
  } catch (error) {
    logger.warn('Redis connection failed — falling back to in-memory cache', { error });
    client = null;
    return null;
  }
}

export function getRedis(): RedisClientType | null {
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
