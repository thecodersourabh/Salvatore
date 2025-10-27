/**
 * WebSocket Service for Real-time Messaging
 * 
 * This service provides a more efficient alternative to polling by maintaining
 * a persistent WebSocket connection for real-time message delivery.
 * 
 * Benefits over polling:
 * - Real-time delivery (no delay)
 * - Significantly reduced server load
 * - Lower bandwidth usage
 * - Better battery life on mobile devices
 * - Scalable to thousands of concurrent users
 * 
 * Connected to: wss://9of5ccgznj.execute-api.us-east-1.amazonaws.com/dev
 */

export interface WebSocketMessage {
  type: 'message' | 'notification' | 'status' | 'error' | 'ping' | 'pong';
  data?: any;
  timestamp?: string;
}

export interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  teamId?: string;
  content: string;
  type: 'text' | 'file' | 'image';
  timestamp: string;
  isRead: boolean;
}

export interface StatusData {
  userId: string;
  status: 'online' | 'offline' | 'away';
}

export interface ErrorData {
  code: string;
  message: string;
}

type WebSocketEventCallback = (data: any) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // Start with 3 seconds
  private listeners: Map<string, Set<WebSocketEventCallback>> = new Map();
  private isIntentionallyClosed = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, token: string): Promise<void> {
    // If already connecting, return existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, resolve immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        
        // Get WebSocket URL from environment or construct it
        const wsUrl = this.getWebSocketUrl(userId, token);
        
        console.log('🔌 Connecting to WebSocket:', wsUrl.replace(token, '***'));
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 3000;
          this.startPingInterval();
          this.emit('connected', { userId });
          this.connectionPromise = null;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.stopPingInterval();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          this.connectionPromise = null;
          
          // Attempt reconnection if not intentionally closed
          if (!this.isIntentionallyClosed) {
            this.attemptReconnect(userId, token);
          }
        };

        // Set timeout for connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
            this.ws?.close();
          }
        }, 10000); // 10 second timeout

      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
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
    this.stopPingInterval();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    console.log('🔌 WebSocket disconnected intentionally');
  }

  /**
   * Send message through WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: string, callback: WebSocketEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'message':
        this.emit('message', message.data);
        break;
      
      case 'notification':
        this.emit('notification', message.data);
        break;
      
      case 'status':
        this.emit('status', message.data);
        break;
      
      case 'pong':
        // Pong received, connection is alive
        break;
      
      case 'error':
        console.error('Server error:', message.data);
        this.emit('error', message.data);
        break;
      
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Get WebSocket URL with authentication
   */
  private getWebSocketUrl(userId: string, token: string): string {
    const chatApiUrl = import.meta.env.VITE_CHAT_API_URL || '';
    const wsUrl = import.meta.env.VITE_WS_URL;

    // If explicit WebSocket URL is provided
    if (wsUrl) {
      return `${wsUrl}?userId=${userId}&token=${encodeURIComponent(token)}`;
    }

    // Convert HTTP(S) URL to WS(S)
    const wsProtocol = chatApiUrl.startsWith('https') ? 'wss' : 'ws';
    const urlWithoutProtocol = chatApiUrl.replace(/^https?:\/\//, '');
    
    return `${wsProtocol}://${urlWithoutProtocol}/ws?userId=${userId}&token=${encodeURIComponent(token)}`;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(userId: string, token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('reconnect-failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(userId, token).catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
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

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state enum
   */
  get state(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();
