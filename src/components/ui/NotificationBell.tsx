import React from 'react';
import { Bell, BellDot } from 'lucide-react';

export interface NotificationBellProps {
  /** Number of unread notifications */
  count?: number;
  /** Maximum count to display before showing "99+" */
  maxCount?: number;
  /** Size of the bell icon */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual variant */
  variant?: 'default' | 'solid' | 'ghost';
  /** Color scheme */
  color?: 'default' | 'primary' | 'danger' | 'warning';
  /** Whether to show a dot indicator instead of count */
  showDot?: boolean;
  /** Whether the bell is in an active/ringing state */
  isActive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Accessibility label */
  ariaLabel?: string;
  /** Whether to animate the bell when there are notifications */
  animate?: boolean;
  /** Custom badge content instead of count */
  customBadge?: React.ReactNode;
  /** Position of the badge */
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  maxCount = 99,
  size = 'md',
  variant = 'default',
  color = 'default',
  showDot = false,
  isActive = false,
  className = '',
  onClick,
  ariaLabel,
  animate = true,
  customBadge,
  badgePosition = 'top-right'
}) => {
  // Size classes for the bell icon
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  // Color classes for different states
  const colorClasses = {
    default: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
    primary: 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300',
    danger: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
    warning: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
  };

  // Variant classes
  const variantClasses = {
    default: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    solid: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
    ghost: 'hover:bg-gray-50 dark:hover:bg-gray-800'
  };

  // Badge position classes
  const badgePositionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  // Determine if we should show a badge
  const hasNotifications = count > 0;
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  // Determine which icon to use
  const BellIcon = hasNotifications && !showDot ? BellDot : Bell;

  // Animation classes
  const animationClasses = animate && hasNotifications 
    ? 'animate-pulse' 
    : '';

  const bellClasses = `
    ${sizeClasses[size]}
    ${colorClasses[color]}
    ${animationClasses}
    transition-colors duration-200
  `.trim();

  const buttonClasses = `
    relative p-2 rounded-full transition-all duration-200 
    ${variantClasses[variant]}
    ${isActive ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : ''}
    ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800' : ''}
    ${className}
  `.trim();

  const content = (
    <>
      <BellIcon className={bellClasses} />
      
      {/* Badge */}
      {(hasNotifications || customBadge) && (
        <span
          className={`
            absolute ${badgePositionClasses[badgePosition]}
            ${customBadge ? '' : 'min-w-[1.25rem] h-5'}
            flex items-center justify-center
            ${showDot ? 'w-2 h-2' : 'px-1'}
            text-xs font-medium text-white 
            ${color === 'danger' ? 'bg-red-600' : 
              color === 'warning' ? 'bg-amber-500' : 
              color === 'primary' ? 'bg-rose-600' : 'bg-red-600'}
            rounded-full shadow-sm
            ${animate && hasNotifications ? 'animate-bounce' : ''}
          `.trim()}
          style={{ 
            fontSize: showDot ? '0' : undefined,
            minWidth: showDot ? '8px' : undefined,
            height: showDot ? '8px' : undefined
          }}
        >
          {customBadge || (!showDot && displayCount)}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={buttonClasses}
        onClick={onClick}
        aria-label={ariaLabel || `${count} notifications`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={buttonClasses}>
      {content}
    </div>
  );
};

// Export default
export default NotificationBell;