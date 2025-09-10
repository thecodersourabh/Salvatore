// App constants
export const APP_NAME = 'Salvatore';

// Auth constants
export const AUTH_CODE_SESSION_KEY = 'auth0_last_processed_code';
export const REDIRECT_DELAYS = {
  SUCCESS: 1000,
  ERROR: 2000,
  LOGOUT: 500,
} as const;

// Mobile deep link schemes
export const DEEP_LINK_SCHEMES = {
  CALLBACK: 'com.salvatore.app://callback',
  LOGOUT: 'com.salvatore.app://logout',
} as const;

// Storage prefixes for cleanup
export const STORAGE_PREFIXES = {
  AUTH0: ['auth0', '@@auth0spajs@@'],
} as const;

// Router configuration
export const ROUTER_FUTURE_CONFIG = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

// UI constants
export const PROFILE_STEPS = {
  BASIC_INFO: 0,
  SKILLS: 1,
  AVAILABILITY: 2,
  SERVICE_AREAS: 3,
  PRICING: 4,
  TOTAL: 5,
} as const;

export const STEP_LABELS = [
  'Basic Info',
  'Skills',
  'Availability', 
  'Service Areas',
  'Pricing'
] as const;

// Responsive breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Splash screen configuration
export const SPLASH_CONFIG = {
  DURATION: 3000,
  MOBILE_ONLY: true,
  SHOW_LOADING: true,
  BRAND_COLOR: '#e11d48',
} as const;
