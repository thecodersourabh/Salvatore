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

  /**
   * Helper to parse a fields expression into path/alias pairs.
   * Accepts strings like:
   *  - 'availability,pricing'
   *  - 'serviceAreas.locations.coordinates.latitude as latitudes'
   */
  private static parseFields(fields: string | string[]) {
    const list = Array.isArray(fields) ? fields : (typeof fields === 'string' ? fields.split(',') : []);
    return list.map(f => {
      const part = f.trim();
      if (!part) return null;
      // support 'path.to.prop as alias'
      const m = part.match(/^(.+?)\s+as\s+(.+)$/i);
      if (m) {
        return { path: m[1].trim(), alias: m[2].trim() };
      }
      return { path: part, alias: undefined };
    }).filter(Boolean) as Array<{ path: string; alias?: string }>;
  }

  /**
   * Safely get nested value by dot path. If any segment is an array, it will map into an array of values.
   */
  private static getByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current: any = obj;
    for (const p of parts) {
      if (current === undefined || current === null) return undefined;
      if (Array.isArray(current)) {
        // map remaining path over the array
        return current.map(item => ServiceProviderService.getByPath(item, parts.slice(parts.indexOf(p)).join('.')));
      }
      current = current[p];
    }
    return current;
  }

  /**
   * Project an object to the requested fields. Fields may include aliases via 'as'.
   */
  private static projectObject<T = any>(obj: any, fields: string | string[]): Partial<T> {
    const parsed = ServiceProviderService.parseFields(fields);
    const out: any = {};
    for (const f of parsed) {
      const val = ServiceProviderService.getByPath(obj, f.path);
      const key = f.alias ?? f.path.split('.').pop() ?? f.path;
      out[key] = val;
    }
    return out;
  }

  /**
   * Convenience method: call the REST search endpoint and return only the requested projected fields.
   * This lets callers use complex projection expressions client-side without changing server API.
   */
  static async searchProjected(searchParams: {
    sector?: string;
    location?: string;
    skills?: string[];
    availability?: string;
    rating?: number;
    maxDistance?: number;
    serviceTypes?: string[];
  }, fields: string | string[]): Promise<Array<Partial<User>>> {
    const users = await ServiceProviderService.search(searchParams);
    // Normalize possible wrapper shapes returned by the API
    let list: any[] = [];
    if (Array.isArray(users)) list = users;
    else if (users && Array.isArray((users as any).items)) list = (users as any).items;
    else if (users && Array.isArray((users as any).data)) list = (users as any).data;
    else if (users && Array.isArray((users as any).users)) list = (users as any).users;
    else if (users && (users as any).data && Array.isArray((users as any).data.users)) list = (users as any).data.users;
    else list = [];

    return list.map(u => ServiceProviderService.projectObject(u, fields));
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
