import { api } from './api';

const AI_API_BASE = import.meta.env.VITE_AI_API_URL;

export interface AIChatPayload {
  message: string;
  conversationId?: string;
  context?: any;
}

export interface AIKnowledgeSearchPayload {
  query: string;
  limit?: number;
  filters?: any;
}

export interface AIKnowledgeUploadPayload {
  file: File;
  metadata?: any;
}

export class AIService {
  /**
   * Get all AI conversations for the authenticated user
   */
  static async getConversations() {
    try {
      const endpoint = `${AI_API_BASE.replace(/\/$/, '')}/ai/conversations`;
      const result = await api.get<any>(endpoint);
      return result;
    } catch (error) {
      console.error('AIService.getConversations failed:', error);
      throw error;
    }
  }

  /**
   * Get a specific AI conversation by ID
   */
  static async getConversation(conversationId: string) {
    try {
      const endpoint = `${AI_API_BASE.replace(/\/$/, '')}/ai/conversations/${conversationId}`;
      const result = await api.get<any>(endpoint);
      return result;
    } catch (error) {
      console.error('AIService.getConversation failed:', error);
      throw error;
    }
  }

  /**
   * Send a message to AI chat
   */
  static async sendChatMessage(payload: AIChatPayload) {
    try {
      const endpoint = `${AI_API_BASE.replace(/\/$/, '')}/ai/chat`;
      const result = await api.post<any>(endpoint, payload);
      return result;
    } catch (error) {
      console.error('AIService.sendChatMessage failed:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base documents
   */
  static async getKnowledgeDocuments() {
    try {
      const endpoint = `${AI_API_BASE.replace(/\/$/, '')}/ai/knowledge/documents`;
      const result = await api.get<any>(endpoint);
      return result;
    } catch (error) {
      console.error('AIService.getKnowledgeDocuments failed:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base
   */
  static async searchKnowledge(payload: AIKnowledgeSearchPayload) {
    try {
      const endpoint = `${AI_API_BASE.replace(/\/$/, '')}/ai/knowledge/search`;
      const result = await api.post<any>(endpoint, payload);
      return result;
    } catch (error) {
      console.error('AIService.searchKnowledge failed:', error);
      throw error;
    }
  }

  /**
   * Upload document to knowledge base
   */
  static async uploadKnowledge(payload: AIKnowledgeUploadPayload) {
    try {
      const endpoint = `${AI_API_BASE.replace(/\/$/, '')}/ai/knowledge/upload`;
      const formData = new FormData();
      formData.append('file', payload.file);
      if (payload.metadata) {
        formData.append('metadata', JSON.stringify(payload.metadata));
      }
      
      const result = await api.post<any>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return result;
    } catch (error) {
      console.error('AIService.uploadKnowledge failed:', error);
      throw error;
    }
  }
}

export const aiService = AIService;
