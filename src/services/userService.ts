import { api } from "./api";
import { User, CreateUserRequest } from "../types/user";

export class UserService {
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const result = await api.post<User>("/api/v2/users", userData);
      return result;
    } catch (error) {
      console.error('UserService.createUser failed:', error);
      throw error;
    }
  }

  static async getUser(userId: string): Promise<User> {
    try {
      const result = await api.get<User>(`/api/v2/users/${userId}`);
      return result;
    } catch (error) {
      console.error("UserService.getUser failed:", error);
      throw error;
    }
  }

  static async isUserExists(userEmail: string): Promise<boolean> {
    try {
      const result = await api.get<{exists: boolean}>(`/api/v2/users/email-exists/${encodeURIComponent(userEmail)}`);
      return result.exists;
    } catch (error) {
      console.error("UserService.isUserExists failed:", error);
      return false;
    }
  }



  static async isUserNameExists(userName: string): Promise<boolean> {
    try {
      const result = await api.get<{exists: boolean}>(`/api/v2/users/username-exists/${encodeURIComponent(userName)}`);
      return result.exists;
    } catch (error) {
      console.error("UserService.isUserNameExists failed:", error);
      return false;
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      // Using the v2 API endpoint to match other methods
      const result = await api.get<User>(`/api/v2/users/username/${encodeURIComponent(username)}`);
      return result;
    } catch (error) {
      // Return null for 404 errors (user not found)
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      console.error("UserService.getUserByUsername failed:", error);
      return null;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await api.get<User>(
        `/api/v2/users/email/${encodeURIComponent(email)}`
      );
      return result;
    } catch (error: any) {
      // Return null if user not found  
      if (error?.status === 404 || 
          (error instanceof Error && (error.message.includes("404") || error.message.includes("User not found") || error.message.includes("not found")))) {
        return null;
      }
      console.error("UserService.getUserByEmail failed:", error);
      throw error;
    }
  }

    static async searchUsers(params: { email?: string; username?: string; q?: string }, fields?: string[]): Promise<User[]> {
      try {
        const qsParts: string[] = [];
        if (params.email) qsParts.push(`email=${encodeURIComponent(params.email)}`);
        if (params.username) qsParts.push(`username=${encodeURIComponent(params.username)}`);
        if (params.q) qsParts.push(`q=${encodeURIComponent(params.q)}`);
        if (fields && fields.length) qsParts.push(`fields=${encodeURIComponent(fields.join(','))}`);
        const qs = qsParts.length ? `?${qsParts.join('&')}` : '';
        const result = await api.get<any>(`/api/v2/users/search${qs}`);
        // Handle both direct array and paginated response formats
        if (result?.items) {
          return result.items || [];
        }
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('UserService.searchUsers failed:', error);
        return [];
      }
    }

  static async getAllUsers(limit: number = 20, fields?: string[]): Promise<User[]> {
    try {
      const qsParts: string[] = [];
      qsParts.push(`limit=${limit}`);
      if (fields && fields.length) qsParts.push(`fields=${encodeURIComponent(fields.join(','))}`);
      const qs = qsParts.length ? `?${qsParts.join('&')}` : '';
      const result = await api.get<any>(`/api/v2/users${qs}`);
      // Handle both direct array and paginated response formats
      if (result?.items) {
        return result.items || [];
      }
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('UserService.getAllUsers failed:', error);
      return [];
    }
  }

  static async updateUser(email: string, profile: Partial<User>): Promise<User | null> {
    try {
      const profileData = {
        ...profile,
        // Only include skills if caller provided them. Do not default to an empty
        // array because that would overwrite existing skills on partial updates.
        skills: profile.skills
          ? profile.skills.map((skill) => ({
              name: skill.name,
              level: skill.level,
              yearsOfExperience: skill.yearsOfExperience,
            }))
          : undefined,
        availability: profile.availability
          ? {
              weekdays: profile.availability.weekdays,
              weekends: profile.availability.weekends,
              hours: {
                start: profile.availability.hours.start,
                end: profile.availability.hours.end,
              },
            }
          : undefined,
        serviceAreas: profile.serviceAreas
          ? {
              locations: profile.serviceAreas.locations.map((location) => ({
                city: location.city,
                state: location.state,
                country: location.country,
                coordinates: {
                  latitude: location.coordinates.latitude,
                  longitude: location.coordinates.longitude,
                },
              })),
              serviceAtHome: profile.serviceAreas.serviceAtHome,
              serviceAtWorkshop: profile.serviceAreas.serviceAtWorkshop,
              radius: profile.serviceAreas.radius,
              unit: profile.serviceAreas.unit,
            }
          : undefined,
        preferences: profile.preferences
          ? (() => {
              const ns: any = profile.preferences.notificationSettings || {};
              // Build flattened notificationSettings payload: global channels + per-category booleans
              const notificationSettings: any = {
                email: ns.email,
                push: ns.push,
                sms: ns.sms,
              };
              // If nested categories provided (per-channel), treat category enabled if any channel enabled
              if (ns.categories && typeof ns.categories === 'object') {
                Object.keys(ns.categories).forEach(k => {
                  const c = ns.categories[k];
                  notificationSettings[k] = !!(c?.email || c?.push || c?.sms);
                });
              }
              // Also copy any flattened category boolean fields that may be present
              Object.keys(ns).forEach(k => {
                if (!['email', 'push', 'sms', 'categories'].includes(k)) {
                  notificationSettings[k] = ns[k];
                }
              });

              return {
                notificationSettings,
                visibility: profile.preferences.visibility
                  ? {
                      public: profile.preferences.visibility.public,
                      searchable: profile.preferences.visibility.searchable,
                    }
                  : undefined,
              };
            })()
          : undefined,
        pricing: profile.pricing && 'model' in profile.pricing
          ? {
              model: profile.pricing.model,
              baseRate: profile.pricing.baseRate || 0,
              currency: profile.pricing.currency || 'INR',
              minimumCharge: profile.pricing.minimumCharge || 0,
              travelFee: profile.pricing.travelFee || 0,
              servicePackages: profile.pricing.servicePackages || []
            }
          : undefined,
        documents: profile.documents
          ? {
              aadhaar: profile.documents.aadhaar,
              pan: profile.documents.pan,
              professional: profile.documents.professional,
              others: profile.documents.others
            }
          : undefined,
        // Progressive Profiling Fields
        phoneVerified: profile.phoneVerified,
        phoneVerifiedAt: profile.phoneVerifiedAt,
        profilingComplete: profile.profilingComplete,
        profilingCompletedAt: profile.profilingCompletedAt,
        profilingStep: profile.profilingStep,
       // sectors: profile.sectors,
       // services: profile.services,
      };
      // Pass the object, not a string
      const result = await api.put<User>(
        `api/v2/users/email/${encodeURIComponent(email)}`,
        profileData
      );
      return result;
    } catch (error) {
      console.error("UserService.updateUserByEmail failed:", error);
      throw error;
    }
  }

  // Progressive Profiling Methods
  static async verifyPhoneNumber(userId: string, phoneNumber: string): Promise<User | null> {
    try {
      const result = await api.put<User>(
        `/api/v2/users/${userId}/verify-phone`,
        {
          phone: phoneNumber,
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString(),
        }
      );
      return result;
    } catch (error) {
      console.error("UserService.verifyPhoneNumber failed:", error);
      throw error;
    }
  }

  static async saveSectorSelection(
    userId: string,
    sectors: string[],
    services: { [sector: string]: string[] }
  ): Promise<User | null> {
    try {
      const result = await api.put<User>(
        `/api/v2/users/${userId}/sectors`,
        {
          sectors,
          services,
          profilingComplete: true,
          profilingCompletedAt: new Date().toISOString(),
          profilingStep: 'complete',
        }
      );
      return result;
    } catch (error) {
      console.error("UserService.saveSectorSelection failed:", error);
      throw error;
    }
  }

  static async updateProfilingStep(
    userId: string,
    step: 'phone' | 'otp' | 'username' | 'sectors' | 'complete'
  ): Promise<User | null> {
    try {
      const result = await api.put<User>(
        `/api/v2/users/${userId}/profiling-step`,
        { profilingStep: step }
      );
      return result;
    } catch (error) {
      console.error("UserService.updateProfilingStep failed:", error);
      throw error;
    }
  }

  static async getUserProfilingStatus(userId: string): Promise<{
    profilingComplete: boolean;
    profilingStep: string;
    phoneVerified: boolean;
    sectors: string[];
  } | null> {
    try {
      const result = await api.get<any>(
        `/api/v2/users/${userId}/profiling-status`
      );
      return result;
    } catch (error) {
      console.error("UserService.getUserProfilingStatus failed:", error);
      return null;
    }
  }
}
