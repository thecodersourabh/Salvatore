import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { MessageData } from '../../services/websocketService';
import { OrderNotificationService } from '../../services/orderNotificationService';

export interface WebSocketMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string; // Changed from Date to string for Redux serialization
  type: 'text' | 'image' | 'file';
  conversationId?: string;
  metadata?: Record<string, any>;
}

interface WebSocketState {
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  messages: WebSocketMessage[];
  activeConversations: string[];
  error: string | null;
  reconnectAttempts: number;
  lastMessageTimestamp: number;
}

const initialState: WebSocketState = {
  isConnected: false,
  connectionStatus: 'disconnected',
  messages: [],
  activeConversations: [],
  error: null,
  reconnectAttempts: 0,
  lastMessageTimestamp: 0,
};

// Async thunk for connecting to WebSocket
export const connectWebSocket = createAsyncThunk(
  'websocket/connect',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Try to get the internal user ID first (stored by auth flow)
      let internalUserId = localStorage.getItem(`auth0_${userId}`);
      if (!internalUserId) {
        internalUserId = userId; // Fallback to Auth0 ID
      }
      
      // Get the auth token from localStorage (Auth0 stores it there)
      let token = null;
      
      // Try to find the Auth0 ID token - look for the actual token in Auth0's storage format
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        const value = localStorage.getItem(key);
        // Auth0 tokens start with 'eyJ' (base64 encoded JWT header)
        if (value && value.startsWith('eyJ') && value.length > 100) {
          token = value;
          break;
        }
      }
      
      // If not found in localStorage, try Auth0's specific format
      if (!token) {
        try {
          const auth0Cache = localStorage.getItem('auth0.a.XXXXXXXXXXXXXXXXXXX');
          if (auth0Cache) {
            const cacheData = JSON.parse(auth0Cache);
            token = cacheData.id_token || cacheData.access_token;
          }
        } catch (e) {
          // Silent fail, try next method
        }
      }
      
      // Fallback: try getting from sessionStorage
      if (!token) {
        const sessionKeys = Object.keys(sessionStorage);
        for (const key of sessionKeys) {
          const value = sessionStorage.getItem(key);
          if (value && value.startsWith('eyJ') && value.length > 100) {
            token = value;
            break;
          }
        }
      }
      
      if (!token) {
        return rejectWithValue('No authentication token available');
      }
      
      // Connect to the Order Notification WebSocket service (for EventBridge notifications)
      // Use internal user ID if available, otherwise use Auth0 ID
      const orderNotificationService = OrderNotificationService.getInstance();
      await orderNotificationService.connect(internalUserId, token);
      
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for disconnecting WebSocket
export const disconnectWebSocket = createAsyncThunk(
  'websocket/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      const orderNotificationService = OrderNotificationService.getInstance();
      orderNotificationService.disconnect();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for sending message
export const sendWebSocketMessage = createAsyncThunk(
  'websocket/sendMessage',
  async (message: Omit<WebSocketMessage, 'id' | 'timestamp'>, { rejectWithValue }) => {
    try {
      // This would be handled by the WebSocket service
      const messageWithId: WebSocketMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(), // Convert to ISO string
      };
      return messageWithId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const webSocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<WebSocketState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === 'connected';
    },
    
    receiveMessage: (state, action: PayloadAction<MessageData>) => {
      const messageData = action.payload;
      const message: WebSocketMessage = {
        id: messageData.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        content: messageData.content,
        timestamp: messageData.timestamp ? new Date(messageData.timestamp).toISOString() : new Date().toISOString(), // Convert to ISO string
        type: messageData.type || 'text',
        conversationId: (messageData as any).conversationId,
        metadata: (messageData as any).metadata,
      };
      
      state.messages.unshift(message);
      state.lastMessageTimestamp = Date.now();
      
      // Add conversation to active conversations if not already present
      if (message.conversationId && !state.activeConversations.includes(message.conversationId)) {
        state.activeConversations.push(message.conversationId);
      }
    },
    
    markMessagesAsRead: (state, _action: PayloadAction<string[]>) => {
      // Mark messages as read - could extend WebSocketMessage interface to include read status
      // For now, we'll just update the timestamp to indicate activity
      state.lastMessageTimestamp = Date.now();
    },
    
    clearMessages: (state) => {
      state.messages = [];
    },
    
    removeConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      state.messages = state.messages.filter(msg => msg.conversationId !== conversationId);
      state.activeConversations = state.activeConversations.filter(id => id !== conversationId);
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
    },
    
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0;
    },
    
    updateConnectionState: (state, action: PayloadAction<{ isConnected: boolean; status: WebSocketState['connectionStatus'] }>) => {
      const { isConnected, status } = action.payload;
      state.isConnected = isConnected;
      state.connectionStatus = status;
      if (isConnected) {
        state.reconnectAttempts = 0;
        state.error = null;
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // connectWebSocket
      .addCase(connectWebSocket.pending, (state) => {
        state.connectionStatus = 'connecting';
        state.error = null;
      })
      .addCase(connectWebSocket.fulfilled, (state) => {
        state.connectionStatus = 'connected';
        state.isConnected = true;
        state.error = null;
        state.reconnectAttempts = 0;
      })
      .addCase(connectWebSocket.rejected, (state, action) => {
        state.connectionStatus = 'error';
        state.isConnected = false;
        state.error = action.payload as string || 'Connection failed';
      })
      
      // disconnectWebSocket
      .addCase(disconnectWebSocket.pending, (state) => {
        state.connectionStatus = 'disconnected';
      })
      .addCase(disconnectWebSocket.fulfilled, (state) => {
        state.connectionStatus = 'disconnected';
        state.isConnected = false;
        state.error = null;
        state.reconnectAttempts = 0;
      })
      .addCase(disconnectWebSocket.rejected, (state, action) => {
        state.error = action.payload as string || 'Disconnection failed';
      })
      
      // sendWebSocketMessage
      .addCase(sendWebSocketMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendWebSocketMessage.fulfilled, (state, action) => {
        // Optimistically add the sent message
        state.messages.unshift(action.payload);
        state.lastMessageTimestamp = Date.now();
      })
      .addCase(sendWebSocketMessage.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to send message';
      });
  },
});

export const {
  setConnectionStatus,
  receiveMessage,
  markMessagesAsRead,
  clearMessages,
  removeConversation,
  setError,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  updateConnectionState,
} = webSocketSlice.actions;

// Selectors with proper typing and null checks
export const selectWebSocketState = (state: { websocket: WebSocketState }) => state.websocket || initialState;
export const selectIsWebSocketConnected = (state: { websocket: WebSocketState }) => state.websocket?.isConnected || false;
export const selectWebSocketConnectionStatus = (state: { websocket: WebSocketState }) => state.websocket?.connectionStatus || 'disconnected';
export const selectWebSocketMessages = (state: { websocket: WebSocketState }) => state.websocket?.messages || [];
export const selectWebSocketActiveConversations = (state: { websocket: WebSocketState }) => state.websocket?.activeConversations || [];
export const selectWebSocketError = (state: { websocket: WebSocketState }) => state.websocket?.error || null;
export const selectWebSocketReconnectAttempts = (state: { websocket: WebSocketState }) => state.websocket?.reconnectAttempts || 0;
export const selectMessagesByConversation = (conversationId: string) => (state: { websocket: WebSocketState }) =>
  (state.websocket?.messages || []).filter((msg: WebSocketMessage) => msg.conversationId === conversationId);

export default webSocketSlice.reducer;