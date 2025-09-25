import React from 'react';
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

  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IonIcon icon={getErrorIcon()} className={`h-6 w-6 text-${color}-400`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium text-${color}-800`}>
            {getErrorTitle()}
          </h3>
          <div className={`mt-2 text-sm text-${color}-700`}>
            <p>{error.message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-2 border border-${color}-600 text-sm leading-4 font-medium rounded-md text-${color}-700 bg-${color}-50 hover:bg-${color}-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500`}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};