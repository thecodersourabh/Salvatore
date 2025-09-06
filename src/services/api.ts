const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-lambda-function-url.com'; // Replace with your actual Lambda Function URL

interface ApiOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  body?: any;
}

interface ApiInstance {
  get: <T>(url: string, options?: ApiOptions) => Promise<T>;
  post: <T>(url: string, data: any, options?: ApiOptions) => Promise<T>;
  put: <T>(url: string, data: any, options?: ApiOptions) => Promise<T>;
  delete: <T>(url: string, options?: ApiOptions) => Promise<T>;
}

export const api: ApiInstance = {
  get: async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    return ApiService.makeRequest(url, { ...options, method: 'GET' });
  },
  post: async <T>(url: string, data: any, options: ApiOptions = {}): Promise<T> => {
    return ApiService.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data,
    });
  },
  put: async <T>(url: string, data: any, options: ApiOptions = {}): Promise<T> => {
    return ApiService.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data,
    });
  },
  delete: async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    return ApiService.makeRequest(url, { ...options, method: 'DELETE' });
  },
};

export class ApiService {
  public static async makeRequest<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const { params, ...init } = options;
    
    // Remove trailing slash from base URL and leading slash from endpoint to avoid double slashes
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
    
    const url = `${baseUrl}${cleanEndpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
      ...init,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}
