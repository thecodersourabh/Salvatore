import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getLogoutUri } from '../utils/getRedirectUri';
import { UserService } from '../services';
import { User } from '../types/user';

export interface UserContext {
  email: string;
  sub?: string;
  name?: string;
  userName?: string;
  sector?: string;
  phoneNumber?: string;
  email_verified?: boolean;
  isVerified?: boolean;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
  loginWithRedirect: () => void;
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
    getIdTokenClaims
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
        const claims = await getIdTokenClaims();
        setIdToken(claims?.__raw || null);
      } else {
        setIdToken(null);
      }
    };
    fetchToken();
  }, [isAuthenticated, getIdTokenClaims]);

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
        
        if (!userExists) {
          // Create new user with Auth0 data
          const userData = {
            email: user.email,
            name: user.name || '',
            phone: user.phone_number || '000-000-0000',
            auth0Id: user.sub,
            version: 1
          };
          
          fetchedUser = await UserService.createUser(userData);
          
          // Store Auth0 to API user ID mapping
          if (fetchedUser?.id) {
            localStorage.setItem(`auth0_${user.sub}`, fetchedUser.id);
            localStorage.setItem(`user_name`, fetchedUser.userName);
          }
        } else {
          // Fetch existing user data from API
          fetchedUser = await UserService.getUserByEmail(user.email);
          
          // Store mapping for existing user
          if (fetchedUser?.id) {
            localStorage.setItem(`auth0_${user.sub}`, fetchedUser.id);
            localStorage.setItem(`user_name`, fetchedUser.userName);
          }
        }
        
        // Update API user state
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
    name: apiUser?.name || user.name,
    userName: apiUser?.userName,
    sector: apiUser?.sector,
    phoneNumber: apiUser?.phone || user.phone_number,
    email_verified: user.email_verified,
    isVerified: user.email_verified,
    avatar: apiUser?.avatar || user.picture
  } : null;

  // Auth context value object
  const value: AuthContextType = {
    isAuthenticated,
    loading: isLoading || creatingUser,
    logout: () => logout({ logoutParams: { returnTo: getLogoutUri() } }),
    loginWithRedirect: () => {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname }
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
