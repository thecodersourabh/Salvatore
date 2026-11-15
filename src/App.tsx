import { useEffect } from 'react';
import { HashRouter as Router } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Capacitor } from '@capacitor/core';

// Redux
import { store, persistor } from './store';
import { AuthProvider, NotificationProvider, ThemeProvider } from './store/providers';

// Components
import { Auth0CallbackHandler } from './components/Auth0CallbackHandler';
import { Navigation } from "./components/Navigation";
import { ChatBot } from "./components/ChatBot";
import { Cart } from "./components/Cart";
import { MobileSplashScreen } from "./components/MobileSplashScreen";
import { MobileNavBar } from "./components/MobileNavBar";
import { AppRoutes } from "./routes/AppRoutes";
import { useWebSocket } from './hooks/useWebSocket';

// Utils and config
import * as config from "./auth_config.json";
import { getRedirectUri } from "./utils/getRedirectUri";
import { StatusBarManager } from "./utils/statusBar";
import {
  DEEP_LINK_SCHEMES,
  ROUTER_FUTURE_CONFIG,
  SPLASH_CONFIG
} from "./constants";
import { AddressBar } from './components/AddressBar';

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Main App component
function MyApp() {
  const { isConnected, connectionStatus, error } = useWebSocket();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[WebSocket]', { isConnected, connectionStatus, error });
    }
  }, [isConnected, connectionStatus, error]);

  useEffect(() => {
    void StatusBarManager.initialize();
  }, []);

  return (
    <Router future={ROUTER_FUTURE_CONFIG}>
      <div className="h-screen overflow-hidden bg-white dark:bg-gray-900">
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider>
              <Auth0CallbackHandler />
          
              <div className="flex flex-col h-full">
                <Navigation />
                {/* Global Address Bar for mobile apps */}
                { Capacitor.isNativePlatform() && <AddressBar /> }
                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                  <AppRoutes />
                </main>
                
                {/* Mobile App Download Footer */}
                <MobileNavBar />
                
                {/* Floating components */}
                <Cart />
                <ChatBot />
              </div>
            </ThemeProvider>
          </NotificationProvider>
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
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <Auth0Provider {...auth0Config}>
          <MobileSplashScreen duration={SPLASH_CONFIG.DURATION}>
            <MyApp />
          </MobileSplashScreen>
        </Auth0Provider>
      </PersistGate>
    </Provider>
  );
}
