import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageData } from '../services/websocketService';
import { useAuth } from './AuthContext';
import { Notification } from '../services/notificationService';
import { UserService } from '../services/userService';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface WebSocketContextType {
  isConnected: boolean;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * WebSocket Provider - Manages real-time messaging connection
 * 
 * This provider:
 * - Automatically connects when user is authenticated
 * - Listens for incoming messages via WebSocket
 * - Creates notifications for new messages
 * - Handles disconnection on logout
 * 
 * Benefits over polling:
 * - Real-time message delivery (instant)
 * - Significantly reduced server load (no repeated requests)
 * - Lower bandwidth usage
 * - Better battery life on mobile
 * - Scalable to thousands of users
 */
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, userCreated, apiUser, idToken } = useAuth();

  // Handle incoming messages
  const handleMessage = useCallback(async (message: MessageData) => {
    // Determine if it's a direct message or team message
    const isTeamMessage = !!message.teamId;
    
    // Try to get sender name - if not provided, fetch from UserService
    let senderName = message.senderName;
    if (!senderName && message.senderId) {
      try {
        const sender = await UserService.getUser(message.senderId);
        senderName = sender?.displayName || sender?.name || sender?.userName || message.senderId;
      } catch (error) {
        console.warn('Failed to fetch sender details:', error);
        senderName = message.senderId; // Fallback to ID
      }
    }
    
    const messageTitle = isTeamMessage 
      ? `${senderName} (Team)` 
      : senderName || 'New Message';

    // Create notification for the new message
    const notification: Notification = {
      id: `msg-${message.id}`,
      type: 'message',
      title: messageTitle,
      message: message.content || 'You have a new message',
      timestamp: new Date(message.timestamp),
      isRead: false,
      priority: 'medium',
      data: {
        messageId: message.id,
        senderId: message.senderId,
        senderName: senderName,
        recipientId: message.recipientId,
        teamId: message.teamId,
        messageType: message.type,
        type: isTeamMessage ? 'group_message' : 'message',
      },
    };

    // Dispatch local notification event for web
    window.dispatchEvent(new CustomEvent('local-notification', {
      detail: {
        id: notification.id,
        title: notification.title,
        body: notification.message,
        data: notification.data,
      }
    }));

    // Also send native notification on mobile
    const isNative = Capacitor.getPlatform() !== 'web';
    if (isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: notification.title,
            body: notification.message,
            schedule: { at: new Date(Date.now() + 100) }, // Schedule immediately
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: notification.data
          }]
        });
      } catch (error) {
        console.error('Failed to send native notification:', error);
      }
    }

    // Also dispatch new-messages event for other components
    window.dispatchEvent(new CustomEvent('new-messages', {
      detail: { 
        unreadCount: 1, 
        messages: [{
          ...message,
          senderName: senderName // Include the resolved sender name
        }],
        isTeamMessage
      }
    }));
  }, []);

  // Handle incoming notifications
  const handleNotification = useCallback((notification: any) => {
    // Dispatch local notification event
    window.dispatchEvent(new CustomEvent('local-notification', {
      detail: {
        id: notification.id || `notif-${Date.now()}`,
        title: notification.title || 'Notification',
        body: notification.message || notification.body,
        data: notification.data || {},
      }
    }));
  }, []);

  // Handle status changes
  const handleStatusChange = useCallback((status: any) => {
    console.log('📡 WebSocket status change received:', status);
    
    // Dispatch user status event for presence/typing indicators
    window.dispatchEvent(new CustomEvent('user-status-change', {
      detail: {
        userId: status.userId,
        status: status.status, // 'online' | 'offline' | 'away'
        timestamp: new Date().toISOString()
      }
    }));
  }, []);

  // Handle errors
  const handleError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
  }, []);

  // Initialize WebSocket connection
  const { isConnected, reconnect } = useWebSocket({
    userId: apiUser?.id || null,
    token: idToken,
    enabled: isAuthenticated && userCreated && !!apiUser?.id && !!idToken,
    onMessage: handleMessage,
    onNotification: handleNotification,
    onStatusChange: handleStatusChange,
    onError: handleError,
  });

  return (
    <WebSocketContext.Provider value={{ isConnected, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
