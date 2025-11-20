import { api } from './api';
import { ApiService } from './ApiService';
const txUrl = import.meta.env.VITE_API_ORDERS_URL;

export interface Transaction {
  id: string;
  date: string;
  type: 'payment' | 'refund' | 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  orderId?: string;
  paymentMethodId?: string;
  documentId?: string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: Transaction['type'];
  status?: Transaction['status'];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TransactionService extends ApiService {

  constructor() {
    super();
  }

  // Get transaction history with filters
  async getTransactions(
    filters: TransactionFilters = {},
    options?: { idToken?: string }
  ): Promise<{
    success: boolean;
    data: {
      records: Transaction[];
      pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      summary: {
        totalAmount: number;
        currency: string;
        recordCount: number;
      };
    };
    timestamp: string;
  }> {
    this.validateUserContext();
    const config = {
      ...this.getConfig({ idToken: options?.idToken }),
      params: this.addUserContext(filters)
    };
    return api.get(`${txUrl}/transactions`, config);
  }

  // Get transaction details
  async getTransactionDetails(id: string): Promise<Transaction> {
    this.validateUserContext();
    return api.get(`${txUrl}/${id}`, this.getConfig());
  }

  // Get transaction document (invoice/receipt)
  async getTransactionDocument(id: string, type: 'invoice' | 'receipt'): Promise<{
    documentUrl: string;
    expiresAt: string;
  }> {
    this.validateUserContext();
    return api.get(`${txUrl}/${id}/document/${type}`, this.getConfig());
  }

  // Export transactions
  async exportTransactions(filters: TransactionFilters = {}, format: 'csv' | 'xlsx' = 'xlsx'): Promise<{
    downloadUrl: string;
    expiresAt: string;
  }> {
    this.validateUserContext();
    const config = {
      ...this.getConfig(),
      params: this.addUserContext({ ...filters, format })
    };
    return api.get(`${txUrl}/export`, config);
  }

  // Get transaction statistics
  async getTransactionStats(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    periodStart: string;
    periodEnd: string;
    breakdown: Array<{
      date: string;
      amount: number;
      count: number;
    }>;
  }> {
    this.validateUserContext();
    const config = {
      ...this.getConfig(),
      params: this.addUserContext({ period })
    };
    return api.get(`${txUrl}/stats`, config);
  }

  // Get recent transactions (last 5)
  async getRecentTransactions(): Promise<Transaction[]> {
    this.validateUserContext();
    return api.get(`${txUrl}/recent`, this.getConfig());
  }

  // Get transaction summary by service type
  async getServiceTransactionSummary(period: 'month' | 'year'): Promise<Array<{
    serviceType: string;
    totalAmount: number;
    transactionCount: number;
    percentageOfTotal: number;
  }>> {
    this.validateUserContext();
    const config = {
      ...this.getConfig(),
      params: this.addUserContext({ period })
    };
    return api.get(`${txUrl}/summary/services`, config);
  }
}

export const transactionService = new TransactionService();