import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getLogoutUri } from '../utils/getRedirectUri';
import { UserService } from '../services';
import { User } from '../types/user';
import { setTokenRefreshCallback, storeToken, clearToken } from '../utils/tokenHelper';

export interface UserContext {
  email: string;
  sub?: string;
  userId?: string;
  name?: string;
  userName?: string;
  sector?: string;
  phoneNumber?: string;
  email_verified?: boolean;
  isVerified?: boolean;
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
  loginWithRedirect: (role?: 'seller' | 'customer') => void;
  userCreated: boolean;
  creatingUser: boolean;
  user: UserContext | null;
  userContext: UserContext | null;
  apiUser: User | null;
  idToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
    isLoading,
    getIdTokenClaims,
    getAccessTokenSilently
  } = useAuth0();

  // State management
  const [idToken, setIdToken] = useState<string | null>(null);
  const [userCreated, setUserCreated] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [apiUser, setApiUser] = useState<User | null>(null);
  const [authRefreshTrigger, setAuthRefreshTrigger] = useState(0);

  // Fetch ID token when user is authenticated
  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated && getIdTokenClaims) {
        try {
          // Get fresh access token to ensure session is valid
          if (getAccessTokenSilently) {
            try {
              await getAccessTokenSilently({ cacheMode: 'off' });
            } catch (accessTokenError) {
              // Check for refresh token errors. Cast to any because TS catch vars may be typed as unknown/{}
              const _msg = (accessTokenError as any)?.message as string | undefined;
              if (_msg?.includes('refresh token') || 
                  _msg?.includes('403') ||
                  _msg?.includes('Forbidden') ||
                  _msg?.includes('Unknown or invalid refresh token')) {
                console.warn('Invalid refresh token detected during initial fetch, logging out');
                clearToken();
                setIdToken(null);
                logout({ 
                  logoutParams: {
                    returnTo: window.location.origin
                  }
                });
                return;
              }
              // Continue with ID token if access token fails for other reasons
            }
          }
          
          const claims = await getIdTokenClaims();
          const token = claims?.__raw || null;
          setIdToken(token);
          
          if (token) {
            storeToken(token);
          }
        } catch (error) {
          console.error('Error fetching ID token:', error);
          setIdToken(null);
          clearToken();
        }
      } else {
        setIdToken(null);
        clearToken();
      }
    };
    fetchToken();
  }, [isAuthenticated, getIdTokenClaims, getAccessTokenSilently, authRefreshTrigger, logout]);

  // Set up token refresh callback for API service
  useEffect(() => {
    if (getIdTokenClaims && getAccessTokenSilently) {
      const refreshCallback = async (): Promise<string | null> => {
        try {
          // Force token refresh by getting fresh access token first
          await getAccessTokenSilently({ cacheMode: 'off' });
          
          // Get fresh ID token claims
          const claims = await getIdTokenClaims();
          const newToken = claims?.__raw || null;
          
          if (newToken) {
            setIdToken(newToken);
            storeToken(newToken);
          }
          
          return newToken;
        } catch (error) {
          console.error('Token refresh failed:', error);

          // Check if it's a refresh token error (403/forbidden or specific error message)
          const _msg = (error as any)?.message as string | undefined;
          if (_msg?.includes('refresh token') || 
              _msg?.includes('403') ||
              _msg?.includes('Forbidden') ||
              _msg?.includes('Unknown or invalid refresh token')) {
            console.warn('Invalid refresh token detected, clearing auth state');

            // Clear all stored tokens
            clearToken();
            setIdToken(null);

            // Force logout to clear Auth0 state
            try {
              logout({ 
                logoutParams: {
                  returnTo: window.location.origin
                }
              });
            } catch (logoutError) {
              console.error('Error during logout:', logoutError);
              // Force reload if logout fails
              window.location.reload();
            }
          }

          return null;
        }
      };
      
      setTokenRefreshCallback(refreshCallback);
    }
  }, [getIdTokenClaims, getAccessTokenSilently, logout]);

  // Listen for auth state refresh events from deep link handler
  useEffect(() => {
    const handleAuthRefresh = () => {
      setAuthRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('auth-state-refresh', handleAuthRefresh);
    
    return () => {
      window.removeEventListener('auth-state-refresh', handleAuthRefresh);
    };
  }, []);

  // Handle user creation when authenticated
  useEffect(() => {
    const createUserIfNeeded = async () => {
      // Early returns for invalid states
      if (!isAuthenticated || !user?.sub || !user?.email || userCreated || creatingUser) {
        return;
      }

      try {
        setCreatingUser(true);
        
        // Check if user already exists in the API
        const userExists = await UserService.isUserExists(user.email);
        
        let fetchedUser: User | null = null;
        
        // Get role from signup flow or default to customer
        const signupRole = localStorage.getItem('signup_role') || 'customer';
        
        if (!userExists) {
          // Create new user
          const userData = {
            email: user.email,
            name: user.name || '',
            phone: user.phone_number || '000-000-0000',
            auth0Id: user.sub,
            version: 1,
            role: signupRole
          };
          
          fetchedUser = await UserService.createUser(userData);
          
          // Store user mapping
          if (fetchedUser?.id) {
            localStorage.setItem(`auth0_${user.sub}`, fetchedUser.id);
            localStorage.setItem(`x-user-id`, fetchedUser.id);
            localStorage.setItem(`user_name`, fetchedUser.userName);
            (window as any).__USER_ID__ = fetchedUser.id;
          }
        } else {
          // Get existing user
          fetchedUser = await UserService.getUserByEmail(user.email);
          
          // Update role if needed (only for seller signups)
          if (signupRole === 'seller' && fetchedUser && fetchedUser.role !== 'seller') {
            fetchedUser = await UserService.updateUser(user.email, { role: 'seller' });
          }
          
          // Store user mapping
          if (fetchedUser?.id) {
            localStorage.setItem(`auth0_${user.sub}`, fetchedUser.id);
            localStorage.setItem(`x-user-id`, fetchedUser.id);
            localStorage.setItem(`user_name`, fetchedUser.userName);
            (window as any).__USER_ID__ = fetchedUser.id;
          }
        }
        
        // Clean up
        localStorage.removeItem('signup_role');
        
        // Update state
        if (fetchedUser) {
          setApiUser(fetchedUser);
        }
        
        setUserCreated(true);
      } catch (error) {
        console.error('Error processing user:', error);
      } finally {
        setCreatingUser(false);
      }
    };

    createUserIfNeeded();
  }, [isAuthenticated, user, authRefreshTrigger]);

  // Create user context object from Auth0 user data combined with API user data
  const userContextValue: UserContext | null = isAuthenticated && user ? {
    email: user.email as string,
    sub: user.sub,
    userId: apiUser?.id,
    name: apiUser?.name || user.name,
    userName: apiUser?.userName,
    sector: apiUser?.sector,
    phoneNumber: apiUser?.phone || user.phone_number,
    email_verified: user.email_verified,
    isVerified: user.email_verified,
    avatar: apiUser?.avatar || user.picture,
    role: apiUser?.role || 'customer'
  } : null;

  // Auth context value object
  const value: AuthContextType = {
    isAuthenticated,
    loading: isLoading || creatingUser,
    logout: () => logout({ logoutParams: { returnTo: getLogoutUri() } }),
    loginWithRedirect: (role?: 'seller' | 'customer') => {
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
    },
    userCreated,
    creatingUser,
    user: userContextValue,
    userContext: userContextValue,
    apiUser,
    idToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    ...context,
    user: context.userContext // For backward compatibility
  };
};
