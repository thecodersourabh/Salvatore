import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

/**
 * Error boundary specifically designed to handle chunk loading failures
 * and provide user-friendly recovery options
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a chunk loading error
    const isChunkError = error.message?.toLowerCase().includes('loading chunk') ||
                        error.message?.toLowerCase().includes('failed to fetch dynamically imported module');
    
    return {
      hasError: true,
      error: isChunkError ? error : null,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo);
    
    // If it's a chunk loading error and we haven't exceeded retry limit, auto-retry
    if (this.isChunkLoadingError(error) && this.retryCount < this.maxRetries) {
      this.handleAutoRetry();
    }
  }

  private isChunkLoadingError(error: Error): boolean {
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('loading chunk') ||
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('loading css chunk')
    );
  }

  private handleAutoRetry = () => {
    this.retryCount++;
    this.setState({ isRetrying: true });
    
    // Wait a bit before retrying
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        isRetrying: false,
      });
    }, 1000);
  };

  private handleManualRetry = () => {
    // Reset retry count for manual retries
    this.retryCount = 0;
    this.setState({ isRetrying: true });
    
    // Clear any caches and reload
    this.clearCachesAndRetry();
  };

  private clearCachesAndRetry = async () => {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Reload the page to get fresh resources
      window.location.reload();
    } catch (error) {
      console.warn('Failed to clear caches:', error);
      // Just reload if cache clearing fails
      window.location.reload();
    }
  };

  render() {
    if (this.state.isRetrying) {
      return (
        <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">
              Retrying to load component...
            </p>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show chunk loading error UI
      if (this.state.error && this.isChunkLoadingError(this.state.error)) {
        return (
          <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-center max-w-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Loading Error
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Failed to load this component. This might be due to a network issue or outdated files.
              </p>
              <button
                onClick={this.handleManualRetry}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      // Generic error fallback
      return (
        <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              An unexpected error occurred.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use chunk error boundary in functional components
 */
export const useChunkErrorRecovery = () => {
  const [retryKey, setRetryKey] = React.useState(0);
  
  const retry = React.useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  return { retryKey, retry };
};

export default ChunkErrorBoundary;