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
      const result = await api.get<User>(`/api/users/${userId}`);
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

  static async updateUser(email: string, profile: Partial<User>): Promise<User | null> {
    try {
      const profileData = {
        ...profile,
        skills:
          profile.skills?.map((skill) => ({
            name: skill.name,
            level: skill.level,
            yearsOfExperience: skill.yearsOfExperience,
          })) || [],
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
          ? {
              notificationSettings: {
                email: profile.preferences.notificationSettings.email,
                push: profile.preferences.notificationSettings.push,
                sms: profile.preferences.notificationSettings.sms,
              },
              visibility: {
                public: profile.preferences.visibility.public,
                searchable: profile.preferences.visibility.searchable,
              },
            }
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
}
