import React from 'react';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  AlertCircle,
  XCircle,
  Settings,
  Play,
  MapPin
} from 'lucide-react';
import { OrderStatus } from '../types/order';

interface OrderStep {
  key: OrderStatus;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface OrderTrackerProps {
  currentStatus: OrderStatus;
  className?: string;
  createdAt?: string;
  scheduledDate?: string;
  completedAt?: string;
}

const ORDER_STEPS: OrderStep[] = [
  {
    key: 'pending',
    label: 'Order Placed',
    description: 'Your order has been received and is awaiting confirmation',
    icon: Package
  },
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    description: 'Service provider has confirmed your order',
    icon: CheckCircle
  },
  {
    key: 'processing',
    label: 'Preparing',
    description: 'Order is being prepared for service delivery',
    icon: Settings
  },
  {
    key: 'in-progress',
    label: 'In Progress',
    description: 'Service is currently being executed',
    icon: Play
  },
  {
    key: 'ready',
    label: 'Ready',
    description: 'Service is ready for delivery or pickup',
    icon: MapPin
  },
  {
    key: 'completed',
    label: 'Completed',
    description: 'Order has been successfully completed',
    icon: CheckCircle
  }
];

const TERMINAL_STATES: OrderStatus[] = ['cancelled', 'rejected'];

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  currentStatus,
  className = '',
  createdAt,
  scheduledDate,
  completedAt
}) => {
  // Determine the current step index
  const getCurrentStepIndex = (): number => {
    if (TERMINAL_STATES.includes(currentStatus)) {
      return -1; // Special case for terminal states
    }
    
    const stepIndex = ORDER_STEPS.findIndex(step => step.key === currentStatus);
    return stepIndex !== -1 ? stepIndex : 0;
  };

  const currentStepIndex = getCurrentStepIndex();
  const isTerminalState = TERMINAL_STATES.includes(currentStatus);

  // Get status color and icon for terminal states
  const getTerminalStateInfo = (status: OrderStatus) => {
    switch (status) {
      case 'cancelled':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
          icon: AlertCircle,
          label: 'Order Cancelled',
          description: 'This order has been cancelled'
        };
      case 'rejected':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900',
          borderColor: 'border-red-300 dark:border-red-700',
          icon: XCircle,
          label: 'Order Rejected',
          description: 'This order has been rejected by the service provider'
        };
      default:
        return null;
    }
  };

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (isTerminalState) {
      return stepIndex === 0 ? 'completed' : 'upcoming';
    }
    
    if (stepIndex < currentStepIndex) {
      return 'completed';
    } else if (stepIndex === currentStepIndex) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  const getStepStyles = (status: 'completed' | 'current' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return {
          iconBg: 'bg-green-500',
          iconColor: 'text-white',
          line: 'bg-green-500',
          textColor: 'text-gray-900 dark:text-white',
          descColor: 'text-gray-600 dark:text-gray-300'
        };
      case 'current':
        return {
          iconBg: 'bg-rose-500',
          iconColor: 'text-white',
          line: 'bg-gray-300 dark:bg-gray-600',
          textColor: 'text-rose-600 dark:text-rose-400',
          descColor: 'text-rose-600 dark:text-rose-400'
        };
      case 'upcoming':
        return {
          iconBg: 'bg-gray-300 dark:bg-gray-600',
          iconColor: 'text-gray-500 dark:text-gray-400',
          line: 'bg-gray-300 dark:bg-gray-600',
          textColor: 'text-gray-500 dark:text-gray-400',
          descColor: 'text-gray-400 dark:text-gray-500'
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString();
  };

  if (isTerminalState) {
    const terminalInfo = getTerminalStateInfo(currentStatus);
    if (!terminalInfo) return null;

    const { color, bgColor, borderColor, icon: Icon, label, description } = terminalInfo;

    return (
      <div className={`${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-rose-600" />
            <span className="hidden sm:inline">Order Status Tracking</span>
            <span className="sm:hidden">Order Status</span>
          </h3>
          
          <div className={`rounded-lg border ${borderColor} ${bgColor} p-3 sm:p-4`}>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative group">
                <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full ${bgColor} border-2 ${borderColor} flex items-center justify-center cursor-pointer`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
                </div>
                
                {/* Tooltip - hidden on mobile for better UX */}
                <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-gray-300 dark:text-gray-400 mt-1">{description}</div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className={`text-base sm:text-lg font-semibold ${color}`}>{label}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                {createdAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Order placed: {formatDate(createdAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
          <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-rose-600" />
          <span className="hidden sm:inline">Order Status Tracking</span>
          <span className="sm:hidden">Order Status</span>
        </h3>
        
        {/* Desktop: Horizontal Progress Bar */}
        <div className="hidden md:block">
          <div className="relative flex items-center justify-between">
            {ORDER_STEPS.map((step, index) => {
              const stepStatus = getStepStatus(index);
              const styles = getStepStyles(stepStatus);
              const Icon = step.icon;
              const isLastStep = index === ORDER_STEPS.length - 1;

              return (
                <div key={step.key} className="flex flex-col items-center relative flex-1">
                  {/* Connection line to next step */}
                  {!isLastStep && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-0.5 z-0 ${
                        getStepStatus(index + 1) === 'completed' || stepStatus === 'completed'
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      style={{ 
                        left: '50%', 
                        right: '-50%',
                        transform: 'translateY(-50%)'
                      }}
                    />
                  )}
                  
                  {/* Step icon with tooltip */}
                  <div className="relative group z-10">
                    <div
                      className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm cursor-pointer transition-transform hover:scale-110`}
                    >
                      {stepStatus === 'completed' ? (
                        <CheckCircle className="h-6 w-6 text-white" />
                      ) : (
                        <Icon className={`h-6 w-6 ${styles.iconColor}`} />
                      )}
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                      <div className="font-medium">{step.label}</div>
                      <div className="text-xs text-gray-300 dark:text-gray-400 mt-1">{step.description}</div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                  
                  {/* Step label */}
                  <div className="mt-3 text-center">
                    <div className={`text-xs font-medium ${styles.textColor}`}>
                      {step.label}
                    </div>
                    {stepStatus === 'current' && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                          Current
                        </span>
                      </div>
                    )}
                    
                    {/* Timestamps */}
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {stepStatus === 'completed' && step.key === 'pending' && createdAt && (
                        <div>✓ {formatDate(createdAt)?.split(' ')[0]}</div>
                      )}
                      {stepStatus === 'completed' && step.key === 'completed' && completedAt && (
                        <div>✓ {formatDate(completedAt)?.split(' ')[0]}</div>
                      )}
                      {stepStatus === 'current' && step.key === 'confirmed' && scheduledDate && (
                        <div className="text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(scheduledDate)?.split(' ')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: Vertical Progress Bar */}
        <div className="md:hidden">
          <div className="relative">
            {ORDER_STEPS.map((step, index) => {
              const stepStatus = getStepStatus(index);
              const styles = getStepStyles(stepStatus);
              const Icon = step.icon;
              const isLastStep = index === ORDER_STEPS.length - 1;

              return (
                <div key={step.key} className="relative pb-6 last:pb-0">
                  {/* Vertical connection line */}
                  {!isLastStep && (
                    <div 
                      className={`absolute left-5 top-10 w-0.5 ${
                        getStepStatus(index + 1) === 'completed' || stepStatus === 'completed'
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      } z-0`}
                      style={{
                        height: 'calc(100% + 0.5rem)',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  )}
                  
                  <div className="flex items-start space-x-3">
                    {/* Step icon */}
                    <div className="flex-shrink-0 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm`}
                      >
                        {stepStatus === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
                        )}
                      </div>
                    </div>
                  
                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${styles.textColor}`}>
                        {step.label}
                      </h4>
                      {stepStatus === 'current' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-xs mt-1 ${styles.descColor}`}>
                      {step.description}
                    </p>
                    
                    {/* Mobile timestamps */}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {stepStatus === 'completed' && step.key === 'pending' && createdAt && (
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          Completed: {formatDate(createdAt)}
                        </div>
                      )}
                      {stepStatus === 'completed' && step.key === 'completed' && completedAt && (
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          Completed: {formatDate(completedAt)}
                        </div>
                      )}
                      {stepStatus === 'current' && step.key === 'confirmed' && scheduledDate && (
                        <div className="flex items-center text-rose-600 dark:text-rose-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Scheduled: {formatDate(scheduledDate)}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Order timeline footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0">
            <span>Order placed: {formatDate(createdAt)}</span>
            {scheduledDate && (
              <span>Scheduled: {formatDate(scheduledDate)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;