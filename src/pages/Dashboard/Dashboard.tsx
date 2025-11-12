import { useState, useEffect } from "react";
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
import { ErrorType } from "../../services/apiErrorHandler";
import { ProductCard } from "../../components/ProductCard";
import { ProductDetailModal } from "../../components/ProductDetailModal";
import { UserService } from "../../services";
import { orderService } from "../../services/orderService";
import { OrderStats } from "../../types/order";
import {useSectorTranslation } from '../../hooks/useSectorTranslation';
import {useLanguage } from '../../context/LanguageContext';
import { ServiceSector, User } from "../../types/user";
import { ProfileCompletionAlert } from "../../components/Dashboard/ProfileCompletionAlert";
import { useCurrency } from '../../context/CurrencyContext';
import { ProductService, ProductResponse } from "../../services/productService";

// ServiceItem interface removed - now using products directly

// Icon map removed - not needed for product display

export const Dashboard = () => {
  const navigate = useNavigate();
  const { getCurrentSectors, translateSector } = useSectorTranslation();
  const { user, idToken } = useAuth() as { user: (User & { serviceProviderProfile?: User; sub?: string }) | null; idToken: string | null };
  const { language } = useLanguage();
  const { formatCurrency, currency } = useCurrency();
  // Removed services state - now showing products directly
  const [loading, setLoading] = useState(true);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [networkError, setNetworkError] = useState<{ type: ErrorType; message: string } | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number | null>(null);
  const [userProducts, setUserProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.email) {
        try {
          const userProfile = await UserService.getUserByEmail(user.email);

          // Calculate completion percentage
          let completed = 0;
          if (userProfile?.displayName) completed += 20;
          if (userProfile?.sector) completed += 20;
          if (userProfile?.phone) completed += 20;
          if (Array.isArray(userProfile?.skills) && userProfile.skills.length > 0) completed += 20;
          if (userProfile?.availability) completed += 20;

          setProfileCompletion(completed);
          setNetworkError(null);
        } catch (error) {
          console.error('Error loading profile:', error);
          setNetworkError({
            type: ErrorType.NETWORK,
            message: 'Unable to load your profile. Please check your internet connection.'
          });
        }
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const profile = await UserService.getUserByEmail(user.email) as User;
        
        if (profile?.sector) {
          const sectorServices = getCurrentSectors(language);
          const userSector = profile.sector;
          const translatedSector = translateSector(userSector);
          const sectorData = sectorServices[translatedSector as ServiceSector];
          if (sectorData) {
            // Store profile data for later use when products are loaded
            localStorage.setItem('dashboardProfile', JSON.stringify({
              profile,
              userSector,
              sectorData
            }));
          }
        }
        setNetworkError(null);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setNetworkError({
          type: ErrorType.NETWORK,
          message: 'Unable to load your services. Please check your internet connection.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch user products
  useEffect(() => {
    const loadUserProducts = async () => {
      if (!user?.email && !(user as any)?.sub) {
        setProductsLoading(false);
        return;
      }

      try {
        // Use proper user ID mapping pattern (same as used in other services)
        let userId: string | null = null;
        
        if ((user as any)?.sub) {
          // First try to get mapped internal user ID from localStorage
          userId = localStorage.getItem(`auth0_${(user as any).sub}`) || null;
        }
        
        // Fallback to x-user-id or window context
        if (!userId) {
          userId = localStorage.getItem('x-user-id') || (window as any).__USER_ID__ || null;
        }
        
        // Final fallback to email or sub
        if (!userId) {
          userId = user?.email || (user as any)?.sub || null;
        }
        
        console.log('Fetching products for userId:', userId, 'user sub:', (user as any)?.sub);
        
        if (userId) {
          const products = await ProductService.getUserProducts(userId);
          console.log('Fetched products:', products?.length || 0, 'products for user:', userId);
          setUserProducts(products || []);
        } else {
          console.warn('No valid userId found for product lookup');
          setUserProducts([]);
        }
        setNetworkError(null);
      } catch (error) {
        console.error('Error loading user products:', error);
        setUserProducts([]);
        // Don't set network error for products since it's not critical
      } finally {
        setProductsLoading(false);
      }
    };

    loadUserProducts();
  }, [user]);

  // Log products when loaded
  useEffect(() => {
    if (!productsLoading) {
      const safeCount = Array.isArray(userProducts) ? userProducts.length : 0;
      console.log('User products loaded:', safeCount, 'userProducts type:', typeof userProducts);
    }
  }, [userProducts, productsLoading]);

  // Fetch provider order stats (status wise) for dashboard metrics
  useEffect(() => {
    const loadOrderStats = async () => {
      if (!user || !idToken) {
        setStatsLoading(false);
        return;
      }

      try {
        // Map auth0 sub to internal user id if present (same pattern used elsewhere)
        const mappedId = (user as any)?.sub ? (localStorage.getItem(`auth0_${(user as any).sub}`) || (user as any).sub) : (user as any).id || '';
        if (!mappedId) {
          setStatsLoading(false);
          return;
        }

        orderService.setUserContext({ id: mappedId, email: user.email || mappedId, name: user.name });

        // Get stats (default period = month)
        const stats = await orderService.getOrderStats('month');
        setOrderStats(stats);
        // Compute active orders from available stats fields when possible
        if (typeof stats?.totalOrders === 'number') {
          const total = stats.totalOrders || 0;
          const completed = typeof stats.completedOrders === 'number' ? stats.completedOrders : 0;
          const cancelled = typeof stats.cancelledOrders === 'number' ? stats.cancelledOrders : 0;
          // Active = total - completed - cancelled (includes pending, confirmed, in-progress)
          const activeFromTotals = Math.max(0, total - completed - cancelled);
          setActiveOrdersCount(activeFromTotals);
        } else if (Array.isArray(stats?.statusBreakdown) && stats.statusBreakdown.length > 0) {
          const computedActive = stats.statusBreakdown
            .filter(s => ['pending', 'confirmed', 'in-progress'].includes(s.status))
            .reduce((sum, s) => sum + (s.count || 0), 0);
          setActiveOrdersCount(computedActive);
        } else {
          // Fallback: fetch provider orders with those statuses and read pagination.total
          try {
            // Request a larger page size to ensure pagination metadata is returned
            const listResp = await orderService.getOrders({ status: ['pending', 'confirmed', 'in-progress'], page: 1, limit: 100 });
            const totalFromPagination = listResp?.pagination?.total;
            const ordersArrayLen = Array.isArray(listResp?.orders) ? listResp.orders.length : 0;
            let total = 0;
            if (typeof totalFromPagination === 'number') {
              total = totalFromPagination;
            } else if (ordersArrayLen > 0) {
              // If pagination not present, use returned array length
              total = ordersArrayLen;
            }
            // Extra safety: if pagination says 1 but the array contains more, prefer array length
            if (total === 1 && ordersArrayLen > 1) total = ordersArrayLen;
            setActiveOrdersCount(total);
          } catch (e) {
            console.warn('[Dashboard] Failed to compute active orders via fallback list', e);
            setActiveOrdersCount(null);
          }
        }
        setNetworkError(null);
      } catch (err) {
        console.error('Failed to load order stats:', err);
        setNetworkError({ type: ErrorType.NETWORK, message: 'Unable to load order metrics.' });
      } finally {
        setStatsLoading(false);
      }
    };

    loadOrderStats();
  }, [user, idToken]);

  // Removed toggleServiceStatus - not needed for product display

  // Calculate stats based on products instead of services
  const safeUserProducts = Array.isArray(userProducts) ? userProducts : [];
  const activeProducts = safeUserProducts.filter(product => product?.isActive !== false);
  const totalEarnings = activeProducts.reduce(
    (sum, product) => sum + (product?.price || 0),
    0
  );

  // Count completed jobs: prefer backend-provided stats when available
  const totalCompletedJobs = orderStats && typeof orderStats.completedOrders === 'number'
    ? orderStats.completedOrders
    : 0;

  // Use orderStats when available for dashboard metrics (values used directly in JSX)
  const hasNumericStats = !!orderStats && typeof orderStats.totalRevenue === 'number' && typeof orderStats.pendingOrders === 'number' && typeof orderStats.inProgressOrders === 'number';
  const safeActiveOrders = hasNumericStats ? (orderStats!.pendingOrders + orderStats!.inProgressOrders) : safeUserProducts.length;
  const safeRevenueNumber = hasNumericStats ? orderStats!.totalRevenue : totalEarnings || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 dark:border-rose-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      {/* Network Error Message */}
      {networkError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <NetworkErrorMessage
            error={networkError}
            onRetry={() => {
              setLoading(true);
              setNetworkError(null);
              window.location.reload();
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
                      {statsLoading ? <StatSkeleton widthClass="w-12" /> : (activeOrdersCount !== null ? activeOrdersCount : safeActiveOrders)}
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
                      {statsLoading ? <StatSkeleton widthClass="w-20" /> : formatCurrency(safeRevenueNumber)}
                    </p>
                  </div>
                   <DollarSign className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">This Month</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{statsLoading ? <StatSkeleton widthClass="w-12" /> : `${totalCompletedJobs} Jobs`}</p>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {loading || productsLoading ? (
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
                <button onClick={() => navigate('/profile/edit')} className="button-primary px-4 py-2">Complete Profile</button>
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
                onDelete={async (productId) => {
                  try {
                    await ProductService.deleteProduct(productId);
                    setUserProducts(prev => Array.isArray(prev) ? prev.filter(p => (p?.productId || p?.id) !== productId) : []);
                    // Show success message
                    console.log('Product deleted successfully');
                  } catch (error) {
                    console.error('Error deleting product:', error);
                    console.log('Failed to delete product. Please try again.');
                  }
                }}
                onToggleActive={async (productId) => {
                  try {
                    const product = safeUserProducts.find(p => (p?.productId || p?.id) === productId);
                    if (product) {
                      // Update the product status
                      const updatedData = { isActive: !product.isActive };
                      await ProductService.updateProduct(productId, updatedData);
                      
                      // Update local state
                      setUserProducts(prev => Array.isArray(prev) ? prev.map(p => 
                        (p?.productId || p?.id) === productId ? { ...p, isActive: !p.isActive } : p
                      ) : []);
                      
                      console.log(`Product ${product.isActive ? 'deactivated' : 'activated'} successfully`);
                    }
                  } catch (error) {
                    console.error('Error toggling product status:', error);
                    console.log('Failed to update product status. Please try again.');
                  }
                }}
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

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/payments')}
              className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-rose-600" />
              </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">View Bookings</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Check your upcoming appointments and schedule</p>
            </div>
            
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-rose-600" />
              </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Analytics</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Track your performance and earnings</p>
            </div>
            
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer">
                <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  {currency === 'USD' ? (
                    <DollarSign className="h-6 w-6 text-rose-600" />
                  ) : (
                    <div className="text-rose-600 font-semibold text-lg">₹</div>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Payments</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Manage your earnings and payments</p>
            </div>
          </div>
        </div>
      </div>

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
          onDelete={async (productId) => {
            try {
              await ProductService.deleteProduct(productId);
              setUserProducts(prev => Array.isArray(prev) ? prev.filter(p => (p?.productId || p?.id) !== productId) : []);
              console.log('Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              console.log('Failed to delete product. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};
