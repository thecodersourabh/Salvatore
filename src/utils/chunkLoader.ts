/**
 * Utility for handling dynamic imports with retry logic and cache busting
 */

interface RetryOptions {
  retries?: number;
  delay?: number;
}

/**
 * Retry a dynamic import with cache busting if it fails
 */
export async function retryDynamicImport<T>(
  importFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 2, delay = 1000 } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      
      // If this is a chunk loading error, try to bust the cache
      if (isChunkLoadError(error)) {
        console.warn(`Chunk load failed (attempt ${attempt + 1}/${retries + 1}):`, error);
        
        if (attempt < retries) {
          // Add a small delay before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Force a cache refresh on the last retry
          if (attempt === retries - 1) {
            await bustCache();
          }
        }
      } else {
        // If it's not a chunk load error, don't retry
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Dynamic import failed after retries');
}

/**
 * Check if an error is related to chunk loading
 */
function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  return (
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading css chunk') ||
    message.includes('networkerror') ||
    message.includes('content security policy')
  );
}

/**
 * Bust the browser cache by reloading the page
 */
async function bustCache(): Promise<void> {
  try {
    // Try to clear caches if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  } catch (error) {
    console.warn('Failed to clear caches:', error);
  }
  
  // Force reload the page to get fresh chunks
  window.location.reload();
}

/**
 * Enhanced lazy loading with retry logic
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: RetryOptions
) {
  return React.lazy(() => retryDynamicImport(importFn, options));
}

// Need React import for the lazy function
import React from 'react';