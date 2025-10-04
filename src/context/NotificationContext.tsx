import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { NotificationPayload, Notification } from '../services/notificationService';

// Helper function to convert NotificationPayload to Notification
function createNotificationFromPayload(payload: NotificationPayload & { actionId?: string }): Notification {
  const now = Date.now();
  
  // Determine notification type from payload data
  let type: Notification['type'] = 'system';
  let priority: Notification['priority'] = 'medium';
  
  if (payload.data?.type) {
    const orderStatuses = ['order_received', 'order_accepted', 'order_rejected', 'order_cancelled', 'order_status_update'];
    if (orderStatuses.includes(payload.data.type)) {
      type = 'order';
      priority = payload.data.type === 'order_received' ? 'high' : 'medium';
    }
  }
  
  // Handle different payload types
  if (payload.title?.toLowerCase().includes('message')) {
    type = 'message';
  } else if (payload.title?.toLowerCase().includes('payment')) {
    type = 'payment';
  } else if (payload.title?.toLowerCase().includes('review')) {
    type = 'review';
  }

  return {
    id: payload.id?.toString() || `notif-${now}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: payload.title || 'Notification',
    message: payload.body || 'You have a new notification',
    timestamp: new Date(),
    isRead: false,
    priority,
    data: payload.data
  };
}

interface NotificationContextType {
  notifications: Notification[];
  isNotificationPanelOpen: boolean;
  setIsNotificationPanelOpen: (isOpen: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addTestNotification: (type: Notification['type'], title: string, message: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Listen for notifications from the service
  useEffect(() => {
    // Listen for local notifications (in-app)
    const handleLocalNotification = (event: CustomEvent) => {
      const payload = event.detail as NotificationPayload;
      console.log('📧 NotificationContext: Local notification received:', payload);
      
      const newNotification = createNotificationFromPayload(payload);
      setNotifications(prev => [newNotification, ...prev]);
    };

    // Listen for notification actions (when user taps notification)
    const handleNotificationAction = (event: CustomEvent) => {
      const payload = event.detail as NotificationPayload & { actionId?: string };
      console.log('📧 NotificationContext: Notification action received:', payload);
      
      const newNotification = createNotificationFromPayload(payload);
      setNotifications(prev => [newNotification, ...prev]);
    };

    // Add event listeners
    window.addEventListener('local-notification', handleLocalNotification as EventListener);
    window.addEventListener('notification-action', handleNotificationAction as EventListener);

    // Add some initial sample data for demo purposes
    if (notifications.length === 0) {
      const sampleNotifications: Notification[] = [
        {
          id: 'sample-1',
          type: 'order',
          title: 'Welcome to App!',
          message: 'Welcome to service provider dashboard!!',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          isRead: false,
          priority: 'medium',
          data: { type: 'system', source: 'demo' }
        }
      ];
      setNotifications(sampleNotifications);
    }

    // Cleanup
    return () => {
      window.removeEventListener('local-notification', handleLocalNotification as EventListener);
      window.removeEventListener('notification-action', handleNotificationAction as EventListener);
    };
  }, [notifications.length]);

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Add a new notification (for testing)
  const addTestNotification = (type: Notification['type'], title: string, message: string) => {
    const newNotification: Notification = {
      id: `test-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      priority: type === 'order' ? 'high' : 'medium',
      data: { source: 'manual-test' }
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Calculate unread notifications count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        isNotificationPanelOpen,
        setIsNotificationPanelOpen,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addTestNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}