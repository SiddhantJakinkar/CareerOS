type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const CacheTTL = {
  SHORT: 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
} as const;

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Read-through cache with in-flight deduplication (parallel requests share one DB call). */
export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) return cached;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = factory()
    .then((value) => {
      cacheSet(key, value, ttlMs);
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

export function cacheDel(key: string): void {
  store.delete(key);
  inflight.delete(key);
}

export function cacheDelPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
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

export function invalidateUserCaches(userId: string): void {
  cacheDel(CacheKey.assessmentHub(userId));
  cacheDel(CacheKey.profile(userId));
  cacheDel(CacheKey.dashboard(userId));
  cacheDel(CacheKey.notifUnread(userId));
  cacheDel(CacheKey.interviewDomains(userId));
}

export function invalidateAssessmentCatalog(): void {
  cacheDel(CacheKey.assessmentCatalog());
  cacheDelPrefix('hub:');
  cacheDelPrefix('test:');
}
