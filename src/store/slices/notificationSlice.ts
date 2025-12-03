import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationPayload } from '../../services/notificationService';

export interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  timestamp: string; // Changed from Date to string for Redux serialization
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  isNotificationPanelOpen: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  isNotificationPanelOpen: false,
};

// Helper function to convert NotificationPayload to Notification
function createNotificationFromPayload(payload: NotificationPayload & { actionId?: string }): Notification {
  const getNotificationType = (): Notification['type'] => {
    const titleLower = (typeof payload.title === 'string' ? payload.title : '').toLowerCase();
    const bodyLower = (typeof payload.body === 'string' ? payload.body : '').toLowerCase();

    // Check payload.data.type first for explicit type
    const dataType = (payload.data?.type || '').toString().toLowerCase();
    
    if (dataType.includes('message') || dataType === 'message' || dataType === 'group_message') {
      return 'message';
    }
    
    if (dataType && dataType.includes('order')) return 'order';

    // If payload.data contains order identifiers
    if (payload.data && (payload.data.orderId || payload.data.order_id || payload.data.orderNumber || payload.data.order_number)) {
      return 'order';
    }

    // If payload.data contains message identifiers
    if (payload.data && (payload.data.messageId || payload.data.senderId || payload.data.senderName)) {
      return 'message';
    }

    // Inspect title/body for order-related keywords
    const orderIndicators = ['order', 'order received', 'new order', 'order #', 'order:'];
    if (orderIndicators.some(k => titleLower.includes(k) || bodyLower.includes(k))) return 'order';

    if (titleLower.includes('payment') || bodyLower.includes('payment')) return 'payment';
    if (titleLower.includes('review') || bodyLower.includes('review')) return 'review';
    
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
    timestamp: new Date().toISOString(), // Convert to ISO string
    isRead: false,
    priority: getPriority(type),
    data: payload.data
  };
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
    
    addNotificationFromPayload: (state, action: PayloadAction<NotificationPayload & { actionId?: string }>) => {
      try {
        const newNotification = createNotificationFromPayload(action.payload);
        state.notifications.unshift(newNotification);
      } catch (error) {
        console.error('Error creating notification from payload:', error);
      }
    },
    
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.isRead = true);
    },
    
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    updateNotification: (state, action: PayloadAction<{ id: string; patch: Partial<Notification> }>) => {
      const { id, patch } = action.payload;
      const notification = state.notifications.find(n => n.id === id);
      if (notification) {
        Object.assign(notification, patch);
      }
    },
    
    addTestNotification: (state, action: PayloadAction<{ type: Notification['type']; title: string; message: string }>) => {
      const { type, title, message } = action.payload;
      const newNotification: Notification = {
        id: `test-${Date.now()}`,
        type,
        title,
        message,
        timestamp: new Date().toISOString(), // Convert to ISO string
        isRead: false,
        priority: type === 'order' ? 'high' : 'medium',
        data: { source: 'manual-test' }
      };
      state.notifications.unshift(newNotification);
    },
    
    setIsNotificationPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isNotificationPanelOpen = action.payload;
    },
  },
});

export const {
  addNotification,
  addNotificationFromPayload,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  updateNotification,
  addTestNotification,
  setIsNotificationPanelOpen,
} = notificationSlice.actions;

// Selectors moved to separate file to avoid circular dependency

export default notificationSlice.reducer;