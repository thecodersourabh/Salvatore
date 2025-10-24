import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Package, MessageSquare, CreditCard, Star, AlertCircle, CheckCircle, Bell, Trash2, CheckCheck } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { usePlatform } from '../hooks/usePlatform';
import { Notification } from '../services/notificationService';
import { orderService } from '../services/orderService';
import { OrderDetails } from '../pages/Orders/OrderDetails';
import { Order } from '../types/order';
import { useAuth } from '../context/AuthContext';

export const NotificationPanel = () => {
  const {
    notifications,
    isNotificationPanelOpen,
    setIsNotificationPanelOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addTestNotification,
    unreadCount
  } = useNotification();
  const { isNative } = usePlatform();

  if (!isNotificationPanelOpen) return null;

  // Get notification icon with better styling
  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: 'h-5 w-5' };
    switch (type) {
      case 'order': return <Package {...iconProps} className="h-5 w-5 text-emerald-500" />;
      case 'message': return <MessageSquare {...iconProps} className="h-5 w-5 text-blue-500" />;
      case 'payment': return <CreditCard {...iconProps} className="h-5 w-5 text-purple-500" />;
      case 'review': return <Star {...iconProps} className="h-5 w-5 text-yellow-500" />;
      case 'system': return <AlertCircle {...iconProps} className="h-5 w-5 text-gray-500" />;
      default: return <AlertCircle {...iconProps} className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get notification badge color
  const getBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'order': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'message': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'payment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'system': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  // Local state for opening OrderDetails modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const { userContext, idToken } = useAuth();
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [previewOrderData, setPreviewOrderData] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Ensure orderService has user context (same approach as OrderDetails/Orders pages)
  const ensureUserContext = () => {
    if (!idToken) {
      throw new Error('ID token not found. Please authenticate.');
    }

    if (userContext && userContext.sub) {
      const actualUserId = localStorage.getItem(`auth0_${userContext.sub}`);
      if (actualUserId) {
        orderService.setUserContext({ id: actualUserId, email: userContext.email, name: userContext.name });
      } else {
        orderService.setUserContext({ id: userContext.sub, email: userContext.email, name: userContext.name });
      }
    } else {
      throw new Error('User authentication required');
    }
  };

  const openOrderFromNotification = async (notification: Notification) => {
    // Prevent opening if no order id present
    const data = notification.data || {} as any;
    const orderId = (data.orderId || data.order_id || data.orderID || data.order || data.id);
    if (!orderId) return;

      try {
    console.debug('[NotificationPanel] Opening order from notification, orderId=', orderId, 'notification=', notification);
    // Ensure user context is available for orderService
    ensureUserContext();
    // Debug mapping and token
      const mappedId = userContext?.sub ? (localStorage.getItem(`auth0_${userContext.sub}`) || userContext.sub) : null;
      console.debug('[NotificationPanel] Using mappedUserId=', mappedId, 'idTokenPresent=', !!idToken);

      // Pre-check: if notification payload contains an assigned provider id and it does not match
      // the current authenticated provider id, avoid calling the single-order endpoint (will 403).
      const payload = (notification && (notification.data || {})) as any;
      const assignedProviderId = payload?.serviceProviderId || payload?.providerId || payload?.serviceProvider?.id || payload?.serviceProviderId || null;
      if (assignedProviderId && mappedId && assignedProviderId !== mappedId) {
        console.debug('[NotificationPanel] Notification assigned to different provider, skipping detailed fetch', { assignedProviderId, mappedId });
        // Show a read-only preview when available and surface a clear message
        setPreviewOrderData(payload);
        setIsPreviewOpen(true);
        setNotificationError('This order is assigned to another provider and cannot be viewed. Showing read-only preview when available.');
        return;
      }

      // First attempt: fetch fresh order details directly (pass explicit idToken like Orders.tsx)
      const order = await orderService.getOrderById(orderId.toString(), { idToken: idToken || undefined });
      // Unwrap API wrapper if present
      const orderPayload = (order && (order as any).data) ? (order as any).data : order;
      if (!orderPayload) {
        console.warn('[NotificationPanel] Received empty order payload for id', orderId, order);
        return;
      }
      setSelectedOrder(orderPayload as Order);
      setIsOrderDetailsOpen(true);
      // Mark as read
      markAsRead(notification.id);
      // Clear any previous error
      setNotificationError(null);
    } catch (err) {
      console.error('Failed to open order from notification', err);
      // Try to surface a helpful message to the user
      let msg = 'Failed to open order. Please try again.';
      try {
        // ApiError-like objects may carry message property
        msg = (err as any)?.message || msg;
        // Some API responses embed actual message in err.details or err.response
        if ((err as any)?.details?.message) msg = (err as any).details.message;
      } catch (e) {}

      // If access denied, try a couple of fallbacks: a search endpoint, then provider-orders paging
      if (msg && msg.toLowerCase().includes('access denied')) {
        console.debug('[NotificationPanel] Access denied fetching single order; attempting provider orders fallback');
        try {
          // Ensure user context is set (already attempted before)
          ensureUserContext();
          // Try search endpoint first (may be faster / more exact)
          try {
            const searchResp: any = await orderService.searchOrders(orderId.toString(), {}, { idToken: idToken || undefined });
            const searchOrders = (searchResp && searchResp.orders) ? searchResp.orders : (Array.isArray(searchResp) ? searchResp : []);
            const foundInSearch = searchOrders.find((o: any) => (o.id === orderId || o.orderNumber === orderId));
            if (foundInSearch) {
              console.debug('[NotificationPanel] Found order via searchOrders', foundInSearch.id);
              setSelectedOrder(foundInSearch as Order);
              setIsOrderDetailsOpen(true);
              markAsRead(notification.id);
              setNotificationError(null);
              return;
            }
          } catch (searchErr) {
            console.warn('[NotificationPanel] searchOrders failed, falling back to paging', searchErr);
          }
          // Try paged fetch of provider orders to find the order
          const maxPages = 5; // safe upper limit to avoid long loops
          const pageLimit = 50;
          for (let p = 1; p <= maxPages; p++) {
            try {
              const listResponse: any = await orderService.getOrders({ page: p, limit: pageLimit }, { idToken: idToken || undefined });
              const orders = (listResponse && listResponse.orders) ? listResponse.orders : (Array.isArray(listResponse) ? listResponse : []);
              if (!orders || orders.length === 0) break;
              const found = orders.find((o: any) => (o.id === orderId || o.orderNumber === orderId));
              if (found) {
                console.debug('[NotificationPanel] Found order in provider list page', p, 'opening details', found.id);
                setSelectedOrder(found as Order);
                setIsOrderDetailsOpen(true);
                markAsRead(notification.id);
                setNotificationError(null);
                return;
              }
              // If fewer than pageLimit returned, no more pages
              if (orders.length < pageLimit) break;
            } catch (pageErr) {
              console.warn('[NotificationPanel] Provider fallback page fetch failed', p, pageErr);
              break;
            }
          }
        } catch (fallbackErr) {
          console.warn('[NotificationPanel] Provider fallback failed', fallbackErr);
        }

        // If fallback didn't work, show preview if possible
        const payload = (notification && (notification.data || {})) as any;
        if (payload && (payload.orderId || payload.order_id || payload.orderNumber || payload.order_number || payload.order)) {
          setPreviewOrderData(payload);
          setIsPreviewOpen(true);
        }

        msg = 'Access denied: you do not have permission to view this order. Showing read-only preview when available.';
      }

      setNotificationError(msg);
    }
  };

  return (<>
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop with animation */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={() => setIsNotificationPanelOpen(false)}
      />

      {/* Notification panel - full screen on mobile, sidebar on desktop */}
      <div className={`
        relative ml-auto w-full sm:w-96 bg-white dark:bg-gray-900 h-full shadow-2xl 
        flex flex-col animate-in slide-in-from-right-full duration-300
        ${isNative ? 'pt-safe' : ''}
      `}>
        {/* Modern Header */}
        <div className="relative px-4 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="text-rose-100 text-sm">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationPanelOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Error banner for notification fetch problems */}
        {notificationError && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 flex items-start justify-between">
            <div>{notificationError}</div>
            <button onClick={() => setNotificationError(null)} className="ml-4 text-red-600 dark:text-red-300">Dismiss</button>
          </div>
        )}

        {/* Quick Action Bar */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {notifications.length} total
              </span>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear all</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications content */}
        {notifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-xs mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 rounded-full flex items-center justify-center">
                <Bell className="h-12 w-12 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Stay tuned! You'll receive notifications here when you get orders, messages, or important updates.
              </p>
              <button
                onClick={() => addTestNotification('order', '🎯 New Order Received', 'You have a new tailoring order from John Doe')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-medium rounded-lg hover:from-rose-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Package className="h-4 w-4" />
                <span>Add Test Notification</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      // If it's an order notification, open order details. Otherwise ignore.
                      if (notification.type === 'order') {
                        openOrderFromNotification(notification);
                      }
                    }}
                    className={`group relative p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                      !notification.isRead 
                        ? 'bg-gradient-to-r from-rose-50 via-white to-red-50 dark:from-rose-900/10 dark:via-gray-800 dark:to-red-900/10 border-l-4 border-l-rose-500 shadow-sm' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.3s ease-out',
                      cursor: notification.type === 'order' ? 'pointer' : 'default'
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon with background */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'order' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        notification.type === 'message' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        notification.type === 'payment' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        notification.type === 'review' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Type badge */}
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(notification.type)}`}>
                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            
                            {/* Title */}
                            <h4 className={`text-sm font-semibold mb-1 ${
                              notification.isRead 
                                ? 'text-gray-700 dark:text-gray-300' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            
                            {/* Message */}
                            <p className={`text-sm leading-relaxed ${
                              notification.isRead 
                                ? 'text-gray-500 dark:text-gray-400' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                            
                            {/* Timestamp */}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </p>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex flex-col items-center space-y-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-gray-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={`border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 ${isNative ? 'pb-safe' : ''}`}>
              <Link
                to="/notification-test"
                onClick={() => setIsNotificationPanelOpen(false)}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Bell className="h-4 w-4" />
                <span>View All Notifications</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
    {/* Order Details Modal */}
    {selectedOrder && (
      <OrderDetails
        order={selectedOrder as Order}
        isOpen={isOrderDetailsOpen}
        onClose={() => { setIsOrderDetailsOpen(false); setSelectedOrder(null); }}
        onOrderUpdate={(updated) => {
          // Update selected order and optionally update notification list
          setSelectedOrder(updated);
        }}
      />
    )}

    {/* Read-only preview fallback when access denied */}
    {isPreviewOpen && previewOrderData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => { setIsPreviewOpen(false); setPreviewOrderData(null); }} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Order Preview</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <div><strong>Order ID:</strong> {previewOrderData.orderId || previewOrderData.order_id || previewOrderData.order || 'N/A'}</div>
            <div><strong>Order Number:</strong> {previewOrderData.orderNumber || previewOrderData.order_number || 'N/A'}</div>
            <div><strong>Status:</strong> {previewOrderData.orderStatus || previewOrderData.status || 'N/A'}</div>
            <div><strong>Customer:</strong> {previewOrderData.customerName || previewOrderData.customer || 'N/A'}</div>
            {previewOrderData.message && <div><strong>Message:</strong> {previewOrderData.message}</div>}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => { setIsPreviewOpen(false); setPreviewOrderData(null); }} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">Close</button>
          </div>
        </div>
      </div>
    )}
  </>);
};