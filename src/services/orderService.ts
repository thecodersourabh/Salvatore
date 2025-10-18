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


// Prefer explicit orders URL from env; fall back to VITE_API_URL + /api, or relative '/api' when not provided
const ordersUrl = import.meta.env.VITE_API_ORDERS_URL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

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
    const data = this.addUserContext(updates as any);

    // Ensure serviceProviderId is present so server can validate ownership
    if (!(data as any).serviceProviderId) {
      (data as any).serviceProviderId = this.userContext!.id;
    }

    return api.put(`${ordersUrl}/orders/${orderId}`, data, this.getConfig());
  }

  // Accept an order
  async acceptOrder(orderId: string, acceptData?: OrderAcceptRequest): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext({
      status: 'confirmed' as OrderStatus,
      ...acceptData
    });

    // Ensure serviceProviderId is present (backend validation requires it). Prefer provided value,
    // otherwise default to the authenticated user context id.
    if (!(data as any).serviceProviderId) {
      (data as any).serviceProviderId = this.userContext!.id;
    }

    const response: any = await api.post(`${ordersUrl}/orders/${orderId}/accept`, data, this.getConfig());
    // If API returns wrapper with success:false, throw with provided message so client can display it
    if (response && typeof response === 'object' && 'success' in response && response.success === false) {
      const errMsg = (response.error && (response.error.message || response.error)) || response.message || 'Failed to accept order';
      throw new Error(errMsg);
    }

    // Prefer wrapped data, otherwise return the response directly
    return response?.data ? response.data as Order : response as Order;
  }

  // Reject an order
  async rejectOrder(orderId: string, rejectData: OrderRejectRequest): Promise<Order> {
    this.validateUserContext();
    const data = this.addUserContext({
      status: 'rejected' as OrderStatus,
      ...rejectData
    });
    const response: any = await api.post(`${ordersUrl}/orders/${orderId}/reject`, data, this.getConfig());
    if (response && typeof response === 'object' && 'success' in response && response.success === false) {
      const errMsg = (response.error && (response.error.message || response.error)) || response.message || 'Failed to reject order';
      throw new Error(errMsg);
    }
    return response?.data ? response.data as Order : response as Order;
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
    const response: any = await api.post(`${ordersUrl}/orders/${orderId}/complete`, data, this.getConfig());
    if (response && typeof response === 'object' && 'success' in response && response.success === false) {
      const errMsg = (response.error && (response.error.message || response.error)) || response.message || 'Failed to complete order';
      throw new Error(errMsg);
    }
    return response?.data ? response.data as Order : response as Order;
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
    const response: any = await api.post(`${ordersUrl}/orders/${orderId}/message`, data, this.getConfig());
    if (response && typeof response === 'object' && 'success' in response && response.success === false) {
      const errMsg = (response.error && (response.error.message || response.error)) || response.message || 'Failed to send message';
      throw new Error(errMsg);
    }
    return response;
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
    const payload = {
      type: 'order',
      subtype: 'order_notification',
      orderId,
      orderStatus,
      customerName: customer,
      timestamp: new Date().toISOString()
    };

    try {
      await showLocalNotification(title, body, payload);
      return { success: true };
    } catch (err) {
      console.error('OrderService.showOrderNotification error:', err);
      return {
        success: false,
        error: { message: err instanceof Error ? err.message : String(err), code: 'NOTIFICATION_ERROR' }
      };
    }
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
  ): Promise<OrderResult<any>> {
    try {
      const token = authToken || await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: { message: 'Authentication token required', code: 'AUTH_REQUIRED' }
        };
      }

  // Use configured ordersUrl (VITE_API_ORDERS_URL) when available, otherwise fall back to VITE_API_URL or '/api'
  const base = ordersUrl;
  const url = `${base}/orders`;
  const response = await fetch(url, {
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
      // Normalize known wrapper shape: { success: true, data: { id, orderNumber, ... } }
      const normalizedOrderId = result.orderId || result.id || (result.data && (result.data.orderId || result.data.id));
      const normalizedOrderNumber = (result.data && result.data.orderNumber) || result.orderNumber;
      return {
        success: true,
        orderId: normalizedOrderId || normalizedOrderNumber || undefined,
        raw: result
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

  const base = ordersUrl;
  const url = `${base}/orders?userId=${encodeURIComponent(userId)}`;
  const response = await fetch(url, {
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
  ): Promise<OrderResult<any>> {
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
  async createOrderWithData(
    params: {
      serviceProviderId: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      serviceName: string;
      serviceDescription: string;
      price: number;
      authToken?: string;
      // optional address to avoid hardcoded values
      customerAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      };
    }
  ): Promise<OrderResult<any>> {
    const {
      serviceProviderId,
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      serviceDescription,
      price,
      authToken
    } = params;

    const { customerAddress } = params;

    // Build customer object; include address only when provided to avoid hardcoded values
    const customerObj: any = {
      contactInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      }
    };

    if (customerAddress && Object.keys(customerAddress).length > 0) {
      customerObj.address = customerAddress;
    }

    const orderData: CreateOrderRequest = {
      serviceProviderId,
      customer: customerObj,
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