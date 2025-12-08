/**
 * Order Notification Service
 * 
 * Manages real-time WebSocket connection for order notifications from EventBridge.
 * Service providers receive notifications when new orders are created.
 * 
 * Architecture:
 * - Backend EventBridge sends order events to SQS
 * - Lambda processes SQS and broadcasts via WebSocket
 * - Frontend maintains persistent WebSocket connection
 * - Notifications filtered by service provider ID
 */

interface OrderNotificationMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

type WebSocketEventCallback = (data: any) => void;

export class OrderNotificationService {
  private static instance: OrderNotificationService;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, Set<WebSocketEventCallback>> = new Map();
  private isIntentionallyClosed = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): OrderNotificationService {
    if (!OrderNotificationService.instance) {
      OrderNotificationService.instance = new OrderNotificationService();
    }
    return OrderNotificationService.instance;
  }

  /**
   * Connect to Order Notification WebSocket server
   * @param userId - Service provider's internal user ID
   * @param token - Authentication token
   */
  connect(userId: string, token: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        const wsUrl = this.getWebSocketUrl(userId, token);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.reconnectDelay = 3000;
          this.startPingInterval();
          this.send({ type: 'ping' });

          this.emit('connected', { userId });
          this.connectionPromise = null;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: OrderNotificationMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse order notification message:', error);
          }
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
        };

        this.ws.onclose = (event) => {
          this.stopPingInterval();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          this.connectionPromise = null;

          if (!this.isIntentionallyClosed) {
            this.attemptReconnect(userId, token);
          }
        };

        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Order Notification WebSocket connection timeout'));
            this.ws?.close();
          }
        }, 10000);
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.stopPingInterval();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Send message through WebSocket
   */
  send(message: OrderNotificationMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send order notification message:', error);
      }
    }
  }

  /**
   * Register event listener
   */
  on(eventType: string, callback: WebSocketEventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, callback: WebSocketEventCallback): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.delete(callback);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get WebSocket ready state
   */
  getReadyState(): number {
    return this.ws?.readyState || WebSocket.CLOSED;
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, data: any): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: OrderNotificationMessage): void {
    if (message.type === 'pong') {
      return;
    }

    if (message.type === 'order-notification' || message.type === 'order_status_update') {
      this.emit(message.type, message.data);
      return;
    }

    this.emit(message.type, message.data);
  }

  /**
   * Get WebSocket URL with authentication
   */
  private getWebSocketUrl(userId: string, token: string): string {
    const wsUrl = import.meta.env.VITE_ORDER_NOTIFICATION_WS_URL;
    if (!wsUrl) {
      throw new Error('VITE_ORDER_NOTIFICATION_WS_URL environment variable is not set.');
    }
    return `${wsUrl}?userId=${userId}&token=${encodeURIComponent(token)}`;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(userId: string, token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect(userId, token).catch((error) => {
        console.error('Order Notification WebSocket reconnect failed:', error);
      });

      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
    }, this.reconnectDelay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
