/**
 * Generic caching mechanism for API data to reduce redundant calls across the app
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class GenericCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Create singleton instance
export const appCache = new GenericCache();

// Generic cache key generators
export const getCacheKey = (namespace: string, identifier: string, subKey?: string): string => {
  return subKey ? `${namespace}_${identifier}_${subKey}` : `${namespace}_${identifier}`;
};

// Generic helper functions
export const cacheData = <T>(
  namespace: string, 
  identifier: string, 
  data: T, 
  ttlMinutes: number = 5,
  subKey?: string
): void => {
  const key = getCacheKey(namespace, identifier, subKey);
  appCache.set(key, data, ttlMinutes);
};

export const getCachedData = <T>(
  namespace: string, 
  identifier: string, 
  subKey?: string
): T | null => {
  const key = getCacheKey(namespace, identifier, subKey);
  return appCache.get<T>(key);
};

export const invalidateCache = (
  namespace: string, 
  identifier?: string, 
  subKey?: string
): void => {
  if (identifier && subKey) {
    // Invalidate specific cache entry
    const key = getCacheKey(namespace, identifier, subKey);
    appCache.invalidate(key);
  } else if (identifier) {
    // Invalidate all cache entries for this namespace + identifier
    const pattern = `${namespace}_${identifier}`;
    appCache.invalidatePattern(pattern);
  } else {
    // Invalidate all cache entries for this namespace
    appCache.invalidatePattern(namespace);
  }
};

// Common cache namespaces
export const CACHE_NAMESPACES = {
  USER: 'user',
  PRODUCT: 'product',
  ORDER: 'order',
  SERVICE: 'service',
  NOTIFICATION: 'notification',
  TEAM: 'team',
  PROFILE: 'profile',
  STATS: 'stats',
  API: 'api',
} as const;

// Common TTL values (in minutes)
export const CACHE_TTL = {
  SHORT: 1,      // 1 minute - for frequently changing data
  MEDIUM: 5,     // 5 minutes - for moderately changing data
  LONG: 15,      // 15 minutes - for rarely changing data
  EXTENDED: 60,  // 1 hour - for static data
} as const;

// Auto cleanup every 5 minutes
setInterval(() => {
  appCache.cleanup();
}, 5 * 60 * 1000);