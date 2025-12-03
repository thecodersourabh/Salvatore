import React, { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  setAuthenticated,
  setIdToken,
  setLoading,
  createOrUpdateUser,
  refreshToken,
  logout,
  resetCreatingUser,
  selectAuth,
} from './slices/authSlice';
import { getLogoutUri } from '../utils/getRedirectUri';

// Redux Auth Provider that bridges Auth0 with Redux
export const ReduxAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const creatingUserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    isAuthenticated,
    logout: auth0Logout,
    user,
    isLoading,
    getIdTokenClaims,
    getAccessTokenSilently
  } = useAuth0();

  // Reset creating user state if it gets stuck
  useEffect(() => {
    if (auth.creatingUser && isAuthenticated) {
      creatingUserTimeoutRef.current = setTimeout(() => {
        console.warn('User creation timed out, resetting state...');
        dispatch(resetCreatingUser());
      }, 8000); // Reduced timeout
    } else {
      if (creatingUserTimeoutRef.current) {
        clearTimeout(creatingUserTimeoutRef.current);
        creatingUserTimeoutRef.current = null;
      }
    }

    return () => {
      if (creatingUserTimeoutRef.current) {
        clearTimeout(creatingUserTimeoutRef.current);
        creatingUserTimeoutRef.current = null;
      }
    };
  }, [auth.creatingUser, isAuthenticated, dispatch]);

  // Sync Auth0 authentication state with Redux
  useEffect(() => {
    dispatch(setAuthenticated(isAuthenticated));
    dispatch(setLoading(isLoading));
    
    // If user is no longer authenticated, immediately reset creating user state
    if (!isAuthenticated && auth.creatingUser) {
      dispatch(resetCreatingUser());
    }
  }, [isAuthenticated, isLoading, auth.creatingUser, dispatch]);

  // Handle ID token fetching and refresh
  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated && user?.email) {
        try {
          // Get fresh access token to ensure session is valid
          try {
            await getAccessTokenSilently({ cacheMode: 'off' });
          } catch (accessTokenError) {
            const errorMessage = (accessTokenError as any)?.message || '';
            if (errorMessage.includes('refresh token') || 
                errorMessage.includes('403') ||
                errorMessage.includes('Forbidden')) {
              console.warn('Invalid refresh token detected, logging out');
              dispatch(logout());
              auth0Logout({ 
                logoutParams: {
                  returnTo: window.location.origin
                }
              });
              return;
            }
          }
          
          const claims = await getIdTokenClaims();
          const token = claims?.__raw || null;
          
          // Only update if token actually changed
          if (token !== auth.idToken) {
            dispatch(setIdToken(token));
            
            // Set up token refresh callback immediately when token is available
            if (token) {
              const enhancedRefreshCallback = async (): Promise<string | null> => {
                try {
                  const result = await dispatch(refreshToken({
                    getIdTokenClaims,
                    getAccessTokenSilently
                  })).unwrap();
                  
                  return result;
                } catch (error) {
                  console.error('Enhanced token refresh failed:', error);
                  
                  // Handle refresh token errors
                  const errorMessage = (error as any)?.message || '';
                  if (errorMessage.includes('refresh token') || 
                      errorMessage.includes('403') ||
                      errorMessage.includes('Forbidden')) {
                    
                    dispatch(logout());
                    auth0Logout({ 
                      logoutParams: {
                        returnTo: window.location.origin
                      }
                    });
                  }
                  
                  return null;
                }
              };

              // Store the enhanced callback for API services to use
              (window as any).__reduxAuthRefreshCallback = enhancedRefreshCallback;
            }
          }
          
        } catch (error) {
          console.error('Error fetching ID token:', error);
          dispatch(setIdToken(null));
        }
      } else if (!isAuthenticated) {
        // Clear token and reset user creation state when not authenticated
        dispatch(setIdToken(null));
        if (auth.creatingUser) {
          dispatch(resetCreatingUser());
        }
      }
    };

    fetchToken();
  }, [isAuthenticated, user?.email, getIdTokenClaims, getAccessTokenSilently, dispatch, auth0Logout]);

  // Handle user creation/update when authenticated
  useEffect(() => {
    const handleUserCreation = async () => {
      // Early return if not authenticated or missing required data
      if (!isAuthenticated || !user?.sub || !user?.email || 
          auth.userCreated || auth.creatingUser || !auth.idToken) {
        return;
      }
        
      const signupRole = localStorage.getItem('signup_role') as 'seller' | 'customer' || 'customer';
      
      try {
        await dispatch(createOrUpdateUser({
          user,
          signupRole
        })).unwrap();
        
        // Clean up signup role
        localStorage.removeItem('signup_role');
      } catch (error) {
        console.error('Error creating/updating user:', error);
      }
    };

    // Only run if we need to create a user AND have a token AND are authenticated
    if (isAuthenticated && user?.sub && user?.email && 
        !auth.userCreated && !auth.creatingUser && auth.idToken) {
      const timeoutId = setTimeout(handleUserCreation, 25); // Optimized timing
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user?.sub, user?.email, auth.userCreated, auth.creatingUser, auth.idToken, dispatch]);

  // Listen for auth state refresh events
  useEffect(() => {
    const handleAuthRefresh = () => {
      if (isAuthenticated) {
        getIdTokenClaims().then(claims => {
          const token = claims?.__raw || null;
          dispatch(setIdToken(token));
        }).catch(error => {
          console.error('Error refreshing token on event:', error);
        });
      }
    };

    const handleTokenRefreshNeeded = async () => {
      if (isAuthenticated) {
        try {
          const result = await dispatch(refreshToken({
            getIdTokenClaims,
            getAccessTokenSilently
          })).unwrap();
          
          return result;
        } catch (error) {
          console.error('Token refresh needed handler failed:', error);
        }
      }
    };

    const handleLogoutRequired = () => {
      // Emergency logout handler - only for critical auth failures
      if (!isAuthenticated) {
        return;
      }
      
      dispatch(logout());
    };

    window.addEventListener('auth-state-refresh', handleAuthRefresh);
    window.addEventListener('auth-token-refresh-needed', handleTokenRefreshNeeded);
    window.addEventListener('auth-logout-required', handleLogoutRequired);
    
    return () => {
      window.removeEventListener('auth-state-refresh', handleAuthRefresh);
      window.removeEventListener('auth-token-refresh-needed', handleTokenRefreshNeeded);
      window.removeEventListener('auth-logout-required', handleLogoutRequired);
    };
  }, [isAuthenticated, dispatch, auth0Logout]);

  return <>{children}</>;
};