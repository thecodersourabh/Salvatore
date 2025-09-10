import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useTransition } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

// Components
import { Navigation } from "./components/Navigation";
import { ChatBot } from "./components/ChatBot";
import { Cart } from "./components/Cart";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MobileSplashScreen } from "./components/MobileSplashScreen";

// Pages
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth/Auth";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { ProfileLayout } from "./pages/Profile/ProfileLayout";
import { Orders } from "./pages/Orders/Orders";
import { Addresses } from "./pages/Profile/Addresses/Addresses";
import { Wishlist } from "./pages/Profile/Wishlist/Wishlist";

// Context
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";

// Utils and Config
import * as config from "./auth_config.json";
import { getRedirectUri } from "./utils/getRedirectUri";
import { 
  AUTH_CODE_SESSION_KEY, 
  REDIRECT_DELAYS, 
  DEEP_LINK_SCHEMES, 
  STORAGE_PREFIXES, 
  ROUTER_FUTURE_CONFIG,
  SPLASH_CONFIG
} from "./constants";

// Auth0 callback handler for mobile deep linking
function Auth0CallbackHandler() {
  const { handleRedirectCallback } = useAuth0();

  useEffect(() => {
    const setupMobileListener = async () => {
      if (!Capacitor.isNativePlatform()) return;

      const listener = await CapApp.addListener('appUrlOpen', async ({ url }) => {
        await handleDeepLink(url, handleRedirectCallback);
      });

      return () => listener.remove();
    };

    setupMobileListener().then(cleanup => {
      return cleanup;
    });
  }, [handleRedirectCallback]);

  return null;
}

// Handle deep link callbacks
async function handleDeepLink(url: string, handleRedirectCallback: (url?: string) => Promise<any>) {
  try {
    // Handle logout callback
    if (url.includes(DEEP_LINK_SCHEMES.LOGOUT)) {
      clearAuthData();
      redirectToHome();
      return;
    }
    
    // Handle authentication callback
    if (url.includes('state') && (url.includes('code') || url.includes('error'))) {
      const code = extractCodeFromUrl(url);
      
      if (isDuplicateCode(code)) return;
      
      if (code) sessionStorage.setItem(AUTH_CODE_SESSION_KEY, code);
      
      await processAuthCallback(url, handleRedirectCallback);
    }
  } finally {
    closeBrowser();
  }
}

// Helper functions for auth callback processing
function clearAuthData() {
  sessionStorage.removeItem(AUTH_CODE_SESSION_KEY);
  clearStorageByPrefix(STORAGE_PREFIXES.AUTH0);
}

function clearStorageByPrefix(prefixes: readonly string[]) {
  [localStorage, sessionStorage].forEach(storage => {
    Object.keys(storage).forEach(key => {
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        storage.removeItem(key);
      }
    });
  });
}

function redirectToHome() {
  setTimeout(() => {
    window.location.hash = '/';
    window.location.reload();
  }, REDIRECT_DELAYS.LOGOUT);
}

function extractCodeFromUrl(url: string): string | null {
  const urlParams = new URLSearchParams(url.split('?')[1] || '');
  return urlParams.get('code');
}

function isDuplicateCode(code: string | null): boolean {
  if (!code) return false;
  return code === sessionStorage.getItem(AUTH_CODE_SESSION_KEY);
}

async function processAuthCallback(url: string, handleRedirectCallback: (url?: string) => Promise<any>) {
  try {
    await handleRedirectCallback(url);
    redirectToProfile();
  } catch (error) {
    handleAuthError(error);
  }
}

function redirectToProfile() {
  setTimeout(() => {
    window.location.hash = '/profile';
  }, REDIRECT_DELAYS.SUCCESS);
}

function handleAuthError(error: any) {
  const isNetworkError = error instanceof Error && (
    error.message.includes('Failed to fetch') ||
    error.message.includes('CORS') ||
    error.message.includes('Network request failed')
  );
  
  const isCodeError = error instanceof Error && 
    error.message.includes('Invalid authorization code');

  if (isNetworkError || isCodeError) {
    redirectToProfile();
  } else {
    setTimeout(() => {
      window.location.hash = '/auth?error=callback_failed';
    }, REDIRECT_DELAYS.ERROR);
  }
}

async function closeBrowser() {
  try {
    await Browser.close();
  } catch {
    // Browser close expected to fail on Android
  }
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 border-t-transparent"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Transition indicator
function TransitionIndicator() {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-600 border-t-transparent"></div>
    </div>
  );
}

// Main App component
function MyApp() {
  const [isPending] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router future={ROUTER_FUTURE_CONFIG}>
      <div className="h-screen overflow-hidden">
        {isPending && <TransitionIndicator />}
        
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Auth0CallbackHandler />
              
              <div className="flex flex-col h-full">
                <Navigation />
                <main className="flex-1 overflow-auto bg-gray-50">
                  <Routes>
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/home" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/auth" element={
                      <ProtectedRoute>
                        <Auth />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfileLayout />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    } />
                    <Route path="/addresses" element={
                      <ProtectedRoute>
                        <Addresses />
                      </ProtectedRoute>
                    } />
                    <Route path="/wishlist" element={
                      <ProtectedRoute>
                        <Wishlist />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </main>
                
                {/* Floating components */}
                <Cart />
                <ChatBot />
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </div>
    </Router>
  );
}

export default function App() {
  const auth0Config = {
    domain: config.domain,
    clientId: config.clientId,
    authorizationParams: {
      redirect_uri: Capacitor.isNativePlatform() 
        ? DEEP_LINK_SCHEMES.CALLBACK
        : getRedirectUri(),
    },
    // Enable cache for better performance
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true,
  };

  return (
    <Auth0Provider {...auth0Config}>
      <MobileSplashScreen duration={SPLASH_CONFIG.DURATION}>
        <MyApp />
      </MobileSplashScreen>
    </Auth0Provider>
  );
}
