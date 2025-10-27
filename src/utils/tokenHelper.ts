/**
 * Token Helper - Manages JWT token operations
 * 
 * Provides utilities for:
 * - Token expiration checking
 * - Silent token refresh
 * - Token storage management
 */

// Token refresh callback - will be set by AuthContext
let tokenRefreshCallback: (() => Promise<string | null>) | null = null;

export const setTokenRefreshCallback = (callback: () => Promise<string | null>) => {
  tokenRefreshCallback = callback;
};

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshingToken = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Decode JWT to check expiration without verification
 * @param token - JWT token string
 * @returns true if token is expired or will expire within 60 seconds
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) return true;
    
    // Check if token expires in the next 60 seconds (add buffer)
    const expirationTime = exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = 60 * 1000; // 60 second buffer
    
    return currentTime >= (expirationTime - bufferTime);
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat as expired if we can't decode
  }
};

/**
 * Get token from localStorage
 * @param customToken - Optional custom token to use instead of stored token
 * @returns Token string or null
 */
export const getStoredToken = (customToken?: string): string | null => {
  return customToken || localStorage.getItem('auth_id_token') || localStorage.getItem('id_token');
};

/**
 * Store token in localStorage
 * @param token - Token string to store
 */
export const storeToken = (token: string): void => {
  localStorage.setItem('id_token', token);
  localStorage.setItem('auth_id_token', token);
};

/**
 * Clear token from localStorage
 */
export const clearToken = (): void => {
  localStorage.removeItem('id_token');
  localStorage.removeItem('auth_id_token');
};

/**
 * Refresh token silently using Auth0
 * @returns Promise with new token or null if refresh failed
 */
export const refreshTokenSilently = async (): Promise<string | null> => {
  // If already refreshing, wait for that promise
  if (isRefreshingToken && refreshPromise) {
    return refreshPromise;
  }

  isRefreshingToken = true;
  refreshPromise = (async () => {
    try {
      console.log('🔄 Refreshing token silently...');
      
      if (!tokenRefreshCallback) {
        console.warn('⚠️ Token refresh callback not set');
        return null;
      }

      const newToken = await tokenRefreshCallback();
      
      if (newToken) {
        storeToken(newToken);
        console.log('✅ Token refreshed successfully');
        return newToken;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return null;
    } finally {
      isRefreshingToken = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Check if token needs refresh and refresh if necessary
 * @param token - Current token
 * @returns Promise with valid token (refreshed if needed)
 */
export const ensureValidToken = async (token: string | null): Promise<string | null> => {
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    console.log('🔐 Token is expired, refreshing before API call...');
    const newToken = await refreshTokenSilently();
    if (newToken) {
      console.log('✅ Using refreshed token for API call');
      return newToken;
    } else {
      console.warn('⚠️ Token refresh failed, proceeding with expired token');
      return token;
    }
  }
  
  return token;
};
