import { BREAKPOINTS } from '../constants';

// Responsive utility functions

/**
 * Generate responsive class names for spacing
 */
export const getResponsivePadding = (sizes: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}) => {
  const { base = 'p-4', sm, md, lg, xl } = sizes;
  const classes = [base];
  
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  
  return classes.join(' ');
};

/**
 * Generate responsive class names for grid columns
 */
export const getResponsiveGrid = (columns: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}) => {
  const { base = 'grid-cols-1', sm, md, lg, xl } = columns;
  const classes = ['grid', base];
  
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  
  return classes.join(' ');
};

/**
 * Generate responsive text sizes
 */
export const getResponsiveText = (sizes: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}) => {
  const { base = 'text-base', sm, md, lg, xl } = sizes;
  const classes = [base];
  
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  
  return classes.join(' ');
};

/**
 * Common responsive container classes
 */
export const RESPONSIVE_CONTAINERS = {
  // Page containers
  page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
  content: 'max-w-4xl mx-auto px-4 sm:px-6',
  narrow: 'max-w-2xl mx-auto px-4 sm:px-6',
  
  // Card layouts
  cardGrid: 'grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  cardList: 'space-y-4 sm:space-y-6',
  
  // Form layouts
  formGrid: 'grid gap-6 sm:grid-cols-2',
  formSingle: 'max-w-md mx-auto',
  
  // Navigation
  nav: 'flex flex-col sm:flex-row items-center justify-between',
  navMobile: 'flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4',
};

/**
 * Common responsive spacing classes
 */
export const RESPONSIVE_SPACING = {
  // Padding
  padding: {
    page: 'p-4 sm:p-6 lg:p-8',
    section: 'py-8 sm:py-12 lg:py-16',
    card: 'p-4 sm:p-6',
    compact: 'p-2 sm:p-4',
  },
  
  // Margins
  margin: {
    section: 'mb-8 sm:mb-12 lg:mb-16',
    element: 'mb-4 sm:mb-6',
    compact: 'mb-2 sm:mb-4',
  },
  
  // Gaps
  gap: {
    grid: 'gap-4 sm:gap-6 lg:gap-8',
    list: 'space-y-4 sm:space-y-6',
    inline: 'space-x-2 sm:space-x-4',
  },
};

/**
 * Check if current viewport matches breakpoint
 */
export const isBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const breakpointValue = parseInt(BREAKPOINTS[breakpoint]);
  
  return width >= breakpointValue;
};

/**
 * Get current breakpoint
 */
export const getCurrentBreakpoint = (): keyof typeof BREAKPOINTS | 'XS' => {
  if (typeof window === 'undefined') return 'XS';
  
  const width = window.innerWidth;
  
  if (width >= parseInt(BREAKPOINTS['2XL'])) return '2XL';
  if (width >= parseInt(BREAKPOINTS.XL)) return 'XL';
  if (width >= parseInt(BREAKPOINTS.LG)) return 'LG';
  if (width >= parseInt(BREAKPOINTS.MD)) return 'MD';
  if (width >= parseInt(BREAKPOINTS.SM)) return 'SM';
  
  return 'XS';
};

/**
 * Check if device is mobile (below SM breakpoint)
 */
export const isMobile = (): boolean => {
  return !isBreakpoint('SM');
};

/**
 * Check if device is tablet (SM to LG)
 */
export const isTablet = (): boolean => {
  return isBreakpoint('SM') && !isBreakpoint('LG');
};

/**
 * Check if device is desktop (LG and above)
 */
export const isDesktop = (): boolean => {
  return isBreakpoint('LG');
};
