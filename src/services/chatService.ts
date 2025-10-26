import { api } from './api';

const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL;

export interface DirectMessagePayload {
  recipientId: string;
  content: string;
  type?: string;
}

export class ChatService {
  /**
   * Send a direct message from the authenticated user to recipientId
   */
  static async sendDirectMessage(payload: DirectMessagePayload) {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/direct-messages`;
      const result = await api.post<any>(endpoint, payload);
      return result;
    } catch (error) {
      console.error('ChatService.sendDirectMessage failed:', error);
      throw error;
    }
  }

  /**
   * Get conversation between authenticated user and recipient
   */
  static async getConversation(recipientId: string, limit = 50) {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/direct-messages`;
      const params = { recipientId, limit };
      const result = await api.get<any>(endpoint, { params });
      return result;
    } catch (error) {
      console.error('ChatService.getConversation failed:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for authenticated user
   */
  static async getConversations() {
    try {
      const endpoint = `${CHAT_API_BASE.replace(/\/$/, '')}/conversations`;
      const result = await api.get<any>(endpoint);
      return result;
    } catch (error) {
      console.error('ChatService.getConversations failed:', error);
      throw error;
    }
  }
}

export const chatService = ChatService;
