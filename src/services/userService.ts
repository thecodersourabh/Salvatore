import { ApiService } from './api';
import { User, CreateUserRequest } from '../types/api';

export class UserService {
  static async createUser(userData: CreateUserRequest): Promise<User> {
    return await ApiService.post<User>('/api/users', userData);
  }

  static async getUser(userId: string): Promise<User> {
    try {
      const result = await ApiService.get<User>(`/api/users/${userId}`);
      return result;
    } catch (error) {
      console.error('❌ UserService.getUser failed:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    console.log('🔧 UserService.getUserByEmail called with email:', email);
    try {
      const result = await ApiService.get<User>(`/api/users/email/${email}`);
      return result;
    } catch (error) {
      // Return null if user not found
      if (error instanceof Error && error.message.includes('404')) {
        console.log('ℹ️ User not found (404), returning null');
        return null;
      }
      console.error('❌ UserService.getUserByEmail unexpected error:', error);
      throw error;
    }
  }
}
