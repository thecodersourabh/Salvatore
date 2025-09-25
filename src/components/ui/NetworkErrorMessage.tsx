import React, { useState, useEffect, useCallback } from 'react';
import { IonIcon } from '@ionic/react';
import { 
  cloudOfflineOutline, 
  serverOutline,
  lockClosedOutline,
  alertCircleOutline 
} from 'ionicons/icons';
import { ErrorType } from '../../services/apiErrorHandler';

interface NetworkErrorMessageProps {
  className?: string;
  onRetry?: () => void;
  error?: {
    type: ErrorType;
    message: string;
  };
}

export const NetworkErrorMessage: React.FC<NetworkErrorMessageProps> = ({ 
  className = '',
  onRetry,
  error = {
    type: ErrorType.NETWORK,
    message: 'Please check your internet connection and try again.'
  }
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onRetry) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onRetry]);

  const handleClose = useCallback(() => {
    if (onRetry) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        onRetry();
      }, 200);
    }
  }, [onRetry]);

  const getErrorIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return cloudOfflineOutline;
      case ErrorType.SERVER:
        return serverOutline;
      case ErrorType.AUTH:
        return lockClosedOutline;
      default:
        return alertCircleOutline;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Unable to Connect';
      case ErrorType.SERVER:
        return 'Server Error';
      case ErrorType.AUTH:
        return 'Authentication Error';
      case ErrorType.VALIDATION:
        return 'Validation Error';
      default:
        return 'Error';
    }
  };

  const getButtonColor = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'rose';
      case ErrorType.SERVER:
        return 'orange';
      case ErrorType.AUTH:
        return 'blue';
      default:
        return 'gray';
    }
  };

  const color = getButtonColor();

  if (!isVisible) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-title"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        } bg-black bg-opacity-50 backdrop-blur-sm`}
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-200 ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          } ${className}`}
        >
          {/* Header */}
          <div className={`bg-${color}-50 p-6 rounded-t-xl border-b border-${color}-100`}>
            <div className="flex items-center space-x-3">
              <div className={`bg-${color}-100 rounded-full p-3`}>
                <IonIcon icon={getErrorIcon()} className={`h-8 w-8 text-${color}-600`} />
              </div>
              <h3 id="error-title" className={`text-xl font-semibold text-${color}-900`}>
                {getErrorTitle()}
              </h3>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-base text-gray-600 mb-6">
              <p>{error.message}</p>
              {error.type === ErrorType.NETWORK && (
                <ul className="mt-4 list-disc list-inside space-y-2 text-sm">
                  <li>Check your internet connection</li>
                  <li>Verify your Wi-Fi or mobile data is enabled</li>
                  <li>Try refreshing the page</li>
                </ul>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className={`inline-flex items-center px-4 py-2 border-2 border-${color}-600 text-base font-medium rounded-lg text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500 transition-colors`}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};