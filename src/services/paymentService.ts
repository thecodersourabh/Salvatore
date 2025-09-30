import { api } from './api';
import { ApiService } from './ApiService';

export interface PaymentMethod {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  isDefault: boolean;
  type: 'credit' | 'debit';
  brand: string;
  lastFourDigits: string;
}

export interface SaveCardRequest {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  setDefault?: boolean;
}

class PaymentService extends ApiService {
  private baseUrl = '/api/payments';

  protected constructor() {
    super();
  }

  // Get all saved payment methods for the user
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    this.validateUserContext();
    return api.get(`${this.baseUrl}/methods`, this.getConfig());
  }

  // Save a new payment method
  async savePaymentMethod(data: SaveCardRequest): Promise<PaymentMethod> {
    this.validateUserContext();
    const dataWithUser = this.addUserContext(data);
    return api.post(`${this.baseUrl}/methods`, dataWithUser, this.getConfig());
  }

  // Delete a payment method
  async deletePaymentMethod(methodId: string): Promise<void> {
    this.validateUserContext();
    return api.delete(`${this.baseUrl}/methods/${methodId}`, this.getConfig());
  }

  // Set a payment method as default
  async setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
    this.validateUserContext();
    const data = this.addUserContext({ isDefault: true });
    return api.put(`${this.baseUrl}/methods/${methodId}/default`, data, this.getConfig());
  }

  // Process a payment
  async processPayment(orderId: string, methodId: string, amount: number): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    this.validateUserContext();
    const data = this.addUserContext({
      orderId,
      methodId,
      amount
    });
    return api.post(`${this.baseUrl}/process`, data, this.getConfig());
  }

  // Get payment status
  async getPaymentStatus(transactionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    message: string;
  }> {
    this.validateUserContext();
    return api.get(`${this.baseUrl}/status/${transactionId}`, this.getConfig());
  }

  // Request payment refund
  async requestRefund(transactionId: string, reason: string): Promise<{
    success: boolean;
    refundId: string;
    message: string;
  }> {
    this.validateUserContext();
    const data = this.addUserContext({
      transactionId,
      reason
    });
    return api.post(`${this.baseUrl}/refund`, data, this.getConfig());
  }
}

export const paymentService = PaymentService.getInstance();