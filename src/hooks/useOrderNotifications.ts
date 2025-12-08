import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAppDispatch } from '../store/hooks';
import { addNotificationFromPayload } from '../store/slices/notificationSlice';

/**
 * Custom hook to handle order notifications from WebSocket/EventBridge
 * Listens for order.created, order.updated events and displays notifications
 */
export const useOrderNotifications = (onNotification?: (notification: any) => void) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const handleOrderEvent = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Check if this is an order event from EventBridge
      if (data.type === 'order-notification' || data['detail-type']?.startsWith('order.')) {
        console.log('📦 Order event received from WebSocket:', data);
        
        // Extract order details from EventBridge format
        const detail = data.detail || data;
        const orderId = detail.orderId;
        const orderNumber = detail.orderNumber;
        const serviceProviderId = detail.serviceProviderId;
        const customerId = detail.customerId;
        const status = detail.status;
        const eventType = data['detail-type'] || data.type;
        
        // Get current user's internal ID
        const currentUserInternalId = user?.sub ? localStorage.getItem(`auth0_${user.sub}`) : null;
        
        // Determine if notification is for current user
        const isForCurrentUser = currentUserInternalId === serviceProviderId;
        
        if (!isForCurrentUser) {
          console.log('🔔 Order notification not for current user, skipping:', {
            serviceProviderId,
            currentUserInternalId
          });
          return;
        }
        
        // Create notification payload
        const notification = {
          id: `order-${orderId}-${Date.now()}`,
          title: getOrderNotificationTitle(eventType, status),
          body: getOrderNotificationBody(orderNumber || orderId, eventType, customerId),
          data: {
            type: 'order',
            subtype: 'order_notification',
            orderId,
            orderNumber,
            orderStatus: status,
            serviceProviderId,
            customerId,
            timestamp: new Date().toISOString()
          },
          targetUserId: serviceProviderId
        };
        
        console.log('🎯 Dispatching order notification:', notification);
        
        // Dispatch to Redux store
        dispatch(addNotificationFromPayload(notification));
        
        // Call custom callback if provided
        if (onNotification) {
          onNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error handling order event:', error);
    }
  }, [user, dispatch, onNotification]);

  useEffect(() => {
    // Listen for WebSocket messages
    const handleWebSocketMessage = (event: CustomEvent) => {
      handleOrderEvent(event.detail as MessageEvent);
    };

    // Listen for WebSocket order events
    window.addEventListener('websocket-message', handleWebSocketMessage as EventListener);
    
    console.log('🔌 Order notifications hook initialized');

    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage as EventListener);
      console.log('🔌 Order notifications hook cleaned up');
    };
  }, [handleOrderEvent]);
};

/**
 * Get notification title based on event type and status
 */
function getOrderNotificationTitle(eventType: string, status: string): string {
  switch (eventType) {
    case 'order.created':
      return '🎯 New Order Received!';
    case 'order.updated':
      switch (status) {
        case 'confirmed':
          return '✅ Order Confirmed';
        case 'in-progress':
          return '⚙️ Order In Progress';
        case 'completed':
          return '✨ Order Completed';
        case 'cancelled':
          return '❌ Order Cancelled';
        default:
          return '📋 Order Updated';
      }
    case 'order.accepted':
      return '✅ Order Accepted';
    case 'order.rejected':
      return '❌ Order Rejected';
    default:
      return '📦 Order Notification';
  }
}

/**
 * Get notification body based on event details
 */
function getOrderNotificationBody(orderNumber: string, eventType: string, customerId?: string): string {
  const customerName = customerId ? ` from ${customerId}` : '';
  
  switch (eventType) {
    case 'order.created':
      return `Order #${orderNumber}${customerName}`;
    case 'order.updated':
      return `Order #${orderNumber} has been updated`;
    case 'order.accepted':
      return `Order #${orderNumber} has been accepted`;
    case 'order.rejected':
      return `Order #${orderNumber} has been rejected`;
    default:
      return `Order #${orderNumber}`;
  }
}
