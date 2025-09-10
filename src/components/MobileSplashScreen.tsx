import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { SPLASH_CONFIG } from '../constants';

interface MobileSplashScreenProps {
  children: React.ReactNode;
  duration?: number;
}

export const MobileSplashScreen: React.FC<MobileSplashScreenProps> = ({ 
  children, 
  duration = SPLASH_CONFIG.DURATION 
}) => {
  const [isShowingSplash, setIsShowingSplash] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeMobileSplash = async () => {
      // Only show custom splash on mobile platforms
      if (Capacitor.isNativePlatform()) {
        setIsShowingSplash(true);
        
        // Hide the native splash screen first
        try {
          await SplashScreen.hide();
        } catch (error) {
          // Native splash screen already hidden or not available
        }

        // Show custom splash for specified duration
        const timer = setTimeout(() => {
          setIsShowingSplash(false);
          setIsReady(true);
        }, duration);

        return () => clearTimeout(timer);
      } else {
        // For web, skip splash and show content immediately
        setIsReady(true);
      }
    };

    initializeMobileSplash();
  }, [duration]);

  // Show splash screen only on mobile
  if (Capacitor.isNativePlatform() && isShowingSplash) {
    return <SalvatoreSplash />;
  }

  // Don't render children until ready (prevents flash on mobile)
  if (Capacitor.isNativePlatform() && !isReady) {
    return null;
  }

  return <>{children}</>;
};

// Custom Salvatore splash screen component
const SalvatoreSplash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 flex items-center justify-center z-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 text-center">
        {/* Logo container */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 animate-pulse">
            <svg 
              className="w-12 h-12 text-rose-600" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              <path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* App name */}
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
          Salvatore
        </h1>
        
        {/* Tagline */}
        <p className="text-xl text-rose-100 mb-12 max-w-xs leading-relaxed">
          Your Trusted Service Network
        </p>

        {/* Loading animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-rose-200 text-sm">Loading your experience...</p>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-rose-200 text-sm">
          Connecting skilled professionals with those who need them
        </p>
      </div>
    </div>
  );
};
