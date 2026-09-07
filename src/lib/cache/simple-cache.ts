/**
 * In-memory TTL cache for profile reports / embeddings — cost optimization.
 */
type Entry = { value: unknown; exp: number };
const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) {
    store.delete(key);
    return null;
  }
  return e.value as T;
}

export function cacheSet(key: string, value: unknown, ttlSec = 300) {
  store.set(key, { value, exp: Date.now() + ttlSec * 1000 });
}

export function cacheDel(prefix: string) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
