import { SPLASH_CONFIG } from '../constants';

/**
 * Utility to test splash screen functionality
 */
export const testSplashScreen = () => {
  console.log('🧪 Testing Splash Screen Configuration:');
  console.log('Duration:', SPLASH_CONFIG.DURATION);
  console.log('Mobile Only:', SPLASH_CONFIG.MOBILE_ONLY);
  console.log('Show Loading:', SPLASH_CONFIG.SHOW_LOADING);
  console.log('Brand Color:', SPLASH_CONFIG.BRAND_COLOR);
  
  // Test platform detection
  if (typeof window !== 'undefined') {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Detected Platform:', isMobile ? 'Mobile' : 'Desktop');
    console.log('User Agent:', navigator.userAgent);
  }
};

/**
 * Mock splash screen timing for testing
 */
export const mockSplashTiming = (callback: () => void) => {
  console.log('🚀 Starting mock splash screen...');
  setTimeout(() => {
    console.log('✅ Mock splash screen completed');
    callback();
  }, SPLASH_CONFIG.DURATION);
};

// Export for development use
if (process.env.NODE_ENV === 'development') {
  (window as any).testSplashScreen = testSplashScreen;
  (window as any).mockSplashTiming = mockSplashTiming;
}
