import React from 'react';
import { RESPONSIVE_CONTAINERS, RESPONSIVE_SPACING } from '../../utils/responsive';
export * from './VerificationBadge';
export * from './NetworkErrorMessage';
export * from './MobileSelect';

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  message 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-rose-600 border-t-transparent ${sizeClasses[size]}`} />
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

// Responsive container component
interface ContainerProps {
  children: React.ReactNode;
  size?: 'page' | 'section' | 'content' | 'narrow';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  size = 'page', 
  className = '' 
}) => {
  const containerClass = RESPONSIVE_CONTAINERS[size];
  
  return (
    <div className={`${containerClass} ${className}`}>
      {children}
    </div>
  );
};

// Responsive card component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'compact' | 'normal' | 'large';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'normal',
  hover = false
}) => {
  const paddingClasses = {
    compact: RESPONSIVE_SPACING.padding.compact,
    normal: RESPONSIVE_SPACING.padding.card,
    large: RESPONSIVE_SPACING.padding.page,
  };

  const hoverClass = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid component
interface GridProps {
  children: React.ReactNode;
  columns?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  columns = { base: 1, md: 2, lg: 3 },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-2 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  const colClasses = [
    `grid-cols-${columns.base || 1}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${colClasses} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive button component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-rose-600 text-white hover:bg-rose-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm sm:text-base',
    lg: 'px-6 py-3 text-base sm:text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
};

// Responsive heading component
interface HeadingProps {
  children: React.ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  responsive?: boolean;
}

export const Heading: React.FC<HeadingProps> = ({ 
  children, 
  level, 
  className = '',
  responsive = true 
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const responsiveClasses = responsive ? {
    1: 'text-responsive-3xl font-bold',
    2: 'text-responsive-2xl font-bold',
    3: 'text-responsive-xl font-semibold',
    4: 'text-responsive-lg font-semibold',
    5: 'text-responsive-base font-medium',
    6: 'text-responsive-sm font-medium'
  } : {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-bold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-semibold',
    5: 'text-base font-medium',
    6: 'text-sm font-medium'
  };

  return (
    <Tag className={`${responsiveClasses[level]} text-gray-900 ${className}`}>
      {children}
    </Tag>
  );
};

// Error message component
interface ErrorMessageProps {
  message: string;
  className?: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  className = '',
  onDismiss 
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-red-400 hover:text-red-600 focus-ring-inset"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
