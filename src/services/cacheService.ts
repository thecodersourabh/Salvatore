/**
 * Simple cache service with in-memory store and optional localStorage persistence.
 * - set/get/delete/clear
 * - TTL (milliseconds)
 * - optional persistence for JSON-serializable values
 */
interface CacheEntry {
  value: any;
  expiresAt?: number;
}

const PERSIST_PREFIX = 'app_cache_v1:';

class CacheService {
  private store: Map<string, CacheEntry> = new Map();

  constructor() {
    this.loadPersisted();
  }

  private loadPersisted() {
    try {
      if (typeof localStorage === 'undefined') return;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!key.startsWith(PERSIST_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          // parsed should be { value, expiresAt }
          if (parsed && parsed.expiresAt && Date.now() > parsed.expiresAt) {
            localStorage.removeItem(key);
            continue;
          }
          const cacheKey = key.slice(PERSIST_PREFIX.length);
          this.store.set(cacheKey, parsed);
        } catch (e) {
          // ignore parse errors
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // localStorage may be unavailable in some environments; ignore
    }
  }

  set(key: string, value: any, ttlMs?: number, persist: boolean = false) {
    const entry: CacheEntry = { value };
    if (typeof ttlMs === 'number') {
      entry.expiresAt = Date.now() + ttlMs;
    }
    this.store.set(key, entry);

    if (persist) {
      try {
        const toStore = JSON.stringify(entry);
        localStorage.setItem(PERSIST_PREFIX + key, toStore);
      } catch (e) {
        // value not serializable or localStorage unavailable — ignore
      }
    }
  }

  get<T = any>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    return entry.value as T;
  }

  delete(key: string) {
    this.store.delete(key);
    try {
      localStorage.removeItem(PERSIST_PREFIX + key);
    } catch (e) {
      // ignore
    }
  }

  clear() {
    this.store.clear();
    try {
      // remove persisted keys
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PERSIST_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  }
}

export const cacheService = new CacheService();

export default cacheService;
