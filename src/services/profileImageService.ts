import { api } from './api';

export class ProfileImageService {
  static async getProfileImageUrl(userId: string, idToken?: string): Promise<string | null> {
    if (!userId) return null;
    const base = (import.meta.env.VITE_CDN_API_URL as string) || '';
    if (!base) return null;
    const baseUrl = base.replace(/\/$/, '');
    const endpoint = `${baseUrl}/upload/list`;
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
