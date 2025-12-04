import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserService } from '../../services';
import { User } from '../../types/user';
import { storeToken, clearToken } from '../../utils/tokenHelper';

// Types
export type UserRole = 'customer' | 'seller'; // Simplified to customer/provider (seller)

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
  role?: UserRole;
}

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  userCreated: boolean;
  creatingUser: boolean;
  user: UserContext | null;
  apiUser: User | null;
  idToken: string | null;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  loading: false,
  userCreated: false,
  creatingUser: false,
  user: null,
  apiUser: null,
  idToken: null,
  error: null,
};

// Async thunks
export const createOrUpdateUser = createAsyncThunk(
  'auth/createOrUpdateUser',
  async (params: {
    user: any;
    signupRole?: 'seller' | 'customer';
  }, { rejectWithValue, getState }) => {
    const { user, signupRole = 'customer' } = params;

    try {
      // Ensure we have a token before making API calls
      const state = getState() as any;
      if (!state.auth.idToken) {
        throw new Error('No authentication token available');
      }

      // Check if user already exists
      const userExists = await UserService.isUserExists(user.email);
      
      let fetchedUser: User | null = null;
      
      if (!userExists) {
        // Create new user
        const userData = {
          email: user.email,
          name: user.name || '',
          phone: user.phone_number,
          auth0Id: user.sub,
          version: 1,
          role: signupRole
        };
        
        fetchedUser = await UserService.createUser(userData);
      } else {
        // Get existing user
        fetchedUser = await UserService.getUserByEmail(user.email);
        
        // Update role if needed (only for seller signups)
        if (signupRole === 'seller' && fetchedUser && fetchedUser.role !== 'seller') {
          fetchedUser = await UserService.updateUser(user.email, { role: 'seller' });
        }
      }
      
      // Store user mapping
      if (fetchedUser?.id) {
        localStorage.setItem(`auth0_${user.sub}`, fetchedUser.id);
        localStorage.setItem(`x-user-id`, fetchedUser.id);
        localStorage.setItem(`user_name`, fetchedUser.userName);
        (window as any).__USER_ID__ = fetchedUser.id;
      }
      
      return { apiUser: fetchedUser, auth0User: user };
    } catch (error) {
      console.error('createOrUpdateUser: Failed with error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'User creation failed');
    }
  }
);

export const switchRole = createAsyncThunk(
  'auth/switchRole',
  async (params: {
    newRole: UserRole;
    userEmail: string;
  }, { rejectWithValue, getState }) => {
    const { newRole, userEmail } = params;
    
    try {
      // Ensure we have a token before making API calls
      const state = getState() as any;
      if (!state.auth.idToken) {
        throw new Error('No authentication token available');
      }
      
      // Update user role in backend
      const updatedUser = await UserService.updateUser(userEmail, { role: newRole });
      
      if (updatedUser) {
        return { updatedUser, newRole };
      }
      
      throw new Error('Failed to update user role');
    } catch (error) {
      console.error('switchRole: Failed with error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Role switch failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (params: {
    getIdTokenClaims: () => Promise<any>;
    getAccessTokenSilently: (options?: any) => Promise<string>;
  }) => {
    const { getIdTokenClaims, getAccessTokenSilently } = params;
    
    // Force token refresh by getting fresh access token first
    await getAccessTokenSilently({ cacheMode: 'off' });
    
    // Get fresh ID token claims
    const claims = await getIdTokenClaims();
    const newToken = claims?.__raw || null;
    
    if (newToken) {
      storeToken(newToken);
    }
    
    return newToken;
  }
);

// Auth slice
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
      if (!action.payload) {
        // Clear auth state on logout
        state.user = null;
        state.apiUser = null;
        state.idToken = null;
        state.userCreated = false;
        state.creatingUser = false; // Ensure this is cleared
        state.loading = false; // Reset loading state
        clearToken();
      }
    },
    setIdToken: (state, action: PayloadAction<string | null>) => {
      state.idToken = action.payload;
      if (action.payload) {
        storeToken(action.payload);
      } else {
        clearToken();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUser: (state, action: PayloadAction<UserContext | null>) => {
      state.user = action.payload;
    },
    setApiUser: (state, action: PayloadAction<User | null>) => {
      state.apiUser = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetCreatingUser: (state) => {
      state.creatingUser = false;
      state.error = null;
    },
    setUserRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        state.user.role = action.payload;
      }
      if (state.apiUser) {
        state.apiUser.role = action.payload;
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.apiUser = null;
      state.idToken = null;
      state.userCreated = false;
      state.creatingUser = false; // Ensure this is reset
      state.loading = false; // Reset loading state
      state.error = null;
      clearToken();
      
      // Clear user-related localStorage
      localStorage.removeItem('signup_role');
      localStorage.removeItem('x-user-id');
      localStorage.removeItem('user_name');
      
      // Clear global user ID
      if ((window as any).__USER_ID__) {
        delete (window as any).__USER_ID__;
      }
      
      // Clear auth refresh callback
      if ((window as any).__reduxAuthRefreshCallback) {
        delete (window as any).__reduxAuthRefreshCallback;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // createOrUpdateUser
      .addCase(createOrUpdateUser.pending, (state) => {
        state.creatingUser = true;
        state.error = null;
      })
      .addCase(createOrUpdateUser.fulfilled, (state, action) => {
        state.creatingUser = false;
        state.userCreated = true;
        state.apiUser = action.payload.apiUser;
        
        // Create user context from Auth0 user and API user
        if (action.payload.auth0User) {
          const { auth0User } = action.payload;
          const { apiUser } = action.payload;
          
          state.user = {
            email: auth0User.email,
            sub: auth0User.sub,
            userId: apiUser?.id,
            name: apiUser?.name || auth0User.name,
            userName: apiUser?.userName,
            sector: apiUser?.sector,
            phoneNumber: apiUser?.phone || auth0User.phone_number,
            email_verified: auth0User.email_verified,
            isVerified: auth0User.email_verified,
            avatar: apiUser?.avatar || auth0User.picture,
            role: (apiUser?.role as UserRole) || 'customer'
          };
        }
      })
      .addCase(createOrUpdateUser.rejected, (state, action) => {
        state.creatingUser = false;
        state.error = action.error.message || 'Failed to create/update user';
      })
      // switchRole
      .addCase(switchRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(switchRole.fulfilled, (state, action) => {
        state.loading = false;
        state.apiUser = action.payload.updatedUser;
        if (state.user) {
          state.user.role = action.payload.newRole;
        }
      })
      .addCase(switchRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to switch role';
      })
      // refreshToken
      .addCase(refreshToken.pending, (state) => {
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.idToken = action.payload;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.error = action.error.message || 'Token refresh failed';
        // Clear auth state on token refresh failure
        state.isAuthenticated = false;
        state.user = null;
        state.apiUser = null;
        state.idToken = null;
        clearToken();
      });
  },
});

// Actions
export const {
  setAuthenticated,
  setIdToken,
  setLoading,
  setUser,
  setApiUser,
  setError,
  clearError,
  resetCreatingUser,
  setUserRole,
  logout,
} = authSlice.actions;

export const selectAuth = (state: any) => state.auth;
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;
export const selectUser = (state: any) => state.auth.user;
export const selectApiUser = (state: any) => state.auth.apiUser;
export const selectIdToken = (state: any) => state.auth.idToken;
export const selectAuthLoading = (state: any) => state.auth.loading || state.auth.creatingUser;
export const selectUserCreated = (state: any) => state.auth.userCreated;
export const selectAuthError = (state: any) => state.auth.error;
export const selectUserRole = (state: any) => state.auth.user?.role || 'customer';

export default authSlice.reducer;