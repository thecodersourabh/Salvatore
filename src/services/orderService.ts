import { api } from './api';
import { ApiService } from './ApiService';
import {
  Order,
  OrderListParams,
  OrderListResponse,
  OrderUpdateRequest,
  OrderAcceptRequest,
  OrderRejectRequest,
  OrderStats,
  OrderStatus
} from '../types/order';

const ordersUrl = import.meta.env.VITE_API_ORDERS_URL;

class OrderService extends ApiService {
  constructor() {
    super();
  }

  // Get orders for service provider
  async getOrders(
    params: OrderListParams = {},
    options?: { idToken?: string }
  ): Promise<OrderListResponse> {
    try {
      this.validateUserContext();
      const providerId = this.userContext!.id;
      const config = {
        ...this.getConfig(options),
        params: params
      };
      const response: any = await api.get(`${ordersUrl}/orders/provider/${providerId}`, config);
      
      // Extract data from API response wrapper
      if (response?.data && response?.success) {
        return response.data as OrderListResponse;
      }
      
      // Fallback for direct response format
      return response as OrderListResponse;
    } catch (error) {
      console.error('OrderService.getOrders error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('User context not set')) {
          throw new Error('Please log in to view your orders.');
        }
        if (error.message.includes('Network')) {
          throw new Error('Unable to connect to the server. Please check your internet connection.');
        }
      }
      
      throw error;
    }
  }

  // Get order details by ID
  async getOrderById(orderId: string): Promise<Order> {
    this.validateUserContext();
    return api.get(`${ordersUrl}/orders/${orderId}`, this.getConfig());
  }

  // Update order status and details
  async updateOrder(orderId: string, updates: OrderUpdateRequest): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext(updates);
    return api.put(`${ordersUrl}/orders/${orderId}`, data, this.getConfig());
  }

  // Accept an order
  async acceptOrder(orderId: string, acceptData?: OrderAcceptRequest): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext({
      status: 'confirmed' as OrderStatus,
      ...acceptData
    });
    return api.post(`${ordersUrl}/orders/${orderId}/accept`, data, this.getConfig());
  }

  // Reject an order
  async rejectOrder(orderId: string, rejectData: OrderRejectRequest): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext({
      status: 'rejected' as OrderStatus,
      ...rejectData
    });
    return api.post(`${ordersUrl}/orders/${orderId}/reject`, data, this.getConfig());
  }

  // Mark order as in progress
  async startOrder(orderId: string, notes?: string): Promise<Order> {
    this.validateUserContext();
    return this.updateOrder(orderId, {
      status: 'in-progress',
      notes
    });
  }

  // Mark order as ready/completed
  async completeOrder(
    orderId: string, 
    completionData?: {
      notes?: string;
      completionPhotos?: string[];
      finalCost?: number;
    }
  ): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext({
      status: 'completed' as OrderStatus,
      ...completionData
    });
    return api.post(`${ordersUrl}/orders/${orderId}/complete`, data, this.getConfig());
  }

  // Request order modification
  async requestModification(
    orderId: string,
    modifications: {
      pricing?: any;
      scheduledDate?: string;
      scheduledTime?: string;
      estimatedDuration?: number;
      message?: string;
    }
  ): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext(modifications);
    return api.post(`${ordersUrl}/orders/${orderId}/request-modification`, data, this.getConfig());
  }

  // Get order statistics for service provider
  async getOrderStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<OrderStats> {
    this.validateUserContext();
    const providerId = this.userContext!.id;
    const config = {
      ...this.getConfig(),
      params: { period }
    };
    return api.get(`${ordersUrl}/orders/provider/${providerId}/stats`, config);
  }

  // Get recent orders (last 10)
  async getRecentOrders(): Promise<Order[]> {
    this.validateUserContext();
    const providerId = this.userContext!.id;
    return api.get(`${ordersUrl}/orders/provider/${providerId}/recent`, this.getConfig());
  }

  // Get pending orders requiring attention
  async getPendingOrders(): Promise<Order[]> {
    this.validateUserContext();
    const providerId = this.userContext!.id;
    const config = {
      ...this.getConfig(),
      params: { status: 'pending', limit: 50 }
    };
    const response: any = await api.get(`${ordersUrl}/orders/provider/${providerId}`, config);
    const data = response?.data && response?.success ? response.data : response;
    return data.orders || [];
  }

  // Search orders
  async searchOrders(
    searchQuery: string,
    filters?: Partial<OrderListParams>,
    options?: { idToken?: string }
  ): Promise<OrderListResponse> {
    this.validateUserContext();
    const providerId = this.userContext!.id;
    const params = {
      searchQuery,
      ...filters
    };
    const config = {
      ...this.getConfig(options),
      params: params
    };
    const response: any = await api.get(`${ordersUrl}/orders/provider/${providerId}/search`, config);
    
    // Extract data from API response wrapper
    if (response?.data && response?.success) {
      return response.data as OrderListResponse;
    }
    
    // Fallback for direct response format
    return response as OrderListResponse;
  }

  // Get orders by status
  async getOrdersByStatus(status: OrderStatus, limit: number = 20): Promise<Order[]> {
    this.validateUserContext();
    const providerId = this.userContext!.id;
    const config = {
      ...this.getConfig(),
      params: { status, limit }
    };
    const response: any = await api.get(`${ordersUrl}/orders/provider/${providerId}`, config);
    const data = response?.data && response?.success ? response.data : response;
    return data.orders || [];
  }

  // Export orders
  async exportOrders(
    filters: OrderListParams = {},
    format: 'csv' | 'xlsx' = 'xlsx'
  ): Promise<{
    downloadUrl: string;
    expiresAt: string;
  }> {
    this.validateUserContext();
    const providerId = this.userContext!.id;
    const config = {
      ...this.getConfig(),
      params: { ...filters, format }
    };
    return api.get(`${ordersUrl}/orders/provider/${providerId}/export`, config);
  }

  // Add internal note to order
  async addInternalNote(orderId: string, note: string): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext({ internalNotes: note });
    return api.post(`${ordersUrl}/orders/${orderId}/internal-note`, data, this.getConfig());
  }

  // Upload order attachment
  async uploadAttachment(
    orderId: string,
    file: File,
    description?: string
  ): Promise<{
    success: boolean;
    attachment: {
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    };
  }> {
    this.validateUserContext();
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    
    const config = {
      ...this.getConfig(),
      headers: {
        ...this.getConfig().headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    return api.post(`${ordersUrl}/orders/${orderId}/attachments`, formData, config);
  }

  // Send message to customer
  async sendMessageToCustomer(
    orderId: string,
    message: string,
    attachments?: string[]
  ): Promise<{
    success: boolean;
    messageId: string;
  }> {
    this.validateUserContext();
    const data = this.addUserContext({
      message,
      attachments
    });
    return api.post(`${ordersUrl}/orders/${orderId}/message`, data, this.getConfig());
  }

  // Get order timeline/history
  async getOrderTimeline(orderId: string, options?: { idToken?: string }): Promise<Array<{
    id: string;
    status: OrderStatus;
    timestamp: string;
    updatedBy: string;
    notes?: string;
  }>> {
    this.validateUserContext();
    return api.get(`${ordersUrl}/orders/${orderId}/timeline`, this.getConfig(options));
  }
}

// Create and export the service instance
export const orderService = new OrderService();