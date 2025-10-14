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
  OrderStatus,
  CreateOrderRequest,
  OrderResult,
  OrdersResult
} from '../types/order';
import {
  NotificationError
} from '../types/notification';
import { showLocalNotification } from './notificationService';

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

  // ============================================================================
  // ORDER NOTIFICATION FUNCTIONS (moved from notificationService)
  // ============================================================================

  /**
   * Show order-specific notification
   */
  async showOrderNotification(
    orderId: string,
    orderStatus: OrderStatus,
    customerName?: string
  ): Promise<{ success: boolean; error?: NotificationError }> {
    let title: string;
    let body: string;
    
    const customer = customerName || 'Customer';
    
    switch (orderStatus) {
      case 'pending':
        title = 'New Order Received!';
        body = `Order #${orderId} from ${customer} has been received.`;
        break;
      case 'confirmed':
        title = 'Order Accepted';
        body = `Order #${orderId} has been accepted.`;
        break;
      case 'rejected':
        title = 'Order Rejected';
        body = `Order #${orderId} has been rejected.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        body = `Order #${orderId} has been cancelled.`;
        break;
      case 'processing':
      case 'in-progress':
        title = 'Order Status Updated';
        body = `Order #${orderId} is now ${orderStatus}.`;
        break;
      case 'ready':
        title = 'Order Ready';
        body = `Order #${orderId} is ready for pickup/delivery.`;
        break;
      case 'completed':
        title = 'Order Completed';
        body = `Order #${orderId} has been completed.`;
        break;
      default:
        title = 'Order Notification';
        body = `Order #${orderId} - Status: ${orderStatus}`;
    }
    
    return await showLocalNotification(title, body, {
      type: 'order_notification',
      orderId,
      orderStatus,
      customerName,
      timestamp: new Date().toISOString(),
    });
  }


  /**
   * Get auth token (helper)
   */
  private async getAuthToken(): Promise<string | null> {
    console.warn('[OrderService] getAuthToken called - prefer passing token explicitly');
    return null;
  }

  /**
   * Create order via API
   */
  async createOrderViaAPI(
    orderData: CreateOrderRequest,
    authToken?: string
  ): Promise<OrderResult> {
    try {
      const token = authToken || await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: { message: 'Authentication token required', code: 'AUTH_REQUIRED' }
        };
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.salvatore.app';
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: { 
            message: `Order creation failed: ${response.status} - ${errorData}`,
            code: 'ORDER_CREATION_FAILED'
          }
        };
      }

      const result = await response.json();
      return { 
        success: true, 
        orderId: result.orderId || result.id 
      };

    } catch (error) {
      return {
        success: false,
        error: { 
          message: error instanceof Error ? error.message : 'Order creation error',
          code: 'ORDER_CREATION_ERROR'
        }
      };
    }
  }

  /**
   * Fetch orders from API
   */
  async fetchOrdersViaAPI(
    userId: string,
    authToken?: string
  ): Promise<OrdersResult> {
    try {
      const token = authToken || await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: { message: 'Authentication token required', code: 'AUTH_REQUIRED' }
        };
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.salvatore.app';
      const response = await fetch(`${API_BASE_URL}/api/orders?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: { 
            message: `Fetch orders failed: ${response.status} - ${errorData}`,
            code: 'FETCH_ORDERS_FAILED'
          }
        };
      }

      const orders = await response.json();
      return { success: true, orders };

    } catch (error) {
      return {
        success: false,
        error: { 
          message: error instanceof Error ? error.message : 'Fetch error',
          code: 'FETCH_ORDERS_ERROR'
        }
      };
    }
  }

  /**
   * Create test order
   */
  async createTestOrder(
    serviceProviderId: string,
    authToken?: string
  ): Promise<OrderResult> {
    const testOrderData: CreateOrderRequest = {
      serviceProviderId,
      customer: {
        contactInfo: {
          name: "Test Customer",
          email: "test.customer@example.com",
          phone: "+1-555-123-4567"
        },
        address: {
          street: "123 Test Street",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "USA"
        }
      },
      items: [
        {
          name: "Test Service",
          description: "Test notification service",
          quantity: 1,
          unitPrice: 25.00
        }
      ]
    };

    return await this.createOrderViaAPI(testOrderData, authToken);
  }

  /**
   * Create order with custom data
   */
  async createOrderWithData({
    serviceProviderId,
    customerName,
    customerEmail,
    customerPhone,
    serviceName,
    serviceDescription,
    price,
    authToken
  }: {
    serviceProviderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceName: string;
    serviceDescription: string;
    price: number;
    authToken?: string;
  }): Promise<OrderResult> {
    
    const orderData: CreateOrderRequest = {
      serviceProviderId,
      customer: {
        contactInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        address: {
          street: "123 Service Street",
          city: "Service City", 
          state: "SC",
          zipCode: "12345",
          country: "USA"
        }
      },
      items: [
        {
          name: serviceName,
          description: serviceDescription,
          quantity: 1,
          unitPrice: price
        }
      ]
    };

    return await this.createOrderViaAPI(orderData, authToken);
  }
}

// Create and export the service instance
export const orderService = new OrderService();