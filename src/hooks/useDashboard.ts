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
    loading: false,
    error: null,
  });

  // Helper function to calculate profile completion
  const calculateProfileCompletion = (profile: User | null): number => {
    if (!profile) return 0;
    
    const requiredFields = ['name', 'email', 'bio'];
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof User];
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const fetchDashboardData = useCallback(async () => {
    // Wait for both user and idToken to be available
    const userEmail = user?.email;
    const userId = getUserId(user);
    
    if (!userEmail || !idToken || !userId) {
      setState(prev => ({ ...prev, loading: !userEmail ? true : false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Set up order service context
      if (idToken && user) {
        orderService.setUserContext({ 
          id: userId, 
          email: userEmail,
          name: user.name || userEmail 
        });
      }

      // Fetch all dashboard data in parallel
      const [profile, products, orderStats] = await Promise.all([
        UserService.getUserByEmail(userEmail),
        ProductService.getUserProducts(userId),
        orderService.getOrderStats('month')
      ]);

      const profileCompletion = calculateProfileCompletion(profile);
      const activeOrdersCount = orderStats?.totalOrders || 0;

      setState({
        data: {
          profile,
          products,
          orderStats,
          profileCompletion,
          activeOrdersCount
        },
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: { type: 'api' as ErrorType, message: error.message || 'Failed to load dashboard' }
      }));
    }
  }, [user?.email, user?.sub, user?.id, idToken]);

  // Separate function to update only products without full reload
  const updateProducts = useCallback(async () => {
    const userId = getUserId(user);
    if (!userId) return;

    try {
      console.log('Updating products only, not full dashboard');
      const products = await ProductService.getUserProducts(userId);
      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          products
        }
      }));
    } catch (error: any) {
      console.error('Failed to update products:', error);
    }
  }, [user?.email, user?.sub, user?.id]);

  // Refresh data function for manual retry
  const refetch = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Update products in state (for optimistic updates)
  const updateProductsState = useCallback((updaterFn: (products: ProductResponse[]) => ProductResponse[]) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        products: updaterFn(prev.data.products),
      },
    }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    console.log('Dashboard render, user:', user?.email, 'idToken:', !!idToken);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Listen for product changes and update only products
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    
    const unsubscribe = onProductChanged((eventType, data) => {
      console.log('Product change detected:', eventType, data);
      
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Debounce refetch to prevent rapid successive calls
      debounceTimer = setTimeout(() => {
        updateProducts(); // Only update products, not entire dashboard
      }, 500); // Wait 500ms after last change before refetching
    });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      unsubscribe();
    };
  }, [updateProducts]);

  // Invalidate cache function for manual cache clearing
  const invalidateCacheFn = useCallback((dataType?: string) => {
    // Use the cached services to invalidate their caches
    if (dataType === 'profile') {
      UserService.invalidateUserCache('*');
    } else if (dataType === 'products') {
      ProductService.invalidateProductCache('*');
    } else if (dataType === 'orders') {
      orderService.invalidateOrderCache('*');
    } else {
      // Clear all caches
      UserService.invalidateUserCache('*');
      ProductService.invalidateProductCache('*');
      orderService.invalidateOrderCache('*');
    }
  }, []);

  return {
    ...state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    updateProducts,
    updateProductsState,
    invalidateCache: invalidateCacheFn,
  };
};