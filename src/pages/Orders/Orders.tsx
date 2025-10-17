import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Filter, ChevronRight, RefreshCw, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, OrderListParams, OrderListResponse } from '../../types/order';
import { useDebounce } from '../../hooks/useDebounce';
import { OrderDetails } from './OrderDetails';
import { useAuth } from '../../context/AuthContext';

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: OrderListResponse['pagination'] | null;
  summary: OrderListResponse['summary'] | null;
}

export const Orders = () => {
  const { userContext, idToken, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<OrdersState>({
    orders: [],
    loading: true,
    error: null,
    pagination: null,
    summary: null
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const limit = 10;

  // Debounced search function
  const debouncedSearchCallback = useCallback((query: string) => {
    if (query.trim()) {
      searchOrders(query);
    } else {
      fetchOrders({ page: currentPage, limit });
    }
  }, [currentPage]);

  const debouncedSearch = useDebounce(debouncedSearchCallback, 500);

  // Main fetch function
  const fetchOrders = async (params: OrderListParams = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check for idToken like in BillingPaymentGrid
      if (!idToken) {
        setState(prev => ({
          ...prev,
          error: 'Authentication required. Please log in to view orders.',
          loading: false
        }));
        return;
      }
      
      // Set user context before making API calls
      if (userContext && userContext.sub) {
        // Get actual user ID from localStorage mapping (same as TransactionService pattern)
        const actualUserId = localStorage.getItem(`auth0_${userContext.sub}`);
        if (actualUserId) {
          orderService.setUserContext({
            id: actualUserId,
            email: userContext.email,
            name: userContext.name
          });
        } else {
          console.warn('No user ID mapping found, using sub as fallback');
          orderService.setUserContext({
            id: userContext.sub,
            email: userContext.email,
            name: userContext.name
          });
        }
      } else {
        throw new Error('User authentication required');
      }
      
      const defaultParams: OrderListParams = {
        page: currentPage,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...params
      };

      let response: OrderListResponse;
      const requestOptions = idToken ? { idToken } : undefined;

      if (selectedStatus !== 'all') {
        response = await orderService.getOrders({
          ...defaultParams,
          status: selectedStatus
        }, requestOptions);
      } else {
        response = await orderService.getOrders(defaultParams, requestOptions);
      }

      // Ensure response is valid
      if (!response) {
        throw new Error('Invalid response from server');
      }

      // Calculate summary if not provided by API
      const orders = response.orders || [];
      const calculatedSummary = response.summary || {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o?.status === 'pending').length,
        completedOrders: orders.filter(o => o?.status === 'completed').length,
        totalRevenue: orders.reduce((sum, o) => {
          const total = (o?.pricing as any)?.totalAmount || o?.pricing?.total;
          return sum + (typeof total === 'number' ? total : 0);
        }, 0),
        currency: 'USD'
      };

      setState(prev => ({
        ...prev,
        orders: orders,
        pagination: response.pagination || {
          total: orders.length,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false
        },
        summary: calculatedSummary,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load orders. Please check your connection and try again.',
        loading: false
      }));
    }
  };

  // Search orders
  const searchOrders = async (query: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check for idToken and set user context (same as TransactionService pattern)
      if (!idToken) {
        setState(prev => ({
          ...prev,
          error: 'Authentication required. Please log in to search orders.',
          loading: false
        }));
        return;
      }
      
      if (userContext && userContext.sub) {
        // Get actual user ID from localStorage mapping (same as TransactionService pattern)
        const actualUserId = localStorage.getItem(`auth0_${userContext.sub}`);
        if (actualUserId) {
          orderService.setUserContext({
            id: actualUserId,
            email: userContext.email,
            name: userContext.name
          });
        } else {
          orderService.setUserContext({
            id: userContext.sub,
            email: userContext.email,
            name: userContext.name
          });
        }
      } else {
        throw new Error('User authentication required');
      }
      
      const response = await orderService.searchOrders(query, {
        page: currentPage,
        limit,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      }, { idToken: idToken || undefined });

      setState(prev => ({
        ...prev,
        orders: response.orders,
        pagination: response.pagination,
        summary: response.summary,
        loading: false
      }));
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Search failed. Please try again.',
        loading: false
      }));
    }
  };

  // Status filter options
  const statusOptions: { value: OrderStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Orders', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'processing', label: 'Processing', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { value: 'ready', label: 'Ready', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    { value: 'rejected', label: 'Rejected', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
  ];

  const getStatusColor = (status: OrderStatus): string => {
    const statusConfig = statusOptions.find(option => option.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle status filter change
  const handleStatusChange = (status: OrderStatus | 'all') => {
    // Local-only filter: do not call the API when changing the status filter.
    setSelectedStatus(status);
    // Keep pagination where it is for now, but reset to first page if switching filters
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Derive filtered orders locally based on selectedStatus (client-side filtering)
  const filteredOrders = selectedStatus === 'all'
    ? state.orders
    : state.orders.filter(o => o.status === selectedStatus);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Retry function
  const handleRetry = () => {
    fetchOrders({ page: currentPage, limit });
  };

  // Handle order selection
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  // Handle order details close
  const handleOrderDetailsClose = () => {
    setIsOrderDetailsOpen(false);
    setSelectedOrder(null);
  };

  // Handle order update from OrderDetails
  const handleOrderUpdate = (updatedOrder: Order) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    }));
    setSelectedOrder(updatedOrder);
  };

  // Initialize data on component mount
  useEffect(() => {
    if (isAuthenticated && idToken) {
      fetchOrders();
    }
  }, [currentPage, isAuthenticated, idToken]);

  // Update search when dependencies change
  useEffect(() => {
    if (isAuthenticated && idToken) {
      if (searchQuery.trim()) {
        debouncedSearch(searchQuery);
      } else {
        fetchOrders({ page: currentPage, limit });
      }
    }
  }, [debouncedSearch, searchQuery, currentPage, isAuthenticated, idToken]);

  // Show loading if not authenticated
  if (!isAuthenticated || !userContext) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-white dark:bg-gray-900">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-rose-600" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Orders</h1>
          </div>

          {/* Search and Filter */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusOptions.find(opt => opt.value === selectedStatus)?.label}
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                  <div className="py-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedStatus === option.value
                            ? 'bg-rose-50 dark:bg-rose-900 text-rose-600 dark:text-rose-200'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${option.color}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {state.loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading orders...</span>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Error</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-300">{state.error}</p>
            <div className="mt-6">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!state.loading && !state.error && (
          <div className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No orders yet</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-300">
                  When you place an order, it will appear here
                </p>
                <div className="mt-6">
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700"
                  >
                    Start Shopping
                  </a>
                </div>
              </div>
            ) : (
              filteredOrders.map((order: Order) => {
                // Debug: log timeline and status
                console.log('Order Timeline:', order.timeline);
                const currentStatus: OrderStatus = order.timeline && order.timeline.length > 0
                  ? order.timeline[order.timeline.length - 1].status
                  : order.status || 'pending';
                return (
                  <div 
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          {order.items && order.items.length > 0 && order.items[0].images && order.items[0].images.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={order.items[0].images![0]} alt={order.items[0].name || 'Item image'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                              {order.items && order.items.length > 0 ? (order.items[0].name || order.serviceProviderName) : order.serviceProviderName || order.id}
                            </h3>
                          </div>

                          <div className="mt-2">
                            {(() => {
                              const time = order.updatedAt ? new Date(order.updatedAt).toLocaleString() : (order.createdAt ? new Date(order.createdAt).toLocaleString() : null);
                              return (
                                <div>
                                  {time && <p className="text-xs text-gray-400 mt-1">{time}</p>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentStatus || 'pending')}`}> 
                          {(currentStatus || 'pending').charAt(0).toUpperCase() + (currentStatus || 'pending').slice(1)}
                        </span>
                        {/* Raw status for visibility/debugging */}

                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">${((order.pricing as any)?.totalAmount || order.pricing?.total || 0).toFixed(2)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-300">{order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}</p>
                        </div>

                        <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {state.pagination && state.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((state.pagination.currentPage - 1) * state.pagination.limit) + 1} to{' '}
                {Math.min(state.pagination.currentPage * state.pagination.limit, state.pagination.total)} of{' '}
                {state.pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!state.pagination.hasPrev}
                  className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm font-medium text-gray-900 dark:text-white">
                  Page {state.pagination.currentPage} of {state.pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!state.pagination.hasNext}
                  className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          isOpen={isOrderDetailsOpen}
          onClose={handleOrderDetailsClose}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
};
