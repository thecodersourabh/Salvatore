import { api } from './api';

export class ProfileImageService {
  static async getProfileImageUrl(userId: string, idToken?: string): Promise<string | null> {
    if (!userId) return null;
    const endpoint = 'https://spg85rhps6.execute-api.us-east-1.amazonaws.com/prod/upload/list';
    const prefix = `${userId}/profile/`;
    try {
      const result = await api.get<any>(endpoint, {
        params: { prefix },
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
      });
      if (result && result.files && result.files.length > 0) {
        // Prefer the first image (could sort by date if needed)
        return result.files[0].url || result.files[0].cdnUrl || null;
      }
      return null;
    } catch (err) {
      // fallback to null if error
      return null;
    }
  }
}
