import { api } from './api';
import { ApiService } from './ApiService';

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

export interface Credit {
  id: string;
  amount: number;
  source: 'refund' | 'referral' | 'promotion' | 'cancellation';
  description: string;
  expiryDate?: string;
  isUsed: boolean;
  usedDate?: string;
  orderId?: string;
}

export interface ReferralInfo {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedCredits: number;
  referralLink: string;
}

class WalletService extends ApiService {
  private baseUrl = '/api/wallet';

  protected constructor() {
    super();
  }

  // Get wallet balance
  async getBalance(): Promise<WalletBalance> {
    this.validateUserContext();
    return api.get(`${this.baseUrl}/balance`, this.getConfig());
  }

  // Get all credits
  async getCredits(params: {
    status?: 'active' | 'used' | 'expired';
    source?: Credit['source'];
    page?: number;
    limit?: number;
  } = {}): Promise<{
    credits: Credit[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.validateUserContext();
    const config = {
      ...this.getConfig(),
      params: this.addUserContext(params)
    };
    return api.get(`${this.baseUrl}/credits`, config);
  }

  // Use credits for an order
  async useCredits(orderId: string, amount: number): Promise<{
    success: boolean;
    remainingCredits: number;
    appliedAmount: number;
    message: string;
  }> {
    this.validateUserContext();
    const data = this.addUserContext({
      orderId,
      amount
    });
    return api.post(`${this.baseUrl}/credits/use`, data, this.getConfig());
  }

  // Get referral information
  async getReferralInfo(): Promise<ReferralInfo> {
    this.validateUserContext();
    return api.get(`${this.baseUrl}/referral`, this.getConfig());
  }

  // Generate new referral code
  async generateReferralCode(): Promise<{
    code: string;
    referralLink: string;
  }> {
    this.validateUserContext();
    return api.post(`${this.baseUrl}/referral/generate`, this.addUserContext({}), this.getConfig());
  }

  // Track referral usage
  async trackReferral(referralCode: string): Promise<{
    success: boolean;
    message: string;
    creditAmount?: number;
  }> {
    this.validateUserContext();
    const data = this.addUserContext({ referralCode });
    return api.post(`${this.baseUrl}/referral/track`, data, this.getConfig());
  }

  // Get credit history
  async getCreditHistory(params: {
    startDate?: string;
    endDate?: string;
    type?: 'earned' | 'used';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    history: Array<{
      id: string;
      date: string;
      type: 'earned' | 'used';
      amount: number;
      source: string;
      description: string;
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
    return api.get(`${this.baseUrl}/credits/history`, config);
  }

  // Check credit eligibility for order
  async checkCreditEligibility(orderId: string): Promise<{
    eligible: boolean;
    maxAmount: number;
    message: string;
  }> {
    this.validateUserContext();
    return api.get(`${this.baseUrl}/credits/eligibility/${orderId}`, this.getConfig());
  }
}

export const walletService = WalletService.getInstance();