/**
 * Utility functions to optimize user ID resolution and reduce redundant lookups
 */

let cachedUserId: string | null = null;

export const getUserId = (user?: any): string | null => {
  // Return cached value if available
  if (cachedUserId) {
    return cachedUserId;
  }

  let userId: string | null = null;

  if (user?.sub) {
    // First try to get mapped internal user ID from localStorage
    userId = localStorage.getItem(`auth0_${user.sub}`) || null;
  }
  
  // Fallback to x-user-id or window context
  if (!userId) {
    userId = localStorage.getItem('x-user-id') || (window as any).__USER_ID__ || null;
  }
  
  // Final fallback to email or sub
  if (!userId) {
    userId = user?.email || user?.sub || null;
  }

  // Cache the result for subsequent calls
  if (userId) {
    cachedUserId = userId;
  }

  return userId;
};

export const clearUserIdCache = () => {
  cachedUserId = null;
};

export const setUserIdCache = (userId: string) => {
  cachedUserId = userId;
};