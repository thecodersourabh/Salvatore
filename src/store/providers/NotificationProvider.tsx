import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks';
import { addNotificationFromPayload } from '../slices/notificationSlice';
import { connectWebSocket } from '../slices/webSocketSlice';
import { useAuth } from '../../hooks/useAuth';

// This component initializes Redux-based notification and WebSocket listeners
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();

  // Initialize notification listeners
  useEffect(() => {
    const handleLocalNotification = (event: CustomEvent) => {
      dispatch(addNotificationFromPayload(event.detail));
    };

    const handleNotificationAction = (event: CustomEvent) => {
      dispatch(addNotificationFromPayload(event.detail));
    };

    // Add event listeners for notifications
    window.addEventListener('local-notification', handleLocalNotification as EventListener);
    window.addEventListener('notification-action', handleNotificationAction as EventListener);

    return () => {
      window.removeEventListener('local-notification', handleLocalNotification as EventListener);
      window.removeEventListener('notification-action', handleNotificationAction as EventListener);
    };
  }, [dispatch]);

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      dispatch(connectWebSocket(user.sub));
    }
  }, [isAuthenticated, user?.sub, dispatch]);

  return <>{children}</>;
};