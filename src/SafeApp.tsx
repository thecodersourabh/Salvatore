import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useTransition } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Navigation } from "./components/Navigation";
import { ChatBot } from "./components/ChatBot";
import { Cart } from "./components/Cart";
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth/Auth";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProfileLayout } from "./pages/Profile/ProfileLayout";
import { Orders } from "./pages/Orders/Orders";
import { Addresses } from "./pages/Profile/Addresses/Addresses";
import { Wishlist } from "./pages/Profile/Wishlist/Wishlist";
import * as config from "./auth_config.json";
import { getRedirectUri } from "./utils/getRedirectUri";

// Configure future flags for React Router v7
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// Auth0 callback handler component that uses proper Capacitor integration
function Auth0CallbackHandler() {
  const { handleRedirectCallback, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    // Handle the 'appUrlOpen' event and call `handleRedirectCallback` - Official Auth0 approach
    const setupListener = async () => {
      const listener = await CapApp.addListener('appUrlOpen', async ({ url }) => {
        // Handle logout callback
        if (url.includes('com.texweb.app://logout')) {
          // Clear any stored auth data
          sessionStorage.removeItem('auth0_last_processed_code');
          localStorage.removeItem('auth0.is.authenticated');
          
          // Clear all Auth0 related data
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('auth0') || key.startsWith('@@auth0spajs@@')) {
              localStorage.removeItem(key);
            }
          });
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('auth0') || key.startsWith('@@auth0spajs@@')) {
              sessionStorage.removeItem(key);
            }
          });
          
          // Navigate to home page after logout
          setTimeout(() => {
            window.location.hash = '/';
            // Force page reload to ensure clean state
            window.location.reload();
          }, 500);
          
          // Close the browser (no-op on Android)
          try {
            await Browser.close();
          } catch (error) {
            // Browser close expected to fail on Android
          }
          return;
        }
        
        // Handle authentication callback
        if (url.includes('state') && (url.includes('code') || url.includes('error'))) {
          // Prevent code reuse by checking if we've already processed this code
          const urlParams = new URLSearchParams(url.split('?')[1] || '');
          const code = urlParams.get('code');
          const lastProcessedCode = sessionStorage.getItem('auth0_last_processed_code');
          
          if (code && code === lastProcessedCode) {
            return;
          }
          
          // Store the code to prevent reuse
          if (code) {
            sessionStorage.setItem('auth0_last_processed_code', code);
          }
          
          try {
            await handleRedirectCallback(url);
            
            // Navigate to profile after successful authentication
            setTimeout(() => {
              window.location.hash = '/profile';
            }, 1000);
          } catch (error) {
            // Check if this is a CORS-related error
            if (error instanceof Error && (
                error.message.includes('Failed to fetch') ||
                error.message.includes('CORS') ||
                error.message.includes('Network request failed')
            )) {
              // Even with CORS error, the authorization code was valid
              setTimeout(() => {
                window.location.hash = '/profile';
              }, 2000);
            } else if (error instanceof Error && error.message.includes('Invalid authorization code')) {
              // Code was already used, but auth might still be valid
              setTimeout(() => {
                window.location.hash = '/profile';
              }, 2000);
            } else {
              // Other errors - redirect to auth page
              setTimeout(() => {
                window.location.hash = '/auth?error=callback_failed';
              }, 2000);
            }
          }
        }
        
        // Close the browser (no-op on Android)
        try {
          await Browser.close();
        } catch (error) {
          // Browser close expected to fail on Android
        }
      });

      // Return cleanup function
      return () => {
        listener.remove();
      };
    };

    let cleanup: (() => void) | null = null;
    
    if (Capacitor.isNativePlatform()) {
      setupListener().then((cleanupFn) => {
        cleanup = cleanupFn;
      });
    }

    // Cleanup on component unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [handleRedirectCallback]);

  // Clear processed code when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      sessionStorage.removeItem('auth0_last_processed_code');
    }
  }, [isAuthenticated, isLoading]);

  return null; // This component doesn't render anything
}

function SafeApp() {
  const [isPending] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [debuggerVisible, setDebuggerVisible] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Router future={routerFutureConfig}>
      <div style={{ paddingBottom: isPending ? '20px' : '0px' }}>
        {isPending && (
          <div className="fixed top-4 right-4 z-50">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-600 border-t-transparent"></div>
          </div>
        )}

        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Auth0CallbackHandler />
              
              <div className="flex flex-col h-screen overflow-hidden">
                <Navigation />
                
                {/* Debug toggle button - only show in development */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => setDebuggerVisible(!debuggerVisible)}
                    style={{
                      position: 'fixed',
                      bottom: '20px',
                      right: '20px',
                      zIndex: 1000,
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      fontSize: '20px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                    title="Toggle Auth Debugger"
                  >
                    🐛
                  </button>
                )}
                
                <div className="flex-1 overflow-auto">
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

                  <Cart />
                  <ChatBot />
                </div>
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
        ? `com.texweb.app://callback`
        : getRedirectUri(),
    },
    // Enable cache for better performance
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true,
  };

  return (
    <Auth0Provider {...auth0Config}>
      <SafeApp />
    </Auth0Provider>
  );
}
