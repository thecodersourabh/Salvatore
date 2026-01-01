import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Truck,
  Home
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import OrderTracker from '../../components/OrderTracker';
import { useCurrency } from '../../hooks/useCurrency';

interface OrderDetailsProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate?: (updatedOrder: Order) => void;
}

export const OrderDetails = ({ order, isOpen, onClose, onOrderUpdate }: OrderDetailsProps) => {
  const { userContext, idToken } = useAuth();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Helper function to ensure user context is set
  const ensureUserContext = () => {
    // Check for idToken like in BillingPaymentGrid
    if (!idToken) {
      throw new Error('ID token not found. Please authenticate.');
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
  };

  // Quick check whether current user matches order's service provider
  const ensureOwnerOrProvider = () => {
    const currentUserId = orderService.getUserContext()?.id;
    const providerId = order.serviceProviderId as string | undefined;
    if (!currentUserId) {
      throw new Error('User authentication required');
    }
    if (providerId && currentUserId !== providerId) {
      throw new Error('Access denied: Cannot access other customers\' orders');
    }
  };

  // Fetch order timeline
  useEffect(() => {
    if (isOpen && order.id) {
      fetchOrderTimeline();
    }
  }, [isOpen, order.id]);

  const fetchOrderTimeline = async () => {
    try {
      ensureUserContext();
      ensureOwnerOrProvider();
      const timelineData = await orderService.getOrderTimeline(order.id, { idToken: idToken || undefined });
      setTimeline(timelineData);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      // Surface API error message if available
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch timeline.');
      }
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus, additionalData?: any) => {
    setLoading(true);
    setError(null);

    try {
      ensureUserContext();
      ensureOwnerOrProvider();
      let updatedOrder: Order;
      console.log('Updating order status to:', newStatus);
      const currentUserId = orderService.getUserContext()?.id;
      switch (newStatus) {
        case 'confirmed':
          // Include customer information if available — backend sometimes requires it for accept endpoint
          updatedOrder = await orderService.acceptOrder(order.id, {
            customer: (order.customer as any) || undefined,
            serviceProviderId: order.serviceProviderId,
            items: (order.items as any) || undefined,
            userId: currentUserId,
            ...additionalData
          });
          break;
        case 'rejected':
          updatedOrder = await orderService.rejectOrder(order.id, {
            reason: rejectionReason,
            ...additionalData
          });
          break;
        case 'in-progress':
          updatedOrder = await orderService.startOrder(order.id, additionalData?.notes);
          console.log('Order started:', updatedOrder);
          break;
        case 'completed':
          // Some backends require customer and related fields for the complete endpoint
          updatedOrder = await orderService.completeOrder(order.id, {
            customer: (order.customer as any) || undefined,
            serviceProviderId: order.serviceProviderId,
            items: (order.items as any) || undefined,
            userId: currentUserId,
            ...additionalData
          });
          break;
        case 'ready':
          updatedOrder = await orderService.markOrderReady(order.id, additionalData);
          break;
        case 'packing_in_progress':
          updatedOrder = await orderService.markOrderPackingInProgress(order.id, additionalData);
          break;
        case 'packed':
          updatedOrder = await orderService.markOrderPacked(order.id, additionalData);
          break;
        case 'ready_to_dispatch':
          updatedOrder = await orderService.markOrderReadyToDispatch(order.id, additionalData);
          break;
        case 'in_transit':
          updatedOrder = await orderService.markOrderInTransit(order.id, additionalData);
          break;
        case 'delivered':
          updatedOrder = await orderService.markOrderDelivered(order.id, additionalData);
          break;
        default:
          updatedOrder = await orderService.updateOrder(order.id, {
            status: newStatus,
            ...additionalData
          });
      }

      onOrderUpdate?.(updatedOrder);
      fetchOrderTimeline(); // Refresh timeline
    } catch (error) {
      console.error('Failed to update order:', error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to update order status. Please try again.');
      } else {
        setError('Failed to update order status. Please try again.');
      }
    } finally {
      setLoading(false);
      setShowRejectForm(false);
      setRejectionReason('');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      ensureUserContext();
      await orderService.sendMessageToCustomer(order.id, message);
      setMessage('');
      setShowMessageForm(false);
      // You might want to refresh messages or show success notification
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to send message. Please try again.');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      packing_in_progress: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      packed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      ready_to_dispatch: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      delivered: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      normal: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full h-screen sm:h-auto sm:max-w-4xl sm:mx-4 bg-white dark:bg-gray-800 sm:rounded-lg shadow-xl overflow-hidden max-sm:pt-[max(env(safe-area-inset-top),3rem)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 max-sm:sticky max-sm:top-0 max-sm:bg-white max-sm:dark:bg-gray-800 max-sm:z-10">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    Order {order.orderNumber || `#${order.id?.substring(0, 8) || 'N/A'}`}
                  </h2>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'pending')}`}>
                    {(order.status || 'pending').replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {order.priority && order.priority !== 'normal' && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-1 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-sm:max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-200px)]">
            <div className="px-4 py-3 sm:p-6 space-y-4 sm:space-y-6 max-sm:pb-20">
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Status Tracker */}
              <OrderTracker
                currentStatus={order.status || 'pending'}
                createdAt={order.createdAt}
                scheduledDate={order.scheduledDate}
                completedAt={order.status === 'completed' ? order.updatedAt || order.createdAt : undefined}
                className="mb-6"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                
                {/* Customer Information */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-rose-600" />
                    Customer Information
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start space-x-3">
                      <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium break-words">{(order.customer as any)?.contactInfo?.name || order.customer?.name || 'Unknown Customer'}</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-all">{(order.customer as any)?.contactInfo?.email || order.customer?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Phone className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{(order.customer as any)?.contactInfo?.phone || order.customer?.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="text-gray-600 dark:text-gray-300">
                        <p>{
                          // First try API format (simple string)
                          (order.customer as any)?.contactInfo?.address ||
                          // Then try interface format (object with safe navigation)
                          (order.customer?.address?.street ? 
                            `${order.customer?.address?.street}${order.customer?.address?.city ? ', ' + order.customer.address.city : ''}${order.customer?.address?.state ? ', ' + order.customer.address.state : ''} ${order.customer?.address?.country || ''} ${order.customer?.address?.pincode || ''}`.trim() : 
                            'No address provided')
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-rose-600" />
                    Order Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Service Provider:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{order.serviceProviderName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Order Date:</span>
                      <span className="text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    {order.scheduledDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Scheduled:</span>
                        <span className="text-gray-900 dark:text-white">{new Date(order.scheduledDate).toLocaleString()}</span>
                      </div>
                    )}
                    {order.deliveryInfo && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Delivery Type:</span>
                        <span className="flex items-center text-gray-900 dark:text-white">
                          {order.deliveryInfo?.type === 'delivery' ? <Truck className="h-4 w-4 mr-1" /> : <Home className="h-4 w-4 mr-1" />}
                          {order.deliveryInfo?.type || 'on_site'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Order Items */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Items</h3>
                <div className="space-y-3">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-md">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Category: {item.category}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{formatCurrency(Math.round(Number(item.totalPrice) || 0))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-rose-600" />
                  Pricing Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(Math.round(Number(order.pricing?.subtotal) || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Taxes:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(Math.round(Number((order.pricing as any)?.tax || order.pricing?.taxes || 0) || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Service Fee:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(Math.round(Number(order.pricing?.serviceFee) || 0))}</span>
                  </div>
                  {(order.pricing?.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(Math.round(Number(order.pricing?.discount) || 0))}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-rose-600">{formatCurrency(Math.round(Number((order.pricing as any)?.totalAmount || order.pricing?.total || 0) || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-rose-600" />
                    Order Timeline
                  </h3>
                  <div className="space-y-3">
                    {timeline.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-3 h-3 bg-rose-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Status changed to {event.status.replace('-', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.timestamp).toLocaleString()} by {event.updatedBy}
                          </p>
                          {event.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
                  <p className="text-gray-600 dark:text-gray-300">{order.notes}</p>
                </div>
              )}

            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 dark:bg-gray-900 sm:rounded-b-lg max-sm:sticky max-sm:bottom-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-2 sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:w-auto">
                {/* Show Accept/Reject for pending orders */}
                {order?.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('confirmed')}
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Accept Order</span>
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </>
                )}

                {/* Show Start button for confirmed orders */}
                {order?.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate('in-progress')}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Start Work</span>
                  </button>
                )}

                {/* Show Complete button for in-progress orders */}
                {order?.status === 'in-progress' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Complete Order</span>
                  </button>
                )}
              </div>

              <div className="w-full sm:w-auto">
                <button
                  onClick={() => setShowMessageForm(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span>Message Customer</span>
                </button>
              </div>
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={!rejectionReason.trim() || loading}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded disabled:opacity-50"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Message Form */}
            {showMessageForm && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message to Customer
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Type your message to the customer..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || loading}
                    className="px-3 py-1 bg-rose-600 text-white text-sm rounded disabled:opacity-50"
                  >
                    Send Message
                  </button>
                  <button
                    onClick={() => setShowMessageForm(false)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};