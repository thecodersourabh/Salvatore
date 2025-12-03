import { Middleware } from '@reduxjs/toolkit';
import { setTokenRefreshCallback } from '../../utils/tokenHelper';
import { logout } from '../slices/authSlice';

// Auth middleware to handle token refresh and Auth0 integration
export const authMiddleware: Middleware = (store) => {
  // Set up token refresh callback for API services
  const setupTokenRefreshCallback = () => {
    const refreshCallback = async (): Promise<string | null> => {
      const state = store.getState() as any;
      if (!state.auth.isAuthenticated) {
        return null;
      }

      try {
        // Use the enhanced refresh callback set by ReduxAuthProvider
        const enhancedCallback = (window as any).__reduxAuthRefreshCallback;
        
        if (enhancedCallback && typeof enhancedCallback === 'function') {
          return await enhancedCallback();
        } else {
          // Fallback: dispatch refresh event for ReduxAuthProvider to handle
          window.dispatchEvent(new CustomEvent('auth-token-refresh-needed'));
          
          // Wait a bit for the refresh to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Return the updated token
          const newState = store.getState() as any;
          return newState.auth.idToken;
        }
      } catch (error) {
        console.error('Token refresh failed in middleware:', error);
        
        // Handle refresh token errors
        const errorMessage = (error as any)?.message || '';
        if (errorMessage.includes('refresh token') || 
            errorMessage.includes('403') ||
            errorMessage.includes('Forbidden')) {
          
          // Only dispatch logout if still authenticated to prevent loops
          const state = store.getState() as any;
          if (state.auth.isAuthenticated) {
            store.dispatch(logout());
          }
        }
        
        return null;
      }
    };

    setTokenRefreshCallback(refreshCallback);
  };

  // Initialize on first middleware setup
  setupTokenRefreshCallback();

  return (next) => (action: any) => {
    // Listen for auth state changes to update token refresh callback
    if (action.type === 'auth/setAuthenticated' && action.payload === true) {
      setupTokenRefreshCallback();
    }

    // Handle logout cleanup
    if (action.type === 'auth/logout') {
      localStorage.removeItem('signup_role');
    }

    return next(action);
  };
};