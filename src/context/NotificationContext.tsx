import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { NotificationPayload, Notification } from '../services/notificationService';

// Helper function to convert NotificationPayload to Notification
function createNotificationFromPayload(payload: NotificationPayload & { actionId?: string }): Notification {
  // Determine notification type and priority from payload
  const getNotificationType = (): Notification['type'] => {
    const titleLower = (typeof payload.title === 'string' ? payload.title : '').toLowerCase();
    const bodyLower = (typeof payload.body === 'string' ? payload.body : '').toLowerCase();

    // 1) Check payload.data.type first for explicit type
    const dataType = (payload.data?.type || '').toString().toLowerCase();
    
    // Check for message types (direct_message, team_message, or just message)
    if (dataType.includes('message') || dataType === 'message' || dataType === 'group_message') {
      return 'message';
    }
    
    // Check for order types
    if (dataType && dataType.includes('order')) return 'order';

    // 2) If payload.data contains order identifiers
    if (payload.data && (payload.data.orderId || payload.data.order_id || payload.data.orderNumber || payload.data.order_number)) {
      return 'order';
    }

    // 3) If payload.data contains message identifiers
    if (payload.data && (payload.data.messageId || payload.data.senderId || payload.data.senderName)) {
      return 'message';
    }

    // 4) Inspect title/body for order-related keywords
    const orderIndicators = ['order', 'order received', 'new order', 'order #', 'order:'];
    if (orderIndicators.some(k => titleLower.includes(k) || bodyLower.includes(k))) return 'order';

    // 5) Check for other specific types
    if (titleLower.includes('payment') || bodyLower.includes('payment')) return 'payment';
    if (titleLower.includes('review') || bodyLower.includes('review')) return 'review';
    
    // 6) Default to system only if none of the above match
    return 'system';
  };

  const getPriority = (type: Notification['type']): Notification['priority'] => {
    if (type === 'order') {
      const dataType = (payload.data?.type || '').toString().toLowerCase();
      const titleLower = (payload.title || '').toString().toLowerCase();
      const bodyLower = (payload.body || '').toString().toLowerCase();
      if (dataType.includes('order_received') || titleLower.includes('order received') || bodyLower.includes('order received') || titleLower.includes('new order') || bodyLower.includes('new order')) return 'high';
      return 'medium';
    }
    if (type === 'message') return 'medium';
    return 'low';
  };

  const type = getNotificationType();

  return {
    id: payload.id?.toString() || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    title: payload.title || 'Notification',
    message: payload.body || 'You have a new notification',
    timestamp: new Date(),
    isRead: false,
    priority: getPriority(type),
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
  updateNotification: (id: string, patch: Partial<Notification>) => void;
  addTestNotification: (type: Notification['type'], title: string, message: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Set up event listeners once on mount
  useEffect(() => {
    // Listen for local notifications (in-app)
    const handleLocalNotification = (event: CustomEvent) => {
      const payload = event.detail as NotificationPayload;
      
      try {
        const newNotification = createNotificationFromPayload(payload);
        
        setNotifications(prev => {
          const updated = [newNotification, ...prev];
          return updated;
        });
      } catch (error) {
        console.error('📧 NotificationContext: Error creating notification:', error);
      }
    };

    // Listen for notification actions (when user taps notification)
    const handleNotificationAction = (event: CustomEvent) => {
      const payload = event.detail as NotificationPayload & { actionId?: string };
      
      try {
        const newNotification = createNotificationFromPayload(payload);
        setNotifications(prev => [newNotification, ...prev]);
      } catch (error) {
        console.error('📧 NotificationContext: Error handling action:', error);
      }
    };

    // Add event listeners (unified for all notification sources)
    window.addEventListener('local-notification', handleLocalNotification as EventListener);
    window.addEventListener('notification-action', handleNotificationAction as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('local-notification', handleLocalNotification as EventListener);
      window.removeEventListener('notification-action', handleNotificationAction as EventListener);
    };
  }, []); // Empty dependency array - only run once on mount

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

  // Update a notification by id (partial patch)
  const updateNotification = (id: string, patch: Partial<Notification>) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
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
        updateNotification,
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