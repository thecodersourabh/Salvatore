import { useState, useEffect, useCallback } from 'react';
import { UserService, ProductService, orderService } from '../services/cachedServices';
import { onProductChanged } from '../utils/cacheEvents';
import { getUserId } from '../utils/userIdResolver';
import { User } from '../types/user';
import { OrderStats } from '../types/order';
import { ErrorType } from '../services/apiErrorHandler';
import { ProductResponse } from '../services/productService';

interface DashboardData {
  profile: User | null;
  products: ProductResponse[];
  orderStats: OrderStats | null;
  profileCompletion: number;
  activeOrdersCount: number | null;
}

interface DashboardState {
  data: DashboardData;
  loading: boolean;
  error: { type: ErrorType; message: string } | null;
}

export const useDashboard = (user: any, idToken: string | null) => {
  const [state, setState] = useState<DashboardState>({
    data: {
      profile: null,
      products: [],
      orderStats: null,
      profileCompletion: 0,
      activeOrdersCount: null,
    },
    loading: true,
    error: null,
  });

  const calculateProfileCompletion = (profile: User): number => {
    let completed = 0;
    if (profile?.displayName) completed += 20;
    if (profile?.sector) completed += 20;
    if (profile?.phone) completed += 20;
    if (Array.isArray(profile?.skills) && profile.skills.length > 0) completed += 20;
    if (profile?.availability) completed += 20;
    return completed;
  };

  const calculateActiveOrders = (stats: OrderStats): number => {
    if (typeof stats?.totalOrders === 'number') {
      const total = stats.totalOrders || 0;
      const completed = typeof stats.completedOrders === 'number' ? stats.completedOrders : 0;
      const cancelled = typeof stats.cancelledOrders === 'number' ? stats.cancelledOrders : 0;
      return Math.max(0, total - completed - cancelled);
    } else if (Array.isArray(stats?.statusBreakdown) && stats.statusBreakdown.length > 0) {
      return stats.statusBreakdown
        .filter(s => ['pending', 'confirmed', 'in-progress'].includes(s.status))
        .reduce((sum, s) => sum + (s.count || 0), 0);
    }
    return 0;
  };

  const fetchDashboardData = useCallback(async () => {
    // Wait for both user and idToken to be available
    if (!user?.email || !idToken) {
      setState(prev => ({ ...prev, loading: !user?.email ? true : false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const userId = getUserId(user);
      if (!userId) {
        throw new Error('Unable to determine user ID');
      }

      // Set up order service context FIRST for cached service
      if (idToken && user) {
        try {
          const mappedId = user.sub ? (localStorage.getItem(`auth0_${user.sub}`) || user.sub) : user.id || '';
          if (mappedId) {
            orderService.setUserContext({ 
              id: mappedId, 
              email: user.email || mappedId, 
              name: user.name || user.email || ''
            });
            console.log('Order service context set successfully for user:', mappedId);
          } else {
            console.warn('No valid mapped ID found for order service context');
          }
        } catch (contextError) {
          console.error('Failed to set order service context:', contextError);
        }
      }

      // Execute all API calls in parallel - cached services handle caching automatically
      const promises = [
        UserService.getUserByEmail(user.email),
        ProductService.getUserProducts(userId),
        // Only try to get order stats if we have a token and user context is set
        idToken && orderService.getUserContext() 
          ? orderService.getOrderStats('month') 
          : Promise.resolve(null),
      ];

      const [profileResponse, productsResponse, orderStatsResponse] = await Promise.allSettled(promises);

      // Process profile data
      const profile = profileResponse.status === 'fulfilled' && profileResponse.value 
        ? profileResponse.value as User 
        : null;
      const profileCompletion = profile ? calculateProfileCompletion(profile) : 0;

      // Process products data
      const products = productsResponse.status === 'fulfilled' && Array.isArray(productsResponse.value) 
        ? productsResponse.value as ProductResponse[]
        : [];

      // Process order stats data
      let orderStats: OrderStats | null = null;
      let activeOrdersCount: number | null = null;

      if (orderStatsResponse.status === 'fulfilled' && orderStatsResponse.value) {
        orderStats = orderStatsResponse.value as OrderStats;
        activeOrdersCount = orderStats ? calculateActiveOrders(orderStats) : 0;
      } else {
        // No order stats available
        activeOrdersCount = null;
      }

      // Update state with all data
      setState({
        data: {
          profile,
          products,
          orderStats,
          profileCompletion,
          activeOrdersCount,
        },
        loading: false,
        error: null,
      });

      console.log('Dashboard data loaded successfully:', {
        profileLoaded: !!profile,
        productsCount: products.length,
        orderStatsLoaded: !!orderStats,
        activeOrdersCount,
      });

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          type: ErrorType.NETWORK,
          message: 'Unable to load dashboard data. Please check your internet connection.',
        },
      }));
    }
  }, [user, idToken]);

  // Refresh data function for manual retry
  const refetch = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Update products in state (for optimistic updates)
  const updateProducts = useCallback((updaterFn: (products: ProductResponse[]) => ProductResponse[]) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        products: updaterFn(prev.data.products),
      },
    }));
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Listen for product changes and refetch data
  useEffect(() => {
    const unsubscribe = onProductChanged((eventType, data) => {
      console.log('Product change detected:', eventType, data);
      // Refetch dashboard data when products are created, updated, or deleted
      fetchDashboardData();
    });

    return unsubscribe;
  }, [fetchDashboardData]);

  // Invalidate cache function for manual cache clearing
  const invalidateCacheFn = useCallback((dataType?: string) => {
    // Use the cached services to invalidate their caches
    if (dataType === 'profile') {
      UserService.invalidateUserCache('*');
    } else if (dataType === 'products') {
      ProductService.invalidateProductCache('*');
    } else {
      // Invalidate all caches
      UserService.invalidateUserCache('*');
      ProductService.invalidateProductCache('*');
      orderService.invalidateOrderCache();
    }
  }, []);

  return {
    ...state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    updateProducts,
    invalidateCache: invalidateCacheFn,
  };
};