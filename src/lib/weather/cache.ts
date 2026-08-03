type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

/** Default 30 minutes — override with WEATHER_CACHE_TTL_SECONDS */
export function getWeatherCacheTtlMs(): number {
  const raw = process.env.WEATHER_CACHE_TTL_SECONDS?.trim();
  const seconds = raw ? Number(raw) : 1800;
  if (!Number.isFinite(seconds) || seconds < 0) return 1800 * 1000;
  return seconds * 1000;
}

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs = getWeatherCacheTtlMs()): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** In-flight dedupe so parallel home-page fetches share one upstream call. */
const inflight = new Map<string, Promise<unknown>>();

export async function withCache<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = getWeatherCacheTtlMs(),
): Promise<T> {
  if (ttlMs === 0) {
    return loader();
  }

  const hit = getCached<T>(key);
  if (hit !== undefined) {
    return hit;
  }

  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = loader()
    .then((value) => {
      setCached(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
