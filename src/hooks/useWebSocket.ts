import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  connectWebSocket,
  disconnectWebSocket,
  sendWebSocketMessage,
  receiveMessage,
  markMessagesAsRead,
  clearMessages,
  removeConversation,
  setError,
  updateConnectionState,
  selectWebSocketState,
  selectIsWebSocketConnected,
  selectWebSocketConnectionStatus,
  selectWebSocketMessages,
  selectWebSocketActiveConversations,
  selectWebSocketError,
  WebSocketMessage,
} from '../store/slices/webSocketSlice';
import { MessageData } from '../services/websocketService';
import { useMemo, useCallback } from 'react';

// Custom hook that provides WebSocket functionality using Redux
export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const webSocketState = useAppSelector(selectWebSocketState);
  const isConnected = useAppSelector(selectIsWebSocketConnected);
  const connectionStatus = useAppSelector(selectWebSocketConnectionStatus);
  const messages = useAppSelector(selectWebSocketMessages);
  const activeConversations = useAppSelector(selectWebSocketActiveConversations);
  const error = useAppSelector(selectWebSocketError);

  const connect = useCallback((userId: string) => {
    dispatch(connectWebSocket(userId));
  }, [dispatch]);

  const disconnect = useCallback(() => {
    dispatch(disconnectWebSocket());
  }, [dispatch]);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => {
    dispatch(sendWebSocketMessage(message));
  }, [dispatch]);

  const handleReceiveMessage = useCallback((messageData: MessageData) => {
    dispatch(receiveMessage(messageData));
  }, [dispatch]);

  const markAsRead = useCallback((messageIds: string[]) => {
    dispatch(markMessagesAsRead(messageIds));
  }, [dispatch]);

  const clearAllMessages = useCallback(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  const removeConversationMessages = useCallback((conversationId: string) => {
    dispatch(removeConversation(conversationId));
  }, [dispatch]);

  const setConnectionError = useCallback((errorMessage: string | null) => {
    dispatch(setError(errorMessage));
  }, [dispatch]);

  const updateConnection = useCallback((isConnected: boolean, status: typeof connectionStatus) => {
    dispatch(updateConnectionState({ isConnected, status }));
  }, [dispatch]);

  const getConversationMessages = useCallback((conversationId: string) => {
    return messages.filter((msg: WebSocketMessage) => msg.conversationId === conversationId);
  }, [messages]);

  return useMemo(() => ({
    ...webSocketState,
    isConnected,
    connectionStatus,
    messages,
    activeConversations,
    error,
    connect,
    disconnect,
    sendMessage,
    receiveMessage: handleReceiveMessage,
    markMessagesAsRead: markAsRead,
    clearMessages: clearAllMessages,
    removeConversation: removeConversationMessages,
    setError: setConnectionError,
    updateConnectionState: updateConnection,
    getMessagesByConversation: getConversationMessages,
  }), [
    webSocketState,
    isConnected,
    connectionStatus,
    messages,
    activeConversations,
    error,
    connect,
    disconnect,
    sendMessage,
    handleReceiveMessage,
    markAsRead,
    clearAllMessages,
    removeConversationMessages,
    setConnectionError,
    updateConnection,
    getConversationMessages,
  ]);
};