import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks';
import { addNotificationFromPayload } from '../slices/notificationSlice';
import { addOrder } from '../slices/orderSlice';
import { connectWebSocket } from '../slices/webSocketSlice';
import { OrderNotificationService } from '../../services/orderNotificationService';
import { useAuth } from '../../hooks/useAuth';

// This component initializes Redux-based notification and WebSocket listeners
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();

  // Listen for order notifications from the Order Notification WebSocket
  useEffect(() => {
    const orderNotificationService = OrderNotificationService.getInstance();
    
    const handleOrderNotification = (data: any) => {
      // Get current user's internal ID for filtering
      const currentUserInternalId = user?.sub ? localStorage.getItem(`auth0_${user.sub}`) : null;
      
      // Check if notification is for current user (use targetUserId or serviceProviderId)
      const targetId = data.targetUserId || data.serviceProviderId;
      if (targetId && currentUserInternalId !== targetId) {
        return;
      }
      
      // For order notifications, dispatch to order slice as well
      if (data.type === 'order' || data.orderId) {
        const orderNotification = {
          id: `order-${data.orderId || data.id}-${Date.now()}`,
          orderId: data.orderId || data.id,
          orderNumber: data.orderNumber || '',
          customerId: data.customerId || '',
          serviceProviderId: data.serviceProviderId || targetId || '',
          title: data.title || '🎯 Order Update',
          body: data.body || `Order ${data.orderId} updated`,
          status: data.status || 'pending',
          timestamp: new Date().toISOString(),
          isRead: false,
          data: {
            type: 'order',
            subtype: 'order_notification',
            ...data
          }
        };
        
        // Dispatch to order slice with current user context
        if (currentUserInternalId) {
          dispatch(addOrder({ order: orderNotification, currentUserInternalId }));
        }
      }
      
      // Create notification payload for notification panel
      const notification = {
        id: `order-${data.orderId || data.id}-${Date.now()}`,
        title: data.title || '🎯 Order Update',
        body: data.body || `Order ${data.orderId} updated`,
        data: {
          type: 'order',
          subtype: 'order_notification',
          ...data
        },
        targetUserId: targetId
      };
      
      dispatch(addNotificationFromPayload(notification));
    };
    
    // Listen for both event types
    orderNotificationService.on('order-notification', handleOrderNotification);
    orderNotificationService.on('order_status_update', handleOrderNotification);
    
    return () => {
      orderNotificationService.off('order-notification', handleOrderNotification);
      orderNotificationService.off('order_status_update', handleOrderNotification);
    };
  }, [dispatch, user?.sub]);

  // Initialize Order Notification WebSocket connection for any authenticated user
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      // Connect to WebSocket for all authenticated users to receive notifications
      dispatch(connectWebSocket(user.sub));
    }
  }, [isAuthenticated, user?.sub, dispatch]);

  return <>{children}</>;
};