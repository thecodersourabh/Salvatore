import { useEffect, useCallback, useRef, useState } from 'react';
import { websocketService, WebSocketMessage, MessageData } from '../services/websocketService';

interface UseWebSocketOptions {
  userId: string | null;
  token: string | null;
  enabled?: boolean;
  onMessage?: (message: MessageData) => void;
  onNotification?: (notification: any) => void;
  onStatusChange?: (status: any) => void;
  onError?: (error: any) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (message: WebSocketMessage) => void;
  disconnect: () => void;
  reconnect: () => void;
  updateStatus: (status: 'online' | 'offline' | 'away') => void;
}

/**
 * React hook for managing WebSocket connections
 * 
 * Automatically handles:
 * - Connection lifecycle (connect/disconnect)
 * - Event subscriptions
 * - Cleanup on unmount
 * - Reconnection on token/user changes
 * 
 * @example
 * ```tsx
 * const { isConnected, send } = useWebSocket({
 *   userId: user.id,
 *   token: idToken,
 *   enabled: isAuthenticated,
 *   onMessage: (msg) => console.log('New message:', msg)
 * });
 * ```
 */
export function useWebSocket({
  userId,
  token,
  enabled = true,
  onMessage,
  onNotification,
  onStatusChange,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const isConnectingRef = useRef(false);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!enabled || !userId || !token) {
      return;
    }

    if (isConnectingRef.current || websocketService.isConnected) {
      return;
    }

    try {
      isConnectingRef.current = true;
      await websocketService.connect(userId, token);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
      onError?.(error);
    } finally {
      isConnectingRef.current = false;
    }
  }, [enabled, userId, token, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect(userId || undefined);
    setIsConnected(false);
  }, [userId]);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [disconnect, connect]);

  // Send message through WebSocket
  const send = useCallback((message: WebSocketMessage) => {
    websocketService.send(message);
  }, []);

  // Update user status
  const updateStatus = useCallback((status: 'online' | 'offline' | 'away') => {
    if (userId) {
      websocketService.updateStatus(userId, status);
    }
  }, [userId]);

  // Setup event listeners
  useEffect(() => {
    if (!enabled || !userId || !token) {
      return;
    }

    // Subscribe to events
    const unsubscribers: (() => void)[] = [];

    // Message event
    if (onMessage) {
      const unsubMessage = websocketService.on('message', onMessage);
      unsubscribers.push(unsubMessage);
    }

    // Notification event
    if (onNotification) {
      const unsubNotification = websocketService.on('notification', onNotification);
      unsubscribers.push(unsubNotification);
    }

    // Status event
    if (onStatusChange) {
      const unsubStatus = websocketService.on('status', onStatusChange);
      unsubscribers.push(unsubStatus);
    }

    // Error event
    if (onError) {
      const unsubError = websocketService.on('error', onError);
      unsubscribers.push(unsubError);
    }

    // Connection state events
    const unsubConnected = websocketService.on('connected', () => {
      setIsConnected(true);
    });
    unsubscribers.push(unsubConnected);

    const unsubDisconnected = websocketService.on('disconnected', () => {
      setIsConnected(false);
    });
    unsubscribers.push(unsubDisconnected);

    // Store unsubscribers
    unsubscribersRef.current = unsubscribers;

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [enabled, userId, token, onMessage, onNotification, onStatusChange, onError]);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && userId && token && !websocketService.isConnected) {
      connect();
    } else if (!enabled && websocketService.isConnected) {
      disconnect();
    }

    // Cleanup on unmount or when disabled
    return () => {
      if (!enabled) {
        disconnect();
      }
    };
  }, [enabled, userId, token, connect, disconnect]);

  return {
    isConnected,
    send,
    disconnect,
    reconnect,
    updateStatus,
  };
}
