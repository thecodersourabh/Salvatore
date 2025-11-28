import React, { useState, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Plus,
  Clock
} from "lucide-react";
import { NetworkErrorMessage } from "../../components/ui/NetworkErrorMessage";
import StatSkeleton from '../../components/ui/StatSkeleton';
import { ProductCard } from "../../components/ProductCard";
import { ProductDetailModal } from "../../components/ProductDetailModal";
import { useDashboard } from "../../hooks/useDashboard";
import { User } from "../../types/user";
import { ProfileCompletionAlert } from "../../components/Dashboard/ProfileCompletionAlert";
import { useCurrency } from '../../context/CurrencyContext';
import { ProductService } from "../../services/cachedServices";
import { ProductResponse } from "../../services/productService";
import { lazyWithRetry } from "../../utils/chunkLoader";

// Lazy load non-critical components with retry logic
const QuickActions = lazyWithRetry(() => import("../../components/Dashboard/QuickActions"));

export const Dashboard = React.memo(() => {

  
  const navigate = useNavigate();
  const { user, idToken } = useAuth() as { user: (User & { serviceProviderProfile?: User; sub?: string }) | null; idToken: string | null };
  const { formatCurrency } = useCurrency();
  

  
  // More stable memoization to prevent unnecessary re-renders
  const memoizedUser = useMemo(() => {
    if (!user) return null;
    return {
      email: user.email,
      sub: user.sub, 
      id: user.id,
      name: user.name
    };
  }, [user?.email, user?.sub, user?.id, user?.name]);
  
  const memoizedIdToken = useMemo(() => idToken, [idToken]);
  
  // Use the optimized dashboard hook
  const {
    products,
    orderStats,
    profileCompletion,
    activeOrdersCount,
    loading,
    error: networkError,
    refetch,
    updateProductsState,
    invalidateCache
  } = useDashboard(memoizedUser, memoizedIdToken);

  // Local state for UI components
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculate stats based on products
  const safeUserProducts = Array.isArray(products) ? products : [];
  const activeProducts = safeUserProducts.filter(product => product?.isActive !== false);
  const totalEarnings = activeProducts.reduce(
    (sum, product) => sum + (product?.price || 0),
    0
  );

  // Count completed jobs: prefer backend-provided stats when available
  const totalCompletedJobs = orderStats && typeof orderStats.completedOrders === 'number'
    ? orderStats.completedOrders
    : 0;

  // Use orderStats when available for dashboard metrics
  const hasNumericStats = !!orderStats && typeof orderStats.totalRevenue === 'number' && typeof orderStats.pendingOrders === 'number' && typeof orderStats.inProgressOrders === 'number';
  const safeActiveOrders = hasNumericStats ? (orderStats!.pendingOrders + orderStats!.inProgressOrders) : safeUserProducts.length;
  const safeRevenueNumber = hasNumericStats ? orderStats!.totalRevenue : totalEarnings || 0;

  // Product management handlers with optimistic updates
  const handleProductDelete = async (productId: string) => {
    try {
      // Optimistically update UI
      updateProductsState(prev => prev.filter(p => (p?.productId || p?.id) !== productId));
      
      // Make API call
      await ProductService.deleteProduct(productId);
      
      // Invalidate cache to ensure fresh data on next load
      invalidateCache('products');
      

    } catch (error) {
      console.error('Error deleting product:', error);
      // Revert optimistic update by refetching
      refetch();

    }
  };

  const handleProductToggle = async (productId: string) => {
    try {
      const product = safeUserProducts.find(p => (p?.productId || p?.id) === productId);
      if (!product) return;

      const newActiveState = !product.isActive;
      
      // Optimistically update UI
      updateProductsState(prev => prev.map(p => 
        (p?.productId || p?.id) === productId ? { ...p, isActive: newActiveState } : p
      ));
      
      // Make API call
      const updatedData = { isActive: newActiveState };
      await ProductService.updateProduct(productId, updatedData);
      
      // Invalidate cache and refetch to ensure UI reflects server state
      invalidateCache('products');
      refetch();
      

    } catch (error) {
      console.error('Error toggling product status:', error);
      // Revert optimistic update by refetching
      refetch();

    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 dark:border-rose-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      {/* Network Error Message */}
      {networkError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <NetworkErrorMessage
            error={networkError}
            onRetry={() => {
              invalidateCache(); // Clear all cached data
              refetch(); // Refetch fresh data
            }}
          />
        </div>
      )}
      
      {/* Profile Completion Alert */}
      {showProfileAlert && user && profileCompletion !== 100 && (
        <ProfileCompletionAlert onClose={() => setShowProfileAlert(false)} completion={profileCompletion} profile={user} />
      )}

      {/* Hero Dashboard Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                Welcome to Dashboard, {user?.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                Manage your services and grow your business across multiple sectors
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                >
                  Active Orders
                </button>
                <button
                  onClick={() => navigate('/payments')}
                  className="border border-rose-600 text-rose-600 px-4 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors"
                >
                  View Analytics
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Active Orders</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {loading ? <StatSkeleton widthClass="w-12" /> : (activeOrdersCount !== null ? activeOrdersCount : safeActiveOrders)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Total Earnings</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {loading ? <StatSkeleton widthClass="w-20" /> : formatCurrency(safeRevenueNumber)}
                    </p>
                  </div>
                   <DollarSign className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">This Month</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {loading ? <StatSkeleton widthClass="w-12" /> : `${totalCompletedJobs} Jobs`}
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">On-time delivery</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">100 %</p>
                  </div>
                  <Clock className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Management Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Your Service Products
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Manage your service offerings and track their performance
            </p>
          </div>
          <button 
            onClick={() => navigate('/add-product')}
            className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : safeUserProducts.length === 0 ? (
          <div className="max-w-xl mx-auto">
            <div className="card p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products yet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">You haven't added any service products. Create your first listing to start receiving bookings.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => navigate('/profile/complete')} className="button-primary px-4 py-2">Complete Profile</button>
                <button onClick={() => navigate('/add-product')} className="button-secondary px-4 py-2">Add Service</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {safeUserProducts.map((product) => (
              <ProductCard
                key={product.productId || product.id}
                product={product}
                onEdit={(product) => navigate(`/add-product?edit=${product.productId || product.id}`)}
                onDelete={(productId) => handleProductDelete(productId)}
                onToggleActive={(productId) => handleProductToggle(productId)}
                onView={(product) => {
                  setSelectedProduct(product as ProductResponse);
                  setIsDetailModalOpen(true);
                }}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lazy-loaded Quick Actions Section */}
      <Suspense fallback={
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mx-auto mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border border-gray-100 rounded-lg">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <QuickActions />
      </Suspense>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedProduct(null);
          }}
          onEdit={(product) => {
            navigate(`/add-product?edit=${product.productId || product.id}`);
          }}
          onDelete={handleProductDelete}
        />
      )}
    </div>
  );
});
