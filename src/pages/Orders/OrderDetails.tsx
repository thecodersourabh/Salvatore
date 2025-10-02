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
import { useAuth } from '../../context/AuthContext';
import OrderTracker from '../../components/OrderTracker';

interface OrderDetailsProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate?: (updatedOrder: Order) => void;
}

export const OrderDetails = ({ order, isOpen, onClose, onOrderUpdate }: OrderDetailsProps) => {
  const { userContext, idToken } = useAuth();
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

  // Fetch order timeline
  useEffect(() => {
    if (isOpen && order.id) {
      fetchOrderTimeline();
    }
  }, [isOpen, order.id]);

  const fetchOrderTimeline = async () => {
    try {
      ensureUserContext();
      const timelineData = await orderService.getOrderTimeline(order.id, { idToken: idToken || undefined });
      setTimeline(timelineData);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus, additionalData?: any) => {
    setLoading(true);
    setError(null);

    try {
      ensureUserContext();
      let updatedOrder: Order;

      switch (newStatus) {
        case 'confirmed':
          updatedOrder = await orderService.acceptOrder(order.id, additionalData);
          break;
        case 'rejected':
          updatedOrder = await orderService.rejectOrder(order.id, {
            reason: rejectionReason,
            ...additionalData
          });
          break;
        case 'in-progress':
          updatedOrder = await orderService.startOrder(order.id, additionalData?.notes);
          break;
        case 'completed':
          updatedOrder = await orderService.completeOrder(order.id, additionalData);
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
      setError('Failed to update order status. Please try again.');
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
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
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

  const canAccept = order?.status === 'pending';
  const canReject = ['pending', 'confirmed'].includes(order?.status || '');
  const canStart = order?.status === 'confirmed';
  const canComplete = order?.status === 'in-progress';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <Package className="h-6 w-6 text-rose-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order {order.orderNumber || `#${order.id?.substring(0, 8) || 'N/A'}`}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status || 'pending')}`}>
                    {(order.status || 'pending').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority || 'normal')}`}>
                    {(order.priority || 'normal').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Customer Information */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-rose-600" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white font-medium">{(order.customer as any)?.contactInfo?.name || order.customer?.name || 'Unknown Customer'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{(order.customer as any)?.contactInfo?.email || order.customer?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{(order.customer as any)?.contactInfo?.phone || order.customer?.phone || 'No phone'}</span>
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {order.pricing?.currency || 'INR'} {(item.totalPrice || 0).toFixed(2)}
                        </p>
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
                    <span className="text-gray-900 dark:text-white">{order.pricing?.currency || 'USD'} {(order.pricing?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Taxes:</span>
                    <span className="text-gray-900 dark:text-white">{order.pricing?.currency || 'USD'} {((order.pricing as any)?.tax || order.pricing?.taxes || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Service Fee:</span>
                    <span className="text-gray-900 dark:text-white">{order.pricing?.currency || 'USD'} {(order.pricing?.serviceFee || 0).toFixed(2)}</span>
                  </div>
                  {(order.pricing?.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{order.pricing?.currency || 'USD'} {(order.pricing?.discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-rose-600">{order.pricing?.currency || 'USD'} {((order.pricing as any)?.totalAmount || order.pricing?.total || 0).toFixed(2)}</span>
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
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex flex-wrap gap-2">
                {canAccept && (
                  <button
                    onClick={() => handleStatusUpdate('confirmed')}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Order
                  </button>
                )}
                
                {canReject && (
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                )}

                {canStart && (
                  <button
                    onClick={() => handleStatusUpdate('in-progress')}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Work
                  </button>
                )}

                {canComplete && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Order
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowMessageForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Customer
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