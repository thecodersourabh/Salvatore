import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getLogoutUri } from '../utils/getRedirectUri';
import { UserService } from '../services';

export interface UserContext {
  email: string;
  sub?: string;
  name?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
    isLoading,
  } = useAuth0();

  const [userCreated, setUserCreated] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [authRefreshTrigger, setAuthRefreshTrigger] = useState(0);

  // Listen for auth state refresh events from deep link handler
  useEffect(() => {
    const handleAuthRefresh = () => {
      console.log('🔄 AuthContext: Auth refresh event received, triggering re-evaluation');
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
      console.log('🔐 AuthContext: Checking if user creation is needed...', {
        isAuthenticated,
        userSub: user?.sub,
        userEmail: user?.email,
        userCreated,
        creatingUser
      });
      
      if (!isAuthenticated) {
        console.log('ℹ️ AuthContext: User not authenticated, skipping user creation');
        return;
      }
      
      if (!user?.sub || !user?.email) {
        console.log('⚠️ AuthContext: Missing user sub or email', {
          sub: user?.sub,
          email: user?.email
        });
        return;
      }
      
      if (userCreated || creatingUser) {
        console.log('ℹ️ AuthContext: User creation already completed or in progress', {
          userCreated,
          creatingUser
        });
        return;
      }

      try {
        console.log('🔄 AuthContext: Starting user creation process...');
        setCreatingUser(true);
        
        // Extract user details from Auth0 token
        const userData = {
          email: user.email,
          name: user.name || '',
          password: '',
          phone: user.phone_number || '000-000-0000',
          avatar: user.picture || '',
          isServiceProvider: true
        };
        
        console.log('👤 AuthContext: User data prepared:', {
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar
        });
        
        // Check if user already exists, then create if needed
        let apiUser;
        try {
          console.log('🔍 AuthContext: Checking if user exists by email...');
          // First, check if user already exists by email
          apiUser = await UserService.getUserByEmail(user.email);
          
          if (apiUser && apiUser.id) {
            console.log('✅ AuthContext: User already exists in API:', apiUser.id);
            // User already exists, store the mapping
            localStorage.setItem(`auth0_${user.sub}`, apiUser.id);
            console.log('💾 AuthContext: Stored Auth0 mapping:', `auth0_${user.sub} → ${apiUser.id}`);
          } else {
            console.log('➕ AuthContext: User does not exist, creating new user...');
            // User doesn't exist, create new user
            apiUser = await UserService.createUser(userData);
            console.log('✅ AuthContext: New user created:', apiUser);
            
            // Store the mapping between Auth0 ID and API user ID
            if (apiUser && apiUser.id) {
              localStorage.setItem(`auth0_${user.sub}`, apiUser.id);
              console.log('💾 AuthContext: Stored Auth0 mapping for new user:', `auth0_${user.sub} → ${apiUser.id}`);
            }
          }
        } catch (error: unknown) {
          console.error('❌ AuthContext: Error during user creation/lookup:', error);
        }
        
        // Mark user creation as completed (whether successful or user already exists)
        console.log('✅ AuthContext: User creation process completed');
        setUserCreated(true);
      } catch (error) {
        console.error('❌ AuthContext: Error processing user:', error);
      } finally {
        console.log('🔄 AuthContext: Setting creatingUser to false');
        setCreatingUser(false);
      }
    };

    createUserIfNeeded();
  }, [isAuthenticated, user, userCreated, creatingUser, authRefreshTrigger]);

  const userContextValue = isAuthenticated && user ? {
    email: user.email as string,
    sub: user.sub,
    name: user.name,
    phoneNumber: user.phone_number,
    email_verified: user.email_verified,
    isVerified: user.email_verified,
    picture: user.picture
  } : null;

  const value: AuthContextType = {
    isAuthenticated,
    loading: isLoading || creatingUser,
    logout: () => logout({ logoutParams: { returnTo: getLogoutUri() } }),
    loginWithRedirect: () => {
      console.log('🔐 AuthContext: Initiating login redirect');
      loginWithRedirect({
        appState: { returnTo: window.location.pathname }
      });
    },
    userCreated,
    creatingUser,
    user: userContextValue,
    userContext: userContextValue
  };

  console.log('🔐 AuthContext: Current auth state:', {
    isAuthenticated,
    loading: value.loading,
    userCreated,
    creatingUser,
    userSub: user?.sub,
    userEmail: user?.email
  });

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
