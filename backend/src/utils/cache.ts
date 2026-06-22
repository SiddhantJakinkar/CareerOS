import { getRedis } from '../config/redis.js';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryStore = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const CacheTTL = {
  SHORT: 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
} as const;

function memoryGet<T>(key: string): T | undefined {
  const entry = memoryStore.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function memorySet<T>(key: string, value: T, ttlMs: number): void {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function redisGet<T>(key: string): Promise<T | undefined> {
  const redis = getRedis();
  if (!redis) return undefined;
  const raw = await redis.get(`cache:${key}`);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

async function redisSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(`cache:${key}`, JSON.stringify(value), { PX: ttlMs });
}

async function redisDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`cache:${key}`);
}

async function redisDelPrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const pattern = `cache:${prefix}*`;
  let cursor = '0';
  do {
    const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = result.cursor;
    if (result.keys.length) await redis.del(result.keys);
  } while (cursor !== '0');
}

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  const redis = getRedis();
  if (redis) return redisGet<T>(key);
  return memoryGet<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redisSet(key, value, ttlMs);
    return;
  }
  memorySet(key, value, ttlMs);
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== undefined) return cached;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = factory()
    .then(async (value) => {
      await cacheSet(key, value, ttlMs);
      inflight.delete(key);
      return value;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

export async function cacheDel(key: string): Promise<void> {
  inflight.delete(key);
  const redis = getRedis();
  if (redis) {
    await redisDel(key);
    return;
  }
  memoryStore.delete(key);
}

export async function cacheDelPrefix(prefix: string): Promise<void> {
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
  const redis = getRedis();
  if (redis) {
    await redisDelPrefix(prefix);
    return;
  }
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
}

export const CacheKey = {
  assessmentHub: (userId: string) => `hub:${userId}`,
  assessmentTest: (testId: string) => `test:${testId}`,
  assessmentCatalog: () => 'catalog:tests',
  profile: (userId: string) => `profile:${userId}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  notifUnread: (userId: string) => `notif:unread:${userId}`,
  interviewDomains: (userId: string) => `interview:domains:${userId}`,
};

export async function invalidateUserCaches(userId: string): Promise<void> {
  await cacheDel(CacheKey.assessmentHub(userId));
  await cacheDel(CacheKey.profile(userId));
  await cacheDel(CacheKey.dashboard(userId));
  await cacheDel(CacheKey.notifUnread(userId));
  await cacheDel(CacheKey.interviewDomains(userId));
}

export async function invalidateAssessmentCatalog(): Promise<void> {
  await cacheDel(CacheKey.assessmentCatalog());
  await cacheDelPrefix('hub:');
  await cacheDelPrefix('test:');
}
