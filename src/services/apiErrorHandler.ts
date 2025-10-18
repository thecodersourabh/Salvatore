export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export enum ErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

interface ErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

export class ApiErrorHandler {
  static isNetworkError(error: Error): boolean {
    return !navigator.onLine || 
           error.message === 'Failed to fetch' ||
           error.message.includes('NetworkError') ||
           error.message.includes('Network request failed');
  }

  static async handleResponseError(response: Response): Promise<never> {
    let errorData: ErrorResponse = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData.message = await response.text();
      }
    } catch {
      errorData.message = 'Failed to parse error response';
    }

    const message = errorData.message || errorData.error || 'An error occurred';
    
    switch (response.status) {
      case 401:
      case 403:
        throw new ApiError(
          'You are not authorized to perform this action. Please login and try again.',
          response.status,
          ErrorType.AUTH,
          errorData.details
        );
      case 404:
        throw new ApiError(
          'The requested resource was not found.',
          response.status,
          ErrorType.SERVER,
          errorData.details
        );
      case 422:
        throw new ApiError(
          message,
          response.status,
          ErrorType.VALIDATION,
          errorData.details
        );
      case 500:
      case 502:
      case 503:
      case 504: {
        // Prefer any server-provided message, but fall back to a generic server error.
        const serverMessage = errorData.message || errorData.error || 'Server error. Please try again later.';
        throw new ApiError(
          serverMessage,
          response.status,
          ErrorType.SERVER,
          errorData.details
        );
      }
      default:
        throw new ApiError(
          message,
          response.status,
          ErrorType.UNKNOWN,
          errorData.details
        );
    }
  }

  static handleError(error: unknown): never {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (this.isNetworkError(error)) {
        throw new ApiError(
          'Unable to connect to the server. Please check your internet connection and try again.',
          undefined,
          ErrorType.NETWORK
        );
      }
      
      throw new ApiError(
        error.message || 'An unexpected error occurred',
        undefined,
        ErrorType.UNKNOWN
      );
    }

    throw new ApiError(
      'An unexpected error occurred',
      undefined,
      ErrorType.UNKNOWN
    );
  }
}