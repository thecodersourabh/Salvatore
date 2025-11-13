/**
 * Global cache invalidation event system
 * Allows components to listen for cache changes and refresh data accordingly
 */

type CacheInvalidationEvent = {
  namespace?: string;
  identifier?: string;
  subKey?: string;
};

class CacheEventManager {
  private listeners: Map<string, Function[]> = new Map();

  // Subscribe to cache invalidation events
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emit cache invalidation event
  emit(eventType: string, data?: CacheInvalidationEvent): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Clear all listeners
  clear(): void {
    this.listeners.clear();
  }
}

// Global instance
export const cacheEventManager = new CacheEventManager();

// Event types
export const CACHE_EVENTS = {
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  PRODUCT_CREATED: 'product_created',
  USER_UPDATED: 'user_updated',
  ORDER_UPDATED: 'order_updated',
  CACHE_CLEARED: 'cache_cleared',
} as const;

// Convenience functions
export const emitProductUpdated = (productId: string) => {
  cacheEventManager.emit(CACHE_EVENTS.PRODUCT_UPDATED, { 
    namespace: 'product', 
    identifier: productId 
  });
};

export const emitProductDeleted = (productId: string) => {
  cacheEventManager.emit(CACHE_EVENTS.PRODUCT_DELETED, { 
    namespace: 'product', 
    identifier: productId 
  });
};

export const emitProductCreated = (productId?: string) => {
  cacheEventManager.emit(CACHE_EVENTS.PRODUCT_CREATED, { 
    namespace: 'product', 
    identifier: productId 
  });
};

export const emitCacheCleared = () => {
  cacheEventManager.emit(CACHE_EVENTS.CACHE_CLEARED);
};

// Subscription helpers
export const onProductUpdated = (callback: (data: CacheInvalidationEvent) => void) => 
  cacheEventManager.subscribe(CACHE_EVENTS.PRODUCT_UPDATED, callback);

export const onProductCreated = (callback: (data: CacheInvalidationEvent) => void) => 
  cacheEventManager.subscribe(CACHE_EVENTS.PRODUCT_CREATED, callback);

export const onProductDeleted = (callback: (data: CacheInvalidationEvent) => void) => 
  cacheEventManager.subscribe(CACHE_EVENTS.PRODUCT_DELETED, callback);

// Listen to any product change
export const onProductChanged = (callback: (eventType: string, data: CacheInvalidationEvent) => void) => {
  const unsubscribers = [
    onProductCreated((data) => callback('created', data)),
    onProductUpdated((data) => callback('updated', data)),
    onProductDeleted((data) => callback('deleted', data))
  ];
  
  return () => unsubscribers.forEach(unsub => unsub());
};