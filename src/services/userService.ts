import { ApiService } from "./api";
import { User, CreateUserRequest } from "../types/user";

export class UserService {
  static async createUser(userData: CreateUserRequest): Promise<User> {
    return await ApiService.post<User>("/api/users", userData);
  }

  static async getUser(userId: string): Promise<User> {
    try {
      const result = await ApiService.get<User>(`/api/users/${userId}`);
      return result;
    } catch (error) {
      console.error("UserService.getUser failed:", error);
      throw error;
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      // Using the v2 API endpoint to match other methods
      const result = await ApiService.get<User>(`/api/v2/users/username/${encodeURIComponent(username)}`);
      return result;
    } catch (error) {
      // Return null for 404 errors (user not found)
      if (error instanceof Error && error.message.includes("404")) {
        console.log("User not found:", username);
        return null;
      }
      console.error("UserService.getUserByUsername failed:", {
        error,
        username,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await ApiService.get<User>(
        `/api/v2/users/email/${encodeURIComponent(email)}`
      );
      return result;
    } catch (error) {
      // Return null if user not found
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
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
              }))
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
        pricing: profile.pricing
          ? {
              model: profile.pricing.model,
              baseRate: profile.pricing.baseRate,
              currency: profile.pricing.currency,
            }
          : undefined,
      };
      // Pass the object, not a string
      const result = await ApiService.put<User>(
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
