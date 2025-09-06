import { api } from './api';
import { User } from '../types/user';

type PortfolioItem = NonNullable<User['portfolio']>[number];

interface ServiceRequest {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  userId: string;
  providerId: string;
  serviceDetails: {
    description: string;
    requestedDate: string;
    location: string;
    images?: string[];
  };
  estimatedDetails?: {
    cost: number;
    time: string;
    notes: string;
  };
  completionDetails?: {
    actualCost: number;
    completionDate: string;
    notes: string;
    photos: string[];
  };
  createdAt: string;
  updatedAt: string;
}



export class ServiceProviderService {

  static async updateProfile(email: string, profile: Partial<User>): Promise<User | null> {
    return api.put(`/api/users/email/${encodeURIComponent(email)}`, profile);
  }

  static async updateAvailability(
    email: string,
    availability: User['availability']
  ): Promise<User> {
    return api.put(`/api/users/${encodeURIComponent(email)}/availability`, availability);
  }

  static async addPortfolioItem(email: string, item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    return api.post(`/api/users/${encodeURIComponent(email)}/portfolio`, item);
  }

  static async updatePortfolioItem(
    email: string,
    itemId: string,
    updates: Partial<PortfolioItem>
  ): Promise<PortfolioItem> {
    return api.put(`/api/users/${encodeURIComponent(email)}/portfolio/${itemId}`, updates);
  }

  static async deletePortfolioItem(email: string, itemId: string): Promise<void> {
    await api.delete(`/api/users/${encodeURIComponent(email)}/portfolio/${itemId}`);
  }

  static async submitVerification(
    email: string,
    documentType: string,
    file: File
  ): Promise<{ status: string; message: string }> {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(
      `/api/users/${encodeURIComponent(email)}/verification/${documentType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  static async updateServiceAreas(
    email: string,
    areas: User['serviceAreas']
  ): Promise<User> {
    return api.put(`/api/users/${encodeURIComponent(email)}/service-areas`, areas);
  }

  static async updatePricing(
    email: string,
    pricing: User['pricing']
  ): Promise<User['pricing']> {
    return api.put(`/api/users/${encodeURIComponent(email)}/pricing`, pricing);
  }

  static async search(searchParams: {
    sector?: string;
    location?: string;
    skills?: string[];
    availability?: string;
    rating?: number;
    maxDistance?: number;
    serviceTypes?: string[];
  }): Promise<User[]> {
    return api.get('/api/users/search', { params: searchParams });
  }

  static async getServiceRequests(
    email: string,
    status?: ServiceRequest['status']
  ): Promise<ServiceRequest[]> {
    return api.get(`/api/users/${encodeURIComponent(email)}/requests`, status ? { params: { status } } : {});
  }

  static async respondToRequest(
    email: string,
    requestId: string,
    action: 'accept' | 'reject',
    details?: {
      estimatedTime?: string;
      estimatedCost?: number;
      notes?: string;
    }
  ): Promise<ServiceRequest> {
    return api.post(`/api/users/${encodeURIComponent(email)}/requests/${requestId}/${action}`, details);
  }

  static async updateServiceStatus(
    email: string,
    requestId: string,
    status: ServiceRequest['status'],
    details?: {
      notes?: string;
      completionPhotos?: string[];
      finalCost?: number;
    }
  ): Promise<ServiceRequest> {
    return api.put(`api/v2/users/${email}/requests/${requestId}/status`, {
      status,
      ...details
    });
  }

  static async getStats(email: string): Promise<User['stats']> {
    return api.get(`api/v2/users/${email}/stats`);
  }

  static async updatePreferences(
    email: string,
    preferences: User['preferences']
  ): Promise<User['preferences']> {
    return api.put(`api/v2/users/${email}/preferences`, preferences);
  }
}   
