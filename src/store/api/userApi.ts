import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User } from '../../types/user';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v2/users',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state?.auth?.idToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// User API endpoints
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery,
  tagTypes: ['User', 'Profile'],
  endpoints: (builder) => ({
    // Get user by email
    getUserByEmail: builder.query<User, string>({
      query: (email) => `/email/${email}`,
      providesTags: (result, _error, email) => [
        { type: 'User', id: email },
        { type: 'Profile', id: result?.id },
      ],
    }),
    
    // Check if user exists
    isUserExists: builder.query<boolean, string>({
      query: (email) => `/exists/${email}`,
      providesTags: (_result, _error, email) => [{ type: 'User', id: `exists-${email}` }],
    }),
    
    // Create user
    createUser: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/create',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: (_result, _error, userData) => [
        { type: 'User', id: userData.email },
        { type: 'User', id: `exists-${userData.email}` },
      ],
    }),
    
    // Update user
    updateUser: builder.mutation<User, { email: string; updates: Partial<User> }>({
      query: ({ email, updates }) => ({
        url: `/email/${email}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, _error, { email }) => [
        { type: 'User', id: email },
        { type: 'Profile', id: result?.id },
      ],
    }),
    
    // Get user profile by ID
    getUserProfile: builder.query<User, string>({
      query: (userId) => `/${userId}/profile`,
      providesTags: (result, _error, userId) => [
        { type: 'Profile', id: userId },
        { type: 'User', id: result?.email },
      ],
    }),
    
    // Update user profile
    updateUserProfile: builder.mutation<User, { userId: string; updates: Partial<User> }>({
      query: ({ userId, updates }) => ({
        url: `/${userId}/profile`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, _error, { userId }) => [
        { type: 'Profile', id: userId },
        { type: 'User', id: result?.email },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetUserByEmailQuery,
  useLazyGetUserByEmailQuery,
  useIsUserExistsQuery,
  useLazyIsUserExistsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = userApi;