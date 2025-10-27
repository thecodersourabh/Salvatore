import { ApiError, ApiErrorHandler, ErrorType } from './apiErrorHandler';
import { cacheService } from './cacheService';
import { 
  refreshTokenSilently, 
  getStoredToken, 
  ensureValidToken 
} from '../utils/tokenHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to get current user ID with fallback
const getUserId = (): string => {
  return localStorage.getItem('x-user-id') || (window as any).__USER_ID__ ;
};

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  body?: any;
  // Optional caching controls for GET
  cacheOptions?: {
    ttlMs?: number; // time-to-live in ms. If omitted, caching disabled.
    persist?: boolean; // persist to localStorage
    force?: boolean; // force refresh and ignore cache
  } | null;
}

export interface ApiInstance {
  get: <T>(url: string, options?: ApiOptions) => Promise<T>;
  post: <T>(url: string, data: any, options?: ApiOptions) => Promise<T>;
  put: <T>(url: string, data: any, options?: ApiOptions) => Promise<T>;
  delete: <T>(url: string, options?: ApiOptions) => Promise<T>;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    await ApiErrorHandler.handleResponseError(response);
  }
  const contentType = response.headers.get('content-type');
  return contentType?.includes('application/json') ? response.json() : (response.text() as unknown as T);
};

const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  // If endpoint is a full URL, use it as-is
  let url = endpoint;
  if (!/^https?:\/\//i.test(endpoint)) {
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  }
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }
  return url;
};

const makeRequest = async <T>(endpoint: string, options: ApiOptions = {}, isRetryAfterRefresh = false): Promise<T> => {
  try {
    if (!navigator.onLine) {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet connection and try again.',
        undefined,
        ErrorType.NETWORK
      );
    }

  const { params, cacheOptions, ...init } = options as any;
    const url = buildUrl(endpoint, params);

    const method = ((init.method as string) || 'GET').toUpperCase();
    const isGet = method === 'GET';

    // Try cache for GET requests (only when ttl provided)
    if (isGet && cacheOptions && !cacheOptions.force && cacheOptions.ttlMs) {
      try {
        const cacheKey = `GET:${url}`;
        const cached = cacheService.get<any>(cacheKey);
        if (cached !== null && cached !== undefined) {
          return cached as T;
        }
      } catch (e) {
        // ignore cache errors and continue to fetch
      }
    }

    // Get token from localStorage (Auth0 default)
    let token = getStoredToken((init as any).idToken);

    // Check if token is expired and refresh if needed (only if not already retrying)
    if (token && !isRetryAfterRefresh) {
      token = await ensureValidToken(token);
    }

    // Always use a plain object for headers
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (init.headers) {
      if (init.headers instanceof Headers) {
        // Convert Headers object to plain object
        (init.headers as Headers).forEach((value, key) => {
          headers[key] = value;
        });
      } else if (typeof init.headers === 'object' && !Array.isArray(init.headers)) {
        headers = { ...headers, ...init.headers };
      }
      // If it's an array or other type, ignore for safety
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add x-request-id for request tracking and logs
    headers['x-request-id'] = crypto.randomUUID();

    // Add x-user-id if available from localStorage or global context
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    // Simple retry strategy for transient server/network errors
    const maxRetries = ((init as any).retryCount as number | undefined) ?? (isGet ? 0 : 1);
    let attempt = 0;
    while (true) {
      try {
        const response = await fetch(url, {
          headers,
          ...init,
        });

        // If successful, parse and return
        if (response.ok) {
          return await handleResponse<T>(response);
        }

        // Handle 401 Unauthorized - Token expired (fallback safety net)
        if (response.status === 401 && !isRetryAfterRefresh) {
          console.log('🔐 Received 401 - Token expired unexpectedly, attempting silent refresh...');
          
          const newToken = await refreshTokenSilently();
          
          if (newToken) {
            // Retry the request with the new token
            console.log('🔄 Retrying request with refreshed token...');
            return makeRequest<T>(endpoint, {
              ...options,
              idToken: newToken
            } as ApiOptions, true);
          } else {
            // Token refresh failed, proceed with error handling
            console.warn('⚠️ Token refresh failed, redirecting to login may be required');
          }
        }

        // For server errors, optionally retry
        if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
          attempt++;
          const backoff = 300 * attempt;
          await new Promise((res) => setTimeout(res, backoff));
          continue;
        }

        // No retry or non-server error - let handler throw the appropriate ApiError
        await ApiErrorHandler.handleResponseError(response);
      } catch (fetchError) {
        // Network-level error - retry if attempts left
        if (attempt < maxRetries) {
          attempt++;
          const backoff = 300 * attempt;
          await new Promise((res) => setTimeout(res, backoff));
          continue;
        }

        throw new ApiError(
          'Unable to connect to the server. Please check your internet connection and try again.',
          undefined,
          ErrorType.NETWORK
        );
      }
    }
  } catch (error) {
    throw ApiErrorHandler.handleError(error);
  }
};

export const api: ApiInstance = {
  get: async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    const opts = { ...options, method: 'GET' } as ApiOptions & { cacheOptions?: any };
    const result = await makeRequest<T>(url, opts);
    try {
      const cacheOpts = (opts as any).cacheOptions;
      if (cacheOpts && cacheOpts.ttlMs) {
        const cacheKey = `GET:${buildUrl(url, opts.params)}`;
        cacheService.set(cacheKey, result, cacheOpts.ttlMs, !!cacheOpts.persist);
      }
    } catch (e) {
      // ignore cache write errors
    }
    return result;
  },
  post: async <T>(url: string, data: any, options: ApiOptions = {}): Promise<T> => {
    return makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  put: async <T>(url: string, data: any, options: ApiOptions = {}): Promise<T> => {
    return makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    return makeRequest<T>(url, { ...options, method: 'DELETE' });
  },
};
