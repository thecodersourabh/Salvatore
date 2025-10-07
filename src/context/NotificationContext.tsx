import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { NotificationPayload, Notification } from '../services/notificationService';

// Helper function to convert NotificationPayload to Notification
function createNotificationFromPayload(payload: NotificationPayload & { actionId?: string }): Notification {
  // Determine notification type and priority from payload
  const getNotificationType = (): Notification['type'] => {
    if (payload.data?.type) {
      const orderStatuses = ['order_received', 'order_accepted', 'order_rejected', 'order_cancelled', 'order_status_update'];
      if (orderStatuses.includes(payload.data.type)) return 'order';
    }
    
    const titleLower = payload.title?.toLowerCase() || '';
    if (titleLower.includes('message')) return 'message';
    if (titleLower.includes('payment')) return 'payment';
    if (titleLower.includes('review')) return 'review';
    return 'system';
  };

  const getPriority = (type: Notification['type']): Notification['priority'] => {
    if (type === 'order' && payload.data?.type === 'order_received') return 'high';
    return type === 'order' ? 'medium' : 'low';
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
  addTestNotification: (type: Notification['type'], title: string, message: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Listen for notifications from the service
  useEffect(() => {
    console.log('🔔 NotificationContext: Setting up event listeners...');
    
    // Listen for local notifications (in-app)
    const handleLocalNotification = (event: CustomEvent) => {
      const payload = event.detail as NotificationPayload;
      console.log('📧 NotificationContext: Local notification received:', payload);
      
      try {
        const newNotification = createNotificationFromPayload(payload);
        console.log('📧 NotificationContext: Created notification object:', newNotification);
        
        setNotifications(prev => {
          console.log('📧 NotificationContext: Adding to notifications list. Current count:', prev.length);
          const updated = [newNotification, ...prev];
          console.log('📧 NotificationContext: New notifications count:', updated.length);
          return updated;
        });
      } catch (error) {
        console.error('📧 NotificationContext: Error creating notification:', error);
      }
    };

    // Listen for notification actions (when user taps notification)
    const handleNotificationAction = (event: CustomEvent) => {
      const payload = event.detail as NotificationPayload & { actionId?: string };
      console.log('📧 NotificationContext: Notification action received:', payload);
      
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
    
    console.log('🔔 NotificationContext: Event listeners added successfully');

    // Add initial welcome notification on first load
    const hasWelcomeNotification = notifications.some(n => n.data?.source === 'welcome');
    if (!hasWelcomeNotification) {
      const welcomeNotification: Notification = {
        id: 'welcome-1',
        type: 'system',
        title: 'Welcome to Salvatore!',
        message: 'Your service provider dashboard is ready.',
        timestamp: new Date(),
        isRead: false,
        priority: 'medium',
        data: { type: 'system', source: 'welcome' }
      };
      setNotifications([welcomeNotification]);
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