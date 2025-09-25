import { ApiError, ApiErrorHandler, ErrorType } from './apiErrorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  body?: any;
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
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    cleanEndpoint += `?${searchParams.toString()}`;
  }
  return `${baseUrl}${cleanEndpoint}`;
};

const makeRequest = async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  try {
    if (!navigator.onLine) {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet connection and try again.',
        undefined,
        ErrorType.NETWORK
      );
    }

    const { params, ...init } = options;
    const url = buildUrl(endpoint, params);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
        ...init,
      });
      return await handleResponse<T>(response);
    } catch (fetchError) {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet connection and try again.',
        undefined,
        ErrorType.NETWORK
      );
    }
  } catch (error) {
    throw ApiErrorHandler.handleError(error);
  }
};

export const api: ApiInstance = {
  get: async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    return makeRequest<T>(url, { ...options, method: 'GET' });
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
