import { useAuth0 } from '@auth0/auth0-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  selectAuth, 
  logout as reduxLogout, 
  switchRole,
  selectUserRole
} from '../store/slices/authSlice';
import { getLogoutUri } from '../utils/getRedirectUri';
import { useMemo, useCallback } from 'react';
import type { UserRole } from '../store/slices/authSlice';

// Global flag to prevent multiple logout calls
let isLoggingOut = false;

// Custom hook that combines Auth0 and Redux state
export const useAuth = () => {
  const { loginWithRedirect, logout: auth0Logout } = useAuth0();
  const auth = useAppSelector(selectAuth);
  const currentRole = useAppSelector(selectUserRole);
  const dispatch = useAppDispatch();

  const loginWithRedirectEnhanced = useCallback((role?: 'seller' | 'customer') => {
    // Store role for processing after login
    if (role && role === 'seller') {
      localStorage.setItem('signup_role', 'seller');
    }
    
    loginWithRedirect({
      appState: { 
        returnTo: window.location.pathname
      },
      authorizationParams: role === 'seller' ? { screen_hint: 'signup' } : undefined
    });
  }, [loginWithRedirect]);

  const logoutEnhanced = useCallback(() => {
    // Prevent concurrent logout calls
    if (isLoggingOut || !auth.isAuthenticated) {
      return;
    }
    
    isLoggingOut = true;
    
    try {
      dispatch(reduxLogout());
      auth0Logout({ 
        logoutParams: { 
          returnTo: getLogoutUri() 
        } 
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTimeout(() => {
        isLoggingOut = false;
      }, 2000);
    }
  }, [auth0Logout, dispatch, auth.isAuthenticated]);

  // Role management function
  const switchUserRole = useCallback(async (newRole: UserRole) => {
    if (!auth.user?.email) {
      throw new Error('User email not available');
    }

    try {
      await dispatch(switchRole({ 
        newRole, 
        userEmail: auth.user.email 
      })).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to switch role:', error);
      throw error;
    }
  }, [dispatch, auth.user?.email]);

  // Basic role checking
  const canAccessSellerFeatures = useMemo(() => {
    return currentRole === 'seller';
  }, [currentRole]);

  return useMemo(() => ({
    // Auth properties
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading || auth.creatingUser,
    logout: logoutEnhanced,
    loginWithRedirect: loginWithRedirectEnhanced,
    userCreated: auth.userCreated,
    creatingUser: auth.creatingUser,
    user: auth.user,
    userContext: auth.user, // For backward compatibility
    apiUser: auth.apiUser,
    idToken: auth.idToken,
    error: auth.error,
    
    // Role properties
    currentRole,
    canAccessSellerFeatures,
    
    // Role functions
    switchRole: switchUserRole,
  }), [
    auth.isAuthenticated,
    auth.loading,
    auth.creatingUser,
    auth.userCreated,
    auth.user,
    auth.apiUser,
    auth.idToken,
    auth.error,
    currentRole,
    canAccessSellerFeatures,
    switchUserRole,
    logoutEnhanced,
    loginWithRedirectEnhanced,
    dispatch
  ]);
};