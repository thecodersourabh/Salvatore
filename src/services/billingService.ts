import { api } from './api';
import { ApiService } from './ApiService';

export interface BillingAddress {
  id: string;
  fullName: string;
  companyName?: string;
  country: string;
  state: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export interface GstDetails {
  gstNumber: string;
  businessName: string;
  registeredAddress: string;
  verified: boolean;
}

export interface BillingInfo {
  id: string;
  fullName: string;
  companyName?: string;
  country: string;
  state: string;
  street: string;
  city: string;
  postalCode: string;
  isGstRegistered: boolean;
  gstDetails?: GstDetails;
}

class BillingService extends ApiService {
  private baseUrl = '/api/billing';

  protected constructor() {
    super();
  }

  // Get billing information
  async getBillingInfo(): Promise<BillingInfo> {
    this.validateUserContext();
    return api.get(`${this.baseUrl}/info`, this.getConfig());
  }

  // Update billing information
  async updateBillingInfo(data: Partial<BillingInfo>): Promise<BillingInfo> {
    this.validateUserContext();
    const dataWithUser = this.addUserContext(data);
    return api.put(`${this.baseUrl}/info`, dataWithUser, this.getConfig());
  }

  // Get all billing addresses
  async getBillingAddresses(): Promise<BillingAddress[]> {
    this.validateUserContext();
    return api.get(`${this.baseUrl}/addresses`, this.getConfig());
  }

  // Add new billing address
  async addBillingAddress(address: Omit<BillingAddress, 'id'>): Promise<BillingAddress> {
    this.validateUserContext();
    const addressWithUser = this.addUserContext(address);
    return api.post(`${this.baseUrl}/addresses`, addressWithUser, this.getConfig());
  }

  // Update billing address
  async updateBillingAddress(id: string, address: Partial<BillingAddress>): Promise<BillingAddress> {
    this.validateUserContext();
    const addressWithUser = this.addUserContext(address);
    return api.put(`${this.baseUrl}/addresses/${id}`, addressWithUser, this.getConfig());
  }

  // Delete billing address
  async deleteBillingAddress(id: string): Promise<void> {
    this.validateUserContext();
    return api.delete(`${this.baseUrl}/addresses/${id}`, this.getConfig());
  }

  // Set default billing address
  async setDefaultBillingAddress(id: string): Promise<BillingAddress> {
    this.validateUserContext();
    const data = this.addUserContext({ isDefault: true });
    return api.put(`${this.baseUrl}/addresses/${id}/default`, data, this.getConfig());
  }

  // Verify GST number
  async verifyGstNumber(gstNumber: string): Promise<{
    valid: boolean;
    details?: GstDetails;
    message: string;
  }> {
    this.validateUserContext();
    const data = this.addUserContext({ gstNumber });
    return api.post(`${this.baseUrl}/gst/verify`, data, this.getConfig());
  }

  // Get billing documents (invoices, receipts)
  async getBillingDocuments(params: {
    startDate?: string;
    endDate?: string;
    type?: 'invoice' | 'receipt' | 'all';
    page?: number;
    limit?: number;
  }): Promise<{
    documents: Array<{
      id: string;
      type: 'invoice' | 'receipt';
      number: string;
      date: string;
      amount: number;
      currency: string;
      downloadUrl: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    this.validateUserContext();
    const config = {
      ...this.getConfig(),
      params: this.addUserContext(params)
    };
    return api.get(`${this.baseUrl}/documents`, config);
  }
}

export const billingService = BillingService.getInstance();