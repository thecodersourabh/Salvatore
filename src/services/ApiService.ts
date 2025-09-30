
export interface UserContext {
  id: string;
  email: string;
  name?: string;
}

export class ApiService {
  protected static instance: any;
  protected userContext: UserContext | null = null;

  protected constructor() {}

  public static getInstance(): ApiService {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  setUserContext(user: UserContext) {
    this.userContext = user;
  }

  clearUserContext() {
    this.userContext = null;
  }

  getUserContext(): UserContext | null {
    return this.userContext;
  }

  protected validateUserContext() {
    if (!this.userContext) {
      throw new Error('User context not set. Please ensure user is authenticated.');
    }
  }

  protected addUserContext<T extends object>(data: T): T & { userId: string } {
    this.validateUserContext();
    return {
      ...data,
      userId: this.userContext!.id
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }


  private getIdToken(overrideIdToken?: string): string {
    if (overrideIdToken) return overrideIdToken;
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      throw new Error('ID token not found. Please authenticate.');
    }
    return idToken;
  }

  protected getConfig(options?: { idToken?: string }) {
    this.validateUserContext();
    const idToken = this.getIdToken(options?.idToken);
    return {
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'X-User-ID': this.userContext!.id,
        'X-User-Email': this.userContext!.email,
        'X-Request-ID': this.generateRequestId()
      }
    };
  }
}

export const apiService = ApiService.getInstance();

// Example usage in a specific service:
/*
class PaymentService extends ApiService {
  async getTransactions() {
    this.validateUserContext();
    return api.get('/transactions', this.getConfig());
  }

  async savePaymentMethod(data: PaymentMethodData) {
    this.validateUserContext();
    const dataWithUser = this.addUserContext(data);
    return api.post('/payment-methods', dataWithUser, this.getConfig());
  }
}
*/